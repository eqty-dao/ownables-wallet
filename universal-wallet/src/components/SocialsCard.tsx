import React from 'react';
import { IconContainer } from './styles/NextFunctionality.styles';
import { navigateToFacebook, navigateToLinkedin, navigateToTwitter } from '../utils/redirectSocialMedia';
import { Icon } from 'react-native-elements'
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';



export const SocialsCard = () => (
  <IconContainer>
    <FontAwesome6 name="x-twitter" onPress={navigateToTwitter} size={30} color="#909092" />
    <FontAwesome6 name="facebook" onPress={navigateToFacebook} size={30} color="#909092" />
    <FontAwesome6 name="linkedin" onPress={navigateToLinkedin} size={30} color="#909092" />
  </IconContainer>
);
