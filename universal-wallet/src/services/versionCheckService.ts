import { Platform } from 'react-native';
import { isVersionGreaterOrEqual } from '../utils/versionUtils';

interface VersionCheckResponse {
  active: number;
  minVersion: string;
}

export const checkAppVersion = async (currentVersion: string): Promise<{
  needsUpdate: boolean;
  minVersion: string;
}> => {
  try {
    const response = await fetch('https://ltonetwork.com/data/obuilder.json');
    const data: VersionCheckResponse = await response.json();
    console.log('data', data);
    if (data.active !== 1) {
      return { needsUpdate: false, minVersion: data.minVersion };
    }
    if (!data.minVersion) {
      // fallback to current version
      data['minVersion'] = "0.2.21";
    }
    const needsUpdate = !isVersionGreaterOrEqual(currentVersion, data.minVersion);
    return { needsUpdate, minVersion: data.minVersion };
  } catch (error) {
    console.error('Error checking version:', error);
    return { needsUpdate: false, minVersion: '0.0.0' };
  }
};

export const getStoreUrl = (): string => {
  if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/us/app/lto-universal-wallet/id6448051682';
  }
  return 'https://play.google.com/store/apps/details?id=com2.ltonetwork.universal';
}; 