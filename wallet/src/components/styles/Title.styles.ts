import styled from 'styled-components/native';

export const TitleContainer = styled.View`
  gap: 16px;
`;

export const StyledTitle = styled.Text<{isDark: boolean}>`
  color: ${({isDark}) => (isDark ? '#fcfcf7' : '#141414')};
  font-family: Inter;
  font-size: 32px;
  font-weight: 600;
`;

export const StyledSubtitle = styled.Text<{isDark: boolean}>`
  color: ${({isDark}) => (isDark ? '#909092' : '#6E6F78')};
  font-family: Inter;
  font-weight: 500;
  width: 281px;
`;
