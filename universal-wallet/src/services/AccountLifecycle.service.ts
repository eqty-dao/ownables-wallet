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
const DERIVATION_PATH = "m/44'/60'/0'/0/0";

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

const toEvmAccount = (mnemonic: string): EvmAccount => {
  const account = mnemonicToAccount(mnemonic, { path: DERIVATION_PATH });

  return {
    address: normalizeEvmAddress(account.address),
    mnemonic,
    seed: mnemonic,
    publicKey: account.publicKey,
    derivationPath: DERIVATION_PATH,
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

    this.account = toEvmAccount(normalizedMnemonic);
    return this.account;
  };

  public static importAccount = async (mnemonic: string): Promise<void> => {
    await this.importAccountFromMnemonic(mnemonic);
  };

  public static getStoredAccounts = async (): Promise<StoredAccountMeta[]> => {
    return this.ensureStoredMetaList();
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
