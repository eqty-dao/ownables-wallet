import styled from 'styled-components/native';

export const StyledSafeAreaView = styled.SafeAreaView<{isDark: boolean}>`
  height: 100%;
  padding-top: 40px;
  background-color: ${({isDark}) => (isDark ? '#0d0d0d' : '#ffffff')};
`;
