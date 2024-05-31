import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types';
import ReactNativeBiometrics from 'react-native-biometrics';
import LTOService from '../services/LTO.service';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LockedScreen' | 'SignIn'>;
  goBack?: boolean;
}

export const authenticateWithBiometrics = async ({navigation, goBack}: Props): Promise<void> => {
  const rnBiometrics = new ReactNativeBiometrics();

  const isEnrolled = (await rnBiometrics.biometricKeysExist()).keysExist;

  if (!isEnrolled) {
    return;
  }

  try {
    const resultObject = await rnBiometrics.createSignature({
      promptMessage: 'Authenticate',
      payload: 'payload',
    });

    const {success, signature} = resultObject;

    if (!success) return;

    if (success && signature) {
      await LTOService.unlock(undefined, signature);
      setTimeout(() => {
        goBack ? navigation.goBack() : navigation.navigate('Root');
      }, 1000);
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    throw new Error(`Error during biometric authentication: ${error}`);
  }
};
