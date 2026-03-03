export const VALID_MNEMONIC_LENGTHS = [12, 15, 18, 21, 24] as const;

export const normalizeMnemonicWords = (value: string): string[] =>
  value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

export const extractEnteredWords = (words: string[]): string[] =>
  words.map(word => word.trim().toLowerCase()).filter(Boolean);

export const isValidMnemonicLength = (count: number): boolean =>
  VALID_MNEMONIC_LENGTHS.includes(count as (typeof VALID_MNEMONIC_LENGTHS)[number]);
