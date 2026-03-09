import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import { styles } from './common';

export default function ReceiveTokenScreen({ navigation, route }: WalletStackScreenProps<'ReceiveToken'>) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen}>
      <Text style={styles.title}>Receive {route.params.token}</Text>
      <Text style={styles.subtitle}>Share this wallet address to receive funds.</Text>

      <Pressable style={styles.row}>
        <Text style={styles.rowTitle}>Wallet Address</Text>
        <Text style={styles.rowSubTitle}>0x742d...0bEb</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
