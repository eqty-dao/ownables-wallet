import axios from 'axios';
import { createPublicClient, createWalletClient, formatEther, http, parseEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { mnemonicToAccount } from 'viem/accounts';
import { BASE_RPC_URL_MAINNET, BASE_RPC_URL_SEPOLIA, BASESCAN_API_URL_MAINNET, BASESCAN_API_URL_SEPOLIA } from '@env';
import { Network } from '../context/User.context';
import AccountLifecycleService from './AccountLifecycle.service';

const DEFAULT_MAINNET_RPC = 'https://mainnet.base.org';
const DEFAULT_SEPOLIA_RPC = 'https://sepolia.base.org';
const DEFAULT_MAINNET_EXPLORER_API = 'https://api.basescan.org/api';
const DEFAULT_SEPOLIA_EXPLORER_API = 'https://api-sepolia.basescan.org/api';
const MAX_HISTORY_ITEMS = 50;

interface ExplorerTxResponse<T> {
  status: string;
  message: string;
  result: T[];
}

interface ExplorerNormalTx {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  txreceipt_status?: string;
  isError?: string;
  gasPrice?: string;
  gasUsed?: string;
}

interface ExplorerTokenTx {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  tokenDecimal: string;
  tokenSymbol: string;
  gasPrice?: string;
  gasUsed?: string;
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

const toFloatAmount = (value: string, decimals: number): number => {
  if (!value) return 0;

  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const padded = unsigned.padStart(decimals + 1, '0');
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, '');
  const text = `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;

  return Number.parseFloat(text);
};

const getNetworkConfig = (network: Network) => {
  const isMainnet = network === Network.MAINNET;

  return {
    chain: isMainnet ? base : baseSepolia,
    rpcUrl: isMainnet ? BASE_RPC_URL_MAINNET || DEFAULT_MAINNET_RPC : BASE_RPC_URL_SEPOLIA || DEFAULT_SEPOLIA_RPC,
    explorerApiUrl: isMainnet
      ? BASESCAN_API_URL_MAINNET || DEFAULT_MAINNET_EXPLORER_API
      : BASESCAN_API_URL_SEPOLIA || DEFAULT_SEPOLIA_EXPLORER_API,
    explorerTxUrl: isMainnet ? 'https://basescan.org/tx' : 'https://sepolia.basescan.org/tx',
  };
};

export default class EvmTransactionService {
  public static getExplorerTxBaseUrl = (network: Network): string => {
    return getNetworkConfig(network).explorerTxUrl;
  };

  private static getPublicClient = (network: Network) => {
    const { chain, rpcUrl } = getNetworkConfig(network);

    return createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
  };

  public static getNativeBalance = async (address: `0x${string}`, network: Network): Promise<{ balanceWei: bigint; balanceEth: string }> => {
    const publicClient = this.getPublicClient(network);
    const balanceWei = await publicClient.getBalance({ address });

    return {
      balanceWei,
      balanceEth: formatEther(balanceWei),
    };
  };

  public static estimateNativeTransfer = async ({
    from,
    to,
    amountEth,
    network,
  }: {
    from: `0x${string}`;
    to: `0x${string}`;
    amountEth: string;
    network: Network;
  }): Promise<{
    amountWei: bigint;
    gasLimit: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    estimatedFeeWei: bigint;
    estimatedFeeEth: string;
  }> => {
    const publicClient = this.getPublicClient(network);
    const amountWei = parseEther(amountEth || '0');

    const [gasLimit, fees] = await Promise.all([
      publicClient.estimateGas({ account: from, to, value: amountWei }),
      publicClient.estimateFeesPerGas(),
    ]);

    const maxFeePerGas = fees.maxFeePerGas ?? fees.gasPrice ?? 0n;
    const maxPriorityFeePerGas = fees.maxPriorityFeePerGas ?? 0n;
    const estimatedFeeWei = gasLimit * maxFeePerGas;

    return {
      amountWei,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      estimatedFeeWei,
      estimatedFeeEth: formatEther(estimatedFeeWei),
    };
  };

  public static sendNativeTransfer = async ({
    to,
    amountEth,
    network,
  }: {
    to: `0x${string}`;
    amountEth: string;
    network: Network;
  }): Promise<{ hash: `0x${string}` }> => {
    const currentAccount = await AccountLifecycleService.getAccount();
    const { chain, rpcUrl } = getNetworkConfig(network);
    const account = mnemonicToAccount(currentAccount.mnemonic, {
      path: currentAccount.derivationPath,
    });

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    const hash = await walletClient.sendTransaction({
      account,
      to,
      value: parseEther(amountEth || '0'),
      chain,
    });

    return { hash };
  };

  public static waitForReceipt = async ({
    hash,
    network,
    timeoutMs = 120000,
  }: {
    hash: `0x${string}`;
    network: Network;
    timeoutMs?: number;
  }): Promise<{ status: 'success' | 'reverted'; feeEth?: string }> => {
    const publicClient = this.getPublicClient(network);
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: timeoutMs });
    const gasUsed = receipt.gasUsed || 0n;
    const effectiveGasPrice = receipt.effectiveGasPrice || 0n;

    return {
      status: receipt.status === 'success' ? 'success' : 'reverted',
      feeEth: formatEther(gasUsed * effectiveGasPrice),
    };
  };

  public static getAddressTransactions = async ({
    address,
    network,
  }: {
    address: string;
    network: Network;
  }): Promise<EvmExplorerTx[]> => {
    const { explorerApiUrl } = getNetworkConfig(network);

    const normalTxRequest = axios.get<ExplorerTxResponse<ExplorerNormalTx>>(explorerApiUrl, {
      params: {
        module: 'account',
        action: 'txlist',
        address,
        sort: 'desc',
        page: 1,
        offset: MAX_HISTORY_ITEMS,
      },
    });

    const tokenTxRequest = axios.get<ExplorerTxResponse<ExplorerTokenTx>>(explorerApiUrl, {
      params: {
        module: 'account',
        action: 'tokentx',
        address,
        sort: 'desc',
        page: 1,
        offset: MAX_HISTORY_ITEMS,
      },
    });

    const [normalTxResponse, tokenTxResponse] = await Promise.allSettled([normalTxRequest, tokenTxRequest]);

    const normalTxs = normalTxResponse.status === 'fulfilled' ? normalTxResponse.value.data.result || [] : [];
    const tokenTxs = tokenTxResponse.status === 'fulfilled' ? tokenTxResponse.value.data.result || [] : [];

    const nativeMapped: EvmExplorerTx[] = normalTxs.map(tx => {
      const failed = tx.txreceipt_status === '0' || tx.isError === '1';
      const feeWei = BigInt(tx.gasPrice || '0') * BigInt(tx.gasUsed || '0');

      return {
        hash: tx.hash,
        timestamp: Number(tx.timeStamp) * 1000,
        from: tx.from,
        to: tx.to,
        amount: Number.parseFloat(formatEther(BigInt(tx.value || '0'))),
        symbol: 'ETH',
        feeEth: formatEther(feeWei),
        pending: false,
        failed,
      };
    });

    const tokenMapped: EvmExplorerTx[] = tokenTxs.map(tx => ({
      hash: tx.hash,
      timestamp: Number(tx.timeStamp) * 1000,
      from: tx.from,
      to: tx.to,
      amount: toFloatAmount(tx.value || '0', Number(tx.tokenDecimal || '18')),
      symbol: tx.tokenSymbol || 'ERC20',
      feeEth: undefined,
      pending: false,
      failed: false,
    }));

    const merged = [...nativeMapped, ...tokenMapped]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_HISTORY_ITEMS);

    const dedupe = new Map<string, EvmExplorerTx>();
    for (const tx of merged) {
      const key = `${tx.hash}:${tx.symbol}`;
      if (!dedupe.has(key)) {
        dedupe.set(key, tx);
      }
    }

    return Array.from(dedupe.values());
  };
}
