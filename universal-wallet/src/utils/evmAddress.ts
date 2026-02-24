import { getAddress, isAddress } from 'viem';

export const isValidEvmAddress = (address: string): boolean => {
  if (!address) return false;
  return isAddress(address);
};

export const normalizeEvmAddress = (address: string): string => {
  if (!isAddress(address)) {
    throw new Error('Invalid EVM address');
  }

  return getAddress(address);
};
