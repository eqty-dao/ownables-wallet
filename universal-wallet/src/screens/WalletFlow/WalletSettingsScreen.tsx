import React, { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalletStackScreenProps } from '../../../types';
import { Network, useUserSettings } from '../../context/User.context';
import WalletPreferencesService, {
  WalletAppearance,
  WalletCurrency,
  WalletPreferences,
} from '../../services/WalletPreferences.service';
import Icon from '../../components/Icon';
import { useWalletFlowStyles } from './common';

const APPEARANCE_OPTIONS: WalletAppearance[] = ['light', 'dark', 'system'];
const CURRENCY_OPTIONS: WalletCurrency[] = ['USD', 'EUR', 'GBP', 'JPY'];

export default function WalletSettingsScreen({ navigation }: WalletStackScreenProps<'WalletSettings'>) {
  const styles = useWalletFlowStyles();
  const insets = useSafeAreaInsets();
  const statusBarTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const topInset = Math.max(insets.top, statusBarTop, 8);
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
            <Icon icon="chevronLeft" size={18} color={styles.homeHeaderIcon.color} />
          </Pressable>
          <Text style={styles.settingsHeaderTitle}>Settings</Text>
          <View style={styles.settingsHeaderBackButton} />
        </View>

        {message ? <Text style={styles.helper}>{message}</Text> : null}

        <View style={styles.settingsCard}>
          <View style={styles.settingsCardHeader}>
            <Text style={styles.settingsCardTitle}>Appearance</Text>
            <Text style={styles.settingsCardSubtitle}>Choose wallet theme</Text>
          </View>
          <View style={styles.settingsSegmentedControl}>
            {APPEARANCE_OPTIONS.map(option => {
              const isActive = preferences.appearance === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.settingsSegmentButton, isActive ? styles.settingsSegmentButtonActive : undefined]}
                  onPress={() => updateAppearance(option)}
                >
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
            <Text style={styles.settingsCardTitle}>Currency</Text>
            <Text style={styles.settingsCardSubtitle}>Display currency</Text>
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
                  <Text style={[styles.settingsCurrencyText, isActive ? styles.settingsCurrencyTextActive : undefined]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingsToggleRow}>
            <View>
              <Text style={styles.settingsRowTitle}>Network</Text>
              <Text style={styles.settingsRowSubtitle}>{network === Network.MAINNET ? 'Base (Mainnet)' : 'Base (Sepolia)'}</Text>
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
            <View>
              <Text style={styles.settingsRowTitle}>Recovery Phrase</Text>
              <Text style={styles.settingsRowSubtitle}>Reveal and verify your secret phrase</Text>
            </View>
            <Icon icon="chevronRight" size={18} color={styles.homeAddressIcon.color} />
          </Pressable>
          <View style={styles.rowDivider} />
          <Pressable
            style={styles.settingsActionRow}
            onPress={() => setMessage('Add token support will be available soon.')}
          >
            <View>
              <Text style={styles.settingsRowTitle}>Add Token</Text>
              <Text style={styles.settingsRowSubtitle}>Custom token support (coming soon)</Text>
            </View>
            <Icon icon="chevronRight" size={18} color={styles.homeAddressIcon.color} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
