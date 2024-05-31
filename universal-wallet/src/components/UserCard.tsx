import React from 'react';
import {Card} from './Card';
import {UserCardContainer, UserCardImageContainer, UserCardImageText} from './styles/UserCard.styles';

export const UserCard = ({nickname, address}: {nickname: string; address: string}) => {
  const defaultImageText = nickname.charAt(0).toUpperCase();

  return (
    <UserCardContainer>
      <UserCardImageContainer>
        <UserCardImageText>{defaultImageText}</UserCardImageText>
      </UserCardImageContainer>
      <Card label={nickname} subLabel={address} type="secondary" flip={true} />
    </UserCardContainer>
  );
};
