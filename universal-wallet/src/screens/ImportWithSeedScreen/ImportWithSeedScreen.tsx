import React, {useContext, useState} from 'react';
import {RootStackScreenProps} from '../../../types';
import {IMPORT_WITHSEEDS} from '../../constants/Text';
import {MessageContext} from '../../context/UserMessage.context';
import LTOService from '../../services/LTO.service';
import {ScreenContainer} from '../../components/ScreenContainer';
import {Title} from '../../components/Title';
import {BackButton} from '../../components/BackButton';
import {InputField} from '../../components/InputField';
import {StyledButton} from '../../components/StyledButton';

export default function ImportSeedScreen({navigation}: RootStackScreenProps<'ImportSeed'>) {
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const {setShowMessage, setMessageInfo} = useContext(MessageContext);

  const handleImportFromSeed = async () => {
    try {
      const seed = seedPhrase.trim().toLowerCase();

      if (seed.split(' ').length === 15) {
        LTOService.importAccount(seed)
          .then(() => navigation.navigate('RegisterAccount', {data: 'seed'}))
          .catch(error => {
            throw new Error(`Error storing data. ${error}`);
          });
      } else {
        setShowMessage(true);
        setMessageInfo('Seed phrase must have 15 words separated by one space!');
      }
    } catch (error) {
      console.error('Error importing account - ', error);
      setShowMessage(true);
      setMessageInfo('Failed to import account. Please try again.');
    } finally {
      setSeedPhrase('');
    }
  };

  return (
    <ScreenContainer>
      <BackButton onPress={() => navigation.goBack()} />
      <Title title={IMPORT_WITHSEEDS.IMPORT_TITLE} />
      <InputField
        label={IMPORT_WITHSEEDS.INPUT_SEEDPHRASE.LABEL}
        onChangeText={setSeedPhrase}
        value={seedPhrase}
        placeholder={IMPORT_WITHSEEDS.INPUT_SEEDPHRASE.PLACEHOLDER}
        // autoCapitalize="none"
        // autoComplete="off"
        // autoCorrect={false}
        // blurOnSubmit={true}
      />
      <StyledButton
        text={IMPORT_WITHSEEDS.BUTTON_IMPORT}
        onPress={() => {
          setSeedPhrase('');
          handleImportFromSeed();
        }}
      />
    </ScreenContainer>
  );
}
