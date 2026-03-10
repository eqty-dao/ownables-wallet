import React from 'react';
import {StyledSubtitle, StyledTitle, TitleContainer} from './styles/Title.styles';
import useEffectiveColorScheme from '../hooks/useEffectiveColorScheme';

export const Title = ({title, subtitle}: {title: string; subtitle?: string}) => {
  const isDark = useEffectiveColorScheme() === 'dark';

  return (
    <TitleContainer>
      <StyledTitle isDark={isDark}>{title}</StyledTitle>
      {subtitle && <StyledSubtitle isDark={isDark}>{subtitle}</StyledSubtitle>}
    </TitleContainer>
  );
};
