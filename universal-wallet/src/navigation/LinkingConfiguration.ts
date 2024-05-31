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
              WalletTabScreen: 'one',
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
