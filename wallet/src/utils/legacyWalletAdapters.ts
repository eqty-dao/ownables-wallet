import { TypedDetails } from '../interfaces/TypedDetails';

const LEGACY_DISPLAY_FACTOR = 100000000;

export const toLegacyAmount = (assetAmount: number): number => {
  return Math.floor(assetAmount * LEGACY_DISPLAY_FACTOR);
};

export const toLegacyDetails = (balanceEth: string): TypedDetails => {
  const amount = toLegacyAmount(Number.parseFloat(balanceEth || '0'));
  return {
    available: amount,
    effective: amount,
    leasing: 0,
    regular: amount,
    unbonding: 0,
  };
};
