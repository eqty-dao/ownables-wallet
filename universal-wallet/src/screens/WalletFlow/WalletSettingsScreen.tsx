import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WalletStackScreenProps } from '../../../types';
import { Network, useUserSettings } from '../../context/User.context';
import WalletPreferencesService, {
  WalletAppearance,
  WalletCurrency,
  WalletPreferences,
} from '../../services/WalletPreferences.service';
import { styles } from './common';

const APPEARANCE_OPTIONS: WalletAppearance[] = ['light', 'dark', 'system'];
const CURRENCY_OPTIONS: WalletCurrency[] = ['USD', 'EUR', 'GBP', 'JPY'];

export default function WalletSettingsScreen({ navigation }: WalletStackScreenProps<'WalletSettings'>) {
  const { network, setNetwork } = useUserSettings();
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
    const next = await WalletPreferencesService.updatePreferences({ appearance });
    setPreferences(next);
  };

  const updateCurrency = async (currency: WalletCurrency) => {
    const next = await WalletPreferencesService.updatePreferences({ currency });
    setPreferences(next);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Wallet preferences and account recovery tools.</Text>
      {message ? <Text style={styles.helper}>{message}</Text> : null}

      <Text style={styles.sectionTitle}>Appearance</Text>
      {APPEARANCE_OPTIONS.map(option => (
        <Pressable
          key={option}
          style={[styles.row, preferences.appearance === option ? styles.rowActive : undefined]}
          onPress={() => updateAppearance(option)}>
          <Text style={styles.rowTitle}>{option.charAt(0).toUpperCase() + option.slice(1)}</Text>
          <Text style={styles.rowSubTitle}>
            {option === 'system' ? 'Follow device preference' : `Always use ${option} mode`}
          </Text>
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>Currency</Text>
      {CURRENCY_OPTIONS.map(option => (
        <Pressable
          key={option}
          style={[styles.row, preferences.currency === option ? styles.rowActive : undefined]}
          onPress={() => updateCurrency(option)}>
          <Text style={styles.rowTitle}>{option}</Text>
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>Network</Text>
      <Pressable
        style={[styles.row, network === Network.MAINNET ? styles.rowActive : undefined]}
        onPress={() => setNetwork(Network.MAINNET)}>
        <Text style={styles.rowTitle}>Base Mainnet</Text>
      </Pressable>
      <Pressable
        style={[styles.row, network === Network.TESTNET ? styles.rowActive : undefined]}
        onPress={() => setNetwork(Network.TESTNET)}>
        <Text style={styles.rowTitle}>Base Sepolia</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Security</Text>
      <Pressable style={styles.row} onPress={() => navigation.navigate('RecoveryPhrase')}>
        <Text style={styles.rowTitle}>Recovery Phrase</Text>
        <Text style={styles.rowSubTitle}>Reveal and verify your secret phrase</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
