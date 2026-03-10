import React, { useContext, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackScreenProps } from '../../../types';
import { IMPORT_WITHSEEDS } from '../../constants/Text';
import { MessageContext } from '../../context/UserMessage.context';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButton } from '../../components/BackButton';
import { StyledButton } from '../../components/StyledButton';
import { SeedPhraseInput } from '../../components/SeedPhraseInput/SeedPhraseInput';
import { extractEnteredWords, isValidMnemonicLength, normalizeMnemonicWords } from './mnemonicInput';
import useEffectiveColorScheme from '../../hooks/useEffectiveColorScheme';

export default function ImportSeedScreen({ navigation }: RootStackScreenProps<'ImportSeed'>) {
  const isDark = useEffectiveColorScheme() === 'dark';
  const [words, setWords] = useState<string[]>(Array(24).fill(''));
  const [visibleWordCount, setVisibleWordCount] = useState<number>(12);
  const { setShowMessage, setMessageInfo } = useContext(MessageContext);

  const showMessage = (message: string) => {
    setShowMessage(true);
    setMessageInfo(message);
  };

  const validateSeedPhrase = (seed: string): boolean => {
    const regExp = /^[a-zA-Z]+( [a-zA-Z]+)*$/;
    return regExp.test(seed);
  };

  const handleWordChange = (text: string, index: number) => {
    const newWords = [...words];
    newWords[index] = text.toLowerCase().trim();
    setWords(newWords);
  };

  const handlePaste = (pasted: string) => {
    const pastedWords = normalizeMnemonicWords(pasted);
    if (!isValidMnemonicLength(pastedWords.length)) {
      setWords(Array(24).fill(''));
      setShowMessage(true);
      setMessageInfo('Invalid recovery phrase length.');
      return;
    }
    setVisibleWordCount(pastedWords.length > 12 ? 24 : 12);
    const paddedWords = Array(24).fill('');
    pastedWords.forEach((word, idx) => {
      paddedWords[idx] = word;
    });
    setWords(paddedWords);
  };

  const handleImportFromSeed = async () => {
    const enteredWords = extractEnteredWords(words);
    const seedPhrase = enteredWords.join(' ');

    if (!seedPhrase) {
      showMessage('Enter your recovery phrase to continue.');
      return;
    }

    if (!validateSeedPhrase(seedPhrase)) {
      showMessage('Invalid recovery phrase, it contains invalid characters.');
      return;
    }

    if (!isValidMnemonicLength(enteredWords.length)) {
      showMessage('Recovery phrase must be 12, 15, 18, 21, or 24 words.');
      return;
    }

    try {
      await AccountLifecycleService.importAccount(seedPhrase);
      navigation.navigate('RegisterAccount', { data: 'seed' });
    } catch (error) {
      console.error('Error importing account:', error);
      showMessage('Failed to import account. Please try again.');
    } finally {
      setWords(Array(24).fill('')); // Clear the seed phrase from memory
    }
  };

  return (
    <ScreenContainer topPadding={12} gapSize={20}>
      <View style={styles.headerRow}>
        <BackButton onPress={navigation.goBack} />
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: isDark ? '#fcfcf7' : '#141414' }]}>{IMPORT_WITHSEEDS.IMPORT_TITLE}</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#909092' : '#6E6F78' }]}>{IMPORT_WITHSEEDS.IMPORT_SUBTITLE}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setVisibleWordCount(visibleWordCount === 12 ? 24 : 12)}
        style={styles.wordCountToggle}
      >
        <Text style={[styles.wordCountToggleText, { color: '#615fff' }]}>
          {visibleWordCount === 12 ? 'Need more than 12 words? Show 24 fields' : 'Use 12 fields'}
        </Text>
      </TouchableOpacity>

      <SeedPhraseInput
        words={words.slice(0, visibleWordCount)}
        onWordChange={handleWordChange}
        showCopyButton={false}
        onPaste={(pasted) => handlePaste(pasted)}
        showPasteButton={true}
      />

      <StyledButton
        text={IMPORT_WITHSEEDS.BUTTON_IMPORT}
        onPress={handleImportFromSeed}
      />

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: '#fcfcf7',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    color: '#909092',
    fontSize: 13,
  },
  wordCountToggle: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: -8,
  },
  wordCountToggleText: {
    color: '#4a9eff',
    fontSize: 13,
    fontWeight: '500',
  },
});
