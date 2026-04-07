import React, {useState} from 'react';
import { TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import {StyledSubLabel, StyledInput, StyledLabel, InputContainer, FieldContainer} from './styles/InputField.styles';
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
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            {passwordVisible ? (
              <Eye color={isDark ? '#FCFCF7' : '#212227'} size={22} strokeWidth={2.25} />
            ) : (
              <EyeOff color={isDark ? '#FCFCF7' : '#212227'} size={22} strokeWidth={2.25} />
            )}
          </TouchableOpacity>
        )}
      </InputContainer>
      {subLabel && <StyledSubLabel isDark={isDark}>{subLabel}</StyledSubLabel>}
    </FieldContainer>
  );
};
