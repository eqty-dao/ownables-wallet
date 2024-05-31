import {Platform} from 'react-native';
import styled from 'styled-components/native';

export const MainScreenView = styled.View`
  flex: 1;
  padding-top: ${Platform.OS === 'ios' ? '0' : '41'}px;
`;

export const MainScreenSubContainer = styled.View`
  flex: 1;
  padding: 64px 16px;
  gap: 64px;
`;

export const MainScreenMinorContainer = styled.View`
  gap: 16px;
`;
