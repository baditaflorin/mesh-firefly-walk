# Privacy threat model — mesh-firefly-walk

## What other peers in the same room can see

- Your phone's wall-clock time (`Date.now()`), published every 1.5 s as part of mesh clock sync.
- Your Yjs awareness `clientID` — a per-session 32-bit random integer regenerated on every page load. Not stable across reloads. Not tied to anything else.

That is the entire payload on the wire. No name, no location, no audio, no identity.

## What the signaling server can see

`signaling-server` (mine, source at https://github.com/baditaflorin/signaling-server) sees:

- The **room name** (`mesh-firefly-walk:<roomId>`).
- Encrypted **SDP** offer/answer blobs being relayed between peers.
- The IP address of the peer making the WebSocket connection (standard TCP).

It does **not** see clock samples, awareness state, or any application-level traffic — those flow peer-to-peer over WebRTC DataChannel once the SDP exchange completes.

## What the TURN server can see

`coturn-hetzner` (mine, source at https://github.com/baditaflorin/coturn-hetzner) relays encrypted WebRTC media/data when peers cannot connect directly (symmetric NAT etc.). It sees:

- The IP addresses of the two peers being relayed.
- Encrypted DTLS-SRTP / DataChannel bytes. It cannot decrypt them.

It does **not** see clock samples either — those are inside the encrypted tunnel.

## What the analytics beacon can see

This app is built on the shared `@baditaflorin/mesh-common` scaffold, which fires a
1×1-pixel pageview beacon (`https://pixel.0exec.com/pix.gif`) once per room join. That
request carries:

- The app id (`mesh-firefly-walk`).
- **Your room ID**, up to 64 characters — this is the one identifier in this app that a
  user chooses and shares with a specific real-world group, so treat it accordingly.
- The first 12 characters of your Yjs awareness `clientID`.
- `document.referrer` and a timestamp.

This is a third domain, separate from the signaling server and TURN relay, and it is
**not** covered by the "only timestamps and CRDT deltas are on the wire" claim above —
that claim describes the peer-to-peer mesh traffic only, not this app-shell pageview
ping. The beacon is a no-op when `Do-Not-Track` is enabled or when the "Opt out of
anonymous pageview pings" toggle in Settings is checked. Source:
[`useMeshBeacon.ts`](https://github.com/baditaflorin/mesh-common/blob/main/src/useMeshBeacon.ts).

## What stays local

- Your room ID and settings are in `localStorage` and never leave your device.
- Your audio chirp setting is local-only.

## What's NOT in the threat model (yet)

- Anonymity within the room. Anyone in the same room with packet-inspection tools could correlate your awareness clientID with your IP. If you need anonymity inside a public room, see [anon-conf-poll](https://github.com/baditaflorin/anon-conf-poll) for the Semaphore commit-reveal pattern that would solve this. This app doesn't bother because the only payload is "my clock is at T," which leaks nothing of consequence.
- Network observers. If you're on a hostile Wi-Fi, the network owner can see the WebSocket connection to `turn.0docker.com` and a relay flow to whatever TURN port you negotiate. They cannot decrypt the contents.
