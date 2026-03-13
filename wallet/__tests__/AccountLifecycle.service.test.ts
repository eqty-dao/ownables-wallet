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
    saveAccountSecretForAddress: jest.fn(),
    readAccountSecret: jest.fn(),
    readAccountSecretForAddress: jest.fn(),
    clearAccountSecret: jest.fn(),
    clearAccountSecretForAddress: jest.fn(),
  },
}));

jest.mock('bip39', () => ({
  generateMnemonic: jest.fn(),
  validateMnemonic: jest.fn(),
}));

jest.mock('viem/accounts', () => ({
  mnemonicToAccount: jest.fn((mnemonic: string, opts: { path: string }) => ({
    address: `0x${opts.path.split('/').pop()}${mnemonic.replace(/\s/g, '').slice(0, 39).padEnd(39, '0')}`,
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
    saveAccountSecretForAddress: jest.Mock;
    readAccountSecret: jest.Mock;
    readAccountSecretForAddress: jest.Mock;
    clearAccountSecret: jest.Mock;
    clearAccountSecretForAddress: jest.Mock;
  };
  const mockedBip39 = bip39 as jest.Mocked<typeof bip39>;

  let storage: Record<string, any>;
  let scopedSecrets: Record<string, any>;
  let legacySecret: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (AccountLifecycleService as any).account = undefined;

    storage = {};
    scopedSecrets = {};
    legacySecret = null;

    mockedLocalStorage.getData.mockImplementation(async (key: string) => storage[key] ?? null);
    mockedLocalStorage.storeData.mockImplementation(async (key: string, value: any) => {
      storage[key] = value;
    });
    mockedLocalStorage.removeData.mockImplementation(async (key: string) => {
      delete storage[key];
    });

    mockedSecureStorage.saveAccountSecretForAddress.mockImplementation(async (address: string, payload: any) => {
      scopedSecrets[address.toLowerCase()] = payload;
    });
    mockedSecureStorage.readAccountSecretForAddress.mockImplementation(async (address: string) => {
      return scopedSecrets[address.toLowerCase()] ?? null;
    });
    mockedSecureStorage.clearAccountSecretForAddress.mockImplementation(async (address: string) => {
      delete scopedSecrets[address.toLowerCase()];
    });

    mockedSecureStorage.saveAccountSecret.mockImplementation(async (payload: any) => {
      legacySecret = payload;
    });
    mockedSecureStorage.readAccountSecret.mockImplementation(async () => legacySecret);
    mockedSecureStorage.clearAccountSecret.mockImplementation(async () => {
      legacySecret = null;
    });
  });

  it('creates account using normalized generated mnemonic', async () => {
    mockedBip39.generateMnemonic.mockReturnValue('  ABLE  BAKER  CABLE  ');

    const account = await AccountLifecycleService.createAccount();

    expect(account.mnemonic).toBe('able baker cable');
    expect(account.derivationPath).toBe("m/44'/60'/0'/0/0");
    expect(account.address.startsWith('0x')).toBe(true);
    expect(AccountLifecycleService.isUnlocked()).toBe(true);
  });

  it('stores account metadata and scoped secret', async () => {
    mockedBip39.generateMnemonic.mockReturnValue('able baker cable');
    await AccountLifecycleService.createAccount();

    await AccountLifecycleService.storeAccount('alice', 'Pass1234!');

    expect(storage['@accountMetaList']).toHaveLength(1);
    expect(storage['@accountMetaList'][0]).toEqual(
      expect.objectContaining({
        nickname: 'alice',
        accountVersion: 1,
      }),
    );
    expect(Object.keys(scopedSecrets)).toHaveLength(1);
    expect(legacySecret).toEqual(
      expect.objectContaining({
        mnemonic: 'able baker cable',
        password: 'Pass1234!',
      }),
    );
  });

  it('unlocks account with valid password and selected address', async () => {
    storage['@accountMetaList'] = [
      {
        nickname: 'alice',
        address: '0xabcdef0000000000000000000000000000000000',
        derivationPath: "m/44'/60'/0'/0/0",
        accountVersion: 1,
        createdAt: new Date().toISOString(),
      },
    ];

    scopedSecrets['0xabcdef0000000000000000000000000000000000'] = {
      mnemonic: 'able baker cable',
      password: 'Pass1234!',
      accountVersion: 1,
    };

    await AccountLifecycleService.unlock('Pass1234!', undefined, '0xabcdef0000000000000000000000000000000000');
    const unlocked = await AccountLifecycleService.getAccount();

    expect(unlocked.address).toBe('0xabcdef0000000000000000000000000000000000');
  });

  it('returns stored accounts list', async () => {
    storage['@accountMetaList'] = [
      {
        nickname: 'alice',
        address: '0xabc0000000000000000000000000000000000000',
        derivationPath: "m/44'/60'/0'/0/0",
        accountVersion: 1,
        createdAt: new Date().toISOString(),
      },
    ];

    const accounts = await AccountLifecycleService.getStoredAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].nickname).toBe('alice');
  });

  it('creates derived account using the next derivation index', async () => {
    storage['@activeAccountAddress'] = '0x0ablebakercable000000000000000000000000000';
    storage['@accountMetaList'] = [
      {
        nickname: 'Account 1',
        address: '0x0ablebakercable000000000000000000000000000',
        derivationPath: "m/44'/60'/0'/0/0",
        accountVersion: 1,
        createdAt: new Date().toISOString(),
      },
    ];
    scopedSecrets['0x0ablebakercable000000000000000000000000000'] = {
      mnemonic: 'able baker cable',
      password: 'Pass1234!',
      accountVersion: 1,
    };

    (AccountLifecycleService as any).account = {
      address: '0x0ablebakercable000000000000000000000000000',
      mnemonic: 'able baker cable',
      seed: 'able baker cable',
      derivationPath: "m/44'/60'/0'/0/0",
    };

    const next = await AccountLifecycleService.addDerivedAccount('Account 2');

    expect(next.derivationPath).toBe("m/44'/60'/0'/0/1");
    expect(storage['@accountMetaList']).toHaveLength(2);
    expect(storage['@accountMetaList'][1]).toEqual(
      expect.objectContaining({
        nickname: 'Account 2',
        derivationPath: "m/44'/60'/0'/0/1",
      }),
    );
  });

  it('creates derived account even when runtime account is locked by using stored mnemonic', async () => {
    storage['@activeAccountAddress'] = '0x0ablebakercable000000000000000000000000000';
    storage['@accountMetaList'] = [
      {
        nickname: 'Account 1',
        address: '0x0ablebakercable000000000000000000000000000',
        derivationPath: "m/44'/60'/0'/0/0",
        accountVersion: 1,
        createdAt: new Date().toISOString(),
      },
    ];
    legacySecret = {
      mnemonic: 'able baker cable',
      password: 'Pass1234!',
      accountVersion: 1,
    };
    (AccountLifecycleService as any).account = undefined;

    const next = await AccountLifecycleService.addDerivedAccount('Account 2');

    expect(next.derivationPath).toBe("m/44'/60'/0'/0/1");
    expect(storage['@accountMetaList']).toHaveLength(2);
    expect(storage['@accountMetaList'][1]).toEqual(
      expect.objectContaining({
        nickname: 'Account 2',
        derivationPath: "m/44'/60'/0'/0/1",
      }),
    );
  });

  it('rejects importing a different mnemonic when accounts already exist', async () => {
    storage['@accountMetaList'] = [
      {
        nickname: 'alice',
        address: '0xabc0000000000000000000000000000000000000',
        derivationPath: "m/44'/60'/0'/0/0",
        accountVersion: 1,
        createdAt: new Date().toISOString(),
      },
    ];
    scopedSecrets['0xabc0000000000000000000000000000000000000'] = {
      mnemonic: 'able baker cable',
      password: 'Pass1234!',
      accountVersion: 1,
    };
    mockedBip39.validateMnemonic.mockReturnValue(true);

    await expect(AccountLifecycleService.importAccountFromMnemonic('zebra tiger moon')).rejects.toThrow(
      'Multiple seeds are not supported',
    );
  });

  it('renames stored account and updates active metadata', async () => {
    storage['@activeAccountAddress'] = '0xabc0000000000000000000000000000000000000';
    storage['@accountMetaList'] = [
      {
        nickname: 'alice',
        address: '0xabc0000000000000000000000000000000000000',
        derivationPath: "m/44'/60'/0'/0/0",
        accountVersion: 1,
        createdAt: new Date().toISOString(),
      },
    ];

    await AccountLifecycleService.renameAccount('0xabc0000000000000000000000000000000000000', 'Main Account');

    expect(storage['@accountMetaList'][0].nickname).toBe('Main Account');
    expect(storage['@userAlias']).toEqual({ nickname: 'Main Account' });
    expect(storage['@accountMeta']).toEqual(
      expect.objectContaining({
        address: '0xabc0000000000000000000000000000000000000',
        nickname: 'Main Account',
      }),
    );
  });

  it('rejects rename when nickname is empty', async () => {
    storage['@accountMetaList'] = [
      {
        nickname: 'alice',
        address: '0xabc0000000000000000000000000000000000000',
        derivationPath: "m/44'/60'/0'/0/0",
        accountVersion: 1,
        createdAt: new Date().toISOString(),
      },
    ];

    await expect(
      AccountLifecycleService.renameAccount('0xabc0000000000000000000000000000000000000', '   '),
    ).rejects.toThrow('Nickname is required');
  });

  it('deletes active account and clears scoped secret', async () => {
    storage['@activeAccountAddress'] = '0xabc0000000000000000000000000000000000000';
    storage['@accountMetaList'] = [
      {
        nickname: 'alice',
        address: '0xabc0000000000000000000000000000000000000',
        derivationPath: "m/44'/60'/0'/0/0",
        accountVersion: 1,
        createdAt: new Date().toISOString(),
      },
    ];
    scopedSecrets['0xabc0000000000000000000000000000000000000'] = {
      mnemonic: 'able baker cable',
      password: 'Pass1234!',
      accountVersion: 1,
    };

    await AccountLifecycleService.deleteAccount();

    expect(scopedSecrets['0xabc0000000000000000000000000000000000000']).toBeUndefined();
    expect(mockedSecureStorage.clearAccountSecret).toHaveBeenCalledTimes(1);
  });
});
