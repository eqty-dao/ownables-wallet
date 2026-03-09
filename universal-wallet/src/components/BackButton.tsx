import React from 'react';
import Icon from './Icon';
import {BackButtonContainer} from './styles/BackButton.styles';
import useColorScheme from '../hooks/useColorScheme';

export const BackButton = ({onPress}: {onPress: () => void}) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <BackButtonContainer isDark={isDark} onPress={onPress}>
      <Icon icon="chevronLeft" color={isDark ? '#909092' : '#585A62'} />
    </BackButtonContainer>
  );
};
