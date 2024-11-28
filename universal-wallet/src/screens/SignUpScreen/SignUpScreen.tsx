import React, { useContext } from 'react';
import { RootStackScreenProps } from '../../../types';
import { SIGNUP } from '../../constants/Text';
import LTOService from '../../services/LTO.service';
import { Title } from '../../components/Title';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Separator } from '../../components/styles/Separator.styles';
import { StyledButton } from '../../components/StyledButton';
import { FormContainer } from '../../components/styles/FormContainer.styles';
import NetworkSelector from '../../components/NetworkSelector';
import { Text } from 'react-native';
import { ENABLE_NETWORK_SWITCH } from '@env';

export default function SignUpScreen({ navigation }: RootStackScreenProps<'SignUp'>) {
  const [showNetworkSelector, setShowNetworkSelector] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');


  const handleCreateAccount = async () => {
    try {
      const account = await LTOService.createAccount();
      if (account) {
        navigation.navigate('RegisterAccount', { data: 'created' })
      } else {
        setErrorMessage('Error creating account, please try again');
      }
    } catch (error) {
      console.error('Error creating account', error);
      setErrorMessage('Error creating account, please try again');
    }

  };
  const handleLongPress = () => {
    if (ENABLE_NETWORK_SWITCH !== 'true') {
      return;
    }
    setShowNetworkSelector(true);
  }
  return (
    <ScreenContainer>
      <Separator />
      <Title title={SIGNUP.TITLE} subtitle={SIGNUP.SUBTITLE} />
      <FormContainer>
        <StyledButton onPress={handleCreateAccount} text={SIGNUP.BUTTON_CREATE} onLongPress={handleLongPress} />
        <StyledButton onPress={() => navigation.navigate('ImportSeed')} text={SIGNUP.BUTTON_IMPORT} type="secondary" onLongPress={handleLongPress} />
      </FormContainer>
      <NetworkSelector showNetworkSelector={showNetworkSelector} setShowNetworkSelector={setShowNetworkSelector} />
      {
        errorMessage ? <Text
          style={{
            color: 'red',
            textAlign: 'center',
            marginTop: 10,
          }}
        >
          {errorMessage}
        </Text> : null
      }
    </ScreenContainer>
  );
}
