import type { Tool, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import {
  DEFAULT_STATE,
  MAX_BASE,
  MIN_BASE,
  type BaseConversion,
  type BitGrouping,
  type DigitCase,
  type ToolState,
} from './types';

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

function digitChar(value: number): string {
  return DIGITS.charAt(value);
}

function digitValue(char: string): number {
  const lower = char.toLowerCase();
  const index = DIGITS.indexOf(lower);
  if (index === -1) return -1;
  return index;
}

/**
 * Parse `input` in `base` into a decimal fraction value.
 * Supports an optional leading sign and a single fractional part.
 * Returns null when input is empty or contains invalid digits.
 */
export function parseInBase(input: string, base: number): number | null {
  if (!Number.isInteger(base) || base < MIN_BASE || base > MAX_BASE) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = /^([+-]?)([0-9a-zA-Z]*)(?:\.([0-9a-zA-Z]*))?$/.exec(trimmed);
  if (!match) return null;
  const [, sign = '', intPart = '', fracPart = ''] = match;
  if (!intPart && !fracPart) return null;
  let value = 0;
  for (const char of intPart) {
    const d = digitValue(char);
    if (d < 0 || d >= base) return null;
    value = value * base + d;
  }
  let scale = 1 / base;
  for (const char of fracPart) {
    const d = digitValue(char);
    if (d < 0 || d >= base) return null;
    value += d * scale;
    scale /= base;
  }
  return sign === '-' ? -value : value;
}

/**
 * Format a non-negative finite number in `base` with up to 12 fractional digits,
 * trimming trailing zeros. Returns null when base is out of range or value invalid.
 */
export function formatInBase(value: number, base: number): string | null {
  if (!Number.isInteger(base) || base < MIN_BASE || base > MAX_BASE) return null;
  if (!Number.isFinite(value)) return null;
  const sign = value < 0 || Object.is(value, -0) ? '-' : '';
  const abs = Math.abs(value);
  let intPart = Math.floor(abs);
  let frac = abs - intPart;
  const intDigits: string[] = [];
  if (intPart === 0) {
    intDigits.push('0');
  }
  while (intPart > 0) {
    intDigits.unshift(digitChar(intPart % base));
    intPart = Math.floor(intPart / base);
  }
  const fracDigits: string[] = [];
  const maxFracDigits = 12;
  while (frac > 0 && fracDigits.length < maxFracDigits) {
    frac *= base;
    let digit = Math.floor(frac);
    if (digit >= base) digit = base - 1;
    fracDigits.push(digitChar(digit));
    frac -= digit;
    if (frac > 1 - 1e-12) {
      // rounding carry to the last written digit
      frac = 0;
    }
  }
  // trim trailing zeros
  while (fracDigits.length > 0 && fracDigits[fracDigits.length - 1] === '0') {
    fracDigits.pop();
  }
  const body = fracDigits.length > 0 ? `${intDigits.join('')}.${fracDigits.join('')}` : intDigits.join('');
  return sign + body;
}

/** Parse an integer in the given base; returns null on invalid input or fractions. */
export function parseIntegerInBase(input: string, base: number): number | null {
  if (!Number.isInteger(base) || base < MIN_BASE || base > MAX_BASE) return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.includes('.')) return null;
  const match = /^([+-]?)([0-9a-zA-Z]+)$/.exec(trimmed);
  if (!match) return null;
  const [, sign = '', digits = ''] = match;
  let value = 0;
  for (const char of digits) {
    const d = digitValue(char);
    if (d < 0 || d >= base) return null;
    value = value * base + d;
  }
  return sign === '-' ? -value : value;
}

/**
 * Unsigned magnitude bits of an integer (no sign bit), at least one digit.
 * For negative numbers this is the magnitude, not two's complement.
 */
export function toUnsignedBits(value: number, bitLength: number): string {
  let magnitude = Math.abs(Math.trunc(value));
  const width = Math.max(1, Math.trunc(bitLength));
  const bits: string[] = [];
  while (magnitude > 0) {
    bits.unshift(magnitude % 2 === 1 ? '1' : '0');
    magnitude = Math.floor(magnitude / 2);
  }
  while (bits.length < width) bits.unshift('0');
  // truncate to width if the magnitude needs more bits than requested
  if (bits.length > width) return bits.slice(bits.length - width).join('');
  return bits.join('');
}

/** Two's complement representation of an integer at the given bit length. */
export function toTwosComplement(value: number, bitLength: number): string {
  const width = Math.max(1, Math.trunc(bitLength));
  const mod = 2 ** width;
  let wrapped = Math.trunc(value) % mod;
  if (wrapped < 0) wrapped += mod;
  let bits = '';
  for (let i = width - 1; i >= 0; i--) {
    bits = ((wrapped >> i) & 1) === 1 ? bits + '1' : bits + '0';
  }
  return bits;
}

/** Group a binary string from the right with a space every `groupSize` bits. */
export function groupBits(bits: string, groupSize: number): string {
  if (groupSize <= 0) return bits;
  const groups: string[] = [];
  for (let end = bits.length; end > 0; end -= groupSize) {
    groups.unshift(bits.slice(Math.max(0, end - groupSize), end));
  }
  return groups.join(' ');
}

function applyCase(text: string, digitCase: DigitCase): string {
  return digitCase === 'upper' ? text.toUpperCase() : text.toLowerCase();
}

function formatBinary(bits: string, grouping: BitGrouping): string {
  const size = grouping === 'nibble' ? 4 : grouping === 'byte' ? 8 : 0;
  return groupBits(bits, size);
}

function validationError(input: string, base: number): string {
  if (!input.trim()) {
    return `Enter a number in base ${base}`;
  }
  return `"${input.trim()}" is not a valid base-${base} number. Valid digits: 0-${
    base <= 10 ? String(base - 1) : `9 and ${DIGITS.slice(10, base).split('').join(', ')}`
  }`;
}

/** Convert state.input (interpreted in state.inputBase) to every target base 2..36. */
export function convertToAllBases(state: ToolState): BaseConversion[] {
  const results: BaseConversion[] = [];
  const value = parseInBase(state.input, state.inputBase);
  for (let base = MIN_BASE; base <= MAX_BASE; base++) {
    if (base === state.inputBase) {
      const raw = state.input.trim();
      results.push({
        value: raw,
        formatted: applyCase(raw, state.digitCase),
        error: null,
      });
      continue;
    }
    if (value === null) {
      results.push({ value: '', formatted: '', error: validationError(state.input, state.inputBase) });
      continue;
    }
    const converted = formatInBase(value, base);
    if (converted === null) {
      results.push({ value: '', formatted: '', error: `Cannot represent input in base ${base}` });
      continue;
    }
    const formatted = applyCase(
      base === 2 ? formattedBinaryOf(value, state) : converted,
      state.digitCase
    );
    results.push({ value: base === 2 ? converted : formatted, formatted, error: null });
  }
  return results;
}

function formattedBinaryOf(value: number, state: ToolState): string {
  const converted = formatInBase(value, 2) ?? '0';
  const parts = converted.split('.');
  const intPart = parts[0] ?? converted;
  const fracPart = parts.length > 1 ? (parts[1] ?? '') : '';
  const groupedInt = formatBinary(intPart, state.grouping);
  return fracPart ? `${groupedInt}.${fracPart}` : groupedInt;
}

/** Bit length needed to represent the integer magnitude unsigned. */
export function requiredBitLength(value: number): number {
  const magnitude = Math.abs(Math.trunc(value));
  let bits = 1;
  while (magnitude >= 2 ** bits && bits < 1024) bits++;
  return bits;
}

/** Two's complement info string for the state input, or null when not applicable. */
export function twosComplementInfo(state: ToolState): string | null {
  const value = parseIntegerInBase(state.input, state.inputBase);
  if (value === null) return null;
  const bits = toTwosComplement(value, state.bitLength);
  return groupBits(bits, state.grouping === 'none' ? 0 : state.grouping === 'nibble' ? 4 : 8);
}

export const baseConverterTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: { ...DEFAULT_STATE },
  serialize: (state) => JSON.stringify(state),
  deserialize: (data): DeserializeResult<ToolState> => {
    if (typeof data !== 'object' || data === null) {
      return { success: false, error: 'Invalid data format: expected base converter state object' };
    }
    const v = data as Partial<ToolState>;
    const inputOk = typeof v.input === 'string';
    const baseOk = typeof v.inputBase === 'number' && Number.isInteger(v.inputBase) && v.inputBase >= MIN_BASE && v.inputBase <= MAX_BASE;
    if (!inputOk || !baseOk) {
      return {
        success: false,
        error: 'Invalid data format: expected { input: string, inputBase: number (2-36), ... }',
      };
    }
    const digitCase: DigitCase = v.digitCase === 'upper' ? 'upper' : 'lower';
    const grouping: BitGrouping =
      v.grouping === 'nibble' || v.grouping === 'byte' || v.grouping === 'none' ? v.grouping : 'none';
    const showTwosComplement = typeof v.showTwosComplement === 'boolean' ? v.showTwosComplement : true;
    const bitLength =
      typeof v.bitLength === 'number' && Number.isInteger(v.bitLength) && v.bitLength >= 1
        ? v.bitLength
        : DEFAULT_STATE.bitLength;
    return {
      success: true,
      data: {
        input: v.input as string,
        inputBase: v.inputBase as number,
        digitCase,
        grouping,
        showTwosComplement,
        bitLength,
      },
    };
  },
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};
