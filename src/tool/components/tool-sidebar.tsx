'use client';

import { MAX_BASE, MIN_BASE } from '../types';

interface ToolSidebarProps {
  text?: string;
  fontSize?: number;
  onFontSizeChange?: (delta: number) => void;
}

export function ToolSidebar({ text, fontSize, onFontSizeChange }: ToolSidebarProps) {
  const digits = (text ?? '').replace(/\s/g, '').length;

  return (
    <div className="converter-sidebar">
      <div className="sidebar-section">
        <h3>Input Stats</h3>
        <dl className="stats-list">
          <div className="stat-row">
            <dt>Digits</dt>
            <dd>{digits.toLocaleString()}</dd>
          </div>
          <div className="stat-row">
            <dt>Font size</dt>
            <dd>
              <button
                type="button"
                aria-label="Decrease font size"
                onClick={() => onFontSizeChange?.(-2)}
                className="mr-2 rounded border border-gray-300 px-2 text-xs dark:border-gray-700"
              >
                A-
              </button>
              <span className="font-mono text-xs">{fontSize ?? 16}px</span>
              <button
                type="button"
                aria-label="Increase font size"
                onClick={() => onFontSizeChange?.(2)}
                className="ml-2 rounded border border-gray-300 px-2 text-xs dark:border-gray-700"
              >
                A+
              </button>
            </dd>
          </div>
          <div className="stat-row">
            <dt>Supported bases</dt>
            <dd>
              {MIN_BASE}–{MAX_BASE}
            </dd>
          </div>
        </dl>
      </div>
      <div className="sidebar-section">
        <h3>Digit reference</h3>
        <p className="text-xs leading-relaxed">
          Digits above 9 map to letters: a=10, b=11, … z=35. Inputs may include an optional
          leading sign and a single fractional part.
        </p>
      </div>
    </div>
  );
}
