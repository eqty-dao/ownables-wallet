import React, {useRef, useState} from 'react';
import {FlatList, useWindowDimensions} from 'react-native';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Slide from '../../components/Slide';
import slides from '../../utils/slideList';
import {StyledSafeAreaView} from './OnBoardingScreen.styles';
import {navigateToWebsite} from '../../utils/redirectSocialMedia';

export default function OnboardingScreen() {
  const {width, height} = useWindowDimensions();
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const ref = useRef<string | any>();

  const updateCurrentSlideIndex = (e: {nativeEvent: {contentOffset: {x: any}}}) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(currentIndex);
  };

  const changeSlide = () => {
    let nextIndex = currentSlideIndex + 1;

    if (currentSlideIndex === slides.length - 1) {
      nextIndex = currentSlideIndex - 1;
    }

    setCurrentSlideIndex(nextIndex);
    ref?.current.scrollToIndex({index: nextIndex, animated: true});
  };

  return (
    <StyledSafeAreaView>
      <Header moreInfo={navigateToWebsite} changeSlide={changeSlide} currentSlideIndex={currentSlideIndex} />
      <FlatList
        ref={ref}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        contentContainerStyle={{height: '100%', marginTop: 50}}
        showsHorizontalScrollIndicator={false}
        horizontal
        data={slides}
        pagingEnabled
        renderItem={({item}) => <Slide item={item} />}
        bounces={false}
      />
      <Footer currentSlideIndex={currentSlideIndex} />
    </StyledSafeAreaView>
  );
}
