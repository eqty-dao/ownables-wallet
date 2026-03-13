/**
 * @format
 */

import 'react-native';
import React from 'react';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

jest.mock('../src/navigation', () => () => null);
jest.mock('../src/hooks/useCachedResources', () => () => true);
jest.mock('../src/hooks/useColorScheme', () => () => 'dark');
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/context/User.context', () => ({
  UserProvider: ({children}: {children: React.ReactNode}) => children,
  useUserSettings: () => ({
    isSignOutForced: false,
    setForceSignOut: () => {},
    network: 'L',
    setNetwork: () => {},
    env: 'PROD',
    setEnv: () => {},
  }),
}));
jest.mock('react-native-paper', () => ({
  Provider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/services/versionCheckService', () => ({
  checkAppVersion: jest.fn().mockResolvedValue({ needsUpdate: false, minVersion: '' }),
}));
jest.mock('react-native-device-info', () => ({
  getVersion: jest.fn(() => '0.2.1'),
}));

it('renders correctly', async () => {
  const App = require('../App').default;
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await renderer.act(async () => {
    renderer.create(<App />);
  });
  logSpy.mockRestore();
});
