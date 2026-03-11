import React from 'react';
import {ScreenView, ScreenSafeAreaView} from './styles/ScreenContainer.styles';
import {KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import useEffectiveColorScheme from '../hooks/useEffectiveColorScheme';

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
}) => {
  const isDark = useEffectiveColorScheme() === 'dark';

  return (
    <ScreenSafeAreaView isDark={isDark}>
      <KeyboardAvoidingView {...(Platform.OS === 'ios' && {behavior: 'position'})}>
        <ScrollView
          bounces={false}
          style={{backgroundColor: isDark ? '#1a1a1a' : '#ffffff'}}
          contentContainerStyle={{backgroundColor: isDark ? '#1a1a1a' : '#ffffff'}}>
          <ScreenView spaceBetween={spaceBetween} topPadding={topPadding} gapSize={gapSize}>
            {children}
          </ScreenView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenSafeAreaView>
  );
};
