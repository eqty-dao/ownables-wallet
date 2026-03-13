import { TypedDetails } from '../interfaces/TypedDetails';
import { TypedTransaction } from '../interfaces/TypedTransaction';
import { EvmExplorerTx } from '../types/evm';

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

export const toLegacyTransactions = (txs: EvmExplorerTx[]): TypedTransaction[] => {
  return txs.map(tx => ({
    id: tx.hash,
    type: 4,
    version: '1',
    fee: tx.feeEth ? toLegacyAmount(Number.parseFloat(tx.feeEth)) : 0,
    timestamp: tx.timestamp,
    sender: tx.from,
    recipient: tx.to,
    amount: toLegacyAmount(tx.amount),
    pending: tx.pending,
    failed: tx.failed,
    symbol: tx.symbol,
    hash: tx.hash,
    valueEth: tx.amount.toString(),
    feeEth: tx.feeEth,
    status: tx.pending ? 'pending' : tx.failed ? 'failed' : 'success',
  }));
};
