import { isValidEvmAddress, normalizeEvmAddress } from '../src/utils/evmAddress';

jest.mock(
  'viem',
  () => ({
    isAddress: (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value),
    getAddress: (value: string) =>
      value.toLowerCase() === '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        ? '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
        : value,
  }),
  { virtual: true },
);

describe('evmAddress', () => {
  it('validates an EVM address', () => {
    expect(isValidEvmAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(true);
    expect(isValidEvmAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')).toBe(true);
    expect(isValidEvmAddress('0x123')).toBe(false);
    expect(isValidEvmAddress('')).toBe(false);
  });

  it('normalizes to checksum format', () => {
    expect(normalizeEvmAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')).toBe(
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    );
  });

  it('keeps already checksummed addresses unchanged', () => {
    expect(normalizeEvmAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    );
  });

  it('throws for invalid addresses', () => {
    expect(() => normalizeEvmAddress('not-an-address')).toThrow('Invalid EVM address');
    expect(() => normalizeEvmAddress('')).toThrow('Invalid EVM address');
  });
});
