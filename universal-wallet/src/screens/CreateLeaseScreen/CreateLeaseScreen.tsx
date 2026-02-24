import React, { useContext } from 'react';
import { RootStackScreenProps } from '../../../types';
import { MessageContext } from '../../context/UserMessage.context';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButton } from '../../components/BackButton';
import { StyledTitle } from '../../components/styles/Title.styles';
import { StyledButton } from '../../components/StyledButton';
import { WALLET } from '../../constants/Text';

export default function CreateLeaseScreen({ navigation }: RootStackScreenProps<'CreateLease'>) {
  const { setShowMessage, setMessageInfo } = useContext(MessageContext);

  return (
    <ScreenContainer>
      <BackButton onPress={navigation.goBack} />
      <StyledTitle>{WALLET.LEASE}</StyledTitle>
      <StyledButton
        text="Leasing is unavailable"
        onPress={() => {
          setMessageInfo('Leasing is temporarily unavailable in this migration phase.');
          setShowMessage(true);
        }}
      />
    </ScreenContainer>
  );
}
