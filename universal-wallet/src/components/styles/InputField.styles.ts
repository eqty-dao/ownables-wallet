import { Platform } from 'react-native';
import styled from 'styled-components/native';

export const FieldContainer = styled.View`
  gap: 8px;
`;

export const InputContainer = styled.View<{
  multiline?: boolean;
  disabled?: boolean;
  error?: boolean;
  isDark: boolean;
}>`
  display: flex;
  flex-direction: row;
  padding: 16px;
  border-radius: 8px;
  background-color: ${({disabled, isDark}) => (disabled ? (isDark ? '#191919' : '#F1F2F5') : 'transparent')};
  align-items: ${({multiline}) => (multiline ? 'flex-start' : 'center')};
  border: 1px solid ${({error, isDark}) => (error ? '#7f1d1a' : isDark ? '#3A3A3C' : '#D9DADE')};
  height: ${({multiline}) => (multiline ? '110px' : '55px')};
`;

export const StyledLabel = styled.Text<{disabled?: boolean; isDark: boolean}>`
  font-family: Inter;
  font-size: 14px;
  font-weight: 400;
  color: ${({disabled, isDark}) => (disabled ? '#656565' : isDark ? '#fcfcf7' : '#212227')};
`;

export const StyledInput = styled.TextInput.attrs<{isDark: boolean}>(props => ({
  placeholderTextColor: props.isDark ? '#909092' : '#8A8B92',
  textAlignVertical: 'top',
}))<{disabled?: boolean; isDark: boolean}>`
  flex: 1;
  color: ${({disabled, isDark}) => (disabled ? '#656565' : isDark ? '#fcfcf7' : '#141414')};
  font-family: Inter;
  font-size: ${Platform.OS === 'ios' ? '12px' : '14px'};
  font-weight: 400;
`;

export const StyledSubLabel = styled.Text<{isDark: boolean}>`
  color: ${({isDark}) => (isDark ? '#909092' : '#6E6F78')};
  font-family: Inter;
  font-size: 12px;
  font-weight: 400;
`;


export const StyledInputWithCopy = styled.TextInput.attrs<{isDark: boolean}>(props => ({
  placeholderTextColor: props.isDark ? '#909092' : '#8A8B92',
  textAlignVertical: 'top',
}))<{disabled?: boolean; isDark: boolean}>`
  flex: 1;
  color: ${({disabled, isDark}) => (disabled ? '#656565' : isDark ? '#fcfcf7' : '#141414')};
  font-family: Inter;
  font-size: 16px;
  font-weight: 400;
`;
