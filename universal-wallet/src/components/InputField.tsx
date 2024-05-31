import React, {useState} from 'react';
import {StyledSubLabel, StyledInput, StyledLabel, InputContainer, FieldContainer} from './styles/InputField.styles';
import {TouchableIcon} from './TouchableIcon';

export const InputField = ({
  label,
  value,
  onChangeText,
  error,
  subLabel,
  placeholder,
  multiline,
  numeric,
  secureTextEntry,
  disabled,
}: {
  label: string;
  value: string;
  onChangeText?: any;
  error?: boolean;
  subLabel?: string;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
  secureTextEntry?: boolean;
  disabled?: boolean;
}) => {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

  return (
    <FieldContainer>
      <StyledLabel disabled={disabled}>{label}</StyledLabel>
      <InputContainer disabled={disabled} error={value !== '' && error} multiline={multiline}>
        <StyledInput
          value={value}
          editable={!disabled}
          disabled={disabled}
          onChangeText={text => onChangeText(numeric ? text.replace(/[^0-9\.]/g, '') : text)}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !passwordVisible}
        />
        {secureTextEntry && (
          <TouchableIcon
            icon={passwordVisible ? 'eye' : 'eyeCross'}
            color="#FCFCF7"
            size={24}
            onPress={() => setPasswordVisible(!passwordVisible)}
          />
        )}
      </InputContainer>
      {subLabel && <StyledSubLabel>{subLabel}</StyledSubLabel>}
    </FieldContainer>
  );
};
