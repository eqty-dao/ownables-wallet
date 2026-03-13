import React from 'react';
import {TouchableOpacity} from 'react-native';
import Icon from './Icon';

export const TouchableIcon = ({
  onPress,
  icon,
  color,
  size,
}: {
  onPress: () => void;
  icon: string;
  color?: string;
  size?: number;
}) => (
  <TouchableOpacity onPress={onPress}>
    <Icon icon={icon} color={color} size={size} />
  </TouchableOpacity>
);
