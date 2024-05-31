import {Platform, StatusBar, View} from 'react-native';
import styled from 'styled-components/native';

export const Container = styled(View)`
  height: ${Platform.OS === 'ios' ? '54' : StatusBar.currentHeight}px;
`;
