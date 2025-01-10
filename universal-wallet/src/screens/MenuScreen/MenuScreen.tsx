import React, { useContext, useEffect, useState } from 'react';
import { RootStackScreenProps } from '../../../types';
import OverviewHeader from '../../components/OverviewHeader';
import { StyledImage } from '../../components/styles/OverviewHeader.styles';
import { MessageContext } from '../../context/UserMessage.context';
import LocalStorageService from '../../services/LocalStorage.service';
import { logoTitle } from '../../utils/images';
import { navigateToExplorer, navigateToWebsite, navigateToWebWallet } from '../../utils/redirectSocialMedia';
import LTOService from '../../services/LTO.service';
import { MainScreenContainer } from '../../components/MainScreenContainer';
import { MainScreenMinorContainer, MainScreenSubContainer } from '../../components/styles/MainScreenContainer.styles';
import { StyledButton } from '../../components/StyledButton';
import { UserCard } from '../../components/UserCard';
import { SocialsCard } from '../../components/SocialsCard';
import { BackHandler, Modal, Platform, useWindowDimensions, View } from 'react-native';
import { Input } from 'react-native-elements';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import PressToCopy from '../../components/PressToCopy';
import { useClipboard } from '@react-native-clipboard/clipboard';
import DeviceInfo from 'react-native-device-info';
import { encryptData, decryptData } from '../../hooks/useStaticServer';
import valid_decoded_values from '../AirdropTabScreen/valid_decoded_values.json';
import { AirdropResponse } from '../../services/LTO.service';
import { Card } from '../../components/Card';
import { StyledLabel } from '../../components/styles/InputField.styles';
import { BottomModal } from '../../components/BottomModal';
export default function MenuScreen({ navigation }: RootStackScreenProps<'Menu'>) {
  const [accountAddress, setAccountAddress] = useState('');
  const [installationId, setInstallationId] = useState('');
  const [accountNickname, setAccountNickname] = useState('');
  const { setShowMessage, setMessageInfo } = useContext(MessageContext);
  const [data, setString] = useClipboard();
  const { width } = useWindowDimensions();
  const isEmulator = DeviceInfo.isEmulatorSync();
  const [validatInstallId, setValidatInstallId] = useState(false);
  const [hasNotClaimed, setHasNotClaimed] = useState(false);
  const [airdropModalVisible, setAirdropModalVisible] = useState(false);
  const [airdropModalMessage, setAirdropModalMessage] = useState('');
  const [airdropModalCode, setAirdropModalCode] = useState('');


  useEffect(() => {
    const getInitialData = async () => {
      // get the device id
      const id = (await DeviceInfo.getUniqueId()) + "-652"
      // hash the id to make it more secure
      const encryptedId = encryptData(id);
      // const decryptedId = decryptData(encryptedId);
      // console.log(encryptedId);
      // console.log(decryptedId);
      setInstallationId(encryptedId.toString());
      setValidatInstallId(valid_decoded_values.includes(id));
    }
    getInitialData().catch(error => {
      console.log(error);
    });
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

  const validateAirdrop = async () => {
    try {
      const _installationId = installationId + "-652" + (isEmulator ? "1" : "0");
      const response = await LTOService.validateAirdrop(
        _installationId,
        accountAddress
      ) as AirdropResponse;
      // snackbar
      if (response.success) {
        if (response.code) {
          setAirdropModalCode(response.code);
        }
        setAirdropModalMessage("Thank you. Your Airdrop claim has been validated");
        setAirdropModalVisible(true);
      } else {
        setAirdropModalCode('');
        setAirdropModalMessage('Something went wrong, please try again later');
        setAirdropModalVisible(true);
      }


    } catch (error) {
      console.log(error);
      setShowMessage(true);
      setMessageInfo('Airdrop claim failed');
      setHasNotClaimed(false);
    }
  }

  const checkClaimStatus = async () => {
    const status = await LTOService.checkIfAlreadyClaimed(accountAddress);
    setHasNotClaimed(status);
  };

  useEffect(() => {
    if (accountAddress) {
      checkClaimStatus();
    }
  }, [accountAddress]);

  const logOut = () => {
    LTOService.lock();

    navigation.reset({
      index: 0,
      routes: [{ name: 'SignIn' }],
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
        <View style={{ flexDirection: 'row', width: '95%' }}>
          <Input
            placeholder="Address"
            value={accountAddress}
            editable={false}
            inputContainerStyle={{ borderBottomWidth: 0 }}
            inputStyle={{ color: '#ffff', fontSize: width * 0.035 }}
            style={{
              width: '110%',
              backgroundColor: '#656565',
              borderRadius: 10,
              paddingLeft: 10,
              marginBottom: 10
            }}
            label="Your Wallet Address"
            labelStyle={{ color: '#ffff', fontSize: width * 0.035 }}
          />
          <FontAwesome6
            name="copy"
            onPress={() => {
              setString(accountAddress);
              setShowMessage(true);
              setMessageInfo('Copied to clipboard!');
            }}
            size={24}
            color="#909092"
            style={{ position: 'absolute', right: -20, top: 25 }}
          />
        </View>
        <View style={{ flexDirection: 'row', width: '95%' }}>
          <Input
            placeholder="Installation ID"
            value={installationId}
            editable={false}
            inputContainerStyle={{ borderBottomWidth: 0 }}
            inputStyle={{ color: '#ffff', fontSize: width * 0.035 }}
            style={{
              width: '110%',
              backgroundColor: '#656565',
              borderRadius: 10,
              paddingLeft: 10,
              marginBottom: 10
            }}
            label="Your Installation ID"
            labelStyle={{ color: '#ffff', fontSize: width * 0.035 }}
          />
          <FontAwesome6
            name="copy"
            onPress={() => {
              setString(installationId);
              setShowMessage(true);
              setMessageInfo('Copied to clipboard!');
            }}
            size={24}
            color="#909092"
            style={{ position: 'absolute', right: -20, top: 25 }}
          />
        </View>
        {
          !isEmulator && validatInstallId && !hasNotClaimed && (
            <><StyledButton
              text={'Validate Airdrop'}
              onPress={validateAirdrop}
              type="secondary"
              textStyle={{ fontWeight: '600' }} />
              <BottomModal
                title={airdropModalMessage}
                body={[{ text: airdropModalCode ? `Your Airdrop Code is: ${airdropModalCode}` : '' }]}
                onSubmit={() => {
                  setAirdropModalVisible(false);
                }}
                submitButtonType="secondary"
                submitText="Close"
                onCancel={() => setAirdropModalVisible(false)}
                visible={airdropModalVisible}
                cancelText=''
                hideCancelButton={true}
              />
            </>
          )
        }
        <MainScreenMinorContainer>
          <StyledButton
            text={'My Account'}
            onPress={() => navigation.navigate('Profile')}
            type="textOnly"
            textStyle={{ fontWeight: '600' }}
          />
          <StyledButton
            text={'More Info'}
            onPress={navigateToWebsite}
            type="textOnly"
            textStyle={{ fontWeight: '600' }}
          />
          <StyledButton
            text={'LTO Explorer'}
            onPress={navigateToExplorer}
            type="textOnly"
            textStyle={{ fontWeight: '600' }}
          />
          <StyledButton
            text={'LTO Web Wallet'}
            onPress={navigateToWebWallet}
            type="textOnly"
            textStyle={{ fontWeight: '600' }}
          />
          <StyledButton
            text={'Log out'}
            onPress={logOut}
            type="textOnly"
            textStyle={{ fontWeight: '600', color: '#9D8EE6' }}
          />
        </MainScreenMinorContainer>
        <SocialsCard />
      </MainScreenSubContainer>
    </MainScreenContainer>
  );
}
