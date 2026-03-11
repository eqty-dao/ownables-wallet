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

export interface TokenDetailsActivityItem {
  hash: string;
  amountLabel: string;
  counterpartyLabel: string;
  dateLabel: string;
  incoming: boolean;
}

export interface TokenDetailsViewModel {
  symbol: SupportedWalletToken;
  name: string;
  amountLabel: string;
  fiatLabel: string;
  contractLabel: string;
  contractUrl?: string;
  priceLabel: string;
  activities: TokenDetailsActivityItem[];
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

const truncateAddress = (value: string): string => {
  if (!value) return '';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
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
    const [nativeBalanceResult, coinInfoResult, txsResult] = await Promise.allSettled([
      EvmTransactionService.getNativeBalance(address, network),
      CoinPriceService.getCoinInfo(new AbortController().signal),
      EvmTransactionService.getAddressTransactions({ address, network }),
    ]);

    const ethBalance =
      nativeBalanceResult.status === 'fulfilled'
        ? Number.parseFloat(nativeBalanceResult.value.balanceEth || '0')
        : 0;
    const txs = txsResult.status === 'fulfilled' ? txsResult.value : [];
    const eqtyBalance = Math.max(getEqtyBalanceFromTransfers(txs, address), 0);

    const ethPriceUsd = coinInfoResult.status === 'fulfilled' ? coinInfoResult.value.price || 0 : 0;
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

  public static buildTokenDetailsViewModel = ({
    token,
    overview,
    transactions,
    walletAddress,
  }: {
    token: SupportedWalletToken;
    overview: WalletOverview;
    transactions: EvmExplorerTx[];
    walletAddress: string;
  }): TokenDetailsViewModel => {
    const summary = overview.tokens.find(item => item.symbol === token);
    const balance = summary?.balance || 0;
    const fiatValue = summary?.fiatValue || 0;
    const activityRows = transactions.slice(0, 4).map(tx => {
      const incoming = tx.to?.toLowerCase() === walletAddress.toLowerCase();
      const counterparty = incoming ? tx.from : tx.to;

      return {
        hash: tx.hash,
        amountLabel: `${incoming ? '+' : '-'} ${tx.amount.toFixed(2)} ${tx.symbol.toUpperCase()}`,
        counterpartyLabel: `${incoming ? 'From' : 'To'}: ${truncateAddress(counterparty || '')}`,
        dateLabel: formatDate(tx.timestamp),
        incoming,
      };
    });

    return {
      symbol: token,
      name: summary?.name || TOKEN_NAMES[token],
      amountLabel: balance.toFixed(token === 'ETH' ? 4 : 2),
      fiatLabel: `$${fiatValue.toFixed(2)}`,
      contractLabel: token === 'ETH' ? 'Native asset' : 'Not available',
      contractUrl: token === 'EQTY' ? 'https://basescan.org' : undefined,
      priceLabel: fiatValue > 0 && balance > 0 ? `$${(fiatValue / balance).toFixed(4)}` : '—',
      activities: activityRows,
    };
  };
}
