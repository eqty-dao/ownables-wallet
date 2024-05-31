import styled from 'styled-components/native';

export const CheckBoxContainer = styled.View`
  flex-direction: row;
  gap: 8px;
  align-items: center;
`;

export const CheckContainer = styled.TouchableOpacity<{value: boolean}>`
  width: 16px;
  height: 16px;
  border-radius: 2px;
  justify-content: center;
  align-items: center;
  background-color: ${({value}) => (value ? '#510094' : 'transparent')};
  border: 1px solid ${({value}) => (value ? '#510094' : '#3A3A3C')};
`;

export const CheckBoxLabelContainer = styled.TouchableOpacity.attrs({
  activeOpacity: 1,
})``;

export const CheckBoxLabel = styled.Text`
  color: #fcfcf7;
  font-family: Inter;
  font-size: 12px;
`;
