import React from 'react';
import {Text} from 'react-native';
import {ButtonText, ButtonContainer} from './styles/StyledButtons2.styles';

export const StyledButton = ({
  text,
  onPress,
  disabled,
  type = 'primary',
  textStyle,
}: {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  type?: 'primary' | 'secondary' | 'textOnly' | 'danger';
  textStyle?: Text['props']['style'];
}) => (
  <ButtonContainer disabled={disabled} type={disabled ? 'disabled' : type} onPress={onPress}>
    <ButtonText style={textStyle} type={disabled ? 'disabled' : type}>
      {text}
    </ButtonText>
  </ButtonContainer>
);
