import styled from 'styled-components/native';

export const BackButtonContainer = styled.TouchableOpacity<{isDark: boolean}>`
  background-color: ${({isDark}) => (isDark ? '#212227' : '#F1F2F5')};
  border-radius: 20px;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
`;
