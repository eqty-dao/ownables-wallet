import { EvmAddress } from './account';
import { EvmNetwork } from './network';

export interface NativeBalance {
  address: EvmAddress;
  network: EvmNetwork;
  balanceWei: bigint;
  balanceEth: string;
}

export interface TokenBalance {
  address: EvmAddress;
  symbol: string;
  decimals: number;
  valueRaw: string;
  valueFormatted: string;
}
