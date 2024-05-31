import styled from 'styled-components/native';
import {Image} from 'react-native';

export const HeaderContainer = styled.View<{marginLeft?: number}>`
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  background-color: transparent;
  width: 93%;
  margin: 0 auto;
  ${props => props.marginLeft && `margin-left: ${props.marginLeft}px;`}
`;

export const StyledImage = styled(Image)`
  height: 20px;
  background-color: transparent;
  resize-mode: contain;
  width: 50%;
`;
