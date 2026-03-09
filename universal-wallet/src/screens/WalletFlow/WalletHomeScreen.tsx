import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import WalletPortfolioService, { WalletOverview } from '../../services/WalletPortfolio.service';
import WalletPreferencesService, { WalletCurrency } from '../../services/WalletPreferences.service';
import { Network, useUserSettings } from '../../context/User.context';
import { styles } from './common';

const formatCurrency = (value: number, currency: WalletCurrency): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: value > 1000 ? 0 : 2,
  }).format(value || 0);
};

const truncateAddress = (value: string): string => {
  if (!value) return '';
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

export default function WalletHomeScreen({ navigation }: WalletStackScreenProps<'WalletHome'>) {
  const { network } = useUserSettings();
  const [nickname, setNickname] = useState('My Wallet');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState<WalletCurrency>('USD');
  const [overview, setOverview] = useState<WalletOverview>({ tokens: [], totalFiat: 0 });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [account, prefs, list] = await Promise.all([
        AccountLifecycleService.getAccount(),
        WalletPreferencesService.getPreferences(),
        AccountLifecycleService.getStoredAccounts(),
      ]);

      setAddress(account.address);
      setCurrency(prefs.currency);

      const activeMeta = list.find(item => item.address.toLowerCase() === account.address.toLowerCase());
      setNickname(activeMeta?.nickname || 'My Wallet');

      const portfolio = await WalletPortfolioService.getWalletOverview({
        address: account.address as `0x${string}`,
        network,
        currency: prefs.currency,
      });
      setOverview(portfolio);
    } catch (_error) {
      setOverview({ tokens: [], totalFiat: 0 });
      setError('Unable to load wallet data right now.');
    }
  }, [network]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Wallet</Text>
      <Text style={styles.subtitle}>Base network wallet with ETH and EQTY.</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Balance</Text>
        <Text style={styles.heroValue}>{formatCurrency(overview.totalFiat, currency)}</Text>
        <Text style={styles.heroSubValue}>Network: {network === Network.MAINNET ? 'Base Mainnet' : 'Base Sepolia'}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.row} onPress={() => navigation.navigate('AccountManager')}>
        <Text style={styles.rowTitle}>{nickname}</Text>
        <Text style={styles.rowSubTitle}>{truncateAddress(address)}</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={() => navigation.navigate('WalletSettings')}>
        <Text style={styles.rowTitle}>Settings</Text>
        <Text style={styles.rowSubTitle}>Appearance, currency, network and recovery phrase</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Tokens</Text>
      {overview.tokens.map(token => (
        <Pressable key={token.symbol} style={styles.row} onPress={() => navigation.navigate('TokenDetails', { token: token.symbol })}>
          <Text style={styles.rowTitle}>{token.symbol}</Text>
          <Text style={styles.rowSubTitle}>{token.name}</Text>
          <Text style={styles.rowValue}>
            {token.balance.toFixed(token.symbol === 'ETH' ? 6 : 2)} {token.symbol}
          </Text>
          <Text style={styles.rowSubTitle}>{formatCurrency(token.fiatValue, currency)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
