import { mnemonicToAccount } from 'viem/accounts';
import * as bip39 from 'bip39';
import LocalStorageService from './LocalStorage.service';
import SecureStorageService from './SecureStorage.service';
import { normalizeEvmAddress } from '../utils/evmAddress';
import { EvmAddress, EvmStoredAccountMeta } from '../types/evm';

const ACCOUNT_META_KEY = '@accountMeta';
const ACCOUNT_META_LIST_KEY = '@accountMetaList';
const ACTIVE_ACCOUNT_KEY = '@activeAccountAddress';
const USER_ALIAS_KEY = '@userAlias';
const ACCOUNT_VERSION = 1;
const DERIVATION_PATH_PREFIX = "m/44'/60'/0'/0";
const DERIVATION_PATH = `${DERIVATION_PATH_PREFIX}/0`;

export interface EvmAccount {
  address: string;
  mnemonic: string;
  seed: string;
  publicKey?: string;
  privateKey?: string;
  derivationPath: string;
}

interface StoredAccountMeta {
  nickname: string;
  address: EvmAddress;
  derivationPath: string;
  accountVersion: number;
  createdAt: string;
}

const normalizeMnemonic = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ');

const toDerivationPath = (index: number): string => `${DERIVATION_PATH_PREFIX}/${index}`;

const derivationIndexFromPath = (path: string | undefined): number => {
  if (!path) {
    return 0;
  }

  const match = path.match(/\/(\d+)$/);
  if (!match) {
    return 0;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toEvmAccount = (mnemonic: string, derivationPath: string = DERIVATION_PATH): EvmAccount => {
  const account = mnemonicToAccount(mnemonic, { path: derivationPath });

  return {
    address: normalizeEvmAddress(account.address),
    mnemonic,
    seed: mnemonic,
    publicKey: account.publicKey,
    derivationPath,
  };
};

const byCreatedAtAsc = (a: StoredAccountMeta, b: StoredAccountMeta): number =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

const dedupeByAddress = (metas: StoredAccountMeta[]): StoredAccountMeta[] => {
  const mapped = new Map<EvmAddress, StoredAccountMeta>();
  metas.forEach(meta => mapped.set(meta.address, meta));
  return Array.from(mapped.values()).sort(byCreatedAtAsc);
};

export default class AccountLifecycleService {
  static account?: EvmAccount;

  private static ensureStoredMetaList = async (): Promise<StoredAccountMeta[]> => {
    const [metaListRaw, legacyMetaRaw] = await Promise.all([
      LocalStorageService.getData(ACCOUNT_META_LIST_KEY) as Promise<StoredAccountMeta[] | null>,
      LocalStorageService.getData(ACCOUNT_META_KEY) as Promise<StoredAccountMeta | null>,
    ]);

    let metaList = Array.isArray(metaListRaw) ? metaListRaw : [];

    if (legacyMetaRaw?.address) {
      metaList = dedupeByAddress([...metaList, legacyMetaRaw]);
      await LocalStorageService.storeData(ACCOUNT_META_LIST_KEY, metaList);
    }

    return metaList;
  };

  private static getActiveAddress = async (): Promise<EvmAddress | undefined> => {
    const [activeAddressRaw, metaList] = await Promise.all([
      LocalStorageService.getData(ACTIVE_ACCOUNT_KEY) as Promise<EvmAddress | null>,
      this.ensureStoredMetaList(),
    ]);

    if (activeAddressRaw && metaList.some(meta => meta.address === activeAddressRaw)) {
      return activeAddressRaw;
    }

    const fallback = metaList[0]?.address;
    if (fallback) {
      await LocalStorageService.storeData(ACTIVE_ACCOUNT_KEY, fallback);
    }

    return fallback;
  };

  private static setActiveMeta = async (meta: StoredAccountMeta): Promise<void> => {
    await Promise.all([
      LocalStorageService.storeData(ACTIVE_ACCOUNT_KEY, meta.address),
      LocalStorageService.storeData(USER_ALIAS_KEY, { nickname: meta.nickname }),
      LocalStorageService.storeData(ACCOUNT_META_KEY, meta),
    ]);
  };

  private static getMetaByAddress = async (address: EvmAddress): Promise<StoredAccountMeta | undefined> => {
    const metaList = await this.ensureStoredMetaList();
    return metaList.find(meta => meta.address === address);
  };

  private static getCanonicalStoredMnemonic = async (): Promise<string | undefined> => {
    const metaList = await this.ensureStoredMetaList();
    if (metaList.length === 0) {
      return undefined;
    }

    const scopedSecret = await SecureStorageService.readAccountSecretForAddress(metaList[0].address);
    if (scopedSecret?.mnemonic) {
      return normalizeMnemonic(scopedSecret.mnemonic);
    }

    const legacySecret = await SecureStorageService.readAccountSecret();
    if (legacySecret?.mnemonic) {
      return normalizeMnemonic(legacySecret.mnemonic);
    }

    return undefined;
  };

  private static getActiveAccountPassword = async (): Promise<string> => {
    const activeAddress = await this.getActiveAddress();
    if (activeAddress) {
      const scopedSecret = await SecureStorageService.readAccountSecretForAddress(activeAddress);
      if (scopedSecret?.password) {
        return scopedSecret.password;
      }
    }

    const legacySecret = await SecureStorageService.readAccountSecret();
    if (legacySecret?.password) {
      return legacySecret.password;
    }

    const metaList = await this.ensureStoredMetaList();
    for (const meta of metaList) {
      const scopedSecret = await SecureStorageService.readAccountSecretForAddress(meta.address);
      if (scopedSecret?.password) {
        return scopedSecret.password;
      }
    }

    throw new Error('Account password not found');
  };

  public static isUnlocked = (): boolean => {
    return !!this.account;
  };

  public static hasStoredAccount = async (): Promise<boolean> => {
    const metaList = await this.ensureStoredMetaList();
    return metaList.length > 0;
  };

  public static getSeed = (): string => {
    return this.account?.mnemonic || '';
  };

  public static createAccount = async (): Promise<EvmAccount> => {
    const mnemonic = normalizeMnemonic(bip39.generateMnemonic());
    this.account = toEvmAccount(mnemonic);
    return this.account;
  };

  public static importAccountFromMnemonic = async (mnemonic: string): Promise<EvmAccount> => {
    const normalizedMnemonic = normalizeMnemonic(mnemonic);

    if (!bip39.validateMnemonic(normalizedMnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    const canonicalMnemonic = await this.getCanonicalStoredMnemonic();
    if (canonicalMnemonic && canonicalMnemonic !== normalizedMnemonic) {
      throw new Error('Multiple seeds are not supported');
    }

    this.account = toEvmAccount(normalizedMnemonic);
    return this.account;
  };

  public static importAccount = async (mnemonic: string): Promise<void> => {
    await this.importAccountFromMnemonic(mnemonic);
  };

  public static getStoredAccounts = async (): Promise<StoredAccountMeta[]> => {
    return this.ensureStoredMetaList();
  };

  public static addDerivedAccount = async (nickname: string): Promise<EvmAccount> => {
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      throw new Error('Nickname is required');
    }

    const mnemonic = this.account?.mnemonic || (await this.getCanonicalStoredMnemonic());
    if (!mnemonic) {
      throw new Error('Account not found');
    }

    const currentList = await this.ensureStoredMetaList();
    const existingAddresses = new Set(currentList.map(meta => normalizeEvmAddress(meta.address)));
    const maxIndex = currentList.reduce((max, meta) => {
      const next = derivationIndexFromPath(meta.derivationPath);
      return next > max ? next : max;
    }, 0);

    let nextIndex = maxIndex + 1;
    let nextAccount = toEvmAccount(mnemonic, toDerivationPath(nextIndex));
    while (existingAddresses.has(normalizeEvmAddress(nextAccount.address))) {
      nextIndex += 1;
      nextAccount = toEvmAccount(mnemonic, toDerivationPath(nextIndex));
    }

    this.account = nextAccount;
    const password = await this.getActiveAccountPassword();
    await this.storeAccount(trimmedNickname, password);

    return this.account;
  };

  public static renameAccount = async (address: EvmAddress, nickname: string): Promise<void> => {
    const normalizedAddress = normalizeEvmAddress(address) as EvmAddress;
    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      throw new Error('Nickname is required');
    }

    const currentList = await this.ensureStoredMetaList();
    const targetIndex = currentList.findIndex(meta => meta.address === normalizedAddress);

    if (targetIndex < 0) {
      throw new Error('Account not found');
    }

    const updatedMeta: StoredAccountMeta = {
      ...currentList[targetIndex],
      nickname: trimmedNickname,
    };

    const updatedList = [...currentList];
    updatedList[targetIndex] = updatedMeta;

    await LocalStorageService.storeData(ACCOUNT_META_LIST_KEY, updatedList);

    const activeAddress = await this.getActiveAddress();
    if (activeAddress === normalizedAddress) {
      await Promise.all([
        LocalStorageService.storeData(USER_ALIAS_KEY, { nickname: trimmedNickname }),
        LocalStorageService.storeData(ACCOUNT_META_KEY, updatedMeta),
      ]);
    }
  };

  public static unlock = async (
    password?: string,
    biometricSignature?: string,
    address?: EvmAddress,
  ): Promise<void> => {
    const selectedAddress = address || (await this.getActiveAddress());

    if (!selectedAddress) {
      throw new Error('Account not found');
    }

    const [accountMeta, accountSecret, legacySecret] = await Promise.all([
      this.getMetaByAddress(selectedAddress),
      SecureStorageService.readAccountSecretForAddress(selectedAddress),
      SecureStorageService.readAccountSecret(),
    ]);

    const resolvedMeta = accountMeta;
    const resolvedSecret = accountSecret || (resolvedMeta ? legacySecret : null);

    if (!resolvedMeta?.address || !resolvedSecret?.mnemonic) {
      throw new Error('Account not found');
    }

    if (!biometricSignature && resolvedSecret.password !== (password || '')) {
      throw new Error('Wrong password');
    }

    const unlocked = toEvmAccount(resolvedSecret.mnemonic);
    unlocked.address = normalizeEvmAddress(resolvedMeta.address);
    this.account = unlocked;

    if (!accountSecret) {
      await SecureStorageService.saveAccountSecretForAddress(selectedAddress, resolvedSecret);
    }

    await this.setActiveMeta(resolvedMeta);
  };

  public static switchAccount = async (
    address: EvmAddress,
    password?: string,
    biometricSignature?: string,
  ): Promise<void> => {
    await this.unlock(password, biometricSignature, address);
  };

  public static lock = (): void => {
    delete this.account;
  };

  public static getAccount = async (): Promise<EvmAccount> => {
    if (!this.account) {
      throw new Error('Not logged in');
    }

    return this.account;
  };

  public static storeAccount = async (nickname: string, password: string): Promise<void> => {
    if (!this.account) {
      throw new Error('Account not created');
    }

    const accountMeta: EvmStoredAccountMeta = {
      nickname,
      address: normalizeEvmAddress(this.account.address) as EvmAddress,
      derivationPath: this.account.derivationPath,
      accountVersion: ACCOUNT_VERSION,
      createdAt: new Date().toISOString(),
    };

    const currentList = await this.ensureStoredMetaList();
    const updatedList = dedupeByAddress([...currentList, accountMeta]);

    await Promise.all([
      LocalStorageService.storeData(ACCOUNT_META_LIST_KEY, updatedList),
      this.setActiveMeta(accountMeta),
      SecureStorageService.saveAccountSecretForAddress(accountMeta.address, {
        mnemonic: this.account.mnemonic,
        password,
        accountVersion: ACCOUNT_VERSION,
      }),
      // keep legacy secret for backward compatibility with old unlock path
      SecureStorageService.saveAccountSecret({
        mnemonic: this.account.mnemonic,
        password,
        accountVersion: ACCOUNT_VERSION,
      }),
    ]);
  };

  public static deleteAccount = async (): Promise<void> => {
    const activeAddress = await this.getActiveAddress();

    if (!activeAddress) {
      await Promise.all([
        LocalStorageService.removeData(ACCOUNT_META_KEY),
        LocalStorageService.removeData(ACCOUNT_META_LIST_KEY),
        LocalStorageService.removeData(ACTIVE_ACCOUNT_KEY),
        LocalStorageService.removeData(USER_ALIAS_KEY),
        SecureStorageService.clearAccountSecret(),
      ]);
      this.lock();
      return;
    }

    const currentList = await this.ensureStoredMetaList();
    const remaining = currentList.filter(meta => meta.address !== activeAddress);

    await Promise.all([
      LocalStorageService.storeData(ACCOUNT_META_LIST_KEY, remaining),
      LocalStorageService.removeData(ACCOUNT_META_KEY),
      LocalStorageService.removeData(USER_ALIAS_KEY),
      LocalStorageService.removeData(ACTIVE_ACCOUNT_KEY),
      SecureStorageService.clearAccountSecretForAddress(activeAddress),
      SecureStorageService.clearAccountSecret(),
    ]);

    const next = remaining[0];
    if (next) {
      await this.setActiveMeta(next);
    }

    this.lock();
  };
}
