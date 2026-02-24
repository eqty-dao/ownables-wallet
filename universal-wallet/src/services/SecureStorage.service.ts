import * as Keychain from 'react-native-keychain';

const ACCOUNT_SECRET_SERVICE = 'ownables_wallet_account_v1';

export interface StoredAccountSecret {
  mnemonic: string;
  password: string;
  accountVersion: number;
}

export default class SecureStorageService {
  public static saveAccountSecret = async (payload: StoredAccountSecret): Promise<void> => {
    await Keychain.setGenericPassword('account', JSON.stringify(payload), {
      service: ACCOUNT_SECRET_SERVICE,
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

  public static clearAccountSecret = async (): Promise<void> => {
    await Keychain.resetGenericPassword({ service: ACCOUNT_SECRET_SERVICE });
  };
}
