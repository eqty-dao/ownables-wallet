import React, { useContext, useState } from 'react';
import { Text } from 'react-native';
import { RootStackScreenProps } from '../../../types';
import { IMPORT_WITHSEEDS } from '../../constants/Text';
import { MessageContext } from '../../context/UserMessage.context';
import LTOService from '../../services/LTO.service';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Title } from '../../components/Title';
import { BackButton } from '../../components/BackButton';
import { StyledButton } from '../../components/StyledButton';
import { SeedPhraseInput } from '../../components/SeedPhraseInput/SeedPhraseInput';
import { useClipboard } from '@react-native-clipboard/clipboard';

export default function ImportSeedScreen({ navigation }: RootStackScreenProps<'ImportSeed'>) {
  const [words, setWords] = useState<string[]>(Array(15).fill(''));
  const { setShowMessage, setMessageInfo } = useContext(MessageContext);
  const [data, setString] = useClipboard();

  const showMessage = (message: string) => {
    setShowMessage(true);
    setMessageInfo(message);
  };

  const validateSeedPhrase = (seed: string): boolean => {
    const regExp = /^[a-zA-Z]+( [a-zA-Z]+)*$/;
    return regExp.test(seed);
  };

  const isValidMnemonicLength = (value: string): boolean => {
    const count = value.split(' ').length;
    return [12, 15, 18, 21, 24].includes(count);
  };

  const handleWordChange = (text: string, index: number) => {
    const newWords = [...words];
    newWords[index] = text.toLowerCase().trim();
    setWords(newWords);
  };

  const handlePaste = (pasted: string) => {
    const seedPhrase = pasted.trim().toLowerCase().split(' ');
    if (![12, 15, 18, 21, 24].includes(seedPhrase.length)) {
      setWords(Array(15).fill(''));
      setShowMessage(true);
      setMessageInfo('Invalid recovery phrase length.');
      return;
    }
    setWords(seedPhrase);
  };

  const handleImportFromSeed = async () => {
    const seedPhrase = words.join(' ').trim();

    if (!seedPhrase || words.some(word => !word)) {
      showMessage('Please fill in all seed phrase words.');
      return;
    }

    if (!validateSeedPhrase(seedPhrase)) {
      showMessage('Invalid recovery phrase, it contains invalid characters.');
      return;
    }

    if (!isValidMnemonicLength(seedPhrase)) {
      showMessage('Recovery phrase must be 12, 15, 18, 21, or 24 words.');
      return;
    }

    try {
      await LTOService.importAccount(seedPhrase);
      navigation.navigate('RegisterAccount', { data: 'seed' });
    } catch (error) {
      console.error('Error importing account:', error);
      showMessage('Failed to import account. Please try again.');
    } finally {
      setWords(Array(15).fill('')); // Clear the seed phrase from memory
    }
  };

  return (
    <ScreenContainer>
      <BackButton onPress={navigation.goBack} />
      <Title title={IMPORT_WITHSEEDS.IMPORT_TITLE} />

      <SeedPhraseInput
        words={words}
        onWordChange={handleWordChange}
        showCopyButton={false}
        onPaste={(pasted) => handlePaste(pasted)}
        showPasteButton={true}
      />

      <StyledButton
        text={IMPORT_WITHSEEDS.BUTTON_IMPORT}
        onPress={handleImportFromSeed}
      />

      <Text
        style={{
          color: '#ffffff',
          padding: 10,
          borderRadius: 5,
          marginTop: 20,
        }}
      >
        Note: You can only use one wallet address at a time. To use another wallet address, you can remove the current account at anytime and add a different one.
      </Text>
    </ScreenContainer>
  );
}
