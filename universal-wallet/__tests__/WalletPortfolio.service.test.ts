import WalletPortfolioService from '../src/services/WalletPortfolio.service';

jest.mock('../src/services/EvmTransaction.service', () => ({
  __esModule: true,
  default: {
    getNativeBalance: jest.fn(),
    getAddressTransactions: jest.fn(),
  },
}));

jest.mock('../src/services/CoinPrice.service', () => ({
  __esModule: true,
  default: {
    getCoinInfo: jest.fn(),
  },
}));

const EvmTransactionService = require('../src/services/EvmTransaction.service').default;
const CoinPriceService = require('../src/services/CoinPrice.service').default;

describe('WalletPortfolioService.getWalletOverview', () => {
  const baseInput = {
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    network: 'BASE_MAINNET',
    currency: 'USD',
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns ETH and EQTY tokens when all data sources succeed', async () => {
    EvmTransactionService.getNativeBalance.mockResolvedValue({ balanceEth: '1.5' });
    CoinPriceService.getCoinInfo.mockResolvedValue({ price: 2000 });
    EvmTransactionService.getAddressTransactions.mockResolvedValue([
      {
        hash: '0x1',
        timestamp: 1,
        from: '0xaaa',
        to: baseInput.address,
        amount: 10,
        symbol: 'EQTY',
      },
    ]);

    const overview = await WalletPortfolioService.getWalletOverview(baseInput as any);

    expect(overview.tokens.map(token => token.symbol)).toEqual(['ETH', 'EQTY']);
    expect(overview.tokens[0].balance).toBe(1.5);
    expect(overview.tokens[1].balance).toBe(10);
    expect(overview.totalFiat).toBe(3000);
  });

  it('still returns ETH and EQTY tokens when price and tx fetch fail', async () => {
    EvmTransactionService.getNativeBalance.mockResolvedValue({ balanceEth: '0.25' });
    CoinPriceService.getCoinInfo.mockRejectedValue(new Error('price unavailable'));
    EvmTransactionService.getAddressTransactions.mockRejectedValue(new Error('tx unavailable'));

    const overview = await WalletPortfolioService.getWalletOverview(baseInput as any);

    expect(overview.tokens.map(token => token.symbol)).toEqual(['ETH', 'EQTY']);
    expect(overview.tokens[0].balance).toBe(0.25);
    expect(overview.tokens[0].fiatValue).toBe(0);
    expect(overview.tokens[1].balance).toBe(0);
    expect(overview.totalFiat).toBe(0);
  });
});
