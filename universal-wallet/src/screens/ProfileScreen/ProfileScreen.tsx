import React, {useEffect, useState} from 'react';
import {PROFILE} from '../../constants/Text';
import LocalStorageService from '../../services/LocalStorage.service';
import LTOService from '../../services/LTO.service';
import {RootStackScreenProps} from '../../../types';
import {ScreenContainer} from '../../components/ScreenContainer';
import {StyledTitle} from '../../components/styles/Title.styles';
import {BackButton} from '../../components/BackButton';
import {Card} from '../../components/Card';
import {StyledButton} from '../../components/StyledButton';
import {ExpandableText} from '../../components/ExpandableText';
import {ScreenSubView} from '../../components/styles/ScreenContainer.styles';
import {BottomModal} from '../../components/BottomModal';

export default function ProfileScreen({navigation}: RootStackScreenProps<'Profile'>) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accountInformation, setAccountInformation] = useState(Object.create(null));
  const [isKeyBlur, setIsKeyBlur] = useState<boolean>(true);
  const [isSeedBlur, setIsSeedBlur] = useState<boolean>(true);
  const [accountNickname, setAccountNickname] = useState<string>('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const {address, publicKey, privateKey, seed} = accountInformation;
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);

  useEffect(() => {
    readStorage();
    getNickname();
  }, []);

  useEffect(() => {
    if (isKeyBlur) {
      setIsKeyBlur(false);
    }
    if (isSeedBlur) {
      setIsSeedBlur(false);
    }
  }, []);

  const deleteAccount = () => {
    setShowConfirmDelete(false);
    LTOService.deleteAccount().then(() => {
      navigation.reset({
        index: 0,
        routes: [{name: 'SignUp'}],
      });
    });
  };

  const readStorage = () => {
    LTOService.getAccount()
      .then(account => {
        setAccountInformation(account);
        setIsLoading(false);
      })
      .catch(error => {
        throw new Error(`Error retrieving data. ${error}`);
      });
  };

  const getNickname = () => {
    LocalStorageService.getData('@userAlias')
      .then(data => setAccountNickname(data.nickname))
      .catch(error => {
        throw new Error(`Error retrieving data. ${error}`);
      });
  };

  return (
    <ScreenContainer>
      <ScreenSubView>
        <BackButton onPress={() => navigation.goBack()} />
        <StyledTitle>{PROFILE.TITLE}</StyledTitle>
        <Card label={accountNickname} subLabel={PROFILE.NICKNAME} type="secondary" />
        <Card label={address} subLabel={PROFILE.WALLET} type="secondary" />
        <Card label={publicKey} subLabel={PROFILE.PUBLIC_KEY} type="secondary" />
        <ExpandableText
          text="Show private key"
          content={
            showPrivateKey ? (
              <Card label={privateKey} subLabel={PROFILE.PRIVATE_KEY} type="secondary" />
            ) : (
              <StyledButton text="Show Private Key" onPress={() => setShowPrivateKey(true)} type="primary" />
            )
          }
        />
        <ExpandableText
          text="Show backup phrase"
          content={<Card label={seed} subLabel={PROFILE.PHRASE} type="secondary" />}
        />
      </ScreenSubView>

      <StyledButton text={PROFILE.DELETE_ACCOUNT} onPress={() => setShowConfirmDelete(true)} type="danger" />
      <BottomModal
        title={PROFILE.DELETE_ACCOUNT_LABEL}
        body={[{text: PROFILE.DELETE_ACCOUNT_MESSAGE}, {text: PROFILE.DELETE_ACCOUNT_MESSAGE_2}]}
        onSubmit={deleteAccount}
        submitButtonType="danger"
        submitText="Delete Account"
        onCancel={() => setShowConfirmDelete(false)}
        visible={showConfirmDelete}
      />
    </ScreenContainer>
  );
}
