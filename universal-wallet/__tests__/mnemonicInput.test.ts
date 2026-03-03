import { extractEnteredWords, isValidMnemonicLength, normalizeMnemonicWords } from '../src/screens/ImportWithSeedScreen/mnemonicInput';

describe('mnemonic input normalization', () => {
  it('normalizes clipboard phrase with mixed whitespace', () => {
    const phrase = '  ABANDON   ability\tAble\nabout  ';
    expect(normalizeMnemonicWords(phrase)).toEqual(['abandon', 'ability', 'able', 'about']);
  });

  it('extracts only entered words from fixed-size input array', () => {
    const words = ['shadow', 'fix', 'test', '', ' ', ''];
    expect(extractEnteredWords(words)).toEqual(['shadow', 'fix', 'test']);
  });

  it('accepts only allowed mnemonic lengths', () => {
    expect(isValidMnemonicLength(12)).toBe(true);
    expect(isValidMnemonicLength(15)).toBe(true);
    expect(isValidMnemonicLength(18)).toBe(true);
    expect(isValidMnemonicLength(21)).toBe(true);
    expect(isValidMnemonicLength(24)).toBe(true);
    expect(isValidMnemonicLength(13)).toBe(false);
    expect(isValidMnemonicLength(0)).toBe(false);
  });
});
