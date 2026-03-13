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
      <Checkbox.Android onPress={() => props.onCheck()} color={'#615fff'} status={props.status} />
      <TouchableOpacity onPress={() => props.onPressText()}>
        <CheckBoxLabel>{REGISTER.CHECKBOX}</CheckBoxLabel>
      </TouchableOpacity>
    </CheckBoxContainer>
  );
}
