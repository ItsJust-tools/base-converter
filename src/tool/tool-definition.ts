import type { Tool, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import {
  type ToolState,
  type MixEntry,
  type MixSnapshot,
  type BlendCurve,
  applyChange,
  undo,
  redo,
  createEntry,
  normalizeHex,
} from './types';

function isToolState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return (
    Array.isArray(v.entries) &&
    v.entries.every(
      (e: unknown) =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as MixEntry).id === 'string' &&
        typeof (e as MixEntry).hex === 'string' &&
        typeof (e as MixEntry).weight === 'number'
    ) &&
    (v.curve === 'linear' || v.curve === 'even')
  );
}

export const hexColorMixerTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: {
    entries: [createEntry('#3b82f6'), createEntry('#f59e0b')],
    curve: 'linear',
    past: [],
    future: [],
  },
  serialize: (state) => JSON.stringify(state),
  deserialize: (data): DeserializeResult<ToolState> => {
    try {
      if (isToolState(data)) {
        return { success: true, data: data };
      }
      return { success: false, error: 'Invalid data format: expected valid mixer state' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deserialization error';
      return { success: false, error: `Failed to deserialize state: ${message}` };
    }
  },
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};

export function updateEntry(state: ToolState, id: string, patch: Partial<Pick<MixEntry, 'hex' | 'weight'>>): ToolState {
  return applyChange(state, (s) => ({
    ...s,
    entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
  }));
}

export function addEntry(state: ToolState, hex = '#000000'): ToolState {
  return applyChange(state, (s) => ({ ...s, entries: [...s.entries, createEntry(hex)] }));
}

export function removeEntry(state: ToolState, id: string): ToolState {
  return applyChange(state, (s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
}

export function setCurve(state: ToolState, curve: BlendCurve): ToolState {
  return applyChange(state, (s) => ({ ...s, curve }));
}

export function validHexOrNull(hex: string): string | null {
  return normalizeHex(hex);
}

export type { ToolState, MixEntry, MixSnapshot, BlendCurve };

export const undoState = undo;
export const redoState = redo;
