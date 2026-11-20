export type BlendCurve = 'linear' | 'even';

export interface MixEntry {
  id: string;
  hex: string;
  weight: number; // 1..100
}

export interface MixSnapshot {
  entries: MixEntry[];
  curve: BlendCurve;
}

export interface ToolState {
  entries: MixEntry[];
  curve: BlendCurve;
  past: MixSnapshot[];
  future: MixSnapshot[];
}

export interface BlendResult {
  result: string | null;
  gradient: string[];
  r: number;
  g: number;
  b: number;
}

/** Validate and expand a HEX color; returns normalized #rrggbb or null when invalid. */
export function normalizeHex(input: string): string | null {
  const raw = (input ?? '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(raw) && raw.length === 3) {
    const r = raw[0]! + raw[0]!;
    const g = raw[1]! + raw[1]!;
    const b = raw[2]! + raw[2]!;
    return `#${(r + g + b).toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toLowerCase()}`;
  }
  return null;
}

export function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

function toHexChannel(value: number): string {
  const clamped = Math.max(0, Math.min(255, Math.round(value)));
  return clamped.toString(16).padStart(2, '0');
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

/**
 * Blend valid entries. 'linear' weighs each color by its weight; 'even' weights
 * all valid colors equally. Intermediate gradient swatches interpolate between
 * the first and last (or between all equal-weight entries) valid colors.
 */
export function blend(entries: MixEntry[], curve: BlendCurve): BlendResult {
  const valid = entries
    .map((e) => ({ color: parseHex(e.hex), weight: Math.max(1, e.weight) }))
    .filter((c): c is { color: { r: number; g: number; b: number }; weight: number } => c.color !== null);

  if (valid.length === 0) {
    return { result: null, gradient: [], r: 0, g: 0, b: 0 };
  }

  const totalWeight = curve === 'linear'
    ? valid.reduce((sum, c) => sum + c.weight, 0)
    : valid.length;

  const blended = valid.reduce(
    (acc, c) => {
      const w = curve === 'linear' ? c.weight / totalWeight : 1 / totalWeight;
      return { r: acc.r + c.color.r * w, g: acc.g + c.color.g * w, b: acc.b + c.color.b * w };
    },
    { r: 0, g: 0, b: 0 }
  );

  const first = valid[0]?.color;
  const last = valid[valid.length - 1]?.color;
  if (!first || !last) {
    return { result: null, gradient: [], r: 0, g: 0, b: 0 };
  }
  const steps = 5;
  const gradient: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = valid.length === 1 ? 0 : i / (steps - 1);
    gradient.push(
      rgbToHex(
        first.r + (last.r - first.r) * t,
        first.g + (last.g - first.g) * t,
        first.b + (last.b - first.b) * t
      )
    );
  }

  return {
    result: rgbToHex(blended.r, blended.g, blended.b),
    gradient,
    r: Math.round(blended.r),
    g: Math.round(blended.g),
    b: Math.round(blended.b),
  };
}

export function rgbToHsl(r: number, g: number, b: number): string {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rf) h = ((gf - bf) / d + (gf < bf ? 6 : 0)) / 6;
    else if (max === gf) h = ((bf - rf) / d + 2) / 6;
    else h = ((rf - gf) / d + 4) / 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export function createEntry(hex: string, weight = 50): MixEntry {
  return { id: `entry-${Math.random().toString(36).slice(2, 10)}`, hex, weight };
}

export function applyChange(
  state: ToolState,
  change: (s: Pick<ToolState, 'entries' | 'curve'>) => Pick<ToolState, 'entries' | 'curve'>
): ToolState {
  const snapshot: MixSnapshot = { entries: state.entries, curve: state.curve };
  const next = change({ entries: state.entries, curve: state.curve });
  return {
    entries: next.entries,
    curve: next.curve,
    past: [...state.past.slice(-49), snapshot],
    future: [],
  };
}

export function undo(state: ToolState): ToolState {
  if (state.past.length === 0) return state;
  const previous = state.past[state.past.length - 1];
  if (!previous) return state;
  const snapshot: MixSnapshot = { entries: state.entries, curve: state.curve };
  return {
    entries: previous.entries,
    curve: previous.curve,
    past: state.past.slice(0, -1),
    future: [snapshot, ...state.future].slice(0, 50),
  };
}

export function redo(state: ToolState): ToolState {
  if (state.future.length === 0) return state;
  const nextEntry = state.future[0];
  if (!nextEntry) return state;
  const snapshot: MixSnapshot = { entries: state.entries, curve: state.curve };
  return {
    entries: nextEntry.entries,
    curve: nextEntry.curve,
    past: [...state.past, snapshot].slice(-50),
    future: state.future.slice(1),
  };
}
