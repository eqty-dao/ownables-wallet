import { TypedTransaction } from '../interfaces/TypedTransaction';
import { Network } from '../context/User.context';
import AccountLifecycleService, { EvmAccount as WalletAccount } from './AccountLifecycle.service';
import { isValidEvmAddress } from '../utils/evmAddress';

const LTO_DECIMALS = 100000000;

export interface TransferDraft {
  recipient: string;
  amount: number;
  attachment?: string;
}

const shortHash = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

export default class LTOService {
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

  public static getBalance = async (_address: string) => {
    return {
      available: 245 * LTO_DECIMALS,
      effective: 245 * LTO_DECIMALS,
      leasing: 0,
      regular: 245 * LTO_DECIMALS,
      unbonding: 0,
    };
  };

  public static getTransactions = async (address: string, limit = 20, page = 1): Promise<TypedTransaction[]> => {
    const now = Date.now();
    const txs: TypedTransaction[] = [
      {
        id: `stub-in-${shortHash(address)}`,
        type: 4,
        version: '3',
        fee: 8000000,
        timestamp: now - 60 * 60 * 1000,
        sender: '0x14A3958f7a3144f7Df0B9fB8F4eCa4Aee6BCce80',
        recipient: address,
        amount: 5 * LTO_DECIMALS,
      },
      {
        id: `stub-out-${shortHash(address + 'x')}`,
        type: 4,
        version: '3',
        fee: 8000000,
        timestamp: now - 3 * 60 * 60 * 1000,
        sender: address,
        recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        amount: 2 * LTO_DECIMALS,
      },
    ];

    const start = Math.max((page - 1) * limit, 0);
    const end = start + limit;
    return txs.slice(start, end);
  };

  public static getLeases = async (_address: string): Promise<TypedTransaction[]> => {
    return [];
  };

  public static createTransferDraft = (recipient: string, amount: number, attachment?: string): TransferDraft => {
    return { recipient, amount, attachment };
  };

  public static broadcastTransfer = async (_transaction: TransferDraft): Promise<void> => {
    return;
  };

  public static broadcast = async (_transaction: unknown): Promise<void> => {
    return;
  };

  public static isValidAddress = (address: string): boolean => {
    return isValidEvmAddress(address);
  };

  public static switchNetwork = (_network: Network): void => {
    return;
  };

  public static validateAirdrop = async (_installationId: string, _accountAddress: string): Promise<AirdropResponse> => {
    return { message: 'Airdrop is not available in migration mode', code: 'MIGRATION_DISABLED', success: false };
  };

  public static checkIfAlreadyClaimed = async (_accountAddress: string): Promise<boolean> => {
    return true;
  };
}

export interface AirdropResponse {
  message: string;
  code?: string;
  success?: boolean;
}

export type { WalletAccount };
