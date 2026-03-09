import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import { useWalletFlowStyles } from './common';

export default function ReceiveTokenScreen({ navigation, route }: WalletStackScreenProps<'ReceiveToken'>) {
  const styles = useWalletFlowStyles();
  const [address, setAddress] = useState('');

  useEffect(() => {
    AccountLifecycleService.getAccount()
      .then(account => setAddress(account.address))
      .catch(() => setAddress(''));
  }, []);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Receive {route.params.token}</Text>
      <Text style={styles.subtitle}>Share this wallet address to receive funds.</Text>

      <Pressable style={styles.row}>
        <Text style={styles.rowTitle}>Wallet Address</Text>
        <Text style={styles.rowSubTitle}>{address || '-'}</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
