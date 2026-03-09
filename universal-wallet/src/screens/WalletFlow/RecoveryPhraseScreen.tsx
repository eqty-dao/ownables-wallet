import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import { styles } from './common';

export default function RecoveryPhraseScreen({ navigation }: WalletStackScreenProps<'RecoveryPhrase'>) {
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    const seed = AccountLifecycleService.getSeed();
    setWords(seed.split(' ').filter(Boolean));
  }, []);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Recovery Phrase</Text>
      <Text style={styles.subtitle}>Never share this phrase with anyone. Store it offline.</Text>

      <View style={styles.twoColumnWrap}>
        {words.map((word, index) => (
          <View key={`${word}-${index}`} style={styles.chip}>
            <Text style={styles.chipIndex}>{index + 1}</Text>
            <Text style={styles.chipWord}>{word}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
