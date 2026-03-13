import {Dimensions, Platform} from 'react-native';
import {Title} from 'react-native-paper';
import styled from 'styled-components/native';

export const Container = styled.SafeAreaView`
  margin-top: 0px;
`;

export const StyledView = styled.View`
  gap: 32px;
  height: 100%;
  align-items: center;
  justify-content: center;
  margin-left: ${Dimensions.get('window').width * 0.12}px;
  margin-right: ${Dimensions.get('window').width * 0.12}px;
`;

export const TitleContainer = styled.View`
  gap: 16px;
  align-items: center;
`;

export const StyledTitle = styled.Text`
    font-size: ${Platform.OS === 'android' ? '17px' : '15px'}
    font-weight: bold;
    color: #FCFCF7;
    margin-top: 5px;
`;

export const StyledText = styled.Text`
    color: #909092;
    font-size: ${Platform.OS === 'android' ? '14px' : '13px'}
    margin-top: 5px;
`;

export const MainTitle = styled(Title)`
  font-family: Overpass-Regular;
  font-family: Arial;
  text-transform: uppercase;
  font-size: 22px;
  margin-top: 9px;
  margin-left: ${Dimensions.get('window').width * 0.12}px;
`;

export const StyledIcon = styled.Image`
  resize-mode: contain;
  width: 21px;
  height: 21px;
  margin-top: 12px;
`;

export const IconContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: 32px;
`;
