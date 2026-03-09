import React, {useRef, useState} from 'react';
import {FlatList, useWindowDimensions} from 'react-native';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Slide from '../../components/Slide';
import slides from '../../utils/slideList';
import {StyledSafeAreaView} from './OnBoardingScreen.styles';
import {navigateToWebsite} from '../../utils/redirectSocialMedia';
import {Dimensions} from 'react-native';
import useColorScheme from '../../hooks/useColorScheme';

const ITEM_WIDTH = Dimensions.get('window').width;

export default function OnboardingScreen() {
  const isDark = useColorScheme() === 'dark';
  const {width, height} = useWindowDimensions();
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const ref = useRef<FlatList>(null);

  const updateCurrentSlideIndex = (e: {nativeEvent: {contentOffset: {x: any}}}) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(currentIndex);
  };

  //F-2024-4585 - Logic Error In ChangeSlide Function - Info
  const changeSlide = () => {
    let nextIndex = currentSlideIndex + 1;

    if (currentSlideIndex >= slides.length - 1) {
      nextIndex = 0;
    }

    setCurrentSlideIndex(nextIndex);
    ref.current?.scrollToIndex({index: nextIndex, animated: true});
  };

  return (
    <StyledSafeAreaView isDark={isDark}>
      <Header moreInfo={navigateToWebsite} changeSlide={changeSlide} currentSlideIndex={currentSlideIndex} />
      {/* F-2024-4586 - Potential Performance Issue With FlatList  */}
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
        initialNumToRender={3}
        getItemLayout={(data, index) => ({length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index})}
      />
      <Footer currentSlideIndex={currentSlideIndex} />
    </StyledSafeAreaView>
  );
}
