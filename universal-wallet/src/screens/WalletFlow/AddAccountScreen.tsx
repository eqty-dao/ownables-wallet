import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import Icon from '../../components/Icon';
import { useWalletFlowStyles } from './common';

export default function AddAccountScreen({ navigation, route }: WalletStackScreenProps<'AddAccount'>) {
  const styles = useWalletFlowStyles();
  const [nickname, setNickname] = useState(route.params?.suggestedName || '');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    if (isLoading) return;

    if (!nickname.trim()) {
      setMessage('Account name is required.');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');

      await AccountLifecycleService.addDerivedAccount(nickname.trim());
      navigation.navigate('WalletHome');
    } catch (_error) {
      setMessage('Could not add account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.addAccountContent}>
        <View style={styles.addAccountHeader}>
          <Pressable accessibilityLabel="Back" style={styles.addAccountBackButton} onPress={() => navigation.goBack()}>
            <Icon icon="chevronLeft" size={18} color={styles.homeHeaderIcon.color} />
          </Pressable>
          <Text style={styles.addAccountHeaderTitle}>Add Account</Text>
          <View style={styles.addAccountBackButton} />
        </View>

        <Text style={styles.addAccountLabel}>Account Name</Text>
        <TextInput
          style={styles.addAccountInput}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Account name"
          placeholderTextColor="#8d94a1"
          autoCapitalize="words"
        />

        {message ? <Text style={styles.helper}>{message}</Text> : null}

        <Pressable style={styles.actionButton} onPress={submit}>
          <Text style={styles.actionText}>{isLoading ? 'Please wait...' : 'Add Account'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
