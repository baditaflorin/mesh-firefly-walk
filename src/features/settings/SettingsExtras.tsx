type Props = {
  periodMs: number;
  onPeriodChange: (next: number) => void;
  hue: number;
  onHueChange: (next: number) => void;
  audio: boolean;
  onAudioChange: (next: boolean) => void;
};

export function SettingsExtras({
  periodMs,
  onPeriodChange,
  hue,
  onHueChange,
  audio,
  onAudioChange,
}: Props) {
  return (
    <>
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
        <input type="checkbox" checked={audio} onChange={(e) => onAudioChange(e.target.checked)} />
        <span>Chirp on each pulse</span>
      </label>
    </>
  );
}
