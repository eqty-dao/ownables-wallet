import React from 'react';
import {ScreenView, ScreenSafeAreaView} from './styles/ScreenContainer.styles';
import {KeyboardAvoidingView, Platform, ScrollView} from 'react-native';

export const ScreenContainer = ({children, spaceBetween = false}: {children: any; spaceBetween?: boolean}) => (
  <ScreenSafeAreaView>
    <KeyboardAvoidingView {...(Platform.OS === 'ios' && {behavior: 'position'})}>
      <ScrollView bounces={false}>
        <ScreenView spaceBetween={spaceBetween}>{children}</ScreenView>
      </ScrollView>
    </KeyboardAvoidingView>
  </ScreenSafeAreaView>
);
