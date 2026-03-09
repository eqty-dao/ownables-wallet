import { Network } from '../context/User.context';
import { EvmExplorerTx } from '../types/evm';
import CoinPriceService from './CoinPrice.service';
import EvmTransactionService from './EvmTransaction.service';
import { WalletCurrency } from './WalletPreferences.service';

export type SupportedWalletToken = 'ETH' | 'EQTY';

export interface WalletTokenSummary {
  symbol: SupportedWalletToken;
  name: string;
  balance: number;
  price: number;
  fiatValue: number;
}

export interface WalletOverview {
  tokens: WalletTokenSummary[];
  totalFiat: number;
}

const FX_USD: Record<WalletCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 148,
};

const TOKEN_NAMES: Record<SupportedWalletToken, string> = {
  ETH: 'Ethereum',
  EQTY: 'EQTY',
};

const toCurrency = (usdValue: number, currency: WalletCurrency): number => {
  return usdValue * FX_USD[currency];
};

const getEqtyBalanceFromTransfers = (txs: EvmExplorerTx[], address: string): number => {
  const lower = address.toLowerCase();

  return txs
    .filter(tx => tx.symbol.toUpperCase() === 'EQTY')
    .reduce((acc, tx) => {
      if (tx.to?.toLowerCase() === lower) {
        return acc + tx.amount;
      }

      if (tx.from?.toLowerCase() === lower) {
        return acc - tx.amount;
      }

      return acc;
    }, 0);
};

export default class WalletPortfolioService {
  public static getWalletOverview = async ({
    address,
    network,
    currency,
  }: {
    address: `0x${string}`;
    network: Network;
    currency: WalletCurrency;
  }): Promise<WalletOverview> => {
    const [nativeBalance, coinInfo, txs] = await Promise.all([
      EvmTransactionService.getNativeBalance(address, network),
      CoinPriceService.getCoinInfo(new AbortController().signal),
      EvmTransactionService.getAddressTransactions({ address, network }),
    ]);

    const ethBalance = Number.parseFloat(nativeBalance.balanceEth || '0');
    const eqtyBalance = Math.max(getEqtyBalanceFromTransfers(txs, address), 0);

    const ethPriceUsd = coinInfo.price || 0;
    const eqtyPriceUsd = 0;

    const tokens: WalletTokenSummary[] = [
      {
        symbol: 'ETH',
        name: TOKEN_NAMES.ETH,
        balance: ethBalance,
        price: toCurrency(ethPriceUsd, currency),
        fiatValue: toCurrency(ethBalance * ethPriceUsd, currency),
      },
      {
        symbol: 'EQTY',
        name: TOKEN_NAMES.EQTY,
        balance: eqtyBalance,
        price: toCurrency(eqtyPriceUsd, currency),
        fiatValue: toCurrency(eqtyBalance * eqtyPriceUsd, currency),
      },
    ];

    return {
      tokens,
      totalFiat: tokens.reduce((acc, token) => acc + token.fiatValue, 0),
    };
  };

  public static getTokenTransactions = async ({
    address,
    network,
    token,
  }: {
    address: string;
    network: Network;
    token: SupportedWalletToken;
  }): Promise<EvmExplorerTx[]> => {
    const txs = await EvmTransactionService.getAddressTransactions({ address, network });
    return txs.filter(tx => tx.symbol.toUpperCase() === token).sort((a, b) => b.timestamp - a.timestamp);
  };
}
