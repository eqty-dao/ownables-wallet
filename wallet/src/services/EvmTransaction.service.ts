import axios from 'axios';
import { formatEther, parseEther } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { Network } from '../context/User.context';
import AccountLifecycleService from './AccountLifecycle.service';
import EvmService from './Evm.service';
import { normalizeEvmError } from './EvmError.service';
import { EvmExplorerTx, EvmNetwork, EvmReceiptResult, EvmTransferEstimate, EvmTransferResult } from '../types/evm';

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

const toEvmNetwork = (network: Network): EvmNetwork => {
  return network === Network.MAINNET ? EvmNetwork.BASE_MAINNET : EvmNetwork.BASE_SEPOLIA;
};

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

export default class EvmTransactionService {
  private static assertEnabled = (): void => {
    if (!EvmService.isEnabled()) {
      throw new Error('EVM service path is disabled by feature flag');
    }
  };

  public static getExplorerTxBaseUrl = (network: Network): string => {
    this.assertEnabled();
    return EvmService.getExplorerTxBaseUrl(toEvmNetwork(network));
  };

  public static getNativeBalance = async (address: `0x${string}`, network: Network): Promise<{ balanceWei: bigint; balanceEth: string }> => {
    this.assertEnabled();
    try {
      return await EvmService.withPublicClientFallback(toEvmNetwork(network), async publicClient => {
        const balanceWei = await publicClient.getBalance({ address });
        return {
          balanceWei,
          balanceEth: formatEther(balanceWei),
        };
      });
    } catch (error) {
      const normalized = normalizeEvmError(error);
      throw new Error(normalized.message);
    }
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
  }): Promise<EvmTransferEstimate> => {
    this.assertEnabled();
    try {
      return await EvmService.withPublicClientFallback(toEvmNetwork(network), async publicClient => {
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
      });
    } catch (error) {
      const normalized = normalizeEvmError(error);
      throw new Error(normalized.message);
    }
  };

  public static sendNativeTransfer = async ({
    to,
    amountEth,
    network,
  }: {
    to: `0x${string}`;
    amountEth: string;
    network: Network;
  }): Promise<EvmTransferResult> => {
    this.assertEnabled();
    try {
      const currentAccount = await AccountLifecycleService.getAccount();
      const account = mnemonicToAccount(currentAccount.mnemonic, {
        path: currentAccount.derivationPath as `m/44'/60'/${string}`,
      });

      return EvmService.withWalletClientFallback(account, toEvmNetwork(network), async (walletClient, chain) => {
        const hash = await walletClient.sendTransaction({
          account,
          to,
          value: parseEther(amountEth || '0'),
          chain,
        });

        return { hash };
      });
    } catch (error) {
      const normalized = normalizeEvmError(error);
      throw new Error(normalized.message);
    }
  };

  public static waitForReceipt = async ({
    hash,
    network,
    timeoutMs = 120000,
  }: {
    hash: `0x${string}`;
    network: Network;
    timeoutMs?: number;
  }): Promise<EvmReceiptResult> => {
    this.assertEnabled();
    try {
      return await EvmService.withPublicClientFallback(toEvmNetwork(network), async publicClient => {
        const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: timeoutMs });
        const gasUsed = receipt.gasUsed || 0n;
        const effectiveGasPrice = receipt.effectiveGasPrice || 0n;

        return {
          status: receipt.status === 'success' ? 'success' : 'reverted',
          feeEth: formatEther(gasUsed * effectiveGasPrice),
        };
      });
    } catch (error) {
      const normalized = normalizeEvmError(error);
      throw new Error(normalized.message);
    }
  };

  public static getAddressTransactions = async ({
    address,
    network,
  }: {
    address: string;
    network: Network;
  }): Promise<EvmExplorerTx[]> => {
    this.assertEnabled();
    const config = EvmService.getChainConfig(toEvmNetwork(network));
    const normalTxRequest = axios.get<ExplorerTxResponse<ExplorerNormalTx>>(config.explorerApiUrl, {
      params: {
        module: 'account',
        action: 'txlist',
        address,
        sort: 'desc',
        page: 1,
        offset: MAX_HISTORY_ITEMS,
      },
    });

    const tokenTxRequest = axios.get<ExplorerTxResponse<ExplorerTokenTx>>(config.explorerApiUrl, {
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
