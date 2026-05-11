import { useEffect, useState } from "react";
import {
  loadSignalingUrl,
  loadTurnTokenUrl,
  resetIceServers,
  saveSignalingUrl,
  saveTurnTokenUrl,
} from "../sync/iceConfig";
import { appConfig } from "../../shared/config";

type Props = {
  open: boolean;
  onClose: () => void;
  roomId: string;
  onRoomChange: (next: string) => void;
  periodMs: number;
  onPeriodChange: (next: number) => void;
  hue: number;
  onHueChange: (next: number) => void;
  audio: boolean;
  onAudioChange: (next: boolean) => void;
};

export function SettingsDrawer({
  open,
  onClose,
  roomId,
  onRoomChange,
  periodMs,
  onPeriodChange,
  hue,
  onHueChange,
  audio,
  onAudioChange,
}: Props) {
  const [signaling, setSignaling] = useState(loadSignalingUrl());
  const [tokenUrl, setTokenUrl] = useState(loadTurnTokenUrl());

  useEffect(() => {
    if (open) {
      setSignaling(loadSignalingUrl());
      setTokenUrl(loadTurnTokenUrl());
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-drawer" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <label>
          <span>Room ID</span>
          <input value={roomId} onChange={(e) => onRoomChange(e.target.value)} />
        </label>

        <label>
          <span>Pulse period (ms)</span>
          <input
            type="number"
            min={500}
            max={10000}
            step={100}
            value={periodMs}
            onChange={(e) => onPeriodChange(Math.max(500, Number(e.target.value) || 2000))}
          />
        </label>

        <label>
          <span>Hue ({hue})</span>
          <input
            type="range"
            min={0}
            max={359}
            value={hue}
            onChange={(e) => onHueChange(Number(e.target.value))}
          />
        </label>

        <label className="settings-check">
          <input
            type="checkbox"
            checked={audio}
            onChange={(e) => onAudioChange(e.target.checked)}
          />
          <span>Chirp on each pulse</span>
        </label>

        <hr />

        <h3>Self-hosted infra (advanced)</h3>
        <p className="settings-help">
          Override the default signaling and TURN endpoints. Leave blank to use the built-in
          defaults (<code>{appConfig.signalingUrl}</code> and <code>{appConfig.turnTokenUrl}</code>
          ).
        </p>

        <label>
          <span>Signaling URL</span>
          <input
            value={signaling}
            onChange={(e) => setSignaling(e.target.value)}
            placeholder={appConfig.signalingUrl}
          />
        </label>

        <label>
          <span>TURN credentials URL</span>
          <input
            value={tokenUrl}
            onChange={(e) => setTokenUrl(e.target.value)}
            placeholder={appConfig.turnTokenUrl}
          />
        </label>

        <div className="settings-actions">
          <button
            type="button"
            onClick={() => {
              saveSignalingUrl(signaling);
              saveTurnTokenUrl(tokenUrl);
              onClose();
              location.reload();
            }}
          >
            Save and reload
          </button>
          <button
            type="button"
            onClick={() => {
              saveSignalingUrl("");
              saveTurnTokenUrl("");
              resetIceServers();
              onClose();
              location.reload();
            }}
          >
            Reset to defaults
          </button>
        </div>

        <hr />

        <footer className="settings-footer">
          <a href={appConfig.repositoryUrl} target="_blank" rel="noreferrer">
            source on github
          </a>
          <span>
            v{appConfig.version} · {appConfig.commit}
          </span>
        </footer>
      </div>
    </div>
  );
}
