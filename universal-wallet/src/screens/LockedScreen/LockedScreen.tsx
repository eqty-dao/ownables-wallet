import React, {useContext, useEffect, useState} from 'react';
import {RootStackScreenProps} from '../../../types';
import LTOService from '../../services/LTO.service';
import {MessageContext} from '../../context/UserMessage.context';
import {StyledInput} from '../../components/styles/StyledInput.styles';
import {StyledButton} from '../../components/styles/StyledButton.styles';
import {ButtonContainer, Container, InputContainer, StyledText, StyledTitle} from './LockedScreen.styles';
import {LOCKED_SCREEN} from '../../constants/Text';
import {authenticateWithBiometrics} from '../../utils/authenticateWithBiometrics';

export default function LockedScreen({navigation}: RootStackScreenProps<'LockedScreen'>) {
  const [password, setPassword] = useState<string>('');
  const [passwordVisible, setPasswordVisible] = useState<boolean>(true);

  const {setShowMessage, setMessageInfo} = useContext(MessageContext);

  const validateForm = (): {err?: string} => {
    if (password === '') {
      return {err: 'Password is required!'};
    } else {
      return {err: undefined};
    }
  };

  const handleSignIn = () => {
    const {err} = validateForm();

    if (err) {
      setMessageInfo(err);
      setShowMessage(true);
      return;
    }

    LTOService.unlock(password)
      .then(() => {
        setPassword('');
        navigation.goBack();
      })
      .catch(() => {
        setMessageInfo('Wrong password');
        setShowMessage(true);
      });
  };

  useEffect(() => {
    authenticateWithBiometrics({navigation, goBack: true});
  }, []);

  return (
    <Container>
      <StyledTitle>{LOCKED_SCREEN.TITLE}</StyledTitle>
      <StyledText>{LOCKED_SCREEN.SUBTITLE}</StyledText>

      <InputContainer>
        <StyledInput
          style={{width: 'auto'}}
          label={LOCKED_SCREEN.INPUT_PASSWORD.LABEL}
          value={password}
          onChangeText={password => setPassword(password)}
          secureTextEntry={passwordVisible}
          placeholder={LOCKED_SCREEN.INPUT_PASSWORD.PLACEHOLDER}
          right={
            <StyledInput.Icon
              name={passwordVisible ? 'eye' : 'eye-off'}
              onPress={() => setPasswordVisible(!passwordVisible)}
            />
          }
        />
      </InputContainer>

      <ButtonContainer>
        <StyledButton
          mode="contained"
          color="#A017B7"
          uppercase={false}
          labelStyle={{fontWeight: '400', fontSize: 16, width: '100%'}}
          onPress={() => handleSignIn()}>
          {LOCKED_SCREEN.BUTTON}
        </StyledButton>
      </ButtonContainer>
    </Container>
  );
}
