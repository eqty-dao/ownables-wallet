import { TypedTransaction } from '../interfaces/TypedTransaction';
import { Network } from '../context/User.context';
import AccountLifecycleService, { EvmAccount as WalletAccount } from './AccountLifecycle.service';
import EvmTransactionService from './EvmTransaction.service';
import { isValidEvmAddress } from '../utils/evmAddress';
import EvmService from './Evm.service';
import { EvmNetwork } from '../types/evm';

const LEGACY_DISPLAY_FACTOR = 100000000;

export interface TransferDraft {
  recipient: string;
  amount: number;
  attachment?: string;
}

export class LTOServiceDeprecatedError extends Error {
  constructor(method: string) {
    super(`LTOService.${method} is deprecated. Migrate this call to EVM services.`);
  }
}

const warnedMethods = new Set<string>();

const deprecatedCall = (method: string): void => {
  if (!warnedMethods.has(method)) {
    warnedMethods.add(method);
    console.warn(`[LTOService][DEPRECATED] ${method} called. Migrate to EVM services.`);
  }
};

const toLegacyAmount = (assetAmount: number): number => {
  return Math.floor(assetAmount * LEGACY_DISPLAY_FACTOR);
};

export default class LTOService {
  public static getCurrentNetwork = (): Network => {
    return EvmService.getActiveNetwork() === EvmNetwork.BASE_SEPOLIA ? Network.TESTNET : Network.MAINNET;
  };

  public static isUnlocked = (): boolean => {
    return AccountLifecycleService.isUnlocked();
  };

  public static getSeed = (): string => {
    return AccountLifecycleService.getSeed();
  };

  public static unlock = async (password?: string, biometricSignature?: string): Promise<void> => {
    await AccountLifecycleService.unlock(password, biometricSignature);
  };

  public static lock = () => {
    AccountLifecycleService.lock();
  };

  public static getAccount = async (): Promise<WalletAccount> => {
    return AccountLifecycleService.getAccount();
  };

  public static storeAccount = async (nickname: string, password: string): Promise<void> => {
    await AccountLifecycleService.storeAccount(nickname, password);
  };

  public static createAccount = async (): Promise<WalletAccount> => {
    return AccountLifecycleService.createAccount();
  };

  public static importAccount = async (mnemonic: string): Promise<void> => {
    await AccountLifecycleService.importAccount(mnemonic);
  };

  public static deleteAccount = async (): Promise<void> => {
    await AccountLifecycleService.deleteAccount();
  };

  public static hasStoredAccount = async (): Promise<boolean> => {
    return AccountLifecycleService.hasStoredAccount();
  };

  public static getBalance = async (address: string) => {
    const { balanceEth } = await EvmTransactionService.getNativeBalance(address as `0x${string}`, this.getCurrentNetwork());
    const displayAmount = toLegacyAmount(Number.parseFloat(balanceEth));

    return {
      available: displayAmount,
      effective: displayAmount,
      leasing: 0,
      regular: displayAmount,
      unbonding: 0,
    };
  };

  public static estimateTransfer = async (recipient: string, amountEth: string) => {
    const account = await AccountLifecycleService.getAccount();

    return EvmTransactionService.estimateNativeTransfer({
      from: account.address as `0x${string}`,
      to: recipient as `0x${string}`,
      amountEth,
      network: this.getCurrentNetwork(),
    });
  };

  public static sendTransfer = async (recipient: string, amountEth: string): Promise<{ hash: `0x${string}`; status: 'success' | 'reverted'; feeEth?: string }> => {
    const { hash } = await EvmTransactionService.sendNativeTransfer({
      to: recipient as `0x${string}`,
      amountEth,
      network: this.getCurrentNetwork(),
    });

    const receipt = await EvmTransactionService.waitForReceipt({ hash, network: this.getCurrentNetwork() });

    return {
      hash,
      status: receipt.status,
      feeEth: receipt.feeEth,
    };
  };

  public static getExplorerTxUrl = (hash: string): string => {
    return `${EvmTransactionService.getExplorerTxBaseUrl(this.getCurrentNetwork())}/${hash}`;
  };

  public static getExplorerBaseUrl = (): string => {
    const txBase = EvmTransactionService.getExplorerTxBaseUrl(this.getCurrentNetwork());
    return txBase.slice(0, txBase.lastIndexOf('/tx'));
  };

  public static getExplorerAddressUrl = (address: string): string => {
    return `${this.getExplorerBaseUrl()}/address/${address}`;
  };

  public static getTransactions = async (_address: string, limit = 20, page = 1): Promise<TypedTransaction[]> => {
    const explorerTxs = await EvmTransactionService.getAddressTransactions({
      address: _address,
      network: this.getCurrentNetwork(),
    });

    const start = Math.max((page - 1) * limit, 0);
    const end = start + limit;

    return explorerTxs.slice(start, end).map(tx => ({
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
    } as TypedTransaction));
  };

  public static getLeases = async (_address: string): Promise<TypedTransaction[]> => {
    deprecatedCall('getLeases');
    return [];
  };

  public static createTransferDraft = (_recipient: string, _amount: number, _attachment?: string): TransferDraft => {
    deprecatedCall('createTransferDraft');
    throw new LTOServiceDeprecatedError('createTransferDraft');
  };

  public static broadcastTransfer = async (_transaction: TransferDraft): Promise<void> => {
    deprecatedCall('broadcastTransfer');
    throw new LTOServiceDeprecatedError('broadcastTransfer');
  };

  public static broadcast = async (_transaction: unknown): Promise<void> => {
    deprecatedCall('broadcast');
    throw new LTOServiceDeprecatedError('broadcast');
  };

  public static isValidAddress = (address: string): boolean => {
    return isValidEvmAddress(address);
  };

  public static switchNetwork = (network: Network): void => {
    EvmService.setActiveNetwork(network === Network.TESTNET ? EvmNetwork.BASE_SEPOLIA : EvmNetwork.BASE_MAINNET);
  };

  public static validateAirdrop = async (_installationId: string, _accountAddress: string): Promise<AirdropResponse> => {
    deprecatedCall('validateAirdrop');
    return { message: 'Airdrop is not available in migration mode', code: 'MIGRATION_DISABLED', success: false };
  };

  public static checkIfAlreadyClaimed = async (_accountAddress: string): Promise<boolean> => {
    deprecatedCall('checkIfAlreadyClaimed');
    return true;
  };
}

export interface AirdropResponse {
  message: string;
  code?: string;
  success?: boolean;
}

export type { WalletAccount };
