import React from 'react';
import {Subtitle, TitleImg} from './styles/Slide.styles';
import {Container, TitleContainer, StyledImage} from './styles/Slide.styles';

export default function Slide({item}: any) {
  return (
    <Container>
      <TitleContainer>
        <TitleImg testID="titleImg" source={item?.titleImg} />
        <Subtitle testID="subtitle">{item?.subtitle}</Subtitle>
      </TitleContainer>
      <StyledImage testID="image" source={item?.image} />
    </Container>
  );
}
