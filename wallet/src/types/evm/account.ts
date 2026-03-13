import { EvmNetwork } from './network';

export type EvmAddress = `0x${string}`;

export interface EvmAccountRef {
  address: EvmAddress;
  network: EvmNetwork;
}

export interface EvmStoredAccountMeta {
  nickname: string;
  address: EvmAddress;
  derivationPath: string;
  accountVersion: number;
  createdAt: string;
}
