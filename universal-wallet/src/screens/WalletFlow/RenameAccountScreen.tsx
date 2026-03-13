import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import { useWalletFlowStyles } from './common';

export default function RenameAccountScreen({ navigation, route }: WalletStackScreenProps<'RenameAccount'>) {
  const styles = useWalletFlowStyles();
  const insets = useSafeAreaInsets();
  const statusBarTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const topInset = Platform.OS === 'android' ? Math.max(insets.top, statusBarTop - 10, 0) : insets.top;
  const [nickname, setNickname] = useState(route.params.nickname);
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
      await AccountLifecycleService.renameAccount(route.params.address, nickname.trim());
      navigation.navigate('WalletHome');
    } catch (_error) {
      setMessage('Could not rename account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        style={styles.screen}
        contentContainerStyle={[styles.addAccountContent, { paddingTop: topInset }]}
      >
        <View style={styles.addAccountHeader}>
          <Pressable accessibilityLabel="Back" style={styles.addAccountBackButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={18} color={styles.homeHeaderIcon.color} strokeWidth={2.25} />
          </Pressable>
          <Text style={styles.addAccountHeaderTitle}>Rename Account</Text>
        </View>

        <Text style={styles.addAccountLabel}>Account Name</Text>
        <TextInput
          style={styles.addAccountInput}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Account name"
          placeholderTextColor="#8d94a1"
          autoCapitalize="words"
          autoFocus
        />

        {message ? <Text style={styles.helper}>{message}</Text> : null}

        <Pressable style={styles.formPrimaryButton} onPress={submit}>
          <Text style={styles.actionText}>{isLoading ? 'Please wait...' : 'Save'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
