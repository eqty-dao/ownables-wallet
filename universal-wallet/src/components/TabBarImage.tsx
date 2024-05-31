import React from 'react';
import {Image, ImageSourcePropType} from 'react-native';

export default function TabBarImage({source}: {source: ImageSourcePropType}): JSX.Element {
  return (
    <Image
      testID="tabIconImage"
      style={{marginHorizontal: -7, marginVertical: -4, width: 35, height: 35}}
      source={source}
    />
  );
}
