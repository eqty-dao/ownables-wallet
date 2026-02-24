import React, { useEffect, useContext, useState } from 'react';
import { PROFILE } from '../../constants/Text';
import { MessageContext } from '../../context/UserMessage.context';
import LocalStorageService from '../../services/LocalStorage.service';
import LTOService from '../../services/LTO.service';
import { RootStackScreenProps } from '../../../types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { StyledTitle } from '../../components/styles/Title.styles';
import { BackButton } from '../../components/BackButton';
import { Card } from '../../components/Card';
import { StyledButton } from '../../components/StyledButton';
import { ExpandableText } from '../../components/ExpandableText';
import { ScreenSubView } from '../../components/styles/ScreenContainer.styles';
import { BottomModal } from '../../components/BottomModal';
import { InputModal } from '../../components/InputModal';
import { InputField } from '../../components/InputField';
import { useWindowDimensions, View } from 'react-native';
import Icon from '../../components/Icon';
import PressToCopy from '../../components/PressToCopy';
import { StyledInputWithCopy } from '../../components/styles/InputField.styles';
import { SeedPhraseInput } from '../../components/SeedPhraseInput/SeedPhraseInput';

export default function ProfileScreen({ navigation }: RootStackScreenProps<'Profile'>) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accountInformation, setAccountInformation] = useState(Object.create(null));
  const [isKeyBlur, setIsKeyBlur] = useState<boolean>(true);
  const [isSeedBlur, setIsSeedBlur] = useState<boolean>(true);
  const [accountNickname, setAccountNickname] = useState<string>('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const { address, publicKey, privateKey, mnemonic, seed } = accountInformation as any;
  const backupPhrase = mnemonic || seed || '';
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [showInputModal, setShowInputModal] = useState<boolean>(false);
  const [currentReveal, setCurrentReveal] = useState<'privateKey' | 'seed' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { width } = useWindowDimensions();

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
        routes: [{ name: 'SignUp' }],
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
  const handleShowPrivateKey = () => {
    setCurrentReveal('privateKey');
    setShowInputModal(true);
  };

  const handleShowSeedPhrase = () => {
    setCurrentReveal('seed');
    setShowInputModal(true);
  };

  const handlePasswordSubmit = (password: string) => {
    if (!password.trim()) {
      setErrorMessage('Password required');
      return;
    }

    LTOService.unlock(password)
      .then(() => {
        if (currentReveal === 'privateKey') {
          setShowPrivateKey(true);
        } else if (currentReveal === 'seed') {
          setShowSeedPhrase(true);
        }
        setShowInputModal(false);
      })
      .catch(() => {
        setErrorMessage('Incorrect password');
      });
  };

  return (
    <ScreenContainer>
      <ScreenSubView>
        <BackButton onPress={() => navigation.goBack()} />
        <StyledTitle>{PROFILE.TITLE}</StyledTitle>
        <Card label={accountNickname} subLabel={PROFILE.NICKNAME} type="secondary" />
        <PressToCopy value={address}>
          <Card
            label={address}
            subLabel={PROFILE.WALLET + ' (hold to copy)'}
            type="secondary"
          />
        </PressToCopy>
        <PressToCopy value={publicKey}>
          <Card
            label={publicKey}
            subLabel={PROFILE.PUBLIC_KEY + ' (hold to copy)'}
            type="secondary"
          />
        </PressToCopy>
        <ExpandableText
          text="Show private key"
          content={
            showPrivateKey ? (
              <Card label={privateKey} subLabel={PROFILE.PRIVATE_KEY} type="secondary" />
            ) : (
              <StyledButton text="Show Private Key" onPress={handleShowPrivateKey} type="primary" />
            )
          }
        />

        <ExpandableText
          text="Show backup phrase"
          content={
            showSeedPhrase ? (
              <SeedPhraseInput
                words={backupPhrase.split(' ')}
                onWordChange={() => { }}
                showCopyButton={true}
                onPaste={() => { }}
                showPasteButton={false}
              />
            ) : (
              <StyledButton text="Show Seed Phrase" onPress={handleShowSeedPhrase} type="primary" />
            )
          }
        />
      </ScreenSubView>

      {/* InputModal for prompting password */}
      <InputModal
        visible={showInputModal}
        onSubmit={handlePasswordSubmit}
        onCancel={() => setShowInputModal(false)}
        title="Enter Password"
        placeholder="Please enter your password to reveal"
        inputType="password"
        body={[]}
        submitText="Submit"
        submitButtonType="primary"
        onInputChange={() => { }}
      />

      <StyledButton text={PROFILE.DELETE_ACCOUNT} onPress={() => setShowConfirmDelete(true)} type="danger" />

      <BottomModal
        title={PROFILE.DELETE_ACCOUNT_LABEL}
        body={[{ text: PROFILE.DELETE_ACCOUNT_MESSAGE }, { text: PROFILE.DELETE_ACCOUNT_MESSAGE_2 }]}
        onSubmit={deleteAccount}
        submitButtonType="danger"
        submitText="Remove Account"
        onCancel={() => setShowConfirmDelete(false)}
        visible={showConfirmDelete}
      />
    </ScreenContainer>
  );
}
