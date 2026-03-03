import {Platform} from 'react-native';
import styled from 'styled-components/native';

export const ScreenSafeAreaView = styled.SafeAreaView`
  flex: 1;
  background: #0d0d0d;
`;

export const ScreenView = styled.View<{spaceBetween: boolean; topPadding?: number; gapSize?: number}>`
  padding: ${({topPadding}) => (topPadding ?? (Platform.OS === 'ios' ? 8 : 49))}px 16px;
  gap: ${({spaceBetween, gapSize}) => (spaceBetween ? 0 : (gapSize ?? 32))}px;
  justifycontent: ${({spaceBetween}) => (spaceBetween ? 'space-between' : 'flex-start')};
`;

export const ScreenSubView = styled.View`
  gap: 32px;
`;
