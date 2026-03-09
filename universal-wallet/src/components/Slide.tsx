import React from 'react';
import {Subtitle, TitleImg} from './styles/Slide.styles';
import {Container, TitleContainer, StyledImage} from './styles/Slide.styles';
import useColorScheme from '../hooks/useColorScheme';

export default function Slide({item}: any) {
  const isDark = useColorScheme() === 'dark';

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
