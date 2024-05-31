import {TypedCoinData} from '../../interfaces/TypedCoinData';

export default class CoinMarketCapService {
  public static getCoinInfo = async (signal: AbortSignal): Promise<TypedCoinData> => {
    try {
      const response = await fetch(
        `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?CMC_PRO_API_KEY=${process.env.CMC_API_KEY}&id=3714`,
        {signal},
      );
      const coinInfo = await response.json();
      return coinInfo.data[3714].quote.USD;
    } catch (error) {
      throw new Error('Error fetching coin info from CoinMarketCap');
    }
  };
}
