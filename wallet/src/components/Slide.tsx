import React from 'react';
import {Subtitle, TitleImg} from './styles/Slide.styles';
import {Container, TitleContainer, StyledImage} from './styles/Slide.styles';
import useEffectiveColorScheme from '../hooks/useEffectiveColorScheme';

export default function Slide({item}: any) {
  const isDark = useEffectiveColorScheme() === 'dark';

  return (
    <Container>
      <TitleContainer>
        <TitleImg testID="titleImg" source={item?.titleImg} />
        <Subtitle isDark={isDark} testID="subtitle">
          {item?.subtitle}
        </Subtitle>
      </TitleContainer>
      <StyledImage testID="image" source={item?.image} />
    </Container>
  );
}
