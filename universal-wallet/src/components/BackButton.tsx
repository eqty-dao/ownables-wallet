import React from 'react';
import Icon from './Icon';
import {BackButtonContainer} from './styles/BackButton.styles';

export const BackButton = ({onPress}: {onPress: () => void}) => (
  <BackButtonContainer onPress={onPress}>
    <Icon icon="chevronLeft" color="#909092" />
  </BackButtonContainer>
);
