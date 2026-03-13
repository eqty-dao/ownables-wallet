import * as Keychain from 'react-native-keychain';

const ACCOUNT_SECRET_SERVICE = 'ownables_wallet_account_v1';
const ACCOUNT_SECRET_SERVICE_PREFIX_V2 = 'ownables_wallet_account_v2';

export interface StoredAccountSecret {
  mnemonic: string;
  password: string;
  accountVersion: number;
}

export default class SecureStorageService {
  private static getScopedServiceName = (address: string): string => {
    return `${ACCOUNT_SECRET_SERVICE_PREFIX_V2}_${address.toLowerCase()}`;
  };

  public static saveAccountSecret = async (payload: StoredAccountSecret): Promise<void> => {
    await Keychain.setGenericPassword('account', JSON.stringify(payload), {
      service: ACCOUNT_SECRET_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  };

  public static saveAccountSecretForAddress = async (
    address: string,
    payload: StoredAccountSecret,
  ): Promise<void> => {
    await Keychain.setGenericPassword('account', JSON.stringify(payload), {
      service: this.getScopedServiceName(address),
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  };

  public static readAccountSecret = async (): Promise<StoredAccountSecret | null> => {
    const credentials = await Keychain.getGenericPassword({ service: ACCOUNT_SECRET_SERVICE });

    if (!credentials) {
      return null;
    }

    try {
      return JSON.parse(credentials.password) as StoredAccountSecret;
    } catch (_error) {
      return null;
    }
  };

  public static readAccountSecretForAddress = async (address: string): Promise<StoredAccountSecret | null> => {
    const credentials = await Keychain.getGenericPassword({
      service: this.getScopedServiceName(address),
    });

    if (!credentials) {
      return null;
    }

    try {
      return JSON.parse(credentials.password) as StoredAccountSecret;
    } catch (_error) {
      return null;
    }
  };

  public static clearAccountSecret = async (): Promise<void> => {
    await Keychain.resetGenericPassword({ service: ACCOUNT_SECRET_SERVICE });
  };

  public static clearAccountSecretForAddress = async (address: string): Promise<void> => {
    await Keychain.resetGenericPassword({
      service: this.getScopedServiceName(address),
    });
  };
}
