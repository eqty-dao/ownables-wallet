import styled from 'styled-components/native';
import {Text, Title} from 'react-native-paper';

export const Container = styled.SafeAreaView`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ButtonContainer = styled.View<{marginBottom?: number}>`
  margin: 250px 40px 0px 40px;
  ${props => props.marginBottom && `margin-bottom: ${props.marginBottom}px;`}
  justify-content: flex-end;
  align-items: center;
`;

export const InputContainer = styled.View`
  margin-top: 50px;
  width: 70%;
`;

export const StyledText = styled(Text)`
  margin-top: 40px;
  margin-bottom: 10px;
  width: 90%;
  text-align: center;
`;

export const StyledTitle = styled(Title)`
  font-family: Overpass-Regular;
  font-family: Arial;
  text-transform: uppercase;
  margin-top: 10%;
`;
