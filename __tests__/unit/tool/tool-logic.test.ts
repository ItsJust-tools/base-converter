import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyChange,
  undo,
  redo,
  blend,
  normalizeHex,
  parseHex,
  rgbToHex,
  createEntry,
} from '../../../src/tool/types';
import { updateEntry, addEntry, removeEntry, setCurve, undoState, redoState } from '../../../src/tool/tool-definition';
import type { ToolState, MixEntry } from '../../../src/tool/types';

function midColor(entryCount: number): ToolState {
  return {
    entries: [createEntry('#000000'), createEntry('#ffffff')],
    curve: 'linear',
    past: [],
    future: [],
  };
}


describe('normalizeHex', () => {
  it('expands 3-digit hex', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc');
    expect(normalizeHex('ABC')).toBe('#aabbcc');
  });

  it('normalizes 6-digit hex', () => {
    expect(normalizeHex('#AABBCC')).toBe('#aabbcc');
    expect(normalizeHex('aabbcc')).toBe('#aabbcc');
  });

  it('rejects invalid hex', () => {
    expect(normalizeHex('#zzzzzz')).toBeNull();
    expect(normalizeHex('12345')).toBeNull();
    expect(normalizeHex('')).toBeNull();
    expect(normalizeHex('#1234567')).toBeNull();
  });
});

describe('blend', () => {
  it('blends two colors 50/50 to exact midpoint', () => {
    const entries = [createEntry('#000000'), createEntry('#ffffff')];
    const result = blend(entries, 'linear');
    expect(result.result).toBe('#808080');
  });

  it('respects weights proportionally', () => {
    const result = blend([createEntry('#000000', 75), createEntry('#ffffff', 25)], 'linear');
    expect(result.result).toBe('#404040');
  });

  it('even curve ignores weights', () => {
    const entries = [createEntry('#000000', 99), createEntry('#ffffff', 1)];
    expect(blend(entries, 'even').result).toBe('#808080');
  });

  it('returns null result when no valid colors', () => {
    expect(blend([createEntry('nope')], 'linear').result).toBeNull();
  });

  it('produces gradient swatches between first and last', () => {
    const result = blend([createEntry('#000000'), createEntry('#ffffff')], 'linear');
    expect(result.gradient).toHaveLength(5);
    expect(result.gradient[0]).toBe('#000000');
    expect(result.gradient[4]).toBe('#ffffff');
    expect(result.gradient[2]).toBe('#808080');
  });

  it('single valid color returns itself', () => {
    expect(blend([createEntry('#ff0000')], 'linear').result).toBe('#ff0000');
  });
});

describe('parseHex / rgbToHex round-trip', () => {
  it('round-trips a color', () => {
    const { r, g, b } = parseHex('#3b82f6')!;
    expect(rgbToHex(r, g, b)).toBe('#3b82f6');
  });
});

describe('undo/redo', () => {
  let state: ToolState;
  beforeEach(() => {
    state = midColor(2);
  });

  it('undo reverts entry change', () => {
    const changed = updateEntry(state, state.entries[0]?.id ?? "", { hex: '#ff0000' });
    expect(changed.entries[0]?.hex).toBe('#ff0000');
    const reverted = undoState(changed);
    expect(reverted.entries[0]?.hex).toBe('#000000');
    expect(reverted.future).toHaveLength(1);
  });

  it('redo reapplies reverted change', () => {
    const changed = updateEntry(state, state.entries[0]?.id ?? "", { hex: '#ff0000' });
    const reverted = undoState(changed);
    const redone = redoState(reverted);
    expect(redone.entries[0]?.hex).toBe('#ff0000');
  });

  it('no-ops when history empty', () => {
    expect(undo(state)).toBe(state);
    expect(redo(state)).toBe(state);
  });

  it('add and remove entries record history', () => {
    const added = addEntry(state, '#00ff00');
    expect(added.entries).toHaveLength(3);
    const removed = removeEntry(added, added.entries[2]?.id ?? "");
    expect(removed.entries).toHaveLength(2);
    expect(undoState(removed).entries).toHaveLength(3);
  });

  it('setCurve records history', () => {
    const changed = setCurve(state, 'even');
    expect(changed.curve).toBe('even');
    expect(undoState(changed).curve).toBe('linear');
  });

  it('applyChange clears future history', () => {
    const withFuture = { ...state, future: [{ entries: state.entries, curve: 'even' as const }] };
    const changed = applyChange(withFuture, (s) => ({ ...s, curve: 'linear' }));
    expect(changed.future).toHaveLength(0);
  });
});

describe('createEntry', () => {
  it('creates unique ids and weights', () => {
    const a = createEntry('#000000');
    const b = createEntry('#000000');
    expect(a.id).not.toBe(b.id);
    expect(a.weight).toBe(50);
    expect(a.hex).toBe('#000000');
  });
});

describe('mixEntry helpers', () => {
  it('updateEntry only touches target entry', () => {
    const state = midColor(2);
    const changed = updateEntry(state, state.entries[1]?.id ?? "", { weight: 10 });
    expect(changed.entries[0]?.weight).toBe(50);
    expect(changed.entries[1]?.weight).toBe(10);
  });
});

