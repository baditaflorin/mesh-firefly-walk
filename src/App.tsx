import { useEffect, useState } from "react";
import { MeshShell } from "@baditaflorin/mesh-common";
import { Firefly } from "./features/firefly/Firefly";
import { SettingsExtras } from "./features/settings/SettingsExtras";
import { appConfig } from "./shared/config";

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
    <MeshShell
      config={appConfig}
      roomId={roomId}
      onRoomChange={setRoomId}
      settingsExtras={
        <SettingsExtras
          periodMs={periodMs}
          onPeriodChange={setPeriodMs}
          hue={hue}
          onHueChange={setHue}
          audio={audio}
          onAudioChange={setAudio}
        />
      }
    >
      <Firefly roomId={roomId} periodMs={periodMs} hue={hue} audio={audio} />
    </MeshShell>
  );
}
