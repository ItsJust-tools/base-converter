'use client';

import React from 'react';
import {
  convertToAllBases,
  parseIntegerInBase,
  twosComplementInfo,
  requiredBitLength,
} from '../tool-definition';
import type { ToolState } from '../types';

interface CanvasProps {
  state: ToolState;
  onChange: (state: ToolState) => void;
}

const BASE_LABELS: { base: number; label: string }[] = [
  { base: 2, label: 'BIN (2)' },
  { base: 8, label: 'OCT (8)' },
  { base: 10, label: 'DEC (10)' },
  { base: 16, label: 'HEX (16)' },
];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  }, [value]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="copy-btn text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Copy converted value"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export const Canvas: React.FC<CanvasProps> = ({ state, onChange }) => {
  const conversions = React.useMemo(() => convertToAllBases(state), [state]);
  const rows = [
    ...BASE_LABELS.map(({ base, label }) => ({ base, label, conversion: conversions[base - 2] })),
    ...Array.from({ length: 30 }, (_, i) => {
      const base = i + 7;
      if (base === 8 || base === 10 || base === 16) return null;
      return { base, label: `Base ${base}`, conversion: conversions[base - 2] };
    }).filter((r): r is { base: number; label: string; conversion: (typeof conversions)[number] } => r !== null),
  ];

  const inputValue = parseIntegerInBase(state.input, state.inputBase);
  const twos = state.showTwosComplement ? twosComplementInfo(state) : null;

  const update = (patch: Partial<ToolState>) => onChange({ ...state, ...patch });

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full" data-testid="base-converter-canvas">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <label
          htmlFor="base-input"
          className="text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300"
        >
          Input (base {state.inputBase})
        </label>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            id="base-input"
            type="text"
            value={state.input}
            onChange={(e) => update({ input: e.target.value })}
            placeholder={`Enter a base-${state.inputBase} number`}
            className="w-full sm:w-72 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
            aria-describedby="base-input-error"
          />
          <select
            aria-label="Input base"
            value={state.inputBase}
            onChange={(e) => update({ inputBase: Number(e.target.value) })}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
          >
            {Array.from({ length: 35 }, (_, i) => i + 2).map((b) => (
              <option key={b} value={b}>
                Base {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        {rows.map((row) => {
          const { base, label, conversion } = row;
          if (!conversion) return null;
          return (
          <div
            key={base}
            className="flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2"
            data-testid={`base-row-${base}`}
          >
            <span className="w-20 shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
            {conversion.error ? (
              <span role="alert" className="flex-1 text-xs text-red-600 dark:text-red-400">
                {conversion.error}
              </span>
            ) : (
              <code className="flex-1 break-all font-mono text-sm text-gray-900 dark:text-gray-100">
                {conversion.formatted || '—'}
              </code>
            )}
            {!conversion.error && conversion.formatted ? <CopyButton value={conversion.formatted} /> : null}
          </div>
          );
        })}
      </div>

      {state.showTwosComplement && (
        <div className="rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Two's complement ({state.bitLength} bit)
            </span>
            {twos ? <CopyButton value={twos.replace(/ /g, '')} /> : null}
          </div>
          {twos ? (
            <code className="mt-1 block break-all font-mono text-sm text-gray-900 dark:text-gray-100">{twos}</code>
          ) : (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter a valid integer (no fractional part) to see the two's complement representation.
            </p>
          )}
          {inputValue !== null && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Minimum unsigned bit length for magnitude: {requiredBitLength(inputValue)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
