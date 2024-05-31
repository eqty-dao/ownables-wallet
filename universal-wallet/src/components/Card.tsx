import React from 'react';
import {CardContainer, CardLabel, CardSubLabel} from './styles/Card.styles';

export const Card = ({
  label,
  subLabel,
  type = 'primary',
  flip = false,
}: {
  label: string;
  subLabel: string;
  type?: 'primary' | 'secondary';
  flip?: boolean;
}) =>
  flip ? (
    <CardContainer type={type}>
      <CardLabel type={type}>{label}</CardLabel>
      <CardSubLabel type={type}>{subLabel}</CardSubLabel>
    </CardContainer>
  ) : (
    <CardContainer type={type}>
      <CardSubLabel type={type}>{subLabel}</CardSubLabel>
      <CardLabel type={type}>{label}</CardLabel>
    </CardContainer>
  );
