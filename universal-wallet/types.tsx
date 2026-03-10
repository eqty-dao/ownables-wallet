import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type WalletTokenSymbol = 'ETH' | 'EQTY';

export type WalletStackParamList = {
  WalletHome: undefined;
  AddAccount: { suggestedName?: string } | undefined;
  WalletSettings: undefined;
  RecoveryPhrase: undefined;
  TokenDetails: { token: WalletTokenSymbol };
  SendToken: { token: WalletTokenSymbol; recipient?: string };
  ReceiveToken: { token: WalletTokenSymbol };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}

export type RootStackParamList = {
  OnBoarding: undefined;
  SignUp: undefined;
  SignIn: undefined;
  ImportSeed: undefined;
  RegisterAccount: { data: string };
  Root: NavigatorScreenParams<RootTabParamList> | undefined;
  QrReader: {
    onScan?: (value: string) => void;
    address?: string;
  };
  Menu: undefined;
  Profile: undefined;
  CreateTransfer: undefined;
  CreateLease: { address: string } | undefined;
  Lease: { address: string };
  Transactions: undefined;
  LockedScreen: undefined;
  Airdrop: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Screen
>;

export type RootTabParamList = {
  Wallet: NavigatorScreenParams<WalletStackParamList> | undefined;
  Credentials: undefined;
  Ownables: undefined;
};

export type WalletStackScreenProps<Screen extends keyof WalletStackParamList> = NativeStackScreenProps<
  WalletStackParamList,
  Screen
>;

export type RootTabScreenProps<Screen extends keyof RootTabParamList> = CompositeScreenProps<
  MaterialTopTabScreenProps<RootTabParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
>;
