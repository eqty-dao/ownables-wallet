import styled from 'styled-components/native';
import {Text, Title} from 'react-native-paper';

export const Container = styled.SafeAreaView<{flexEnd?: boolean; marginTop?: number}>`
  flex: 1;
  height: 100%;
  justify-content: space-around;
  ${props => props.flexEnd && 'justify-content: flex-end;'}
  ${props => props.marginTop && `margin-top: ${props.marginTop}px;`}
`;

export const ButtonContainer = styled.View<{marginBottom?: number}>`
  height: 250px;
  margin: 60px 40px 0px 40px;
  ${props => props.marginBottom && `margin-bottom: ${props.marginBottom}px;`}
  justify-content: flex-end;
  align-items: center;
`;

export const InputContainer = styled.View`
  margin: 25px 40px 0px 40px;
`;

export const StyledText = styled(Text)`
  margin-top: 40px;
  margin-bottom: 10px;
`;

export const StyledTitle = styled(Title)`
  font-family: Overpass-Regular;
  font-family: Arial;
  color: #fcfcf7;
`;
