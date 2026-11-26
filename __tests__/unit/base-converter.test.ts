import { describe, it, expect } from 'vitest';
import {
  parseInBase,
  parseIntegerInBase,
  formatInBase,
  toUnsignedBits,
  toTwosComplement,
  groupBits,
  requiredBitLength,
  convertToAllBases,
  twosComplementInfo,
  baseConverterTool,
} from '../../src/tool/tool-definition';
import { DEFAULT_STATE, MAX_BASE, MIN_BASE } from '../../src/tool/types';
import type { BaseConversion, ToolState } from '../../src/tool/types';

const state = (patch: Partial<ToolState> = {}): ToolState => ({ ...DEFAULT_STATE, ...patch });

describe('parseInBase', () => {
  it('parses decimal integers', () => {
    expect(parseInBase('255', 10)).toBe(255);
    expect(parseInBase('-42', 10)).toBe(-42);
    expect(parseInBase('+7', 10)).toBe(7);
  });

  it('parses binary, octal and hex', () => {
    expect(parseInBase('1010', 2)).toBe(10);
    expect(parseInBase('777', 8)).toBe(511);
    expect(parseInBase('ff', 16)).toBe(255);
    expect(parseInBase('FF', 16)).toBe(255);
    expect(parseInBase('z', 36)).toBe(35);
  });

  it('parses fractional numbers', () => {
    expect(parseInBase('0.5', 10)).toBeCloseTo(0.5);
    expect(parseInBase('0.1', 2)).toBeCloseTo(0.5);
    expect(parseInBase('10.1', 2)).toBeCloseTo(2.5);
    expect(parseInBase('-2.5', 10)).toBeCloseTo(-2.5);
  });

  it('rejects invalid digits for the base', () => {
    expect(parseInBase('2', 2)).toBeNull();
    expect(parseInBase('129', 8)).toBeNull();
    expect(parseInBase('g', 16)).toBeNull();
    expect(parseInBase('hello', 10)).toBeNull();
  });

  it('rejects empty and malformed input', () => {
    expect(parseInBase('', 10)).toBeNull();
    expect(parseInBase('   ', 10)).toBeNull();
    expect(parseInBase('.', 10)).toBeNull();
    expect(parseInBase('1.2.3', 10)).toBeNull();
    expect(parseInBase('--5', 10)).toBeNull();
  });

  it('rejects out-of-range bases', () => {
    expect(parseInBase('1', 1)).toBeNull();
    expect(parseInBase('1', 37)).toBeNull();
    expect(parseInBase('1', 0)).toBeNull();
  });
});

describe('formatInBase', () => {
  it('formats integers in every base', () => {
    expect(formatInBase(255, 16)).toBe('ff');
    expect(formatInBase(255, 2)).toBe('11111111');
    expect(formatInBase(511, 8)).toBe('777');
    expect(formatInBase(35, 36)).toBe('z');
    expect(formatInBase(0, 10)).toBe('0');
  });

  it('formats fractions', () => {
    expect(formatInBase(0.5, 2)).toBe('0.1');
    expect(formatInBase(2.5, 2)).toBe('10.1');
    expect(formatInBase(0.5, 10)).toBe('0.5');
  });

  it('formats negatives with sign', () => {
    expect(formatInBase(-255, 16)).toBe('-ff');
    expect(formatInBase(-2.5, 10)).toBe('-2.5');
  });

  it('returns null for invalid base/value', () => {
    expect(formatInBase(1, 1)).toBeNull();
    expect(formatInBase(1, 37)).toBeNull();
    expect(formatInBase(Number.NaN, 10)).toBeNull();
    expect(formatInBase(Infinity, 10)).toBeNull();
  });

  it('survives round-trips for base boundaries 2 and 36', () => {
    for (const base of [MIN_BASE, MAX_BASE, 8, 10, 16]) {
      for (const value of [0, 1, 9, 35, 255, 4095]) {
        const formatted = formatInBase(value, base);
        expect(formatted).not.toBeNull();
        expect(parseInBase(formatted as string, base)).toBe(value);
      }
    }
  });
});

describe('toUnsignedBits / toTwosComplement / groupBits', () => {
  it('produces magnitude bits', () => {
    expect(toUnsignedBits(5, 8)).toBe('00000101');
    expect(toUnsignedBits(255, 8)).toBe('11111111');
    expect(toUnsignedBits(0, 4)).toBe('0000');
  });

  it("produces two's complement", () => {
    expect(toTwosComplement(5, 8)).toBe('00000101');
    expect(toTwosComplement(-1, 8)).toBe('11111111');
    expect(toTwosComplement(-128, 8)).toBe('10000000');
    expect(toTwosComplement(127, 8)).toBe('01111111');
    expect(toTwosComplement(-5, 4)).toBe('1011');
  });

  it('groups bits from the right', () => {
    expect(groupBits('11111111', 4)).toBe('1111 1111');
    expect(groupBits('11111111', 8)).toBe('11111111');
    expect(groupBits('1010001', 4)).toBe('101 0001');
    expect(groupBits('101', 0)).toBe('101');
  });

  it('computes required bit length', () => {
    expect(requiredBitLength(0)).toBe(1);
    expect(requiredBitLength(1)).toBe(1);
    expect(requiredBitLength(255)).toBe(8);
    expect(requiredBitLength(256)).toBe(9);
    expect(requiredBitLength(-255)).toBe(8);
  });
});

describe('twosComplementInfo', () => {
  it('returns grouped bits for integer input', () => {
    expect(
      twosComplementInfo(state({ input: '-1', inputBase: 10, bitLength: 8, grouping: 'none' }))
    ).toBe('11111111');
    expect(
      twosComplementInfo(state({ input: '-1', inputBase: 10, bitLength: 8, grouping: 'nibble' }))
    ).toBe('1111 1111');
  });

  it('returns null for fractional or invalid input', () => {
    expect(twosComplementInfo(state({ input: '2.5', inputBase: 10 }))).toBeNull();
    expect(twosComplementInfo(state({ input: 'xyz', inputBase: 10 }))).toBeNull();
  });

  it('accepts input in other bases', () => {
    expect(
      twosComplementInfo(state({ input: 'ff', inputBase: 16, bitLength: 8, grouping: 'none' }))
    ).toBe('11111111');
  });
});

describe('convertToAllBases', () => {
  it('converts 255 decimal to all bases', () => {
    const results: BaseConversion[] = convertToAllBases(state({ input: '255', inputBase: 10 }));
    expect(results).toHaveLength(35);
    expect(results[0]!.value).toBe('11111111'); // base 2
    expect(results[6]!.value).toBe('377'); // base 8
    expect(results[8]!.value).toBe('255'); // base 10 row (input base echo)
    expect(results[14]!.value).toBe('ff'); // base 16
    expect(results[34]!.value).toBe('73'); // 255 = 7*36+3
  });

  it('groups binary output as nibbles', () => {
    const results: BaseConversion[] = convertToAllBases(
      state({ input: '255', inputBase: 10, grouping: 'nibble' })
    );
    expect(results[0]!.formatted).toBe('1111 1111');
  });

  it('groups binary output as bytes', () => {
    const results: BaseConversion[] = convertToAllBases(
      state({ input: '65535', inputBase: 10, grouping: 'byte' })
    );
    expect(results[0]!.formatted).toBe('11111111 11111111');
  });

  it('applies uppercase digits', () => {
    const results: BaseConversion[] = convertToAllBases(
      state({ input: '255', inputBase: 10, digitCase: 'upper' })
    );
    expect(results[14]!.formatted).toBe('FF');
    expect(results[0]!.formatted).toBe('1111 1111');
  });

  it('reports errors for invalid input with message per base', () => {
    const results: BaseConversion[] = convertToAllBases(state({ input: '9', inputBase: 8 }));
    for (const [index, r] of results.entries()) {
      if (index + 2 === 8) {
        expect(r.error).toBeNull(); // input base row echoes the raw input
        continue;
      }
      expect(r.error ?? '').toMatch(/not a valid base-8/);
    }
  });

  it('handles fractional input', () => {
    const results: BaseConversion[] = convertToAllBases(state({ input: '2.5', inputBase: 10 }));
    expect(results[0]!.value).toBe('10.1');
    expect(results[8]!.value).toBe('2.5');
  });

  it('handles negative input', () => {
    const results: BaseConversion[] = convertToAllBases(state({ input: '-255', inputBase: 10 }));
    expect(results[14]!.value).toBe('-ff');
    expect(
      twosComplementInfo(state({ input: '-255', inputBase: 10, bitLength: 16, grouping: 'none' }))
    ).toBe('1111111100000001');
  });

  it('echoes the input row for the input base', () => {
    const results: BaseConversion[] = convertToAllBases(state({ input: 'zz', inputBase: 36 }));
    expect(results[34]!.formatted).toBe('zz');
    expect(results[34]!.error).toBeNull();
  });
});

describe('baseConverterTool serialize/deserialize', () => {
  it('round-trips full state', () => {
    const s = state({
      input: 'ff',
      inputBase: 16,
      digitCase: 'upper',
      grouping: 'byte',
      showTwosComplement: false,
      bitLength: 8,
    });
    const json = baseConverterTool.serialize(s);
    const result = baseConverterTool.deserialize(JSON.parse(json));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(s);
  });

  it('rejects invalid payloads', () => {
    expect(baseConverterTool.deserialize(null).success).toBe(false);
    expect(baseConverterTool.deserialize('string').success).toBe(false);
    expect(baseConverterTool.deserialize({ input: 5, inputBase: 10 }).success).toBe(false);
    expect(baseConverterTool.deserialize({ input: '1', inputBase: 1 }).success).toBe(false);
    expect(baseConverterTool.deserialize({ input: '1', inputBase: 37 }).success).toBe(false);
    expect(baseConverterTool.deserialize({ input: '1', inputBase: 10.5 }).success).toBe(false);
  });

  it('normalizes optional fields with defaults', () => {
    const result = baseConverterTool.deserialize({ input: '10', inputBase: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.digitCase).toBe('lower');
      expect(result.data.grouping).toBe('none');
      expect(result.data.showTwosComplement).toBe(true);
      expect(result.data.bitLength).toBe(DEFAULT_STATE.bitLength);
    }
  });

  it('rejects invalid enum values by defaulting safely', () => {
    const result = baseConverterTool.deserialize({
      input: '10',
      inputBase: 2,
      digitCase: 'weird',
      grouping: 'bogus',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.digitCase).toBe('lower');
      expect(result.data.grouping).toBe('none');
    }
  });
});
