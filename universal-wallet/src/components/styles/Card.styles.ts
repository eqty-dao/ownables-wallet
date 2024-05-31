import styled from 'styled-components/native';

export const CardContainer = styled.View<{type: 'primary' | 'secondary'}>`
  align-items: ${({type}) => (type == 'primary' ? 'center' : 'normal')};
  gap: 8px;
  padding: ${({type}) => (type == 'primary' ? '16px' : '0px')};
`;

export const CardSubLabel = styled.Text<{type: 'primary' | 'secondary'}>`
  color: #909092;
  font-family: Inter;
  font-size: ${({type}) => (type == 'primary' ? '16px' : '14px')};
  font-weight: 400;
`;

export const CardLabel = styled.Text<{type: 'primary' | 'secondary'}>`
  color: #fcfcf7;
  font-family: Inter;
  font-size: ${({type}) => (type == 'primary' ? '24px' : '16px')};
  font-weight: ${({type}) => (type == 'primary' ? 600 : 400)};
`;
