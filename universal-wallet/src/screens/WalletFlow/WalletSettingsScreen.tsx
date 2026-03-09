import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import { styles } from './common';

export default function WalletSettingsScreen({ navigation }: WalletStackScreenProps<'WalletSettings'>) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen}>
      <Text style={styles.title}>Settings</Text>

      <Pressable style={styles.row}>
        <Text style={styles.rowTitle}>Appearance</Text>
        <Text style={styles.rowSubTitle}>Light / Dark / System</Text>
      </Pressable>

      <Pressable style={styles.row}>
        <Text style={styles.rowTitle}>Currency</Text>
        <Text style={styles.rowSubTitle}>USD, EUR, GBP, JPY</Text>
      </Pressable>

      <Pressable style={styles.row}>
        <Text style={styles.rowTitle}>Network</Text>
        <Text style={styles.rowSubTitle}>Base Mainnet / Base Sepolia</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={() => navigation.navigate('RecoveryPhrase')}>
        <Text style={styles.rowTitle}>Recovery Phrase</Text>
        <Text style={styles.rowSubTitle}>View your secret phrase</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
