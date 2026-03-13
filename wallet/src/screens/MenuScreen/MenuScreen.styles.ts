import {Dimensions} from 'react-native';
import {Card, Paragraph} from 'react-native-paper';
import styled from 'styled-components/native';

export const Container = styled.SafeAreaView`
  background-color: #ffffff;
  margin-top: 30px;
`;

export const InfoContainer = styled.View`
  flex-direction: column;
  margin-left: 16px;
  margin-right: 5px;
  margin-bottom: 25px;
`;

export const ButtonContainer = styled.View`
  align-items: center;
  width: ${Dimensions.get('window').width * 1}px;
  height: auto;
  margin-bottom: 25px;
`;

export const MainCard = styled(Card)`
  width: 100%;
  height: auto;
  margin-left: 0px;
  background-color: transparent;
  box-shadow: 0px 0px 0px #ffffff;
`;

export const Field = styled(Paragraph)`
  color: #cccccc;
`;

export const StyledNickname = styled(Paragraph)`
  font-size: 15px;
  font-weight: bold;
  margin-top: 5px;
  color: #0092aa;
`;

export const Content = styled(Paragraph)`
  font-size: 15px;
  color: #565656;
  width: 100%;
`;
