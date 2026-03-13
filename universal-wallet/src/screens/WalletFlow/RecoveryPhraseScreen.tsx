import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { ArrowLeft, Copy, TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import { useWalletFlowStyles } from './common';

export default function RecoveryPhraseScreen({ navigation }: WalletStackScreenProps<'RecoveryPhrase'>) {
  const styles = useWalletFlowStyles();
  const insets = useSafeAreaInsets();
  const statusBarTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const topInset = Platform.OS === 'android' ? Math.max(insets.top, statusBarTop - 10, 0) : insets.top;
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    const seed = AccountLifecycleService.getSeed();
    setWords(seed.split(' ').filter(Boolean));
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        style={styles.screen}
        contentContainerStyle={[styles.recoveryContent, { paddingTop: topInset }]}
      >
        <View style={styles.recoveryHeader}>
          <Pressable accessibilityLabel="Back" style={styles.recoveryHeaderBackButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={18} color={styles.homeHeaderIcon.color} strokeWidth={2.25} />
          </Pressable>
          <Text style={styles.recoveryHeaderTitle}>Recovery Phrase</Text>
        </View>

        <View style={styles.recoveryWarningCard}>
          <TriangleAlert size={18} color="#F59E0B" strokeWidth={2} />
          <View style={styles.recoveryWarningTextWrap}>
            <Text style={styles.recoveryWarningTitle}>Never share your recovery phrase</Text>
            <Text style={styles.recoveryWarningBody}>
              Anyone with this phrase can access your funds. Store it securely offline.
            </Text>
          </View>
        </View>

        <View style={styles.twoColumnWrap}>
          {words.map((word, index) => (
            <View key={`${word}-${index}`} style={styles.chip}>
              <Text style={styles.chipIndex}>{index + 1}.</Text>
              <Text style={styles.chipWord}>{word}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.recoveryCopyButton} onPress={() => Clipboard.setString(words.join(' '))}>
          <Copy size={18} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.recoveryCopyButtonText}>Copy to Clipboard</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
