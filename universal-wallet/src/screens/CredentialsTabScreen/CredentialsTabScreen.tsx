import React from 'react';
import {RootTabScreenProps} from '../../../types';
import OverviewHeader from '../../components/OverviewHeader';
import {StyledText, StyledTitle, StyledView, TitleContainer} from '../../components/styles/NextFunctionality.styles';
import {CREDENTIALS} from '../../constants/Text';
import {logoTitle} from '../../utils/images';
import {MainScreenContainer} from '../../components/MainScreenContainer';
import {StyledImage} from '../../components/styles/OverviewHeader.styles';
import Icon from '../../components/Icon';
import {SocialsCard} from '../../components/SocialsCard';
import {View} from 'react-native';

export default function CredentialsTabScreen({navigation}: RootTabScreenProps<'Credentials'>) {
  return (
    <MainScreenContainer disableScroll={true}>
      <OverviewHeader
        icon={'menu'}
        onPress={() => navigation.navigate('Menu')}
        onQrPress={() => navigation.navigate('QrReader')}
        input={<StyledImage testID="logo-title" source={logoTitle} />}
      />
      <View>
        <StyledView>
          <Icon icon="diamond" size={44} color="#9D8EE6" />
          <TitleContainer>
            <StyledTitle>{CREDENTIALS.TITLE}</StyledTitle>
            <StyledText>{CREDENTIALS.SUBTITLE}</StyledText>
          </TitleContainer>
          <SocialsCard />
        </StyledView>
      </View>
    </MainScreenContainer>
  );
}
