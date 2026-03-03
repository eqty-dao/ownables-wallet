import styled from 'styled-components/native';
import {Text, Title} from 'react-native-paper';

export const Container = styled.SafeAreaView<{flexEnd?: boolean; marginTop?: number}>`
  flex: 1;
  margin: 0px 40px 0px 30px;
  justify-content: space-around;
  ${props => props.flexEnd && 'justify-content: flex-end;'}
  ${props => props.marginTop && `margin-top: ${props.marginTop}px;`}
`;

export const StyledText = styled(Text)`
  margin-top: 40px;
`;
export const StyledTitle = styled(Title)`
  margin-bottom: 10px;
  font-family: Overpass-Regular;
  font-family: Arial;
  text-transform: uppercase;
`;
export const InputContainer = styled.View`
  margin-top: 20px;
`;

export const ButtonContainer = styled.View<{marginBottom?: number}>`
  height: 250px;
  margin: 0px 40px 0px 40px;
  ${props => props.marginBottom && `margin-bottom: ${props.marginBottom}px;`}
  justify-content: flex-end;
  align-items: center;
`;

export const StyledCreateTitle = styled.Text`
  color: #fcfcf7;
  font-family: Inter;
  font-size: 32px;
  font-weight: 600;
`;

export const StyledCreateSubtitle = styled.Text`
  color: #909092;
  font-family: Inter;
  font-weight: 500;
  width: 281px;
`;
