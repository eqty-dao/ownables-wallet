import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import { styles } from './common';

const WORDS = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident'];

export default function RecoveryPhraseScreen({ navigation }: WalletStackScreenProps<'RecoveryPhrase'>) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen}>
      <Text style={styles.title}>Recovery Phrase</Text>
      <Text style={styles.subtitle}>Never share this phrase with anyone.</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 }}>
        {WORDS.map((word, index) => (
          <View key={word} style={[styles.row, { width: '48%', marginBottom: 8 }]}> 
            <Text style={styles.rowSubTitle}>{index + 1}.</Text>
            <Text style={styles.rowTitle}>{word}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
