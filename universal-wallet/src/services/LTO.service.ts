import LocalStorageService from './LocalStorage.service';
import { TypedTransaction } from '../interfaces/TypedTransaction';
import { Network } from '../context/User.context';

const DEFAULT_DUMMY_SEED = 'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid';
const DEFAULT_DUMMY_ADDRESS = '3JstubAddress111111111111111111111111111';
const LTO_DECIMALS = 100000000;

export interface WalletAccount {
  address: string;
  seed: string;
  publicKey: string;
  privateKey: string;
}

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

const buildAccountFromSeed = (seed: string): WalletAccount => {
  const hash = shortHash(seed);
  return {
    address: `3J${hash}${DEFAULT_DUMMY_ADDRESS.slice(10)}`.slice(0, 42),
    seed,
    publicKey: `PUB_${hash}_${shortHash(seed + 'pub')}`,
    privateKey: `PRV_${hash}_${shortHash(seed + 'prv')}`,
  };
};

export default class LTOService {
  static account?: WalletAccount;

  public static isUnlocked = (): boolean => {
    return !!this.account;
  };

  public static getSeed = (): string => {
    return this.account?.seed || DEFAULT_DUMMY_SEED;
  };

  public static unlock = async (password: string | undefined): Promise<void> => {
    const [encryptedAccount] = (await LocalStorageService.getData('@accountData')) || [];

    if (!encryptedAccount?.seed?.length) {
      throw new Error('Account not found');
    }

    if (encryptedAccount.password && password && encryptedAccount.password !== password) {
      throw new Error('Wrong password');
    }

    const seed = encryptedAccount.seed[1] || encryptedAccount.seed[0] || DEFAULT_DUMMY_SEED;
    this.account = buildAccountFromSeed(seed);
  };

  public static lock = () => {
    delete this.account;
  };

  public static getAccount = async (): Promise<WalletAccount> => {
    if (!this.account) {
      throw new Error('Not logged in');
    }

    return this.account;
  };

  public static storeAccount = async (nickname: string, password: string): Promise<void> => {
    if (!this.account) {
      throw new Error('Account not created');
    }

    await LocalStorageService.storeData('@accountData', [
      {
        nickname,
        address: this.account.address,
        seed: [this.account.seed, this.account.seed],
        password,
      },
    ]);
  };

  public static createAccount = async (): Promise<WalletAccount> => {
    const seed = DEFAULT_DUMMY_SEED;
    this.account = buildAccountFromSeed(seed);
    return this.account;
  };

  public static importAccount = async (seed: string): Promise<void> => {
    if (!seed?.trim()) {
      throw new Error('Error importing account from seeds');
    }

    this.account = buildAccountFromSeed(seed.trim());
  };

  public static deleteAccount = async (): Promise<void> => {
    await Promise.all([
      LocalStorageService.removeData('@accountData'),
      LocalStorageService.removeData('@userAlias'),
    ]);
    this.lock();
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
        sender: '3JexternalDummySender111111111111111111111',
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
        recipient: '3JdummyRecipient111111111111111111111111',
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
    if (!address) return false;
    return /^[A-Za-z0-9]{26,60}$/.test(address);
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
