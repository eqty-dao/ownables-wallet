import React from 'react';
import renderer, { act } from 'react-test-renderer';
import WalletHomeScreen from '../src/screens/WalletFlow/WalletHomeScreen';
import TokenDetailsScreen from '../src/screens/WalletFlow/TokenDetailsScreen';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: () => undefined,
}));

jest.mock('../src/context/User.context', () => ({
  Network: {
    MAINNET: 'BASE_MAINNET',
    TESTNET: 'BASE_SEPOLIA',
  },
  useUserSettings: () => ({
    network: 'BASE_MAINNET',
    setNetwork: jest.fn(),
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
  it('renders wallet home token rows', async () => {
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
    expect(text).toContain('ETH');
    expect(text).toContain('EQTY');
    expect(text).toContain('Settings');
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
    expect(text).toContain('Send');
  });
});
