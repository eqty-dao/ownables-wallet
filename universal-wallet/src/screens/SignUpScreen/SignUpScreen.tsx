import React from 'react';
import {RootStackScreenProps} from '../../../types';
import {SIGNUP} from '../../constants/Text';
import LTOService from '../../services/LTO.service';
import {Title} from '../../components/Title';
import {ScreenContainer} from '../../components/ScreenContainer';
import {Separator} from '../../components/styles/Separator.styles';
import {StyledButton} from '../../components/StyledButton';
import {FormContainer} from '../../components/styles/FormContainer.styles';

export default function SignUpScreen({navigation}: RootStackScreenProps<'SignUp'>) {
  const handleCreateAccount = async () => {
    LTOService.createAccount()
      .then(() => navigation.navigate('RegisterAccount', {data: 'created'}))
      .catch(error => {
        throw new Error(`Error storing data. ${error}`);
      });
  };

  return (
    <ScreenContainer>
      <Separator />
      <Title title={SIGNUP.TITLE} subtitle={SIGNUP.SUBTITLE} />
      <FormContainer>
        <StyledButton onPress={handleCreateAccount} text={SIGNUP.BUTTON_CREATE} />
        <StyledButton onPress={() => navigation.navigate('ImportSeed')} text={SIGNUP.BUTTON_IMPORT} type="secondary" />
      </FormContainer>
    </ScreenContainer>
  );
}
