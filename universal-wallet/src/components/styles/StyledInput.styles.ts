import styled from 'styled-components/native';
import {TextInput} from 'react-native-paper';

export const StyledInput = styled(TextInput)<{flexEnd?: boolean; marginTop?: number; marginBottom?: number}>`
  background-color: 'transparent';
  ${props => props.marginTop && `margin-top: ${props.marginTop}px;`}
  ${props => props.marginBottom && `margin-bottom: ${props.marginBottom}px;`}
`;
