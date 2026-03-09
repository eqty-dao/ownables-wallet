import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import { styles } from './common';

export default function AccountManagerScreen({ navigation }: WalletStackScreenProps<'AccountManager'>) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen}>
      <Text style={styles.title}>Accounts</Text>
      <Text style={styles.subtitle}>Manage derived accounts for this wallet.</Text>

      <Pressable style={styles.row}>
        <Text style={styles.rowTitle}>My Wallet</Text>
        <Text style={styles.rowSubTitle}>0x742d...0bEb</Text>
      </Pressable>

      <Pressable style={styles.row}>
        <Text style={styles.rowTitle}>Account 2</Text>
        <Text style={styles.rowSubTitle}>0x8f3C...A063</Text>
      </Pressable>

      <Pressable style={styles.actionButton} onPress={() => navigation.navigate('AddAccount')}>
        <Text style={styles.actionText}>Add Account</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
