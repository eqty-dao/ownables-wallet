import React from 'react';
import {HeaderContainer} from './styles/OverviewHeader.styles';

export default function OverviewHeader(props: {
  input: any;
  marginLeft?: number | undefined;
}): JSX.Element {
  return (
    <HeaderContainer {...props}>{props.input}</HeaderContainer>
  );
}
