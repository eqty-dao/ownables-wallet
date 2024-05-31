import styled from 'styled-components/native';

const IconButton = styled.TouchableOpacity.attrs({
  hitSlop: {top: 10, bottom: 10, left: 10, right: 10},
})`
  align-items: center;
  justify-content: center;
`;

export default IconButton;
