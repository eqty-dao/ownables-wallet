import React from 'react';
import styled from 'styled-components/native';

interface Props {
  size: number;
}

const Spacer = styled.View<Props>`
  width: ${({size}) => size}px;
  height: ${({size}) => size}px;
`;

export default Spacer;
