import { Network as UserNetwork } from '../context/User.context';
import EvmService from './Evm.service';
import { EvmNetwork } from '../types/evm';

const toEvmNetwork = (network: UserNetwork): EvmNetwork => {
  return network === UserNetwork.TESTNET ? EvmNetwork.BASE_SEPOLIA : EvmNetwork.BASE_MAINNET;
};

const fromEvmNetwork = (network: EvmNetwork): UserNetwork => {
  return network === EvmNetwork.BASE_SEPOLIA ? UserNetwork.TESTNET : UserNetwork.MAINNET;
};

export default class WalletNetworkService {
  public static getCurrentNetwork = (): UserNetwork => {
    return fromEvmNetwork(EvmService.getActiveNetwork());
  };

  public static setCurrentNetwork = (network: UserNetwork): void => {
    EvmService.setActiveNetwork(toEvmNetwork(network));
  };

  public static getExplorerTxUrl = (hash: string, network: UserNetwork = this.getCurrentNetwork()): string => {
    const baseUrl = EvmService.getExplorerTxBaseUrl(toEvmNetwork(network));
    return `${baseUrl}/${hash}`;
  };

  public static getExplorerBaseUrl = (network: UserNetwork = this.getCurrentNetwork()): string => {
    const txBase = EvmService.getExplorerTxBaseUrl(toEvmNetwork(network));
    return txBase.slice(0, txBase.lastIndexOf('/tx'));
  };

  public static getExplorerAddressUrl = (address: string, network: UserNetwork = this.getCurrentNetwork()): string => {
    return `${this.getExplorerBaseUrl(network)}/address/${address}`;
  };
}
