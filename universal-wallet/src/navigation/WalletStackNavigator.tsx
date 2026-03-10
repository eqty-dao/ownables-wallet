import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WalletStackParamList } from '../../types';
import WalletHomeScreen from '../screens/WalletFlow/WalletHomeScreen';
import AddAccountScreen from '../screens/WalletFlow/AddAccountScreen';
import WalletSettingsScreen from '../screens/WalletFlow/WalletSettingsScreen';
import RecoveryPhraseScreen from '../screens/WalletFlow/RecoveryPhraseScreen';
import TokenDetailsScreen from '../screens/WalletFlow/TokenDetailsScreen';
import SendTokenScreen from '../screens/WalletFlow/SendTokenScreen';
import ReceiveTokenScreen from '../screens/WalletFlow/ReceiveTokenScreen';

const Stack = createNativeStackNavigator<WalletStackParamList>();

export default function WalletStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletHome" component={WalletHomeScreen} />
      <Stack.Screen name="AddAccount" component={AddAccountScreen} />
      <Stack.Screen name="WalletSettings" component={WalletSettingsScreen} />
      <Stack.Screen name="RecoveryPhrase" component={RecoveryPhraseScreen} />
      <Stack.Screen name="TokenDetails" component={TokenDetailsScreen} />
      <Stack.Screen name="SendToken" component={SendTokenScreen} />
      <Stack.Screen name="ReceiveToken" component={ReceiveTokenScreen} />
    </Stack.Navigator>
  );
}
