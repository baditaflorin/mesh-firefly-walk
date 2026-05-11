---
status: accepted
date: 2026-05-11
---

# 0003 — Pulse-envelope shape and timing

## Context

A square-wave pulse looks like a stuttering flashlight. A pure sinusoid feels mechanical. The pulse needs to feel **alive** — like a firefly's belly, not a notification light.

## Decision

The brightness envelope is a function of `phase = (mesh_t mod period) / period`:

```
intensity(phase) =
  phase / 0.1                  if  phase < 0.1        // sharp attack
  1 - (phase - 0.1) / 0.4      if  0.1 ≤ phase < 0.5  // exponential-ish decay
  0                            otherwise              // dark gap
```

- **Period default**: 2000 ms.
- **Hue default**: 48° (warm yellow, hsl(48, 85%, …)). Configurable 0–359 in Settings.
- **Sharp attack (100 ms)** then **slow decay (400 ms)** then **silence (1500 ms)** matches what real fireflies do.

Render path: a CSS radial gradient is rebuilt every animation frame from the current `intensity`. No canvas, no WebGL — DOM + GPU compositing is plenty for a single full-screen ellipse.

## Consequences

- Battery friendly — no continuous canvas draws, just style recalcs.
- Identical math on every phone, fed by the same `mesh_t`, produces the same brightness everywhere simultaneously.
- The "darkness gap" between pulses is the recognizable shape: from a distance the group genuinely twinkles.

## Alternatives considered

- **Sinusoid.** Looks too synthetic; lacks the dark gap.
- **Random per-phone phase offsets.** Rejected — defeats the point. The whole spectacle is unison, not chaos.
- **WebGL shader.** Rejected — overkill for a single radial gradient. Saved for `mesh-wave-canvas` where the spatial structure matters.

## Audio chirp

A 880→440 Hz exponential sine sweep, 200 ms long, fired once per period at the brightness peak. Opt-in, off by default. Web Audio context is created on the user's first tap (iOS Safari gesture requirement).
