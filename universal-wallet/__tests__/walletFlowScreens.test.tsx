import React from 'react';
import renderer from 'react-test-renderer';
import WalletHomeScreen from '../src/screens/WalletFlow/WalletHomeScreen';
import TokenDetailsScreen from '../src/screens/WalletFlow/TokenDetailsScreen';

describe('Wallet flow screens', () => {
  it('renders wallet home token rows', () => {
    const tree = renderer.create(
      <WalletHomeScreen
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation={{ navigate: jest.fn() } as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        route={{ key: 'WalletHome', name: 'WalletHome' } as any}
      />,
    );

    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('ETH');
    expect(text).toContain('EQTY');
    expect(text).toContain('Settings');
  });

  it('renders token details for route token', () => {
    const tree = renderer.create(
      <TokenDetailsScreen
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation={{ navigate: jest.fn(), goBack: jest.fn() } as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        route={{ key: 'TokenDetails', name: 'TokenDetails', params: { token: 'ETH' } } as any}
      />,
    );

    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('Send');
  });
});
