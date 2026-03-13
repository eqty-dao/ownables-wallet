import React, {useState} from 'react';
import {StyledSubLabel, StyledInput, StyledLabel, InputContainer, FieldContainer} from './styles/InputField.styles';
import {TouchableIcon} from './TouchableIcon';
import useEffectiveColorScheme from '../hooks/useEffectiveColorScheme';

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
  autoCapitalize
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
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) => {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const isDark = useEffectiveColorScheme() === 'dark';

  return (
    <FieldContainer>
      <StyledLabel disabled={disabled} isDark={isDark}>
        {label}
      </StyledLabel>
      <InputContainer disabled={disabled} error={value !== '' && error} multiline={multiline} isDark={isDark}>
        <StyledInput
          value={value}
          editable={!disabled}
          disabled={disabled}
          isDark={isDark}
          onChangeText={text => onChangeText(numeric ? text.replace(/[^0-9\.]/g, '') : text)}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !passwordVisible}
          autoCapitalize={autoCapitalize}
        />
        {secureTextEntry && (
          <TouchableIcon
            icon={passwordVisible ? 'eye' : 'eyeCross'}
            color={isDark ? '#FCFCF7' : '#212227'}
            size={24}
            onPress={() => setPasswordVisible(!passwordVisible)}
          />
        )}
      </InputContainer>
      {subLabel && <StyledSubLabel isDark={isDark}>{subLabel}</StyledSubLabel>}
    </FieldContainer>
  );
};
