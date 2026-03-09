import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import WalletPortfolioService from '../../services/WalletPortfolio.service';
import { useUserSettings } from '../../context/User.context';
import { EvmExplorerTx } from '../../types/evm';
import { styles } from './common';

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

const truncateHash = (value: string): string => {
  if (!value) return '';
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
};

export default function TokenDetailsScreen({ navigation, route }: WalletStackScreenProps<'TokenDetails'>) {
  const { network } = useUserSettings();
  const token = route.params.token;
  const [transactions, setTransactions] = useState<EvmExplorerTx[]>([]);
  const [address, setAddress] = useState('');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const account = await AccountLifecycleService.getAccount();
          setAddress(account.address.toLowerCase());
          const txs = await WalletPortfolioService.getTokenTransactions({
            address: account.address,
            network,
            token,
          });
          setTransactions(txs);
        } catch (_error) {
          setTransactions([]);
        }
      };

      load();
    }, [network, token]),
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{token}</Text>
      <Text style={styles.subtitle}>Token details and recent activity.</Text>

      <Pressable style={styles.actionButton} onPress={() => navigation.navigate('SendToken', { token })}>
        <Text style={styles.actionText}>Send</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.navigate('ReceiveToken', { token })}>
        <Text style={styles.actionText}>Receive</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {transactions.length === 0 ? (
        <Text style={styles.helper}>No {token} transactions found for this account.</Text>
      ) : null}

      {transactions.map(tx => {
        const incoming = tx.to?.toLowerCase() === address;
        return (
          <Pressable key={`${tx.hash}:${tx.symbol}`} style={styles.row}>
            <Text style={styles.rowTitle}>{incoming ? 'Received' : 'Sent'}</Text>
            <Text style={styles.rowSubTitle}>{truncateHash(tx.hash)}</Text>
            <Text style={styles.rowSubTitle}>{formatDate(tx.timestamp)}</Text>
            <Text style={incoming ? styles.txAmountPositive : styles.txAmountNegative}>
              {incoming ? '+' : '-'}{tx.amount} {tx.symbol}
            </Text>
          </Pressable>
        );
      })}

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
