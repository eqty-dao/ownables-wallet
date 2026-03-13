import React from 'react';
import {CheckBoxContainer, CheckBoxLabel, CheckBoxLabelContainer, CheckContainer} from './styles/CheckBoxCard.styles';
import Icon from './Icon';

const CheckBox = ({value, onPress}: {value: boolean; onPress: () => void}) => (
  <CheckContainer value={value} onPress={onPress}>
    {value && <Icon icon="check" color="#FFFFFF" />}
  </CheckContainer>
);

export const CheckBoxCard = ({
  label,
  value,
  onChange,
  onPressText,
}: {
  label: string;
  value: boolean;
  onChange: () => void;
  onPressText: () => void;
}) => (
  <CheckBoxContainer>
    <CheckBox value={value} onPress={onChange} />
    <CheckBoxLabelContainer onPress={onPressText}>
      <CheckBoxLabel>{label}</CheckBoxLabel>
    </CheckBoxLabelContainer>
  </CheckBoxContainer>
);
