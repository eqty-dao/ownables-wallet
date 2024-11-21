import React, {useContext, useEffect, useState} from 'react';
import {RootStackScreenProps} from '../../../types';
import {MessageContext} from '../../context/UserMessage.context';
import LocalStorageService from '../../services/LocalStorage.service';
import LTOService from '../../services/LTO.service';
import {SIGNIN} from '../../constants/Text';
import {authenticateWithBiometrics} from '../../utils/authenticateWithBiometrics';
import ReactNativeBiometrics from 'react-native-biometrics';
import {ScreenContainer} from '../../components/ScreenContainer';
import {StyledButton} from '../../components/StyledButton';
import {InputField} from '../../components/InputField';
import {Separator} from '../../components/styles/Separator.styles';
import {Title} from '../../components/Title';

export default function SignInScreen({navigation}: RootStackScreenProps<'SignIn'>) {
  const [userAlias, setUserAlias] = useState<any>();
  const [password, setPassword] = useState<string>('');
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const {setShowMessage, setMessageInfo} = useContext(MessageContext);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    getAlias();
  }, []);

  const getAlias = () => {
    LocalStorageService.getData('@userAlias')
      .then(data => {
        setUserAlias(data);
      })
      .catch(error => {
        throw new Error(`Error retrieving user data. ${error}`);
      });
  };

  const validateForm = (): {err?: string} => {
    if (!userAlias?.nickname) {
      return {err: 'Please import your account first!'};
    }
    if (password === '') {
      return {err: 'Password is required!'};
    }

    return {};
  };

  const handleSignIn = () => {
    if (loading) return;

    setLoading(true);
    const {err} = validateForm();

    if (err) {
      setMessageInfo(err);
      setShowMessage(true);
      setLoading(false);
      return;
    }

    LTOService.unlock(password)
      .then(() => {
        setLoading(false);
        navigation.replace('Root');
        setPassword('');
      })
      .catch(() => {
        setMessageInfo('Wrong password!');
        setShowMessage(true);
        setLoading(false);
      });
  };
  useEffect(() => {
    const verifyForEnrollment = async () => {
      const rnBiometrics = new ReactNativeBiometrics();
      const isEnrolled = (await rnBiometrics.biometricKeysExist()).keysExist;
      if (isEnrolled) setIsEnrolled(true);
    };
    verifyForEnrollment();
  }, []);

  return (
    <ScreenContainer>
      <Separator />
      <Title title={SIGNIN.TITLE} subtitle={SIGNIN.SUBTITLE} />
      <InputField label={SIGNIN.INPUT_NICKNAME.LABEL} value={userAlias?.nickname} disabled={true} />
      <InputField
        label={SIGNIN.INPUT_PASSWORD.LABEL}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!passwordVisible}
        placeholder={SIGNIN.INPUT_PASSWORD.PLACEHOLDER}
      />

      <StyledButton disabled={loading} onPress={handleSignIn} text={loading ? 'Please wait' : SIGNIN.BUTTON_SIGNIN} />
      {isEnrolled && (
        // F-2024-4598 - Biometric Authentication Without Fallback
        <StyledButton
          onPress={() =>
            authenticateWithBiometrics({navigation}).catch(() => {
              setMessageInfo('Biometric authentication failed. Please use your password.');
              setShowMessage(true);
            })
          }
          text={SIGNIN.BUTTON_BIOMETRICS}
        />
      )}
    </ScreenContainer>
  );
}
