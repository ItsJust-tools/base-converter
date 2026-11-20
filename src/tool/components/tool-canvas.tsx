'use client';

import { useCallback, useMemo } from 'react';
import { blend } from '../types';
import type { ToolState } from '../types';

function CopyRow({ label, value }: { label: string; value: string }) {
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(value);
  }, [value]);
  return (
    <div className="mixer-copy-row" data-testid={`copy-${label}`}>
      <span className="mixer-copy-label">{label}</span>
      <code>{value}</code>
      <button type="button" className="mixer-copy-btn" aria-label={`Copy ${label} value`} onClick={copy}>
        Copy
      </button>
    </div>
  );
}

export function MixerToolCanvas({ state }: { state: ToolState }) {
  const { result, gradient } = useMemo(() => blend(state.entries, state.curve), [state.entries, state.curve]);

  const rgb = useMemo(() => {
    if (!result) return null;
    const m = result.slice(1);
    return `rgb(${parseInt(m.slice(0, 2), 16)}, ${parseInt(m.slice(2, 4), 16)}, ${parseInt(m.slice(4, 6), 16)})`;
  }, [result]);

  const hsl = useMemo(() => {
    if (!result) return null;
    const r = parseInt(result.slice(1, 3), 16) / 255;
    const g = parseInt(result.slice(3, 5), 16) / 255;
    const b = parseInt(result.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }, [result]);

  return (
    <div className="mixer-canvas" role="application" aria-label="HEX Color Mixer canvas">
      <div
        className="mixer-result-preview"
        data-testid="result-preview"
        style={{ backgroundColor: result ?? 'transparent' }}
        aria-label={`Blended color ${result ?? 'none'}`}
      />
      {result ? <CopyRow label="hex" value={result} /> : null}
      {rgb ? <CopyRow label="rgb" value={rgb} /> : null}
      {hsl ? <CopyRow label="hsl" value={hsl} /> : null}
      {gradient.length > 0 && (
        <div className="mixer-gradient" data-testid="gradient-swatches" aria-label="Gradient swatches">
          {gradient.map((c, i) => (
            <span key={i} className="mixer-swatch" style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
      )}
    </div>
  );
}
