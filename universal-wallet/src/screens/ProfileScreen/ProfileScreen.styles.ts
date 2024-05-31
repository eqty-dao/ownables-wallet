import styled from 'styled-components/native';
import {Card, Paragraph, Title} from 'react-native-paper';

export const CardsContainer = styled.SafeAreaView`
  margin-top: 5px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: auto;
  height: auto;
`;

export const StyledTitle = styled(Title)`
  font-weight: bold;
  margin-bottom: 20px;
`;

export const MainCard = styled(Card)<{justifyContent?: string; alignItems?: string}>`
  shadow-color: #e1f9fc;
  shadow-offset: 5px 9px;
  shadow-opacity: 0.5;
  box-shadow: 10px 5px 5px #e1f9fc;
  shadow-radius: 10px;
  border-radius: 20px;
  elevation: 5;
  width: 350px;
  height: auto;
  ${props => props.justifyContent && `justify-content: ${props.justifyContent}`}
  ${props => props.alignItems && `align-items: ${props.alignItems}`}
`;

export const Field = styled(Paragraph)`
  color: #cccccc;
`;

export const Content = styled(Paragraph)`
  font-size: 15px;
  margin-bottom: 15px;
`;
export const HiddenTitle = styled(Title)`
  color: #9e1eb6;
  text-align: center;
  width: 200px;
`;
