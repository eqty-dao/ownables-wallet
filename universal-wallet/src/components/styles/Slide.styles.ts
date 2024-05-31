import styled from 'styled-components/native';
import {Dimensions} from 'react-native';

export const Subtitle = styled.Text`
  color: #303030;
  font-size: 16px;
  margin-top: 35px;
  margin-left: -12px;
  text-align: justify;
  width: 340px;
`;
export const TitleImg = styled.Image`
  resize-mode: contain;
  align-self: flex-start;
  margin-left: 60px;
  height: 205px;
  width: 205px;
  margin-bottom: -90px;
  margin-top: -90px;
`;

export const Container = styled.View`
  align-items: center;
  width: ${Dimensions.get('window').width}px;
  height: ${Dimensions.get('window').height * 0.85}px;
`;

export const TitleContainer = styled.View`
  width: 470px;
  align-items: center;
`;

export const StyledImage = styled.Image`
  height: 50%;
  width: 80%;
  resize-mode: contain;
`;
