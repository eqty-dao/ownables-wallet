import React, { useContext, useEffect, useState } from 'react';
import { RootStackScreenProps } from '../../../types';
import { MessageContext } from '../../context/UserMessage.context';
import LocalStorageService from '../../services/LocalStorage.service';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import { SIGNIN } from '../../constants/Text';
import { authenticateWithBiometrics } from '../../utils/authenticateWithBiometrics';
import ReactNativeBiometrics from 'react-native-biometrics';
import { ScreenContainer } from '../../components/ScreenContainer';
import { StyledButton } from '../../components/StyledButton';
import { InputField } from '../../components/InputField';
import { Separator } from '../../components/styles/Separator.styles';
import { Title } from '../../components/Title';
import EnvironmentSelectionSwitch from '../../components/EnvironmentSwitch';
import { ENABLE_ENV_SWITCH } from '@env';

export default function SignInScreen({ navigation }: RootStackScreenProps<'SignIn'>) {

  const [userAlias, setUserAlias] = useState<any>();
  const [password, setPassword] = useState<string>('');
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { setShowMessage, setMessageInfo } = useContext(MessageContext);
  const [loading, setLoading] = useState<boolean>(false);
  const [isBiometric, setIsBiometric] = useState<boolean>(false);
  const [showEnvironmentSelector, setShowEnvironmentSelector] = useState<boolean>(false);

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

  const validateForm = (): { err?: string } => {
    if (!userAlias?.nickname) {
      return { err: 'Please import your account first!' };
    }
    if (password === '') {
      return { err: 'Password is required!' };
    }

    return {};
  };

  const handleSignIn = () => {
    if (loading) return;

    setLoading(true);
    const { err } = validateForm();

    if (err) {
      setMessageInfo(err);
      setShowMessage(true);
      setLoading(false);
      return;
    }

    AccountLifecycleService.unlock(password)
      .then(() => {
        setLoading(false);
        navigation.replace('Root');
        setPassword('');
        setLoading(false);
        setIsBiometric(false);
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

  const handleLongPress = () => {
    if (ENABLE_ENV_SWITCH !== 'true') return;
    setShowEnvironmentSelector(true);
  }

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

      <StyledButton disabled={loading} onPress={handleSignIn} text={loading && !isBiometric ? 'Please wait' : SIGNIN.BUTTON_SIGNIN} onLongPress={handleLongPress} />
      {isEnrolled && (
        // F-2024-4598 - Biometric Authentication Without Fallback
        <StyledButton
          onPress={() => {
            setIsBiometric(true);
            setLoading(true);
            authenticateWithBiometrics({ navigation }).catch(() => {
              setMessageInfo('Biometric authentication failed. Please use your password.');
              setLoading(false);
              setShowMessage(true);
            })
          }}
          disabled={loading}
          text={loading && isBiometric ? 'Please wait' : SIGNIN.BUTTON_BIOMETRICS}
          onLongPress={handleLongPress}
        />
      )}
      <EnvironmentSelectionSwitch
        showEnvironmentSelector={showEnvironmentSelector}
        setShowEnvironmentSelector={setShowEnvironmentSelector}
      />
    </ScreenContainer>
  );
}
