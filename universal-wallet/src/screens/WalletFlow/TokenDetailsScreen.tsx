import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import { styles } from './common';

export default function TokenDetailsScreen({ navigation, route }: WalletStackScreenProps<'TokenDetails'>) {
  const { token } = route.params;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen}>
      <Text style={styles.title}>{token}</Text>
      <Text style={styles.subtitle}>Token details and recent activity.</Text>

      <Pressable style={styles.actionButton} onPress={() => navigation.navigate('SendToken', { token })}>
        <Text style={styles.actionText}>Send</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.navigate('ReceiveToken', { token })}>
        <Text style={styles.actionText}>Receive</Text>
      </Pressable>

      <Pressable style={styles.row}>
        <Text style={styles.rowTitle}>Token Information</Text>
        <Text style={styles.rowSubTitle}>Network and contract details</Text>
      </Pressable>

      <Pressable style={styles.row}>
        <Text style={styles.rowTitle}>Recent Activity</Text>
        <Text style={styles.rowSubTitle}>Token transfer history</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
