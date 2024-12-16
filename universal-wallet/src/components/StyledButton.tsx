import React from 'react';
import {Text} from 'react-native';
import {ButtonText, ButtonContainer} from './styles/StyledButtons2.styles';

export const StyledButton = ({
  text,
  onPress,
  disabled,
  type = 'primary',
  textStyle,
  onLongPress,
}: {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  type?: 'primary' | 'secondary' | 'textOnly' | 'danger';
  textStyle?: Text['props']['style'];
  onLongPress?: () => void;
}) => (
  <ButtonContainer disabled={disabled} type={disabled ? 'disabled' : type} onPress={onPress} onLongPress={onLongPress}>
    <ButtonText style={textStyle} type={disabled ? 'disabled' : type}>
      {text}
    </ButtonText>
  </ButtonContainer>
);
