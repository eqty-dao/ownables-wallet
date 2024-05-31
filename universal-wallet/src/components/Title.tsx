import React from 'react';
import {StyledSubtitle, StyledTitle, TitleContainer} from './styles/Title.styles';

export const Title = ({title, subtitle}: {title: string; subtitle?: string}) => {
  return (
    <TitleContainer>
      <StyledTitle>{title}</StyledTitle>
      {subtitle && <StyledSubtitle>{subtitle}</StyledSubtitle>}
    </TitleContainer>
  );
};
