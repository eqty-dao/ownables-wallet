import {TypedCoinData} from '../../interfaces/TypedCoinData';

export default class CoinGeckoService {
  public static getCoinInfo = async (signal: AbortSignal): Promise<TypedCoinData> => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=lto-network&vs_currencies=usd&include_24hr_change=true',
        {signal},
      );
      const prices = await response.json();
      return {
        price: prices['lto-network'].usd,
        percent_change_24h: prices['lto-network'].usd_24h_change,
      };
    } catch (error) {
      throw new Error('Error fetching price from CoinGecko');
    }
  };
}
