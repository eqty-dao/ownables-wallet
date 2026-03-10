import React, { useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import { RootStackScreenProps } from '../../../types';
import { MessageContext } from '../../context/UserMessage.context';
import LocalStorageService from '../../services/LocalStorage.service';
import { REGISTER, TERMS_AND_CONDITIONS_CONTENT } from '../../constants/Text';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import ReactNativeBiometrics from 'react-native-biometrics';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Title } from '../../components/Title';
import { InputField } from '../../components/InputField';
import { BackButton } from '../../components/BackButton';
import { StyledButton } from '../../components/StyledButton';
import { FormContainer } from '../../components/styles/FormContainer.styles';
import { CheckBoxCard } from '../../components/CheckBoxCard';
import { BottomModal } from '../../components/BottomModal';
import { isValidEvmAddress } from '../../utils/evmAddress';
import { StyledCreateSubtitle, StyledCreateTitle } from './RegisterAccountScreen.styles';
import useEffectiveColorScheme from '../../hooks/useEffectiveColorScheme';


export default function RegisterAccountScreen({ navigation, route }: RootStackScreenProps<'RegisterAccount'>) {
  const isDark = useEffectiveColorScheme() === 'dark';
  const [dialogVisible, setDialogVisible] = useState(false);

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
  }, []);

  const getAccountAddress = () => {
    AccountLifecycleService.getAccount()
      .then(account => {
        if (!isValidEvmAddress(account.address)) {
          throw new Error('Generated account is not an EVM address');
        }
        setAccountAddress(account.address);
      })
      .catch(() => {
        setShowMessage(true);
        setMessageInfo('Error creating/importing your account!');
        navigation.goBack();
      });
  };


  // only allow alphanumeric characters and special characters
  const isValidInput = (value: string) => {
    const regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
    return regex.test(value);
  }

  //F-2024-4597 - Lack of Input Sanitization in handleInputChange
  const handleInputChange = (name: string, value: string) => {
    if (!isValidInput(value)) {
      setMessageInfo(`Invalid characters detected for ${name} : ${value}`);
      setShowMessage(true);
      return;
    }
    setloginForm({ ...loginForm, [name]: value });
  };

  const isStrongPassword = (password: string): boolean => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    return regex.test(password);
  };

  const validateForm = (): { err?: string } => {
    if (loginForm.nickname === '') {
      return { err: 'Account name is required!' };
    }

    if (loginForm.nickname.length < 3 || loginForm.nickname.length > 15) {
      return { err: 'Account name must be between 3 and 15 characters!' };
    }

    if (loginForm.password === '') {
      return { err: 'Password is required!' };
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

      await AccountLifecycleService.storeAccount(loginForm.nickname, loginForm.password);

      const message =
        route.params.data === 'created' ? 'Account created successfully!' : 'Account imported successfully!';

      setTimeout(() => {
        setLoading(false);
        navigation.navigate('Root');
      }, 1000);
    } catch (error) {
      console.log(error);
      // throw new Error(`Error storing account data. ${error}`);
      setMessageInfo(`Error storing account data,please try again`);
      setShowMessage(true);
      console.log('Error storing account data:', error);
    }
  };

  const checkForBiometrics = async () => {
    const isSupported = (await rnBiometrics.isSensorAvailable()).available;
    if (isSupported) {
      setDialogVisible(true);
      return true;
    } else {
      handleAccount();
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
      console.log(signatureResult.error);
      setMessageInfo("Biometric authentication failed. Please try again or continue without it.");
      setShowMessage(true);
    }

    return signatureResult.signature;
  };

  //"F-2024-4596 - Potential Biometric Authentication Bypass"
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pin, setPin] = useState('');
  const handlePinAuthentication = () => {
    const pinRegex = /^\d{8}$/;

    if (!pinRegex.test(pin)) {
      setMessageInfo('PIN must be exactly 8 numeric characters.');
      setShowMessage(true);
      return;
    }

    handleAccount();
  };
  const truncateAddressMiddle = (address: string) => {
    if (!address) return '';
    if (address.length <= 18) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  return (
    <ScreenContainer>
      {route.params.data === 'created' ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <BackButton onPress={() => navigation.goBack()} />
            <StyledCreateTitle isDark={isDark}>{REGISTER.CREATE_TITLE}</StyledCreateTitle>
          </View>
          <StyledCreateSubtitle isDark={isDark}>{REGISTER.CREATE_SUBTITLE}</StyledCreateSubtitle>
        </>
      ) : (
        <>
          <BackButton onPress={() => navigation.goBack()} />
          <Title title={REGISTER.IMPORT_TITLE} />
        </>
      )
      }
      <FormContainer>
        <InputField label={REGISTER.INPUT_ADDRESS} value={truncateAddressMiddle(accountAddress)} disabled={true} />
        <InputField
          label={REGISTER.INPUT_NICKNAME.LABEL}
          value={loginForm.nickname}
          placeholder={REGISTER.INPUT_NICKNAME.PLACEHOLDER}
          onChangeText={(text: any) => handleInputChange('nickname', text)}
          autoCapitalize='none'
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
      ) : null}

      <CheckBoxCard
        label={REGISTER.CHECKBOX}
        value={checked}
        onChange={() => setChecked(!checked)}
        onPressText={() => setModalVisible(true)}
      />

      {
        route.params.data === 'created' ? (
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
        )
      }

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
        body={[]}
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
        type="biometric"
        visible={dialogVisible}
      />
    </ScreenContainer >
  );
}
