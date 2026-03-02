import { mnemonicToAccount } from 'viem/accounts';
import * as bip39 from 'bip39';
import LocalStorageService from './LocalStorage.service';
import SecureStorageService from './SecureStorage.service';
import { normalizeEvmAddress } from '../utils/evmAddress';
import { EvmAddress, EvmStoredAccountMeta } from '../types/evm';

const ACCOUNT_META_KEY = '@accountMeta';
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

export default class AccountLifecycleService {
  static account?: EvmAccount;

  public static isUnlocked = (): boolean => {
    return !!this.account;
  };

  public static hasStoredAccount = async (): Promise<boolean> => {
    const accountMeta = await LocalStorageService.getData(ACCOUNT_META_KEY);
    return !!accountMeta?.address;
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

  public static unlock = async (password?: string, biometricSignature?: string): Promise<void> => {
    const [accountMeta, accountSecret] = await Promise.all([
      LocalStorageService.getData(ACCOUNT_META_KEY) as Promise<StoredAccountMeta | null>,
      SecureStorageService.readAccountSecret(),
    ]);

    if (!accountMeta?.address || !accountSecret?.mnemonic) {
      throw new Error('Account not found');
    }

    if (!biometricSignature && accountSecret.password !== (password || '')) {
      throw new Error('Wrong password');
    }

    const unlocked = toEvmAccount(accountSecret.mnemonic);
    unlocked.address = normalizeEvmAddress(accountMeta.address);
    this.account = unlocked;
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

    await Promise.all([
      LocalStorageService.storeData(ACCOUNT_META_KEY, accountMeta),
      LocalStorageService.storeData(USER_ALIAS_KEY, { nickname }),
      SecureStorageService.saveAccountSecret({
        mnemonic: this.account.mnemonic,
        password,
        accountVersion: ACCOUNT_VERSION,
      }),
    ]);
  };

  public static deleteAccount = async (): Promise<void> => {
    await Promise.all([
      LocalStorageService.removeData(ACCOUNT_META_KEY),
      LocalStorageService.removeData(USER_ALIAS_KEY),
      SecureStorageService.clearAccountSecret(),
    ]);

    this.lock();
  };
}
