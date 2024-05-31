import styled from 'styled-components/native';

const buttonBackgrounds = {
  primary: '#510094',
  secondary: 'transparent',
  danger: 'transparent',
  textOnly: 'transparent',
  disabled: '#212227',
};

const buttonColors = {
  primary: '#FCFCF7',
  secondary: '#9D8EE6',
  danger: '#FF3B30',
  textOnly: '#FCFCF7',
  disabled: '#909092',
};

const buttonBorders = {
  primary: '#510094',
  secondary: '#9D8EE6',
  danger: '#FF3B30',
  textOnly: 'transparent',
  disabled: '#212227',
};

export const ButtonContainer = styled.TouchableOpacity<{
  type: 'primary' | 'secondary' | 'danger' | 'textOnly' | 'disabled';
}>`
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({type}) => buttonBorders[type]};
  background-color: ${({type}) => buttonBackgrounds[type]};
  display: flex;
  height: 48px;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

export const ButtonText = styled.Text<{
  type: 'primary' | 'secondary' | 'danger' | 'textOnly' | 'disabled';
}>`
  font-family: Inter;
  font-size: 16px;
  color: ${({type}) => buttonColors[type]};
`;
