import WalletPreferencesService from '../src/services/WalletPreferences.service';
import LocalStorageService from '../src/services/LocalStorage.service';

jest.mock('../src/services/LocalStorage.service', () => ({
  __esModule: true,
  default: {
    storeData: jest.fn(),
    getData: jest.fn(),
  },
}));

describe('WalletPreferencesService', () => {
  const mockedLocalStorage = LocalStorageService as unknown as {
    storeData: jest.Mock;
    getData: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns defaults when storage is empty', async () => {
    mockedLocalStorage.getData.mockResolvedValueOnce(null);

    await expect(WalletPreferencesService.getPreferences()).resolves.toEqual({
      appearance: 'system',
      currency: 'USD',
    });
  });

  it('merges and stores updated preferences', async () => {
    mockedLocalStorage.getData.mockResolvedValueOnce({ appearance: 'dark', currency: 'USD' });

    const updated = await WalletPreferencesService.updatePreferences({ currency: 'EUR' });

    expect(updated).toEqual({ appearance: 'dark', currency: 'EUR' });
    expect(mockedLocalStorage.storeData).toHaveBeenCalledWith('@walletPreferences', updated);
  });
});
