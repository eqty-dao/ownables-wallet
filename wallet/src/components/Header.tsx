import {useNavigation} from '@react-navigation/native';
import React from 'react';
import slides from '../utils/slideList';
import {HeaderBtn, HeaderView} from './styles/Header.styles';
import {ONBOARDING} from '../constants/Text';

export default function Header({currentSlideIndex, moreInfo, changeSlide}: any) {
  return (
    <HeaderView>
      <HeaderBtn icon="information-outline" mode="text" uppercase={false} onPress={moreInfo}>
        {ONBOARDING.HEADER_LEFT}
      </HeaderBtn>
      {currentSlideIndex !== slides.length - 1 && (
        <HeaderBtn mode="text" uppercase={false} onPress={changeSlide}>
          {ONBOARDING.HEADER_RIGHT}
        </HeaderBtn>
      )}
    </HeaderView>
  );
}
