import React, {useContext, useEffect, useState} from 'react';
import {RootStackScreenProps} from '../../../types';
import OverviewHeader from '../../components/OverviewHeader';
import {StyledImage} from '../../components/styles/OverviewHeader.styles';
import {MessageContext} from '../../context/UserMessage.context';
import LocalStorageService from '../../services/LocalStorage.service';
import {logoTitle} from '../../utils/images';
import {navigateToExplorer, navigateToWebsite, navigateToWebWallet} from '../../utils/redirectSocialMedia';
import LTOService from '../../services/LTO.service';
import {MainScreenContainer} from '../../components/MainScreenContainer';
import {MainScreenMinorContainer, MainScreenSubContainer} from '../../components/styles/MainScreenContainer.styles';
import {StyledButton} from '../../components/StyledButton';
import {UserCard} from '../../components/UserCard';
import {SocialsCard} from '../../components/SocialsCard';
import {BackHandler, Platform} from 'react-native';

export default function MenuScreen({navigation}: RootStackScreenProps<'Menu'>) {
  const [accountAddress, setAccountAddress] = useState('');
  const [accountNickname, setAccountNickname] = useState('');
  const {setShowMessage, setMessageInfo} = useContext(MessageContext);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
        return true;
      });
      return () => backHandler.remove();
    }
  }, []);

  useEffect(() => {
    getAccountAddress();
    getNickname();
  }, []);

  const getNickname = () => {
    LocalStorageService.getData('@userAlias')
      .then(data => setAccountNickname(data.nickname))
      .catch(error => {
        throw new Error(`Error retrieving data. ${error}`);
      });
  };

  const getAccountAddress = () => {
    LTOService.getAccount()
      .then(account => setAccountAddress(account.address))
      .catch(error => {
        throw new Error(`Error retrieving data. ${error}`);
      });
  };

  const logOut = () => {
    LTOService.lock();

    navigation.reset({
      index: 0,
      routes: [{name: 'SignIn'}],
    });
  };

  return (
    <MainScreenContainer>
      <OverviewHeader
        icon={'xmark'}
        onPress={navigation.goBack}
        input={<StyledImage testID="logo-title" source={logoTitle} />}
        hideQR={true}
      />
      <MainScreenSubContainer>
        <UserCard nickname={accountNickname} address={accountAddress} />
        <MainScreenMinorContainer>
          <StyledButton
            text={'My Account'}
            onPress={() => navigation.navigate('Profile')}
            type="textOnly"
            textStyle={{fontWeight: '600'}}
          />
          <StyledButton
            text={'More info'}
            onPress={navigateToWebsite}
            type="textOnly"
            textStyle={{fontWeight: '600'}}
          />
          <StyledButton
            text={'LTO Explorer'}
            onPress={navigateToExplorer}
            type="textOnly"
            textStyle={{fontWeight: '600'}}
          />
          <StyledButton
            text={'LTO Web Wallet'}
            onPress={navigateToWebWallet}
            type="textOnly"
            textStyle={{fontWeight: '600'}}
          />
          <StyledButton
            text={'Log out'}
            onPress={logOut}
            type="textOnly"
            textStyle={{fontWeight: '600', color: '#9D8EE6'}}
          />
        </MainScreenMinorContainer>
        <SocialsCard />
      </MainScreenSubContainer>
    </MainScreenContainer>
  );
}
