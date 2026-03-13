import {TypedCoinData} from '../interfaces/TypedCoinData';
import CoinMarketCapService from './ExternalApi/CoinMarketCap.service';
import CoinGeckoService from './ExternalApi/CoinGecko.service';

export default class CoinPriceService {
  public static getCoinInfo = async (signal: AbortSignal): Promise<TypedCoinData> => {
    return process.env.CMC_API_KEY ? CoinMarketCapService.getCoinInfo(signal) : CoinGeckoService.getCoinInfo(signal);
  };
}
