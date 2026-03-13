import React from 'react';
import {MainScreenView} from './styles/MainScreenContainer.styles';
import {ScreenSafeAreaView} from './styles/ScreenContainer.styles';
import {ScrollView} from 'react-native';

export const MainScreenContainer = ({children, disableScroll = false}: {children: any; disableScroll?: boolean}) => (
  <ScreenSafeAreaView>
    <ScrollView bounces={false} contentContainerStyle={disableScroll && {flex: 1}}>
      <MainScreenView>{children}</MainScreenView>
    </ScrollView>
  </ScreenSafeAreaView>
);
