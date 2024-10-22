import React from 'react';
import { Card } from './Card';
import { UserCardContainer, UserCardImageContainer, UserCardImageText } from './styles/UserCard.styles';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { View } from 'react-native';
import { Input } from 'react-native-elements';
export const UserCard = ({ nickname, address }: { nickname: string; address: string }) => {
  const defaultImageText = nickname.charAt(0).toUpperCase();

  return (
    <><UserCardContainer>
      <UserCardImageContainer>
        <UserCardImageText>{defaultImageText}</UserCardImageText>
      </UserCardImageContainer>
      <Card label={nickname} subLabel={''} type="secondary" flip={true} />

    </UserCardContainer>

    </>
  );
};
