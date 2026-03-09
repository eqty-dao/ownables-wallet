import LocalStorageService from './LocalStorage.service';

export type WalletAppearance = 'light' | 'dark' | 'system';
export type WalletCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY';

export interface WalletPreferences {
  appearance: WalletAppearance;
  currency: WalletCurrency;
}

const SETTINGS_KEY = '@walletPreferences';

const DEFAULT_PREFERENCES: WalletPreferences = {
  appearance: 'system',
  currency: 'USD',
};

const isAppearance = (value: unknown): value is WalletAppearance =>
  value === 'light' || value === 'dark' || value === 'system';

const isCurrency = (value: unknown): value is WalletCurrency =>
  value === 'USD' || value === 'EUR' || value === 'GBP' || value === 'JPY';

const sanitizePreferences = (value: unknown): WalletPreferences => {
  if (!value || typeof value !== 'object') {
    return DEFAULT_PREFERENCES;
  }

  const raw = value as Partial<WalletPreferences>;
  return {
    appearance: isAppearance(raw.appearance) ? raw.appearance : DEFAULT_PREFERENCES.appearance,
    currency: isCurrency(raw.currency) ? raw.currency : DEFAULT_PREFERENCES.currency,
  };
};

export default class WalletPreferencesService {
  public static getPreferences = async (): Promise<WalletPreferences> => {
    const raw = await LocalStorageService.getData(SETTINGS_KEY);
    return sanitizePreferences(raw);
  };

  public static updatePreferences = async (update: Partial<WalletPreferences>): Promise<WalletPreferences> => {
    const current = await this.getPreferences();
    const merged = sanitizePreferences({
      ...current,
      ...update,
    });

    await LocalStorageService.storeData(SETTINGS_KEY, merged);
    return merged;
  };
}
