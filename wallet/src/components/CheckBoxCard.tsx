import React from 'react';
import { Check } from 'lucide-react-native';
import {CheckBoxContainer, CheckBoxLabel, CheckBoxLabelContainer, CheckContainer} from './styles/CheckBoxCard.styles';

const CheckBox = ({value, onPress}: {value: boolean; onPress: () => void}) => (
  <CheckContainer value={value} onPress={onPress}>
    {value && <Check color="#FFFFFF" size={16} strokeWidth={2.5} />}
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
