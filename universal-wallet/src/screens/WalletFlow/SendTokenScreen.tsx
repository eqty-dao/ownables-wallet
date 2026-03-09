import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import { styles } from './common';

export default function SendTokenScreen({ navigation, route }: WalletStackScreenProps<'SendToken'>) {
  const [recipient, setRecipient] = useState(route.params.recipient || '');
  const [amount, setAmount] = useState('');

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen}>
      <Text style={styles.title}>Send {route.params.token}</Text>

      <TextInput
        value={recipient}
        onChangeText={setRecipient}
        style={styles.input}
        placeholder="Recipient Address"
        placeholderTextColor="#8d94a1"
      />

      <TextInput
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
        placeholder={`Amount (${route.params.token})`}
        placeholderTextColor="#8d94a1"
      />

      <Pressable style={styles.actionButton}>
        <Text style={styles.actionText}>Submit Transfer</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
