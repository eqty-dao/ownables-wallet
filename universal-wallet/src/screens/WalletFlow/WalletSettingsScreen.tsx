import React, { useCallback, useState } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, StatusBar, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronRight, DollarSign, Eye, Monitor, Moon, Network as NetworkIcon, Plus, Sun } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalletStackScreenProps } from '../../../types';
import { Network, useUserSettings } from '../../context/User.context';
import WalletPreferencesService, {
  WalletAppearance,
  WalletCurrency,
  WalletPreferences,
} from '../../services/WalletPreferences.service';
import { useWalletFlowStyles } from './common';

const APPEARANCE_OPTIONS: WalletAppearance[] = ['light', 'dark', 'system'];
const CURRENCY_OPTIONS: WalletCurrency[] = ['USD', 'EUR', 'GBP', 'JPY'];
const CURRENCY_LABELS: Record<WalletCurrency, string> = {
  USD: 'USD ($)',
  EUR: 'EUR (€)',
  GBP: 'GBP (£)',
  JPY: 'JPY (¥)',
};

export default function WalletSettingsScreen({ navigation }: WalletStackScreenProps<'WalletSettings'>) {
  const styles = useWalletFlowStyles();
  const insets = useSafeAreaInsets();
  const statusBarTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const topInset = Platform.OS === 'android' ? Math.max(insets.top, statusBarTop - 10, 0) : insets.top;
  const { network, setNetwork, setAppearance } = useUserSettings();
  const [preferences, setPreferences] = useState<WalletPreferences>({
    appearance: 'system',
    currency: 'USD',
  });
  const [message, setMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      WalletPreferencesService.getPreferences()
        .then(setPreferences)
        .catch(() => {
          setMessage('Unable to load wallet settings.');
        });
    }, []),
  );

  const updateAppearance = async (appearance: WalletAppearance) => {
    setAppearance(appearance);
    const next = await WalletPreferencesService.updatePreferences({ appearance });
    setPreferences(current => ({
      ...current,
      appearance: next.appearance,
    }));
  };

  const updateCurrency = async (currency: WalletCurrency) => {
    const next = await WalletPreferencesService.updatePreferences({ currency });
    setPreferences(next);
  };

  const onToggleNetwork = (enabled: boolean) => {
    setNetwork(enabled ? Network.MAINNET : Network.TESTNET);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        style={styles.screen}
        contentContainerStyle={[styles.settingsContent, { paddingTop: topInset }]}
      >
        <View style={styles.settingsHeader}>
          <Pressable accessibilityLabel="Back" style={styles.settingsHeaderBackButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={18} color={styles.settingsIconTone.color} strokeWidth={2.25} />
          </Pressable>
          <Text style={styles.settingsHeaderTitle}>Settings</Text>
        </View>

        {message ? <Text style={styles.helper}>{message}</Text> : null}

        <View style={styles.settingsCard}>
          <View style={styles.settingsCardHeader}>
            <View style={styles.settingsCardHeaderIcon}>
              <Sun size={18} color={styles.settingsIconTone.color} strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.settingsCardTitle}>Appearance</Text>
              <Text style={styles.settingsCardSubtitle}>Choose your theme</Text>
            </View>
          </View>
          <View style={styles.settingsSegmentedControl}>
            {APPEARANCE_OPTIONS.map(option => {
              const isActive = preferences.appearance === option;
              const IconComponent = option === 'light' ? Sun : option === 'dark' ? Moon : Monitor;
              return (
                <Pressable
                  key={option}
                  style={[styles.settingsSegmentButton, isActive ? styles.settingsSegmentButtonActive : undefined]}
                  onPress={() => updateAppearance(option)}
                >
                  <IconComponent size={18} color={isActive ? '#635BFF' : styles.settingsIconTone.color} strokeWidth={2} />
                  <Text style={[styles.settingsSegmentText, isActive ? styles.settingsSegmentTextActive : undefined]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingsCardHeader}>
            <View style={styles.settingsCardHeaderIcon}>
              <DollarSign size={18} color={styles.settingsIconTone.color} strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.settingsCardTitle}>Currency</Text>
              <Text style={styles.settingsCardSubtitle}>Choose display currency</Text>
            </View>
          </View>
          <View style={styles.settingsCurrencyGrid}>
            {CURRENCY_OPTIONS.map(option => {
              const isActive = preferences.currency === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.settingsCurrencyButton, isActive ? styles.settingsCurrencyButtonActive : undefined]}
                  onPress={() => updateCurrency(option)}
                >
                  <Text style={[styles.settingsCurrencyText, isActive ? styles.settingsCurrencyTextActive : undefined]}>
                    {CURRENCY_LABELS[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingsToggleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={styles.settingsRowIcon}>
                <NetworkIcon size={16} color={styles.settingsIconTone.color} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.settingsRowTitle}>Network</Text>
                <Text style={styles.settingsRowSubtitle}>{network === Network.MAINNET ? 'Base (Mainnet)' : 'Base (Sepolia)'}</Text>
              </View>
            </View>
            <Switch
              value={network === Network.MAINNET}
              onValueChange={onToggleNetwork}
              trackColor={{ false: '#9ca3af', true: '#615fff' }}
              thumbColor="#ffffff"
              ios_backgroundColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Pressable style={styles.settingsActionRow} onPress={() => navigation.navigate('RecoveryPhrase')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={styles.settingsRowIcon}>
                <Eye size={16} color={styles.settingsIconTone.color} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.settingsRowTitle}>Recovery Phrase</Text>
                <Text style={styles.settingsRowSubtitle}>View your secret recovery phrase</Text>
              </View>
            </View>
            <ChevronRight size={18} color={styles.settingsChevronTone.color} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.settingsCard}>
          <Pressable
            style={styles.settingsActionRow}
            onPress={() => navigation.navigate('AddToken')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={styles.settingsRowIcon}>
                <Plus size={16} color={styles.settingsIconTone.color} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.settingsRowTitle}>Add Token</Text>
                <Text style={styles.settingsRowSubtitle}>Import custom ERC20 token</Text>
              </View>
            </View>
            <ChevronRight size={18} color={styles.settingsChevronTone.color} strokeWidth={2} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
