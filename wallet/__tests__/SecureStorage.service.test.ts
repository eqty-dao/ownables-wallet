import SecureStorageService from '../src/services/SecureStorage.service';
import * as Keychain from 'react-native-keychain';

jest.mock('react-native-keychain', () => ({
  __esModule: true,
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },
}));

describe('SecureStorageService', () => {
  const mockedKeychain = Keychain as jest.Mocked<typeof Keychain>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves account secret into keychain with expected options', async () => {
    await SecureStorageService.saveAccountSecret({
      mnemonic: 'able baker cable',
      password: 'Pass1234!',
      accountVersion: 1,
    });

    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
      'account',
      JSON.stringify({
        mnemonic: 'able baker cable',
        password: 'Pass1234!',
        accountVersion: 1,
      }),
      expect.objectContaining({
        service: 'ownables_wallet_account_v1',
        accessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
      }),
    );
  });

  it('reads and parses stored account secret', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValueOnce({
      username: 'account',
      password: JSON.stringify({
        mnemonic: 'able baker cable',
        password: 'Pass1234!',
        accountVersion: 1,
      }),
      service: 'ownables_wallet_account_v1',
      storage: 'mock',
    } as any);

    await expect(SecureStorageService.readAccountSecret()).resolves.toEqual({
      mnemonic: 'able baker cable',
      password: 'Pass1234!',
      accountVersion: 1,
    });
  });

  it('returns null when keychain has no credentials', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValueOnce(false as any);

    await expect(SecureStorageService.readAccountSecret()).resolves.toBeNull();
  });

  it('returns null for malformed stored payload', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValueOnce({
      username: 'account',
      password: '{invalid-json',
      service: 'ownables_wallet_account_v1',
      storage: 'mock',
    } as any);

    await expect(SecureStorageService.readAccountSecret()).resolves.toBeNull();
  });

  it('clears stored account secret', async () => {
    await SecureStorageService.clearAccountSecret();

    expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
      service: 'ownables_wallet_account_v1',
    });
  });
});
