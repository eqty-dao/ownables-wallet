import React from 'react';
import {TouchableOpacity} from 'react-native';
import {StyledIcon} from './styles/NextFunctionality.styles';

export default function SocialMediaIcon(props: {onPress: () => void; style?: any; source: any}): JSX.Element {
  return (
    <TouchableOpacity onPress={props.onPress}>
      <StyledIcon testID="social-media-icon" style={props.style} source={props.source} />
    </TouchableOpacity>
  );
}
