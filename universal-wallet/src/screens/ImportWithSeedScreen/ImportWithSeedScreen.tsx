import React, { useContext, useState } from 'react';
import { RootStackScreenProps } from '../../../types';
import { IMPORT_WITHSEEDS } from '../../constants/Text';
import { MessageContext } from '../../context/UserMessage.context';
import LTOService from '../../services/LTO.service';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Title } from '../../components/Title';
import { BackButton } from '../../components/BackButton';
import { InputField } from '../../components/InputField';
import { StyledButton } from '../../components/StyledButton';

export default function ImportSeedScreen({ navigation }: RootStackScreenProps<'ImportSeed'>) {
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const { setShowMessage, setMessageInfo } = useContext(MessageContext);

  const validateSeedPhrase = (seed: string): boolean => {
    const regExp = /^[a-zA-Z]+( [a-zA-Z]+)*$/;
    return regExp.test(seed);
  };

  const showMessage = (message: string) => {
    setShowMessage(true);
    setMessageInfo(message);
  };

  const handleImportFromSeed = async () => {
    if (!seedPhrase) {
      showMessage('Please enter a seed phrase to import.');
      return;
    }

    const trimmedSeed = seedPhrase.trim().toLowerCase();

    if (!validateSeedPhrase(trimmedSeed)) {
      showMessage('Invalid seed phrase, seed phase contains invalid characters.');
      return;
    }

    try {
      await LTOService.importAccount(trimmedSeed);
      navigation.navigate('RegisterAccount', { data: 'seed' });
    } catch (error) {
      console.error('Error importing account:', error);
      showMessage('Failed to import account. Please try again.');
    } finally {
      setSeedPhrase(''); // Clear the seed phrase from memory
    }
  };

  return (
    <ScreenContainer>
      <BackButton onPress={navigation.goBack} />
      <Title title={IMPORT_WITHSEEDS.IMPORT_TITLE} />
      <InputField
        label={IMPORT_WITHSEEDS.INPUT_SEEDPHRASE.LABEL}
        onChangeText={setSeedPhrase}
        value={seedPhrase}
        placeholder={IMPORT_WITHSEEDS.INPUT_SEEDPHRASE.PLACEHOLDER}
      />
      <StyledButton
        text={IMPORT_WITHSEEDS.BUTTON_IMPORT}
        onPress={handleImportFromSeed}
      />
    </ScreenContainer>
  );
}
