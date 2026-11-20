export type DigitCase = 'lower' | 'upper';

export type BitGrouping = 'none' | 'nibble' | 'byte';

export interface ToolState {
  /** The number as typed by the user, interpreted in `inputBase`. */
  input: string;
  /** Base used to interpret `input` (2-36). */
  inputBase: number;
  /** Which case to use for digit letters in outputs. */
  digitCase: DigitCase;
  /** Grouping applied to binary output. */
  grouping: BitGrouping;
  /** Whether to show the signed two's complement representation. */
  showTwosComplement: boolean;
  /** Assumed bit length used for two's complement (multiple of 4). */
  bitLength: number;
}

export const MIN_BASE = 2;
export const MAX_BASE = 36;

export const DEFAULT_STATE: ToolState = {
  input: '255',
  inputBase: 10,
  digitCase: 'lower',
  grouping: 'nibble',
  showTwosComplement: true,
  bitLength: 32,
};

export interface BaseConversion {
  /** Canonical lowercase conversion (no grouping separators). */
  value: string;
  /** Formatted value: case applied plus bit grouping for binary. */
  formatted: string;
  /** True when an error is reported for this base row. */
  error: string | null;
}
