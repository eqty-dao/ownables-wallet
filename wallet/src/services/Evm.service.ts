import { Account, Chain, createPublicClient, createWalletClient, http, PublicClient, WalletClient } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import {
  BASE_RPC_URL_MAINNET,
  BASE_RPC_URL_SEPOLIA,
  BASESCAN_API_URL_MAINNET,
  BASESCAN_API_URL_SEPOLIA,
  ENABLE_EVM_PATHS,
} from '@env';
import { EvmChainConfig, EvmNetwork } from '../types/evm';
import { EvmErrorCode, normalizeEvmError } from './EvmError.service';

const DEFAULT_MAINNET_RPC = 'https://mainnet.base.org';
const DEFAULT_SEPOLIA_RPC = 'https://sepolia.base.org';
const DEFAULT_MAINNET_EXPLORER_API = 'https://api.basescan.org/api';
const DEFAULT_SEPOLIA_EXPLORER_API = 'https://api-sepolia.basescan.org/api';
const DEFAULT_MAINNET_EXPLORER_TX_BASE = 'https://basescan.org/tx';
const DEFAULT_SEPOLIA_EXPLORER_TX_BASE = 'https://sepolia.basescan.org/tx';

const parseRpcUrls = (value: string | undefined, fallback: string): string[] => {
  const candidates = (value || '')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean);

  const merged = [...candidates, fallback];
  return Array.from(new Set(merged));
};

const CHAIN_REGISTRY: Record<EvmNetwork, EvmChainConfig & { chain: Chain }> = {
  [EvmNetwork.BASE_MAINNET]: {
    network: EvmNetwork.BASE_MAINNET,
    chainId: 8453,
    name: 'Base Mainnet',
    chain: base,
    rpcUrls: parseRpcUrls(BASE_RPC_URL_MAINNET, DEFAULT_MAINNET_RPC),
    explorerApiUrl: BASESCAN_API_URL_MAINNET || DEFAULT_MAINNET_EXPLORER_API,
    explorerTxBaseUrl: DEFAULT_MAINNET_EXPLORER_TX_BASE,
  },
  [EvmNetwork.BASE_SEPOLIA]: {
    network: EvmNetwork.BASE_SEPOLIA,
    chainId: 84532,
    name: 'Base Sepolia',
    chain: baseSepolia,
    rpcUrls: parseRpcUrls(BASE_RPC_URL_SEPOLIA, DEFAULT_SEPOLIA_RPC),
    explorerApiUrl: BASESCAN_API_URL_SEPOLIA || DEFAULT_SEPOLIA_EXPLORER_API,
    explorerTxBaseUrl: DEFAULT_SEPOLIA_EXPLORER_TX_BASE,
  },
};

export default class EvmService {
  private static activeNetwork: EvmNetwork = EvmNetwork.BASE_MAINNET;

  public static isEnabled = (): boolean => {
    return ENABLE_EVM_PATHS !== 'false';
  };

  public static setActiveNetwork = (network: EvmNetwork): void => {
    this.activeNetwork = network;
  };

  public static getActiveNetwork = (): EvmNetwork => {
    return this.activeNetwork;
  };

  public static getChainConfig = (network: EvmNetwork): EvmChainConfig => {
    return CHAIN_REGISTRY[network];
  };

  public static getExplorerTxBaseUrl = (network: EvmNetwork): string => {
    return CHAIN_REGISTRY[network].explorerTxBaseUrl;
  };

  public static createPublicClientForRpc = (network: EvmNetwork, rpcUrl: string): PublicClient => {
    const config = CHAIN_REGISTRY[network];
    return createPublicClient({
      chain: config.chain,
      transport: http(rpcUrl),
    });
  };

  public static createWalletClientForRpc = (account: Account, network: EvmNetwork, rpcUrl: string): WalletClient => {
    const config = CHAIN_REGISTRY[network];
    return createWalletClient({
      account,
      chain: config.chain,
      transport: http(rpcUrl),
    });
  };

  public static withPublicClientFallback = async <T>(
    network: EvmNetwork,
    action: (client: PublicClient) => Promise<T>,
  ): Promise<T> => {
    const config = CHAIN_REGISTRY[network];
    let lastError: unknown;

    for (const rpcUrl of config.rpcUrls) {
      try {
        const client = this.createPublicClientForRpc(network, rpcUrl);
        return await action(client);
      } catch (error) {
        lastError = error;
      }
    }

    const normalized = normalizeEvmError(lastError);
    throw new Error(`[${EvmErrorCode.RPC_UNAVAILABLE}] ${normalized.message}`);
  };

  public static withWalletClientFallback = async <T>(
    account: Account,
    network: EvmNetwork,
    action: (client: WalletClient, chain: Chain) => Promise<T>,
  ): Promise<T> => {
    const config = CHAIN_REGISTRY[network];
    let lastError: unknown;

    for (const rpcUrl of config.rpcUrls) {
      try {
        const client = this.createWalletClientForRpc(account, network, rpcUrl);
        return await action(client, config.chain);
      } catch (error) {
        lastError = error;
      }
    }

    const normalized = normalizeEvmError(lastError);
    throw new Error(`[${EvmErrorCode.RPC_UNAVAILABLE}] ${normalized.message}`);
  };
}
