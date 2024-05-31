import styled from 'styled-components/native';
import {Text} from 'react-native-paper';
import {BarCodeScanner} from 'expo-barcode-scanner';

export const ScannerContainer = styled.View`
  flex: 1;
  justify-content: flex-start;
  align-items: center;
`;

export const StyledScanner = styled(BarCodeScanner)`
  padding: 10px;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: absolute;
`;

export const StyledText = styled(Text)<{title?: any}>`
  margin-top: 5px;
  padding: 0px 15px 5px 15px;
  color: #ffffff;
  font-weight: 400;
  ${props =>
    props.title &&
    `
        text-transform: uppercase; 
        font-size: 20px; 
        font-family: Overpass-Regular;
        font-family: Arial;`}
`;

export const CenteredView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const TextContainer = styled.View`
  margin-top: 66px;
  background: rgba(25, 25, 25, 0.5);
  width: 100%;
`;
