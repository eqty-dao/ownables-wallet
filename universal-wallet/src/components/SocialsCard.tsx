import React from 'react';
import {IconContainer} from './styles/NextFunctionality.styles';
import {TouchableIcon} from './TouchableIcon';
import {navigateToFacebook, navigateToLinkedin, navigateToTwitter} from '../utils/redirectSocialMedia';

export const SocialsCard = () => (
  <IconContainer>
    <TouchableIcon icon="twitter" onPress={navigateToTwitter} size={24} color="#909092" />
    <TouchableIcon icon="facebook" onPress={navigateToFacebook} size={24} color="#909092" />
    <TouchableIcon icon="linkedin" onPress={navigateToLinkedin} size={24} color="#909092" />
  </IconContainer>
);
