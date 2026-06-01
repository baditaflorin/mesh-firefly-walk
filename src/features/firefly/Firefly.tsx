import { useEffect, useMemo, useRef, useState } from "react";
import { useTone } from "@baditaflorin/mesh-common";
import { createRoomSync } from "../sync/yjsRoom";
import { createClockSync } from "../sync/clockSync";
import { maybeFetchTurnCredentials } from "../sync/iceConfig";

type Props = {
  roomId: string;
  periodMs: number;
  hue: number;
  audio: boolean;
};

export function Firefly({ roomId, periodMs, hue, audio }: Props) {
  const [armed, setArmed] = useState(false);
  const [phase, setPhase] = useState(0);
  const [peers, setPeers] = useState(0);
  const tone = useTone();
  const lastChirpRef = useRef(-1);

  const meshHandle = useMemo(() => {
    if (!armed) return null;
    const room = createRoomSync(roomId);
    const clock = createClockSync(room.provider);
    return { room, clock };
  }, [armed, roomId]);

  useEffect(() => {
    if (!armed) return undefined;
    void maybeFetchTurnCredentials();
    return undefined;
  }, [armed]);

  useEffect(() => {
    return () => {
      meshHandle?.clock.destroy();
      meshHandle?.room.provider?.destroy();
    };
  }, [meshHandle]);

  useEffect(() => {
    if (!meshHandle) return undefined;
    let frame = 0;
    const tick = () => {
      const t = meshHandle.clock.meshNow();
      const p = ((t % periodMs) / periodMs + 1) % 1;
      setPhase(p);
      setPeers(meshHandle.clock.peerCount());

      if (audio) {
        const cycle = Math.floor(t / periodMs);
        if (cycle !== lastChirpRef.current && p < 0.05) {
          lastChirpRef.current = cycle;
          tone.play({
            freq: 880,
            glideTo: 440,
            type: "sine",
            duration: 0.18,
            gain: 0.05,
            attack: 0.02,
          });
        }
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [meshHandle, periodMs, audio, tone]);

  const intensity = pulseEnvelope(phase);
  const glow = `radial-gradient(ellipse at center, hsla(${hue}, 85%, ${Math.round(20 + 50 * intensity)}%, ${0.6 + 0.4 * intensity}) 0%, hsla(${hue}, 70%, 8%, 1) 70%)`;

  if (!armed) {
    return (
      <div className="firefly-arm">
        <h1>mesh-firefly-walk</h1>
        <p>
          Tap to join the swarm. Your phone will pulse soft yellow in sync with every other phone in
          the same room. Walk in a group; from a distance you look like a swarm of fireflies.
        </p>
        <button
          type="button"
          className="firefly-arm-button"
          onClick={() => {
            if (audio) {
              void tone.resume();
            }
            setArmed(true);
          }}
        >
          Begin pulsing
        </button>
        <p className="firefly-hint">
          Room <code>{roomId}</code> · period {periodMs} ms · {audio ? "audio chirp on" : "silent"}
        </p>
      </div>
    );
  }

  const phoneCount = peers + 1;
  return (
    <div className="firefly-stage" style={{ background: glow }}>
      <div className="firefly-hud">
        <span>
          {phoneCount} phone{phoneCount === 1 ? "" : "s"}
        </span>
        <span>·</span>
        <span>{Math.round(intensity * 100)}%</span>
      </div>
      {peers === 0 && (
        <p className="firefly-solo">
          Pulsing solo — open this room on another phone to sync the swarm.
        </p>
      )}
    </div>
  );
}

function pulseEnvelope(phase: number): number {
  // soft attack, gentle decay, dark gap
  const x = phase;
  if (x < 0.1) return x / 0.1;
  if (x < 0.5) return 1 - (x - 0.1) / 0.4;
  return 0;
}
