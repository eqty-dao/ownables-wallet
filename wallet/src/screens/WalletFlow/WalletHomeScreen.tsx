import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, Modal, Platform, Pressable, ScrollView, StatusBar, Text, UIManager, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Gem,
  Plus,
  Settings,
  SlidersHorizontal,
} from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import WalletPortfolioService, { WalletOverview } from '../../services/WalletPortfolio.service';
import WalletPreferencesService, { WalletCurrency } from '../../services/WalletPreferences.service';
import { useUserSettings } from '../../context/User.context';
import { EvmStoredAccountMeta } from '../../types/evm';
import useEffectiveColorScheme from '../../hooks/useEffectiveColorScheme';
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
  const scheme = useEffectiveColorScheme();
  const insets = useSafeAreaInsets();
  const statusBarTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const hasAndroidBlurView = Platform.OS === 'android' && Boolean(UIManager.getViewManagerConfig?.('AndroidBlurView'));
  const canUseBlur = Platform.OS === 'ios' || hasAndroidBlurView;
  const topInset = Platform.OS === 'android' ? Math.max(insets.top, statusBarTop - 10, 0) : insets.top;
  const { network } = useUserSettings();
  const [heroSize, setHeroSize] = useState({ width: 0, height: 0 });
  const [accounts, setAccounts] = useState<EvmStoredAccountMeta[]>([]);
  const [activeAddress, setActiveAddress] = useState('');
  const [nickname, setNickname] = useState('My Wallet');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState<WalletCurrency>('USD');
  const [switcherMessage, setSwitcherMessage] = useState('');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
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
      setAccounts(list);
      setActiveAddress(account.address.toLowerCase());

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

  const handleHeroLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setHeroSize(prev =>
      prev.width === width && prev.height === height
        ? prev
        : { width, height },
    );
  }, []);

  const closeSwitcher = useCallback(() => {
    setIsSwitcherOpen(false);
    setSwitcherMessage('');
  }, []);

  const onSwitchAccount = useCallback(
    async (targetAddress: string) => {
      if (targetAddress.toLowerCase() === activeAddress) {
        closeSwitcher();
        return;
      }

      try {
        await AccountLifecycleService.switchAccount(targetAddress as `0x${string}`, undefined, 'in-session');
        await load();
        closeSwitcher();
      } catch (_error) {
        setSwitcherMessage('Could not switch account right now.');
      }
    },
    [activeAddress, closeSwitcher, load],
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: topInset }]}
      >
        <View style={styles.homeHeaderRow}>
          <Pressable
            style={styles.homeAccountButton}
            onPress={() => {
              setSwitcherMessage('');
              setIsSwitcherOpen(true);
            }}>
            <Text style={styles.homeAccountText}>{nickname}</Text>
            <ChevronDown size={14} color={styles.homeHeaderIcon.color} strokeWidth={2} />
          </Pressable>
          <Pressable style={styles.homeSettingsButton} onPress={() => navigation.navigate('WalletSettings')}>
            <Settings size={20} color={styles.homeHeaderIcon.color} strokeWidth={2} />
          </Pressable>
        </View>

        <Pressable
          style={styles.homeAddressRow}
          onPress={() => Clipboard.setString(address)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text style={styles.homeAddressText}>{truncateAddress(address)}</Text>
          <Copy size={14} color={styles.homeAddressIcon.color} strokeWidth={2} />
        </Pressable>

        <View style={styles.homeHeaderDivider} />

        <View style={styles.homeHeroCard} onLayout={handleHeroLayout}>
          <Svg
            style={styles.homeHeroGradient}
            width={heroSize.width}
            height={heroSize.height}
            viewBox={`0 0 ${heroSize.width || 1} ${heroSize.height || 1}`}
            preserveAspectRatio="none"
            pointerEvents="none"
          >
            <Defs>
              <LinearGradient id="homeBalanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#615fff" />
                <Stop offset="100%" stopColor="#8d35ff" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={heroSize.width || 1} height={heroSize.height || 1} fill="url(#homeBalanceGradient)" />
          </Svg>
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
                      <Gem size={14} color={styles.tokenIconText.color} strokeWidth={1.9} />
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
                  <ChevronRight size={18} color={styles.tokenChevron.color} strokeWidth={2} />
                </View>
              </Pressable>
              {index < overview.tokens.length - 1 ? <View style={styles.rowDivider} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal transparent visible={isSwitcherOpen} animationType="fade" onRequestClose={closeSwitcher}>
        <View style={styles.switcherOverlay}>
          {canUseBlur ? (
            <BlurView
              style={styles.switcherBlur}
              blurType={scheme === 'dark' ? 'dark' : 'light'}
              blurAmount={18}
              reducedTransparencyFallbackColor={scheme === 'dark' ? 'rgba(11,12,17,0.86)' : 'rgba(232,235,244,0.86)'}
            />
          ) : (
            <View
              style={[
                styles.switcherBlur,
                { backgroundColor: scheme === 'dark' ? 'rgba(11,12,17,0.86)' : 'rgba(232,235,244,0.86)' },
              ]}
            />
          )}
          <Pressable style={styles.switcherBackdropPressable} onPress={closeSwitcher} />

          <View style={styles.switcherSheet}>
            <View style={styles.switcherRows}>
              {accounts.map((account, index) => {
                const isActive = account.address.toLowerCase() === activeAddress;
                return (
                  <View key={account.address}>
                    <View style={[styles.switcherRow, index === 0 ? styles.switcherRowFirst : null]}>
                      <Pressable style={styles.switcherRowMain} onPress={() => onSwitchAccount(account.address)}>
                        <Text style={styles.switcherRowTitle}>{account.nickname}</Text>
                        <Text style={styles.switcherRowAddress}>{truncateAddress(account.address)}</Text>
                      </Pressable>

                      <View style={styles.switcherRowActions}>
                        {isActive ? <Check size={16} color="#615fff" strokeWidth={2} /> : null}
                        <Pressable
                          style={styles.switcherSettingsButton}
                          onPress={() => {
                            closeSwitcher();
                            navigation.navigate('RenameAccount', {
                              address: account.address as `0x${string}`,
                              nickname: account.nickname,
                            });
                          }}>
                          <SlidersHorizontal size={14} color={styles.homeHeaderIcon.color} strokeWidth={2} />
                        </Pressable>
                      </View>
                    </View>
                    {index < accounts.length - 1 ? <View style={styles.switcherDivider} /> : null}
                  </View>
                );
              })}
            </View>

            <Pressable
              style={styles.switcherAddRow}
              onPress={() => {
                closeSwitcher();
                navigation.navigate('AddAccount', { suggestedName: `Account ${accounts.length + 1}` });
              }}>
              <View style={styles.switcherAddIconCircle}>
                <Plus size={14} color="#ffffff" strokeWidth={2} />
              </View>
              <Text style={styles.switcherAddText}>Add Account</Text>
            </Pressable>
            {switcherMessage ? <Text style={styles.switcherMessage}>{switcherMessage}</Text> : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
