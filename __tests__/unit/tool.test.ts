import { describe, it, expect } from 'vitest';
import { hexColorMixerTool } from '../../src/tool/tool-definition';
import type { ToolState } from '../../src/tool/types';

describe('hexColorMixerTool', () => {
  it('initializes with two seeded entries and linear curve', () => {
    const state = hexColorMixerTool.initialState;
    expect(state.entries).toHaveLength(2);
    expect(state.curve).toBe('linear');
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(0);
  });

  it('serializes state to JSON', () => {
    const state = hexColorMixerTool.initialState;
    const parsed = JSON.parse(hexColorMixerTool.serialize(state));
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.curve).toBe('linear');
  });

  it('deserializes valid mixer state', () => {
    const state = hexColorMixerTool.initialState;
    const result = hexColorMixerTool.deserialize(JSON.parse(hexColorMixerTool.serialize(state)));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.entries).toHaveLength(2);
    }
  });

  it('rejects invalid state shapes', () => {
    expect(hexColorMixerTool.deserialize(null).success).toBe(false);
    expect(hexColorMixerTool.deserialize({}).success).toBe(false);
    expect(hexColorMixerTool.deserialize({ entries: 'nope', curve: 'linear' }).success).toBe(false);
    expect(hexColorMixerTool.deserialize({ entries: [], curve: 'warp' }).success).toBe(false);
    expect(
      hexColorMixerTool.deserialize({ entries: [{ id: 1, hex: 2, weight: 'x' }], curve: 'linear' }).success
    ).toBe(false);
  });

  it('keeps state type contract intact', () => {
    const state: ToolState = hexColorMixerTool.initialState;
    expect(state).toHaveProperty('entries');
    expect(state).toHaveProperty('curve');
  });
});
