'use client';

import React from 'react';
import { MAX_BASE, MIN_BASE, type BitGrouping, type DigitCase, type ToolState } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (state: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state, onChange }) => {
  const update = (patch: Partial<ToolState>) => onChange({ ...state, ...patch });

  return (
    <div
      className="p-4 space-y-6 text-sm overflow-y-auto h-full"
      data-testid="base-converter-sidebar"
    >
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Digit case</h3>
        <div className="flex gap-2">
          {(['lower', 'upper'] as DigitCase[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => update({ digitCase: mode })}
              aria-pressed={state.digitCase === mode}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                state.digitCase === mode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {mode === 'lower' ? 'lowercase (a-f)' : 'UPPERCASE (A-F)'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Binary grouping</h3>
        <select
          aria-label="Binary grouping"
          value={state.grouping}
          onChange={(e) => update({ grouping: e.target.value as BitGrouping })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="none">No grouping</option>
          <option value="nibble">Nibbles (4 bits)</option>
          <option value="byte">Bytes (8 bits)</option>
        </select>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Two&apos;s complement</h3>
        <label className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Show signed representation
          </span>
          <input
            type="checkbox"
            checked={state.showTwosComplement}
            onChange={(e) => update({ showTwosComplement: e.target.checked })}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
        </label>
        <label className="mt-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
          Bit length
          <input
            type="number"
            min={1}
            max={512}
            step={1}
            value={state.bitLength}
            onChange={(e) => {
              const n = Math.trunc(Number(e.target.value));
              update({ bitLength: Number.isFinite(n) && n >= 1 ? Math.min(n, 512) : 1 });
            }}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </label>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Bases {MIN_BASE}–{MAX_BASE} are supported. Digits above 9 use letters a–z.
      </p>
    </div>
  );
};
