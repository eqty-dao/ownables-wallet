import React from 'react';
import styled from 'styled-components/native';

type IconRecord = Record<string, string>;
const icons: IconRecord = {
  arrowUp: '',
  chevronLeft: '',
  chevronRight: '',
  chevronUp: '',
  chevronDown: '',
  delete: '',
  ownables: '',
  menu: '',
  qr: '',
  transfer: '',
  linkedin: '',
  facebook: '',
  wallet: '',
  profile: '',
  diamond: '',
  add: '',
  twitter: '',
  xmark: '',
  eye: '',
  eyeCross: '',
  check: '',
  close: '',
};

interface IconProps {
  icon: string;
  color?: string;
  size?: number;
}

const IconWrapper = styled.Text<IconProps>`
  font-family: 'LTOIcons';
  font-size: ${({size}) => size ?? 16}px;
  color: ${({color}) => color ?? '#000000'};
`;

const Icon = (props: IconProps) => <IconWrapper {...props}>{icons[props.icon]}</IconWrapper>;

export default Icon;
