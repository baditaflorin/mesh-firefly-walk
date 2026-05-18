export const appConfig = {
  appName: "mesh-firefly-walk",
  storagePrefix: "mesh-firefly-walk",
  description:
    "Peer-to-peer browser mesh. Phones pulse soft yellow in clock-synced unison. From a distance, a walking group looks like a swarm of fireflies.",
  accentHex: "#FFD24A",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
  repositoryUrl: "https://github.com/baditaflorin/mesh-firefly-walk",
  pagesUrl: "https://baditaflorin.github.io/mesh-firefly-walk/",
  signalingUrl:
    (import.meta.env.VITE_WEBRTC_SIGNALING as string | undefined) ?? "wss://turn.0docker.com/ws",
  turnTokenUrl:
    (import.meta.env.VITE_TURN_TOKEN_URL as string | undefined) ??
    "https://turn.0docker.com/credentials",
  paypalUrl: "https://www.paypal.com/paypalme/florinbadita",
} as const;
