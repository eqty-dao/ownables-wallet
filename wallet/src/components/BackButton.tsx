import React from 'react';
import { ChevronLeft } from 'lucide-react-native';
import {BackButtonContainer} from './styles/BackButton.styles';
import useEffectiveColorScheme from '../hooks/useEffectiveColorScheme';

export const BackButton = ({onPress}: {onPress: () => void}) => {
  const isDark = useEffectiveColorScheme() === 'dark';

  return (
    <BackButtonContainer isDark={isDark} onPress={onPress}>
      <ChevronLeft color={isDark ? '#909092' : '#585A62'} size={18} strokeWidth={2.25} />
    </BackButtonContainer>
  );
};
