import { Platform } from 'react-native';
import styled from 'styled-components/native';

export const FieldContainer = styled.View`
  gap: 8px;
`;

export const InputContainer = styled.View<{
  multiline?: boolean;
  disabled?: boolean;
  error?: boolean;
}>`
  display: flex;
  flex-direction: row;
  padding: 16px;
  border-radius: 8px;
  background-color: ${({disabled}) => (disabled ? '#191919' : 'transparent')};
  align-items: ${({multiline}) => (multiline ? 'flex-start' : 'center')};
  border: 1px solid ${({error}) => (error ? '#7f1d1a' : '#3A3A3C')};
  height: ${({multiline}) => (multiline ? '110px' : '55px')};
`;

export const StyledLabel = styled.Text<{disabled?: boolean}>`
  font-family: Inter;
  font-size: 14px;
  font-weight: 400;
  color: ${({disabled}) => (disabled ? '#656565' : '#fcfcf7')};
`;

export const StyledInput = styled.TextInput.attrs({
  placeholderTextColor: '#909092',
  textAlignVertical: 'top',
})<{disabled?: boolean}>`
  flex: 1;
  color: ${({disabled}) => (disabled ? '#656565' : '#fcfcf7')};
  font-family: Inter;
  font-size: ${Platform.OS === 'ios' ? '12px' : '14px'};
  font-weight: 400;
`;

export const StyledSubLabel = styled.Text`
  color: #909092;
  font-family: Inter;
  font-size: 12px;
  font-weight: 400;
`;


export const StyledInputWithCopy = styled.TextInput.attrs({
  placeholderTextColor: '#909092',
  textAlignVertical: 'top',
})<{disabled?: boolean}>`
  flex: 1;
  color: ${({disabled}) => (disabled ? '#656565' : '#fcfcf7')};
  font-family: Inter;
  font-size: 16px;
  font-weight: 400;
`;