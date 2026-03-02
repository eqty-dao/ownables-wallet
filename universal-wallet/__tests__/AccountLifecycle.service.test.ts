import AccountLifecycleService from '../src/services/AccountLifecycle.service';
import LocalStorageService from '../src/services/LocalStorage.service';
import SecureStorageService from '../src/services/SecureStorage.service';
import * as bip39 from 'bip39';

jest.mock('../src/services/LocalStorage.service', () => ({
  __esModule: true,
  default: {
    storeData: jest.fn(),
    getData: jest.fn(),
    removeData: jest.fn(),
  },
}));

jest.mock('../src/services/SecureStorage.service', () => ({
  __esModule: true,
  default: {
    saveAccountSecret: jest.fn(),
    readAccountSecret: jest.fn(),
    clearAccountSecret: jest.fn(),
  },
}));

jest.mock('bip39', () => ({
  generateMnemonic: jest.fn(),
  validateMnemonic: jest.fn(),
}));

jest.mock('viem/accounts', () => ({
  mnemonicToAccount: jest.fn((mnemonic: string, opts: { path: string }) => ({
    address: `0x${mnemonic.replace(/\s/g, '').slice(0, 40).padEnd(40, '0')}`,
    publicKey: `pub_${opts.path}`,
  })),
}));

jest.mock('../src/utils/evmAddress', () => ({
  normalizeEvmAddress: jest.fn((value: string) => value.toLowerCase()),
}));

describe('AccountLifecycleService', () => {
  const mockedLocalStorage = LocalStorageService as unknown as {
    storeData: jest.Mock;
    getData: jest.Mock;
    removeData: jest.Mock;
  };
  const mockedSecureStorage = SecureStorageService as unknown as {
    saveAccountSecret: jest.Mock;
    readAccountSecret: jest.Mock;
    clearAccountSecret: jest.Mock;
  };
  const mockedBip39 = bip39 as jest.Mocked<typeof bip39>;

  beforeEach(() => {
    jest.clearAllMocks();
    (AccountLifecycleService as any).account = undefined;
  });

  it('creates account using normalized generated mnemonic', async () => {
    mockedBip39.generateMnemonic.mockReturnValue('  ABLE  BAKER  CABLE  ');

    const account = await AccountLifecycleService.createAccount();

    expect(account.mnemonic).toBe('able baker cable');
    expect(account.derivationPath).toBe("m/44'/60'/0'/0/0");
    expect(account.address.startsWith('0x')).toBe(true);
    expect(AccountLifecycleService.isUnlocked()).toBe(true);
  });

  it('imports account from valid mnemonic', async () => {
    mockedBip39.validateMnemonic.mockReturnValue(true);

    const account = await AccountLifecycleService.importAccountFromMnemonic('  ABLE  BAKER  CABLE  ');

    expect(mockedBip39.validateMnemonic).toHaveBeenCalledWith('able baker cable');
    expect(account.mnemonic).toBe('able baker cable');
    expect(AccountLifecycleService.isUnlocked()).toBe(true);
  });

  it('rejects invalid mnemonic import', async () => {
    mockedBip39.validateMnemonic.mockReturnValue(false);

    await expect(AccountLifecycleService.importAccountFromMnemonic('invalid phrase')).rejects.toThrow('Invalid mnemonic');
  });

  it('stores account metadata and secret', async () => {
    mockedBip39.generateMnemonic.mockReturnValue('able baker cable');
    await AccountLifecycleService.createAccount();

    await AccountLifecycleService.storeAccount('alice', 'Pass1234!');

    expect(mockedLocalStorage.storeData).toHaveBeenCalledWith(
      '@accountMeta',
      expect.objectContaining({
        nickname: 'alice',
        derivationPath: "m/44'/60'/0'/0/0",
        accountVersion: 1,
      }),
    );
    expect(mockedLocalStorage.storeData).toHaveBeenCalledWith('@userAlias', { nickname: 'alice' });
    expect(mockedSecureStorage.saveAccountSecret).toHaveBeenCalledWith(
      expect.objectContaining({
        mnemonic: 'able baker cable',
        password: 'Pass1234!',
        accountVersion: 1,
      }),
    );
  });

  it('unlocks account with valid password', async () => {
    mockedLocalStorage.getData.mockResolvedValueOnce({
      nickname: 'alice',
      address: '0xABCDEF0000000000000000000000000000000000',
      derivationPath: "m/44'/60'/0'/0/0",
      accountVersion: 1,
      createdAt: new Date().toISOString(),
    });
    mockedSecureStorage.readAccountSecret.mockResolvedValueOnce({
      mnemonic: 'able baker cable',
      password: 'Pass1234!',
      accountVersion: 1,
    });

    await AccountLifecycleService.unlock('Pass1234!');
    const unlocked = await AccountLifecycleService.getAccount();

    expect(unlocked.address).toBe('0xabcdef0000000000000000000000000000000000');
  });

  it('rejects unlock with wrong password', async () => {
    mockedLocalStorage.getData.mockResolvedValueOnce({
      address: '0xABCDEF0000000000000000000000000000000000',
    });
    mockedSecureStorage.readAccountSecret.mockResolvedValueOnce({
      mnemonic: 'able baker cable',
      password: 'CorrectPass123!',
      accountVersion: 1,
    });

    await expect(AccountLifecycleService.unlock('WrongPass')).rejects.toThrow('Wrong password');
  });

  it('allows biometric unlock without password', async () => {
    mockedLocalStorage.getData.mockResolvedValueOnce({
      address: '0xABCDEF0000000000000000000000000000000000',
    });
    mockedSecureStorage.readAccountSecret.mockResolvedValueOnce({
      mnemonic: 'able baker cable',
      password: 'CorrectPass123!',
      accountVersion: 1,
    });

    await expect(AccountLifecycleService.unlock(undefined, 'signed-payload')).resolves.toBeUndefined();
  });

  it('fails unlock when no stored account exists', async () => {
    mockedLocalStorage.getData.mockResolvedValueOnce(null);
    mockedSecureStorage.readAccountSecret.mockResolvedValueOnce(null);

    await expect(AccountLifecycleService.unlock('any')).rejects.toThrow('Account not found');
  });

  it('hasStoredAccount reports true only when meta has address', async () => {
    mockedLocalStorage.getData.mockResolvedValueOnce({ address: '0xabc' });
    await expect(AccountLifecycleService.hasStoredAccount()).resolves.toBe(true);

    mockedLocalStorage.getData.mockResolvedValueOnce({});
    await expect(AccountLifecycleService.hasStoredAccount()).resolves.toBe(false);
  });

  it('lock clears in-memory account', async () => {
    mockedBip39.generateMnemonic.mockReturnValue('able baker cable');
    await AccountLifecycleService.createAccount();
    expect(AccountLifecycleService.isUnlocked()).toBe(true);

    AccountLifecycleService.lock();
    expect(AccountLifecycleService.isUnlocked()).toBe(false);
    await expect(AccountLifecycleService.getAccount()).rejects.toThrow('Not logged in');
  });

  it('deletes account metadata and secret', async () => {
    mockedBip39.generateMnemonic.mockReturnValue('able baker cable');
    await AccountLifecycleService.createAccount();

    await AccountLifecycleService.deleteAccount();

    expect(mockedLocalStorage.removeData).toHaveBeenCalledWith('@accountMeta');
    expect(mockedLocalStorage.removeData).toHaveBeenCalledWith('@userAlias');
    expect(mockedSecureStorage.clearAccountSecret).toHaveBeenCalledTimes(1);
    expect(AccountLifecycleService.isUnlocked()).toBe(false);
  });
});
