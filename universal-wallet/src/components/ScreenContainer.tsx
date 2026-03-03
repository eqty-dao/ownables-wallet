import React from 'react';
import {ScreenView, ScreenSafeAreaView} from './styles/ScreenContainer.styles';
import {KeyboardAvoidingView, Platform, ScrollView} from 'react-native';

export const ScreenContainer = ({
  children,
  spaceBetween = false,
  topPadding,
  gapSize,
}: {
  children: any;
  spaceBetween?: boolean;
  topPadding?: number;
  gapSize?: number;
}) => (
  <ScreenSafeAreaView>
    <KeyboardAvoidingView {...(Platform.OS === 'ios' && {behavior: 'position'})}>
      <ScrollView bounces={false}>
        <ScreenView spaceBetween={spaceBetween} topPadding={topPadding} gapSize={gapSize}>
          {children}
        </ScreenView>
      </ScrollView>
    </KeyboardAvoidingView>
  </ScreenSafeAreaView>
);
