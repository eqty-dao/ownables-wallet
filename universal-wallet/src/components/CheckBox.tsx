import React from 'react';
import {TouchableOpacity} from 'react-native';
import {Checkbox} from 'react-native-paper';
import {REGISTER} from '../constants/Text';
import {CheckBoxContainer, CheckBoxLabel} from './styles/CheckBox.styles';

export default function CheckBox(props: {
  onCheck: () => void;
  onPressText: () => void;
  status: 'checked' | 'unchecked' | 'indeterminate';
}): JSX.Element {
  return (
    <CheckBoxContainer>
      <Checkbox.Android onPress={() => props.onCheck()} color={'#A017B7'} status={props.status} />
      <TouchableOpacity onPress={() => props.onPressText()}>
        <CheckBoxLabel>{REGISTER.CHECKBOX}</CheckBoxLabel>
      </TouchableOpacity>
    </CheckBoxContainer>
  );
}
