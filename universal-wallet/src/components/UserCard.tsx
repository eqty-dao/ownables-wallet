import React from 'react';
import { Card } from './Card';
import { UserCardContainer, UserCardImageContainer, UserCardImageText } from './styles/UserCard.styles';
import PressToCopy from './PressToCopy';
import { NodeAddress } from '../screens/LeaseScreen/LeaseScreen.styles';
import { Text } from 'react-native-paper';

export const UserCard = ({ nickname, address }: { nickname: string; address: string }) => {
  const defaultImageText = nickname.charAt(0).toUpperCase();

  return (
    <UserCardContainer>
      <UserCardImageContainer>
        <UserCardImageText>{defaultImageText}</UserCardImageText>
      </UserCardImageContainer>
      <Card label={nickname} subLabel={''} type="secondary" flip={true} />
      {/** address with clipboard  */}
      <PressToCopy value={address}>
        <Text style={{ fontSize: 12, color: '#ffff' }}>{address}</Text>
      </PressToCopy>
    </UserCardContainer>
  );
};
