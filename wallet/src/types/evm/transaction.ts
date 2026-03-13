import { EvmAddress } from './account';
import { EvmNetwork } from './network';

export interface EvmTransferRequest {
  from: EvmAddress;
  to: EvmAddress;
  amountEth: string;
  network: EvmNetwork;
}

export interface EvmTransferEstimate {
  amountWei: bigint;
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedFeeWei: bigint;
  estimatedFeeEth: string;
}

export interface EvmTransferResult {
  hash: `0x${string}`;
}

export interface EvmReceiptResult {
  status: 'success' | 'reverted';
  feeEth?: string;
}

export interface EvmExplorerTx {
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  amount: number;
  symbol: string;
  feeEth?: string;
  pending: boolean;
  failed: boolean;
}
