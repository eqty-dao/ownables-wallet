// import React, { useContext, useEffect, useReducer } from 'react';
// import { RootStackScreenProps } from '../../../types';
// import { MessageContext } from '../../context/UserMessage.context';
// import LocalStorageService from '../../services/LocalStorage.service';
// import { REGISTER, TERMS_AND_CONDITIONS_CONTENT } from '../../constants/Text';
// import LTOService from '../../services/LTO.service';
// import ReactNativeBiometrics from 'react-native-biometrics';
// import { ScreenContainer } from '../../components/ScreenContainer';
// import { Title } from '../../components/Title';
// import { InputField } from '../../components/InputField';
// import { BackButton } from '../../components/BackButton';
// import { StyledButton } from '../../components/StyledButton';
// import { FormContainer } from '../../components/styles/FormContainer.styles';
// import { CheckBoxCard } from '../../components/CheckBoxCard';
// import { BottomModal } from '../../components/BottomModal';
// import { useFormValidation } from '../../hooks/useFormValidation';

// interface State {
//   nickname: string;
//   password: string;
//   passwordConfirmation: string;
//   checked: boolean;
//   accountAddress: string;
//   loading: boolean;
//   dialogVisible: boolean;
//   modalVisible: boolean;
// }

// type Action =
//   | { type: 'SET_FIELD'; field: string; value: string }
//   | { type: 'TOGGLE_CHECKED' }
//   | { type: 'SET_LOADING'; value: boolean }
//   | { type: 'SET_ACCOUNT_ADDRESS'; value: string }
//   | { type: 'SET_DIALOG_VISIBLE'; value: boolean }
//   | { type: 'SET_MODAL_VISIBLE'; value: boolean };

// const reducer = (state: State, action: Action): State => {
//   switch (action.type) {
//     case 'SET_FIELD':
//       return { ...state, [action.field]: action.value };
//     case 'TOGGLE_CHECKED':
//       return { ...state, checked: !state.checked };
//     case 'SET_LOADING':
//       return { ...state, loading: action.value };
//     case 'SET_ACCOUNT_ADDRESS':
//       return { ...state, accountAddress: action.value };
//     case 'SET_DIALOG_VISIBLE':
//       return { ...state, dialogVisible: action.value };
//     case 'SET_MODAL_VISIBLE':
//       return { ...state, modalVisible: action.value };
//     default:
//       return state;
//   }
// };

// const initialState: State = {
//   nickname: '',
//   password: '',
//   passwordConfirmation: '',
//   checked: false,
//   accountAddress: '',
//   loading: false,
//   dialogVisible: false,
//   modalVisible: false,
// };

// export default function RegisterAccountScreen({ navigation, route }: RootStackScreenProps<'RegisterAccount'>) {
//   const [state, dispatch] = useReducer(reducer, initialState);
//   const { setShowMessage, setMessageInfo } = useContext(MessageContext);
//   const rnBiometrics = new ReactNativeBiometrics();
//   const { validateForm, isValidInput, setShowMessage: setShowMessageValidation, setMessageInfo: setMessageInfoValidation } = useFormValidation();

//   useEffect(() => {
//     getAccountAddress();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const getAccountAddress = async () => {
//     try {
//       const account = await LTOService.getAccount();
//       dispatch({ type: 'SET_ACCOUNT_ADDRESS', value: account.address });
//     } catch (error) {
//       console.error('Get Account Address Error:', error);
//       setShowMessage(true);
//       setMessageInfo('Error creating/importing your account!');
//       navigation.goBack();
//     }
//   };

//   const handleInputChange = (name: string, value: string) => {
//     if (isValidInput(value)) {
//       setMessageInfoValidation(`Invalid characters detected for ${name}!`);
//       setShowMessageValidation(true);
//       return;
//     }
//     dispatch({ type: 'SET_FIELD', field: name, value });
//   };

//   const handleAccount = async (requireBiometrics: boolean = false) => {
//     const validation = validateForm({
//       nickname: state.nickname,
//       password: state.password,
//       passwordConfirmation: state.passwordConfirmation,
//       checked: state.checked,
//     } as any); // Adjust if necessary

//     if (validation.err) {
//       setMessageInfo(validation.err);
//       setShowMessage(true);
//       return;
//     }

//     try {
//       dispatch({ type: 'SET_LOADING', value: true });

//       let signature;
//       if (requireBiometrics) {
//         signature = await addSignature();
//         if (!signature) {
//           dispatch({ type: 'SET_LOADING', value: false });
//           throw new Error('User cancelled biometrics request');
//         }
//       }

//       await LocalStorageService.storeData('@userAlias', { nickname: state.nickname });
//       await LTOService.storeAccount(state.nickname, state.password, signature);

//       const message = route.params.data === 'created' ? 'Account created successfully!' : 'Account imported successfully!';
//       setMessageInfo(message);
//       setShowMessage(true);

//       setTimeout(() => {
//         dispatch({ type: 'SET_LOADING', value: false });
//         navigation.navigate('Root');
//       }, 1000);
//     } catch (error) {
//       console.error('Handle Account Error:', error);
//       setMessageInfo(`Error storing account data. ${error.message}`);
//       setShowMessage(true);
//       dispatch({ type: 'SET_LOADING', value: false });
//     }
//   };

//   const handleBiometricAuthentication = async () => {
//     try {
//       // validate inputs
//       const validation = validateForm({
//         nickname: state.nickname,
//         password: state.password,
//         passwordConfirmation: state.passwordConfirmation,
//         checked: state.checked,
//       } as any);
//       if (validation.err) {
//         setMessageInfo(validation.err);
//         setShowMessage(true);
//         return;
//       }
//       const isSupported = (await rnBiometrics.isSensorAvailable()).available;
//       if (isSupported) {
//         dispatch({ type: 'SET_DIALOG_VISIBLE', value: true });
//       } else {
//         await handleAccount();
//       }
//     } catch (error) {
//       console.error('Biometric Authentication Error:', error);
//       setMessageInfo('Biometric authentication failed. Please try again.');
//       setShowMessage(true);
//     }
//   };

//   const subscribeBiometrics = async () => {
//     try {
//       await handleAccount(true);
//       dispatch({ type: 'SET_LOADING', value: true });
//     } catch (error) {
//       console.error('Subscribe Biometrics Error:', error);
//       setMessageInfo('Biometric authentication failed. Please try again or continue without it.');
//       setShowMessage(true);
//       dispatch({ type: 'SET_LOADING', value: false });
//       dispatch({ type: 'SET_DIALOG_VISIBLE', value: false });
//     }
//   };

//   const addSignature = async (): Promise<string | undefined> => {
//     const { keysExist } = await rnBiometrics.biometricKeysExist();

//     if (!keysExist) {
//       await rnBiometrics.createKeys();
//     }

//     const signatureResult = await rnBiometrics.createSignature({
//       promptMessage: 'Authenticate',
//       payload: 'payload',
//     });

//     if (!signatureResult.success) {
//       throw new Error(signatureResult.error);
//     }

//     return signatureResult.signature;
//   };

//   return (
//     <ScreenContainer>
//       <BackButton onPress={() => navigation.goBack()} />
//       {route.params.data === 'created' ? (
//         <Title title={REGISTER.CREATE_TITLE} subtitle={REGISTER.CREATE_SUBTITLE} />
//       ) : (
//         <Title title={REGISTER.IMPORT_TITLE} />
//       )}
//       <FormContainer>
//         <InputField label={REGISTER.INPUT_ADDRESS} value={state.accountAddress} disabled={true} />
//         <InputField
//           label={REGISTER.INPUT_NICKNAME.LABEL}
//           value={state.nickname}
//           placeholder={REGISTER.INPUT_NICKNAME.PLACEHOLDER}
//           onChangeText={(text: string) => handleInputChange('nickname', text)}
//           autoCapitalize='none'
//         />
//         <InputField
//           label={REGISTER.INPUT_PASSWORD.LABEL}
//           value={state.password}
//           onChangeText={(text: string) => handleInputChange('password', text)}
//           secureTextEntry={true}
//           placeholder={REGISTER.INPUT_PASSWORD.PLACEHOLDER}
//           autoCapitalize='none'
//         />
//         <InputField
//           label={REGISTER.INPUT_PASSWORD_REPEAT.LABEL}
//           value={state.passwordConfirmation}
//           onChangeText={(text: string) => handleInputChange('passwordConfirmation', text)}
//           secureTextEntry={true}
//           placeholder={REGISTER.INPUT_PASSWORD_REPEAT.PLACEHOLDER}
//           autoCapitalize='none'
//         />
//       </FormContainer>

//       <CheckBoxCard
//         label={REGISTER.CHECKBOX}
//         value={state.checked}
//         onChange={() => dispatch({ type: 'TOGGLE_CHECKED' })}
//         onPressText={() => dispatch({ type: 'SET_MODAL_VISIBLE', value: true })}
//       />

//       {route.params.data === 'created' ? (
//         <StyledButton
//           text={state.loading ? 'Please wait' : REGISTER.BUTTON_CREATE}
//           disabled={state.loading}
//           onPress={handleBiometricAuthentication}
//         />
//       ) : (
//         <StyledButton
//           text={state.loading ? 'Please wait' : REGISTER.BUTTON_IMPORT}
//           disabled={state.loading}
//           onPress={handleBiometricAuthentication}
//         />
//       )}

//       {/* Terms and Conditions Modal */}
//       <BottomModal
//         title={REGISTER.MODAL_TITLE}
//         body={TERMS_AND_CONDITIONS_CONTENT}
//         onSubmit={() => {
//           dispatch({ type: 'SET_MODAL_VISIBLE', value: false });
//           dispatch({ type: 'SET_FIELD', field: 'checked', value: 'true' }); // Alternatively, use a separate action
//           dispatch({ type: 'TOGGLE_CHECKED' }); // To ensure checkbox is checked
//         }}
//         type="terms"
//         submitButtonType="primary"
//         submitText="I agree"
//         onCancel={() => dispatch({ type: 'SET_MODAL_VISIBLE', value: false })}
//         visible={state.modalVisible}
//         hideCancelButton={true}
//       />

//       {/* Biometric Confirmation Modal */}
//       <BottomModal
//         title={REGISTER.DIALOG_TITLE}
//         body={[{ text: REGISTER.BIOMETRICS_CONFIRMATION }]}
//         onSubmit={subscribeBiometrics}
//         submitButtonType="primary"
//         submitText="Enable biometrics authentication"
//         cancelText="No, continue"
//         onCancel={() => {
//           handleAccount();
//           dispatch({ type: 'SET_DIALOG_VISIBLE', value: false });
//         }}
//         visible={state.dialogVisible}
//       />
//     </ScreenContainer>
//   );
// }

import React, { useContext, useEffect, useState } from 'react';
import { RootStackScreenProps } from '../../../types';
import { MessageContext } from '../../context/UserMessage.context';
import LocalStorageService from '../../services/LocalStorage.service';
import { REGISTER, TERMS_AND_CONDITIONS_CONTENT } from '../../constants/Text';
import LTOService from '../../services/LTO.service';
import ReactNativeBiometrics from 'react-native-biometrics';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Title } from '../../components/Title';
import { InputField } from '../../components/InputField';
import { BackButton } from '../../components/BackButton';
import { StyledButton } from '../../components/StyledButton';
import { FormContainer } from '../../components/styles/FormContainer.styles';
import { CheckBoxCard } from '../../components/CheckBoxCard';
import { BottomModal } from '../../components/BottomModal';
import DOMPurify from 'dompurify';

export default function RegisterAccountScreen({ navigation, route }: RootStackScreenProps<'RegisterAccount'>) {
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

  // const isStrongPassword = (password: string) => {
  //   const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  //   return regex.test(password);
  // };
  const isStrongPassword = (password: string): boolean => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
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
    </ScreenContainer>
  );
}
