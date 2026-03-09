import {LinkingOptions} from '@react-navigation/native';
import {RootStackParamList} from '../../types';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['/'],
  config: {
    screens: {
      Root: {
        screens: {
          Wallet: {
            screens: {
              WalletHome: 'one',
              AccountManager: 'one/accounts',
              AddAccount: 'one/accounts/add',
              WalletSettings: 'one/settings',
              RecoveryPhrase: 'one/settings/recovery',
              TokenDetails: 'one/token/:token',
              SendToken: 'one/token/:token/send',
              ReceiveToken: 'one/token/:token/receive',
            },
          },
          Credentials: {
            screens: {
              CredentialsTabScreen: 'two',
            },
          },
          Ownables: {
            screens: {
              OwnablesTabScreen: 'three',
            },
          },
        },
      },
      Menu: 'modal',
      NotFound: '*',
    },
  },
};

export default linking;
