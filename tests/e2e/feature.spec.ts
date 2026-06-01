import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

/**
 * Load-bearing cross-peer assertion for the advertised core action:
 * "Phones pulse soft yellow in clock-synced unison."
 *
 * The pulse brightness is a pure function of `mesh-time mod period`, where
 * mesh-time is derived from the median clock offset published by every peer
 * into Yjs awareness. Two things must hold for the advertised claim to be true:
 *
 *   1. Each peer must actually RECEIVE the other peer's clock awareness — the
 *      HUD prints `<peerCount + 1> phones`, so a connected pair must read
 *      "2 phones" on BOTH screens. If awareness publish/receive were broken
 *      (the regression this guards against), each peer would be alone and the
 *      HUD would read "1 phones".
 *   2. Given a shared mesh-clock, both peers must compute the SAME pulse phase
 *      at the same instant — the HUD prints the live brightness `<n>%`. Sampled
 *      simultaneously, peer A and peer B must agree within a tight tolerance.
 *      If clock-sync were ignored / desynced, the two brightnesses would drift
 *      apart.
 */
function parseHud(text: string): { phones: number | null; pct: number | null } {
  const phones = text.match(/(\d+)\s+phones/);
  const pct = text.match(/(\d+)\s*%/);
  return {
    phones: phones ? Number(phones[1]) : null,
    pct: pct ? Number(pct[1]) : null,
  };
}

async function beginPulsing(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /begin pulsing/i }).click();
  await expect(page.locator(".firefly-hud")).toBeVisible();
}

test("two peers see each other and pulse in clock-synced unison", async ({ browser, baseURL }) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    await beginPulsing(a);
    await beginPulsing(b);

    // (1) Awareness must cross the mesh: each peer's HUD must count the other.
    // Poll because the first clock awareness round takes up to PING_INTERVAL.
    await expect
      .poll(async () => parseHud((await a.locator(".firefly-hud").textContent()) ?? "").phones, {
        timeout: 15_000,
      })
      .toBe(2);
    await expect
      .poll(async () => parseHud((await b.locator(".firefly-hud").textContent()) ?? "").phones, {
        timeout: 15_000,
      })
      .toBe(2);

    // (2) Clock-synced unison: the pulse envelope spends roughly half of every
    // cycle dark (0%), so two RANDOMLY desynced peers would still trivially
    // "agree" whenever both happen to be in the dark gap. The load-bearing
    // signal is the BRIGHT moment: whenever peer A is lit, a clock-synced peer B
    // must be lit too. We sample many simultaneous pairs across several pulse
    // periods (period default 2000 ms) and look only at the frames where A is
    // bright (>60%). Among those, a clock-synced pair has at least one frame
    // where B is also near-peak → a tight gap; a desynced clock keeps B dark on
    // EVERY bright-A frame → the minimum gap stays large. Tracking the minimum
    // over many bright frames (rather than a single peak sample) removes the
    // one-frame sampling-skew flakiness while staying strict against desync.
    let brightFrames = 0;
    let minGapWhileABright = 100;
    for (let i = 0; i < 90; i++) {
      const [ta, tb] = await Promise.all([
        a.locator(".firefly-hud").textContent(),
        b.locator(".firefly-hud").textContent(),
      ]);
      const pa = parseHud(ta ?? "").pct;
      const pb = parseHud(tb ?? "").pct;
      if (pa !== null && pb !== null && pa > 60) {
        brightFrames++;
        minGapWhileABright = Math.min(minGapWhileABright, Math.abs(pa - pb));
      }
      await a.waitForTimeout(70);
    }
    // We must have actually caught A bright on several frames (else the test
    // proved nothing about unison).
    expect(
      brightFrames,
      "never observed peer A pulse bright — sampling too sparse",
    ).toBeGreaterThan(2);
    // Across the bright-A frames, a clock-synced B lines up tightly on at least
    // one; a desynced/ignored clock leaves B dark on all of them (gap >> 12).
    expect(
      minGapWhileABright,
      `min cross-peer gap while A bright was ${minGapWhileABright}% over ${brightFrames} frames`,
    ).toBeLessThanOrEqual(12);
  } finally {
    await cleanup();
  }
});

/**
 * Cross-peer assertion for the solo / connected UI state. A lone phone shows a
 * "pulsing solo — open this room on another phone" hint; the moment a second
 * peer's clock awareness arrives the hint must disappear. This proves the
 * presence count is driven by the mesh (awareness), not a local fixture: peer A
 * starts alone (hint visible) and the hint clears ONLY because B joined the
 * room and B's awareness crossed into A's replica.
 */
test("solo hint shows when alone and clears once a second phone joins", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    // Arm peer A first and leave B on the splash, so A is genuinely alone.
    await beginPulsing(a);
    await expect(a.locator(".firefly-solo")).toBeVisible();
    await expect(a.locator(".firefly-hud")).toContainText(/\b1 phone\b/);

    // Now bring the second phone into the room.
    await beginPulsing(b);

    // Once B's awareness crosses the mesh, A is no longer solo: the hint clears
    // and the count rises to 2. (Web-first assertions auto-poll up to the
    // awareness ping interval.)
    await expect(a.locator(".firefly-solo")).toBeHidden({ timeout: 15_000 });
    await expect(a.locator(".firefly-hud")).toContainText(/2 phones/, { timeout: 15_000 });
  } finally {
    await cleanup();
  }
});
