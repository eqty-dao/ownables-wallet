import React from 'react';
import renderer, { act } from 'react-test-renderer';
import WalletHomeScreen from '../src/screens/WalletFlow/WalletHomeScreen';
import TokenDetailsScreen from '../src/screens/WalletFlow/TokenDetailsScreen';
import WalletSettingsScreen from '../src/screens/WalletFlow/WalletSettingsScreen';

jest.setTimeout(20000);

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => {
    const ReactNative = require('react');
    ReactNative.useEffect(() => {
      callback();
    }, [callback]);
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}));

jest.mock('react-native-vector-icons/FontAwesome6', () => 'FontAwesome6');

jest.mock('../src/context/User.context', () => ({
  Network: {
    MAINNET: 'BASE_MAINNET',
    TESTNET: 'BASE_SEPOLIA',
  },
  useUserSettings: () => ({
    network: 'BASE_MAINNET',
    setNetwork: jest.fn(),
    setAppearance: jest.fn(),
  }),
}));

jest.mock('../src/services/AccountLifecycle.service', () => ({
  __esModule: true,
  default: {
    getAccount: jest.fn().mockResolvedValue({
      address: '0x1234567890123456789012345678901234567890',
      mnemonic: 'able baker cable',
    }),
    getStoredAccounts: jest.fn().mockResolvedValue([
      {
        nickname: 'My Wallet',
        address: '0x1234567890123456789012345678901234567890',
      },
    ]),
  },
}));

jest.mock('../src/services/WalletPreferences.service', () => ({
  __esModule: true,
  default: {
    getPreferences: jest.fn().mockResolvedValue({ appearance: 'system', currency: 'USD' }),
    updatePreferences: jest.fn().mockImplementation(update =>
      Promise.resolve({
        appearance: update.appearance ?? 'system',
        currency: update.currency ?? 'USD',
      }),
    ),
  },
}));

jest.mock('../src/services/WalletPortfolio.service', () => ({
  __esModule: true,
  default: {
    getWalletOverview: jest.fn().mockResolvedValue({
      tokens: [
        { symbol: 'ETH', name: 'Ethereum', balance: 1.25, fiatValue: 2200 },
        { symbol: 'EQTY', name: 'EQTY', balance: 0, fiatValue: 0 },
      ],
      totalFiat: 2200,
    }),
    getTokenTransactions: jest.fn().mockResolvedValue([]),
  },
}));

describe('Wallet flow screens', () => {
  it('renders wallet home header and ETH/EQTY rows', async () => {
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <WalletHomeScreen
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          navigation={{ navigate: jest.fn() } as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          route={{ key: 'WalletHome', name: 'WalletHome' } as any}
        />,
      );
    });

    const text = JSON.stringify((tree as renderer.ReactTestRenderer).toJSON());
    expect(text).toContain('My Wallet');
    expect(text).toContain('Total Balance');
    expect(text).toContain('ETH');
    expect(text).toContain('EQTY');
    expect(text).toContain('Tokens');
    expect(text).not.toContain('Appearance, currency, network and recovery phrase');
  });

  it('renders token details for route token', async () => {
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <TokenDetailsScreen
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          navigation={{ navigate: jest.fn(), goBack: jest.fn() } as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          route={{ key: 'TokenDetails', name: 'TokenDetails', params: { token: 'ETH' } } as any}
        />,
      );
    });

    const text = JSON.stringify((tree as renderer.ReactTestRenderer).toJSON());
    expect(text).toContain('ETH');
    expect(text).toContain('Ethereum');
    expect(text).toContain('Send');
    expect(text).toContain('Receive');
    expect(text).toContain('Token Information');
    expect(text).toContain('Recent Activity');
    expect(text).toContain('No transactions yet');
    expect(text).not.toContain('Token details and recent activity.');
  });

  it('renders settings with top header and cards', async () => {
    let tree: renderer.ReactTestRenderer;
    const goBack = jest.fn();
    const navigate = jest.fn();

    await act(async () => {
      tree = renderer.create(
        <WalletSettingsScreen
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          navigation={{ navigate, goBack } as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          route={{ key: 'WalletSettings', name: 'WalletSettings' } as any}
        />,
      );
    });

    const text = JSON.stringify((tree as renderer.ReactTestRenderer).toJSON());
    expect(text).toContain('Settings');
    expect(text).toContain('Appearance');
    expect(text).toContain('Light');
    expect(text).toContain('Dark');
    expect(text).toContain('System');
    expect(text).toContain('Currency');
    expect(text).toContain('Network');
    expect(text).toContain('Recovery Phrase');
    expect(text).toContain('Add Token');
    expect(text).not.toContain('Wallet preferences and account recovery tools.');
    expect(text).not.toContain('children":["Back"]');
  });
});
