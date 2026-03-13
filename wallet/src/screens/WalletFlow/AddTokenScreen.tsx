import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalletStackScreenProps } from '../../../types';
import { useWalletFlowStyles } from './common';

export default function AddTokenScreen({ navigation }: WalletStackScreenProps<'AddToken'>) {
  const styles = useWalletFlowStyles();
  const insets = useSafeAreaInsets();
  const statusBarTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const topInset = Platform.OS === 'android' ? Math.max(insets.top, statusBarTop - 10, 0) : insets.top;
  const [contractAddress, setContractAddress] = useState('');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [decimals, setDecimals] = useState('');
  const [message, setMessage] = useState('');

  const onSubmit = () => {
    setMessage('Custom ERC20 import is not wired yet.');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        style={styles.screen}
        contentContainerStyle={[styles.formScreenContent, { paddingTop: topInset }]}
      >
        <View style={styles.formHeader}>
          <Pressable accessibilityLabel="Back" style={styles.formHeaderBackButton} onPress={() => navigation.goBack()}>
            <ChevronLeft size={18} color={styles.homeHeaderIcon.color} strokeWidth={2} />
          </Pressable>
          <Text style={styles.formHeaderTitle}>Add Token</Text>
        </View>

        <Text style={styles.formLabel}>Contract Address</Text>
        <TextInput
          style={styles.formInput}
          value={contractAddress}
          onChangeText={setContractAddress}
          placeholder="0x..."
          placeholderTextColor="#8D94A1"
          autoCapitalize="none"
        />

        <Text style={styles.formLabel}>Token Symbol</Text>
        <TextInput
          style={styles.formInput}
          value={symbol}
          onChangeText={setSymbol}
          placeholder=""
          placeholderTextColor="#8D94A1"
          autoCapitalize="characters"
        />

        <Text style={styles.formLabel}>Token Name</Text>
        <TextInput
          style={styles.formInput}
          value={name}
          onChangeText={setName}
          placeholder=""
          placeholderTextColor="#8D94A1"
          autoCapitalize="words"
        />

        <Text style={styles.formLabel}>Token Decimals</Text>
        <TextInput
          style={styles.formInput}
          value={decimals}
          onChangeText={setDecimals}
          placeholder=""
          placeholderTextColor="#8D94A1"
          keyboardType="number-pad"
        />

        {message ? <Text style={styles.formHelper}>{message}</Text> : null}

        <Pressable style={styles.formPrimaryButton} onPress={onSubmit}>
          <Text style={styles.formPrimaryButtonText}>Add Token</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
