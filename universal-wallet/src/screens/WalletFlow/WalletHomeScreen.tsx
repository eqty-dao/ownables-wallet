import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import WalletPortfolioService, { WalletOverview } from '../../services/WalletPortfolio.service';
import WalletPreferencesService, { WalletCurrency } from '../../services/WalletPreferences.service';
import Icon from '../../components/Icon';
import { useUserSettings } from '../../context/User.context';
import { useWalletFlowStyles } from './common';

const formatCurrency = (value: number, currency: WalletCurrency): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

const truncateAddress = (value: string): string => {
  if (!value) return '';
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

export default function WalletHomeScreen({ navigation }: WalletStackScreenProps<'WalletHome'>) {
  const styles = useWalletFlowStyles();
  const { network } = useUserSettings();
  const [nickname, setNickname] = useState('My Wallet');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState<WalletCurrency>('USD');
  const [overview, setOverview] = useState<WalletOverview>({
    tokens: [
      { symbol: 'ETH', name: 'Ethereum', balance: 0, price: 0, fiatValue: 0 },
      { symbol: 'EQTY', name: 'EQTY', balance: 0, price: 0, fiatValue: 0 },
    ],
    totalFiat: 0,
  });

  const load = useCallback(async () => {
    try {
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
      setOverview({
        tokens: [
          { symbol: 'ETH', name: 'Ethereum', balance: 0, price: 0, fiatValue: 0 },
          { symbol: 'EQTY', name: 'EQTY', balance: 0, price: 0, fiatValue: 0 },
        ],
        totalFiat: 0,
      });
    }
  }, [network]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.homeHeaderRow}>
        <Pressable style={styles.homeAccountButton} onPress={() => navigation.navigate('AccountManager')}>
          <Text style={styles.homeAccountText}>{nickname}</Text>
          <Icon icon="chevronDown" size={14} color={styles.homeHeaderIcon.color} />
        </Pressable>
        <Pressable style={styles.homeSettingsButton} onPress={() => navigation.navigate('WalletSettings')}>
          <FontAwesome6 name="gear" size={20} color={styles.homeHeaderIcon.color} />
        </Pressable>
      </View>

      <Pressable style={styles.homeAddressRow} onPress={() => Clipboard.setString(address)} hitSlop={10}>
        <Text style={styles.homeAddressText}>{truncateAddress(address)}</Text>
        <FontAwesome6 name="copy" size={14} color={styles.homeAddressIcon.color} />
      </Pressable>

      <View style={styles.homeHeaderDivider} />

      <View style={styles.homeHeroCard}>
        <Text style={styles.homeHeroLabel}>Total Balance</Text>
        <Text style={styles.homeHeroValue}>{formatCurrency(overview.totalFiat, currency)}</Text>
        <Text style={styles.homeHeroCurrency}>{currency}</Text>
      </View>

      <Text style={styles.sectionTitle}>Tokens</Text>

      <View style={styles.tokenCard}>
        {overview.tokens.map((token, index) => (
          <View key={token.symbol}>
            <Pressable style={styles.tokenRow} onPress={() => navigation.navigate('TokenDetails', { token: token.symbol })}>
              <View style={styles.tokenRowLeft}>
                <View style={styles.tokenIconCircle}>
                  {token.symbol === 'ETH' ? (
                    <Icon icon="diamond" size={14} color={styles.tokenIconText.color} />
                  ) : (
                    <Text style={styles.tokenIconText}>{token.symbol.slice(0, 2)}</Text>
                  )}
                </View>
                <View>
                  <Text style={styles.tokenMainText}>{token.symbol}</Text>
                  <Text style={styles.tokenSubText}>{token.name}</Text>
                </View>
              </View>

              <View style={styles.tokenRowMeta}>
                <View style={styles.tokenRowRight}>
                  <Text style={styles.tokenAmountText}>{token.balance.toFixed(token.symbol === 'ETH' ? 4 : 2)}</Text>
                  <Text style={styles.tokenFiatText}>{formatCurrency(token.fiatValue, currency)}</Text>
                </View>
                <Icon icon="chevronRight" size={16} color={styles.tokenChevron.color} />
              </View>
            </Pressable>
            {index < overview.tokens.length - 1 ? <View style={styles.rowDivider} /> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
