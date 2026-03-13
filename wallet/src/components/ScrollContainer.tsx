import React from 'react';
import {ScrollView, StyleProp, View, ViewStyle} from 'react-native';

export default function ScrollContainer(props: {
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  children: any;
}): JSX.Element {
  return (
    <ScrollView style={props.style}>
      <View style={props.innerStyle}>{props.children}</View>
    </ScrollView>
  );
}
