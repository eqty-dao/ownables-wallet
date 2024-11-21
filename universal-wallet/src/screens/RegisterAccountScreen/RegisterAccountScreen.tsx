import React, { useContext, useEffect, useState } from 'react';
import { RootStackScreenProps } from '../../../types';
import { MessageContext } from '../../context/UserMessage.context';
import LocalStorageService from '../../services/LocalStorage.service';
import { REGISTER, TERMS_AND_CONDITIONS_CONTENT } from '../../constants/Text';
import LTOService from '../../services/LTO.service';
import ReactNativeBiometrics from 'react-native-biometrics';
import {ScreenContainer} from '../../components/ScreenContainer';
import {Title} from '../../components/Title';
import {InputField} from '../../components/InputField';
import {BackButton} from '../../components/BackButton';
import {StyledButton} from '../../components/StyledButton';
import {FormContainer} from '../../components/styles/FormContainer.styles';
import {CheckBoxCard} from '../../components/CheckBoxCard';
import {BottomModal} from '../../components/BottomModal';

export default function RegisterAccountScreen({ navigation, route }: RootStackScreenProps<'RegisterAccount'>) {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pin, setPin] = useState('');

  const [loginForm, setloginForm] = useState({
    nickname: '',
    password: '',
    passwordConfirmation: '',
  });

  const [checked, setChecked] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [accountAddress, setAccountAddress] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const { setShowMessage, setMessageInfo } = useContext(MessageContext);
  const rnBiometrics = new ReactNativeBiometrics();

  useEffect(() => {
    getAccountAddress();
  }, [accountAddress]);

  const getAccountAddress = () => {
    LTOService.getAccount()
      .then(account => {
        setAccountAddress(account.address);
      })
      .catch(() => {
        setShowMessage(true);
        setMessageInfo('Error creating/importing your account!');
        navigation.goBack();
      });
  };

  const sanitize = (value: string) => {
    const sanitizedRegex = /[^a-zA-Z0-9@!$%*?&#]/g;
    return value.replace(sanitizedRegex, '');
  };

  //F-2024-4597 - Lack of Input Sanitization in handleInputChange
  const handleInputChange = (name: string, value: string) => {
    const sanitizedValue = sanitize(value);
    setloginForm({...loginForm, [name]: sanitizedValue});
  };

  const isStrongPassword = (password: string) => {
    const regex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})');
    return regex.test(password);
  };

  const validateForm = (): { err?: string } => {
    if (loginForm.nickname === '') {
      return { err: 'Nickname is required!' };
    }

    if (loginForm.nickname.length < 3 || loginForm.nickname.length > 15) {
      return { err: 'Nickname must be more than 3 or less than 15 character!' };
    }

    if (loginForm.password === '') {
      return { err: 'Password is required!' };
    }

    if (!isStrongPassword(loginForm.password)) {
      return {
        err: 'Password must be atleast 8 characters long and include uppercase, lowercase, number and special character!',
      };
    }
    //F-2024-4595 - Insufficient Password Complexity

    if (!isStrongPassword(loginForm.password)) {
      return {
        err: 'Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character!',
      };
    }
    if (loginForm.password !== loginForm.passwordConfirmation) {
      return { err: 'Passwords do not match!' };
    }

    if (!checked) {
      return { err: 'To continue accept terms and conditions!' };
    }

    return {};
  };

  const handleAccount = async (requireBiometrics: boolean = false) => {
    const { err } = validateForm();

    if (err) {
      setMessageInfo(err);
      setShowMessage(true);
      return;
    }

    try {
      setLoading(true);

      let signature;
      if (requireBiometrics) {
        signature = await addSignature();
        if (!signature) {
          setLoading(false);
          throw new Error('User cancelled biometrics request');
        }
      }

      await LocalStorageService.storeData('@userAlias', { nickname: loginForm.nickname });

      await LTOService.storeAccount(loginForm.nickname, loginForm.password, signature);

      const message =
        route.params.data === 'created' ? 'Account created successfully!' : 'Account imported successfully!';

      setTimeout(() => {
        setLoading(false);
        navigation.navigate('Root');
      }, 1000);
    } catch (error) {
      console.log(error);
      throw new Error(`Error storing account data. ${error}`);
    }
  };

  const checkForBiometrics = async () => {
    const isSupported = (await rnBiometrics.isSensorAvailable()).available;
    if (isSupported) {
      setDialogVisible(true);
      return true;
    } else {
      setShowPinFallback(true);
    }
  };

  const SuscribeBiometrics = async () => {
    await handleAccount(true);
  };

  const addSignature = async (): Promise<string | undefined> => {
    const { keysExist } = await rnBiometrics.biometricKeysExist();

    if (!keysExist) {
      await rnBiometrics.createKeys();
    }

    const signatureResult = await rnBiometrics.createSignature({
      promptMessage: 'Authenticate',
      payload: 'payload',
    });

    if (!signatureResult.success) {
      throw new Error(signatureResult.error);
    }

    return signatureResult.signature;
  };

  //"F-2024-4596 - Potential Biometric Authentication Bypass"
  const handlePinAuthentication = () => {
    const pinRegex = /^\d{8}$/;

    if (!pinRegex.test(pin)) {
      setMessageInfo('PIN must be exactly 8 numeric characters.');
      setShowMessage(true);
      return;
    }

    handleAccount();
  };

  return (
    <ScreenContainer>
      <BackButton onPress={() => navigation.goBack()} />
      {route.params.data === 'created' ? (
        <Title title={REGISTER.CREATE_TITLE} subtitle={REGISTER.CREATE_SUBTITLE} />
      ) : (
        <Title title={REGISTER.IMPORT_TITLE} />
      )}
      <FormContainer>
        <InputField label={REGISTER.INPUT_ADDRESS} value={accountAddress} disabled={true} />
        <InputField
          label={REGISTER.INPUT_NICKNAME.LABEL}
          value={loginForm.nickname}
          placeholder={REGISTER.INPUT_NICKNAME.PLACEHOLDER}
          onChangeText={(text: any) => handleInputChange('nickname', text)}
        />
        <InputField
          label={REGISTER.INPUT_PASSWORD.LABEL}
          value={loginForm.password}
          onChangeText={(text: any) => handleInputChange('password', text)}
          secureTextEntry={true}
          placeholder={REGISTER.INPUT_PASSWORD.PLACEHOLDER}
        />
        <InputField
          label={REGISTER.INPUT_PASSWORD_REPEAT.LABEL}
          value={loginForm.passwordConfirmation}
          onChangeText={(text: any) => handleInputChange('passwordConfirmation', text)}
          secureTextEntry={true}
          placeholder={REGISTER.INPUT_PASSWORD_REPEAT.PLACEHOLDER}
        />
      </FormContainer>

      {showPinFallback ? (
        <>
          <InputField
            label="Enter your PIN"
            value={pin}
            onChangeText={setPin}
            placeholder="Enter a 8-digit PIN"
            secureTextEntry={true}
          />
          <StyledButton text="Submit PIN" disabled={loading} onPress={handlePinAuthentication} />
        </>
      ) : (
        <StyledButton
          text={loading ? 'Please wait' : REGISTER.BUTTON_CREATE}
          disabled={loading}
          onPress={checkForBiometrics}
        />
      )}

      <CheckBoxCard
        label={REGISTER.CHECKBOX}
        value={checked}
        onChange={() => setChecked(!checked)}
        onPressText={() => setModalVisible(true)}
      />

      {route.params.data === 'created' ? (
        <StyledButton
          text={loading ? 'Please wait' : REGISTER.BUTTON_CREATE}
          disabled={loading}
          onPress={checkForBiometrics}
        />
      ) : (
        <StyledButton
          text={loading ? 'Please wait' : REGISTER.BUTTON_IMPORT}
          disabled={loading}
          onPress={checkForBiometrics}
        />
      )}

      <BottomModal
        title={REGISTER.MODAL_TITLE}
        body={TERMS_AND_CONDITIONS_CONTENT}
        onSubmit={() => {
          setModalVisible(!modalVisible);
          setChecked(true);
        }}
        type="terms"
        submitButtonType="primary"
        submitText="I agree"
        onCancel={() => setModalVisible(!modalVisible)}
        visible={modalVisible}
        hideCancelButton={true}
      />

      <BottomModal
        title={REGISTER.DIALOG_TITLE}
        body={[{ text: REGISTER.BIOMETRICS_CONFIRMATION }]}
        onSubmit={() => {
          SuscribeBiometrics();
          setDialogVisible(false);
        }}
        submitButtonType="primary"
        submitText="Enable biometrics authentication"
        cancelText="No, continue"
        onCancel={() => {
          handleAccount();
          setDialogVisible(false);
        }}
        visible={dialogVisible}
      />
    </ScreenContainer>
  );
}
