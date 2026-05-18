import { useEffect, useState } from "react";
import { Firefly } from "./features/firefly/Firefly";
import { SettingsDrawer } from "./features/settings/SettingsDrawer";
import { appConfig } from "./shared/config";
import { InviteShareButton, MeshBeacon } from "@baditaflorin/mesh-common";

const STORAGE = {
  room: `${appConfig.storagePrefix}:room`,
  period: `${appConfig.storagePrefix}:period`,
  hue: `${appConfig.storagePrefix}:hue`,
  audio: `${appConfig.storagePrefix}:audio`,
};

function readString(key: string, fallback: string): string {
  return localStorage.getItem(key) ?? fallback;
}
function readNumber(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
function readBool(key: string, fallback: boolean): boolean {
  const raw = localStorage.getItem(key);
  return raw === null ? fallback : raw === "1";
}

export function App() {
  const [roomId, setRoomId] = useState(() => readString(STORAGE.room, "default"));
  const [periodMs, setPeriodMs] = useState(() => readNumber(STORAGE.period, 2000));
  const [hue, setHue] = useState(() => readNumber(STORAGE.hue, 48));
  const [audio, setAudio] = useState(() => readBool(STORAGE.audio, false));
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE.room, roomId);
  }, [roomId]);
  useEffect(() => {
    localStorage.setItem(STORAGE.period, String(periodMs));
  }, [periodMs]);
  useEffect(() => {
    localStorage.setItem(STORAGE.hue, String(hue));
  }, [hue]);
  useEffect(() => {
    localStorage.setItem(STORAGE.audio, audio ? "1" : "0");
  }, [audio]);

  return (
    <div className="app-root">
      <Firefly roomId={roomId} periodMs={periodMs} hue={hue} audio={audio} />

      <InviteShareButton appName={appConfig.appName} roomId={roomId} />
      <MeshBeacon app={appConfig.appName} room={roomId} />

      <button
        type="button"
        className="settings-fab"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        ⚙
      </button>

      <div className="self-ref">
        <a href={appConfig.repositoryUrl} target="_blank" rel="noreferrer">
          source
        </a>
        <span aria-hidden="true">·</span>
        <a href={appConfig.paypalUrl} target="_blank" rel="noreferrer">
          tip ♥
        </a>
        <span aria-hidden="true">·</span>
        <span>
          v{appConfig.version} · {appConfig.commit}
        </span>
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        roomId={roomId}
        onRoomChange={setRoomId}
        periodMs={periodMs}
        onPeriodChange={setPeriodMs}
        hue={hue}
        onHueChange={setHue}
        audio={audio}
        onAudioChange={setAudio}
      />
    </div>
  );
}
