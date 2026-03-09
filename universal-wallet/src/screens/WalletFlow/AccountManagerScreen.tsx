import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import { EvmStoredAccountMeta } from '../../types/evm';
import { useWalletFlowStyles } from './common';

const truncateAddress = (value: string): string => {
  if (!value) return '';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

export default function AccountManagerScreen({ navigation }: WalletStackScreenProps<'AccountManager'>) {
  const styles = useWalletFlowStyles();
  const [accounts, setAccounts] = useState<EvmStoredAccountMeta[]>([]);
  const [activeAddress, setActiveAddress] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      setMessage('');
      const [all, current] = await Promise.all([
        AccountLifecycleService.getStoredAccounts(),
        AccountLifecycleService.getAccount(),
      ]);
      setAccounts(all);
      setActiveAddress(current.address.toLowerCase());
    } catch (_error) {
      setAccounts([]);
      setActiveAddress('');
      setMessage('Unable to load stored accounts.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onSwitch = async (address: string) => {
    if (address.toLowerCase() === activeAddress) return;

    try {
      await AccountLifecycleService.switchAccount(address as `0x${string}`, undefined, 'in-session');
      setActiveAddress(address.toLowerCase());
      setMessage('Active account changed.');
    } catch (_error) {
      setMessage('Could not switch account right now.');
    }
  };

  const onDeleteCurrent = async () => {
    if (accounts.length <= 1) {
      setMessage('At least one account is required.');
      return;
    }

    try {
      await AccountLifecycleService.deleteAccount();
      await load();
      setMessage('Current account removed.');
    } catch (_error) {
      setMessage('Could not delete account.');
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Accounts</Text>
      <Text style={styles.subtitle}>Manage wallet accounts and switch active profile.</Text>
      {message ? <Text style={styles.helper}>{message}</Text> : null}

      {accounts.map(account => {
        const isActive = account.address.toLowerCase() === activeAddress;
        return (
          <Pressable
            key={account.address}
            style={[styles.row, isActive ? styles.rowActive : undefined]}
            onPress={() => onSwitch(account.address)}>
            <Text style={styles.rowTitle}>{account.nickname}</Text>
            <Text style={styles.rowSubTitle}>{truncateAddress(account.address)}</Text>
            <Text style={styles.rowSubTitle}>{isActive ? 'Active' : 'Tap to switch'}</Text>
          </Pressable>
        );
      })}

      <Pressable style={styles.actionButton} onPress={() => navigation.navigate('AddAccount')}>
        <Text style={styles.actionText}>Add Account</Text>
      </Pressable>

      <Pressable style={styles.actionButtonDanger} onPress={onDeleteCurrent}>
        <Text style={styles.actionText}>Delete Current Account</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
