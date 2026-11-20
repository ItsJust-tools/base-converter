'use client';

import { blend, normalizeHex } from '../types';
import type { ToolState } from '../types';

interface ToolSidebarProps {
  state: ToolState;
  onEntryChange: (id: string, patch: { hex?: string; weight?: number }) => void;
  onAddEntry: (hex?: string) => void;
  onRemoveEntry: (id: string) => void;
  onCurveChange: (curve: 'linear' | 'even') => void;
  onRandomPalette: (hex: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const RANDOM_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#0f172a',
];

export function ToolSidebar({
  state,
  onEntryChange,
  onAddEntry,
  onRemoveEntry,
  onCurveChange,
  onRandomPalette,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolSidebarProps) {
  const { result } = blend(state.entries, state.curve);

  const randomHex = () => RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)] ?? "#3b82f6";

  return (
    <div className="mixer-sidebar">
      <div className="sidebar-section">
        <h3>Mix Colors</h3>
        <div className="mixer-history-controls">
          <button type="button" className="mixer-btn" aria-label="Undo" onClick={onUndo} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" className="mixer-btn" aria-label="Redo" onClick={onRedo} disabled={!canRedo}>
            Redo
          </button>
        </div>
        <ul className="mixer-entry-list" aria-label="Mix color entries">
          {state.entries.map((entry) => {
            const normalized = normalizeHex(entry.hex);
            return (
              <li key={entry.id} className="mixer-entry">
                <span
                  className="mixer-entry-swatch"
                  data-testid={`swatch-${entry.id}`}
                  style={{ backgroundColor: normalized ?? 'transparent' }}
                />
                <input
                  type="text"
                  className="mixer-hex-input"
                  aria-label={`HEX value for entry ${entry.id}`}
                  value={entry.hex}
                  aria-invalid={!normalized}
                  onChange={(e) => onEntryChange(entry.id, { hex: e.target.value })}
                  placeholder="#rrggbb"
                  spellCheck={false}
                />
                <input
                  type="range"
                  className="mixer-weight-slider"
                  aria-label={`Weight for entry ${entry.id}`}
                  min={1}
                  max={100}
                  value={entry.weight}
                  onChange={(e) => onEntryChange(entry.id, { weight: Number(e.target.value) })}
                />
                <span className="mixer-weight-value">{entry.weight}</span>
                <button
                  type="button"
                  className="mixer-remove-btn"
                  aria-label={`Remove entry ${entry.id}`}
                  onClick={() => onRemoveEntry(entry.id)}
                >
                  ✕
                </button>
                {!normalized && (
                  <span className="mixer-error-hint" role="alert">
                    Invalid HEX
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mixer-actions">
          <button type="button" className="mixer-btn mixer-btn-primary" aria-label="Add color" onClick={() => onAddEntry()}>
            + Add Color
          </button>
          <button
            type="button"
            className="mixer-btn"
            aria-label="Random palette"
            onClick={() => {
              const hex = randomHex();
              onRandomPalette(hex);
            }}
          >
            🎲 Random
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Blend Curve</h3>
        <div className="mixer-curve-controls" role="radiogroup" aria-label="Blend curve">
          <label>
            <input
              type="radio"
              name="mixer-curve"
              checked={state.curve === 'linear'}
              onChange={() => onCurveChange('linear')}
            />
            Linear (weights)
          </label>
          <label>
            <input
              type="radio"
              name="mixer-curve"
              checked={state.curve === 'even'}
              onChange={() => onCurveChange('even')}
            />
            Even
          </label>
        </div>
        {result && <p className="mixer-result-hint">Result: {result}</p>}
      </div>
    </div>
  );
}
