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

describe('WalletPortfolioService.buildTokenDetailsViewModel', () => {
  it('builds token details rows and activity labels for incoming and outgoing txs', () => {
    const model = WalletPortfolioService.buildTokenDetailsViewModel({
      token: 'ETH',
      walletAddress: '0x1234567890123456789012345678901234567890',
      overview: {
        tokens: [
          { symbol: 'ETH', name: 'Ethereum', balance: 1.5, price: 2000, fiatValue: 3000 },
          { symbol: 'EQTY', name: 'EQTY', balance: 0, price: 0, fiatValue: 0 },
        ],
        totalFiat: 3000,
      },
      transactions: [
        {
          hash: '0xabc',
          timestamp: 1710000000000,
          from: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          to: '0x1234567890123456789012345678901234567890',
          amount: 0.75,
          symbol: 'ETH',
          pending: false,
          failed: false,
        },
        {
          hash: '0xdef',
          timestamp: 1710000100000,
          from: '0x1234567890123456789012345678901234567890',
          to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          amount: 0.3,
          symbol: 'ETH',
          pending: false,
          failed: false,
        },
      ],
    } as any);

    expect(model.name).toBe('Ethereum');
    expect(model.amountLabel).toBe('1.5000');
    expect(model.fiatLabel).toBe('$3000.00');
    expect(model.priceLabel).toBe('$2000.0000');
    expect(model.contractLabel).toBe('Native asset');
    expect(model.contractUrl).toBeUndefined();
    expect(model.activities).toHaveLength(2);
    expect(model.activities[0].amountLabel).toBe('+ 0.75 ETH');
    expect(model.activities[0].counterpartyLabel).toBe('From: 0xaaaa...aaaa');
    expect(model.activities[0].incoming).toBe(true);
    expect(model.activities[1].amountLabel).toBe('- 0.30 ETH');
    expect(model.activities[1].counterpartyLabel).toBe('To: 0xbbbb...bbbb');
    expect(model.activities[1].incoming).toBe(false);
  });

  it('uses fallback values for EQTY when no overview token is present', () => {
    const model = WalletPortfolioService.buildTokenDetailsViewModel({
      token: 'EQTY',
      walletAddress: '0x1234567890123456789012345678901234567890',
      overview: { tokens: [], totalFiat: 0 },
      transactions: [],
    } as any);

    expect(model.name).toBe('EQTY');
    expect(model.amountLabel).toBe('0.00');
    expect(model.fiatLabel).toBe('$0.00');
    expect(model.priceLabel).toBe('—');
    expect(model.contractLabel).toBe('Not available');
    expect(model.contractUrl).toBe('https://basescan.org');
    expect(model.activities).toHaveLength(0);
  });
});
