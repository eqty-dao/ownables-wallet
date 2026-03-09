import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import { styles } from './common';

export default function AddAccountScreen({ navigation, route }: WalletStackScreenProps<'AddAccount'>) {
  const [name, setName] = useState(route.params?.suggestedName || '');

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen}>
      <Text style={styles.title}>Add Account</Text>
      <Text style={styles.subtitle}>Create a new derived account name.</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Account Name"
        placeholderTextColor="#8d94a1"
      />

      <Pressable style={styles.actionButton} onPress={() => navigation.navigate('AccountManager')}>
        <Text style={styles.actionText}>Save Account</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}
