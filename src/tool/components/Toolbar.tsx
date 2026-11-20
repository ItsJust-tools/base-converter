'use client';

import React from 'react';
import type { ToolState } from '../types';

interface ToolbarProps {
  state: ToolState;
  onChange: (state: ToolState) => void;
  onClear: () => void;
}

const QUICK_BASES: { base: number; label: string }[] = [
  { base: 2, label: 'BIN' },
  { base: 8, label: 'OCT' },
  { base: 10, label: 'DEC' },
  { base: 16, label: 'HEX' },
];

export const Toolbar: React.FC<ToolbarProps> = ({ state, onChange, onClear }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-1" role="group" aria-label="Quick input base">
        {QUICK_BASES.map(({ base, label }) => (
          <button
            key={base}
            type="button"
            onClick={() => onChange({ ...state, inputBase: base })}
            aria-pressed={state.inputBase === base}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              state.inputBase === base
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
