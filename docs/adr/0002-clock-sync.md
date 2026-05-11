---
status: accepted
date: 2026-05-11
---

# 0002 — Mesh clock-sync algorithm

## Context

The whole experience depends on every phone in the mesh believing the same `t` at the same wall-clock instant. Browsers don't expose NTP-grade time, and `Date.now()` drifts between devices by tens to hundreds of milliseconds. Sub-50 ms synchrony is the threshold above which the firefly effect visibly falls apart.

## Decision

A minimal **median-offset** algorithm:

1. Every peer publishes its `Date.now()` into a Yjs awareness field (`clock.t`) every 1.5 s.
2. On receipt of a remote peer's awareness update, each peer records `offset_peer = peer.t - my.t`.
3. **Mesh time** = `Date.now() + median(offsets across live peers)`.
4. Stale samples (no update within 5 s) are evicted, so peers that go away stop dragging the median.

Implementation lives in `src/features/sync/clockSync.ts`.

## Consequences

- **Pros.** Simple. Symmetric — every peer applies the same algorithm so they all converge on the same mesh time. Robust to single slow peers or GC pauses because median, not mean. No RTT measurement, no extra round trips.
- **Cons.** One-way-latency bias is not removed: if peers' awareness updates arrive 100 ms late on average, the median offset is biased by ~100 ms. But that bias is the **same** for every peer (because the median is the same function of the same inputs), so visible synchrony across phones is preserved even though the mesh clock isn't accurate to wall-clock UTC.
- **Settle time.** ~3 s (two awareness rounds) for a fresh peer to reach steady state.

## Alternatives considered

- **NTP-style offset + RTT correction** with a designated time source. Rejected as overkill for this use case — the symmetric median bias is good enough for visual synchrony.
- **Designated leader broadcasting `t`**. Rejected — adds a single point of failure and a special-case code path for the leader.
- **Performance.now() with a shared epoch**. Rejected — `performance.now()` is per-document; a shared epoch would still need wall-clock to bootstrap.

## How synchrony is measured

The HUD shows the current pulse intensity. A second phone running the same room should display visually identical brightness within ~30 ms — verifiable by eye when phones are placed side by side. There is no telemetry; this is checked manually with two devices.
