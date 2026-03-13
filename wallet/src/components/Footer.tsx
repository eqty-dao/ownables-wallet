import {useNavigation} from '@react-navigation/native';
import React from 'react';
import slides from '../utils/slideList';
import {BtnContainer, Container, Indicator, IndicatorContainer} from './styles/Footer.styles';
import {StyledButton} from './styles/StyledButton.styles';
import {ONBOARDING} from '../constants/Text';
import useEffectiveColorScheme from '../hooks/useEffectiveColorScheme';

export default function Footer({currentSlideIndex}: any): JSX.Element {
  const navigation = useNavigation();
  const isDark = useEffectiveColorScheme() === 'dark';

  return (
    <Container>
      <IndicatorContainer>
        {slides.map((_, index) => (
          <Indicator
            testID="indicator"
            key={index}
            style={[
              currentSlideIndex === index && {
                backgroundColor: isDark ? '#FCFCF7' : '#141414',
                width: 5,
              },
            ]}
          />
        ))}
      </IndicatorContainer>

      <BtnContainer>
        {currentSlideIndex === slides.length - 1 && (
          <StyledButton
            mode="contained"
            color="#615fff"
            uppercase={false}
            labelStyle={{fontWeight: '400', fontSize: 16, width: '100%'}}
            onPress={() => navigation.navigate('SignUp')}>
            {ONBOARDING.BUTTON}
          </StyledButton>
        )}
      </BtnContainer>
    </Container>
  );
}
