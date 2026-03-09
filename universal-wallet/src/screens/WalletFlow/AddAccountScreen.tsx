import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import { useWalletFlowStyles } from './common';

export default function AddAccountScreen({ navigation }: WalletStackScreenProps<'AddAccount'>) {
  const styles = useWalletFlowStyles();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    if (isLoading) return;

    if (!nickname.trim() || !password.trim()) {
      setMessage('Nickname and password are required.');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');

      if (mnemonic.trim()) {
        await AccountLifecycleService.importAccountFromMnemonic(mnemonic);
      } else {
        await AccountLifecycleService.createAccount();
      }

      await AccountLifecycleService.storeAccount(nickname.trim(), password);
      const created = await AccountLifecycleService.getAccount();
      await AccountLifecycleService.switchAccount(created.address as `0x${string}`, password);

      setMessage('Account added successfully.');
      navigation.navigate('AccountManager');
    } catch (_error) {
      setMessage('Could not add account. Verify the recovery phrase and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add Account</Text>
      <Text style={styles.subtitle}>Create a new account or import with a recovery phrase.</Text>

      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder="Account name"
        placeholderTextColor="#8d94a1"
      />

      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#8d94a1"
        secureTextEntry
      />

      <TextInput
        style={[styles.input, { minHeight: 92, textAlignVertical: 'top' }]}
        value={mnemonic}
        onChangeText={setMnemonic}
        placeholder="Optional: paste 12-word recovery phrase to import"
        placeholderTextColor="#8d94a1"
        multiline
      />

      {message ? <Text style={styles.helper}>{message}</Text> : null}

      <Pressable style={styles.actionButton} onPress={submit}>
        <Text style={styles.actionText}>{isLoading ? 'Please wait...' : 'Save Account'}</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
