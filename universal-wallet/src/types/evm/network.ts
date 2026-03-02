export enum EvmNetwork {
  BASE_MAINNET = 'BASE_MAINNET',
  BASE_SEPOLIA = 'BASE_SEPOLIA',
}

export type Network = EvmNetwork;

export interface EvmChainConfig {
  network: EvmNetwork;
  chainId: 8453 | 84532;
  name: string;
  rpcUrls: string[];
  explorerApiUrl: string;
  explorerTxBaseUrl: string;
}

const LEGACY_MAINNET_VALUES = new Set(['M', 'L', EvmNetwork.BASE_MAINNET]);
const LEGACY_SEPOLIA_VALUES = new Set(['T', EvmNetwork.BASE_SEPOLIA]);

export const normalizeNetwork = (value?: string | null): EvmNetwork => {
  if (!value || LEGACY_MAINNET_VALUES.has(value)) {
    return EvmNetwork.BASE_MAINNET;
  }

  if (LEGACY_SEPOLIA_VALUES.has(value)) {
    return EvmNetwork.BASE_SEPOLIA;
  }

  return EvmNetwork.BASE_MAINNET;
};
