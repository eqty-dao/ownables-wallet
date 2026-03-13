import React from 'react';
import {View} from 'react-native';
import {ActivityIndicator} from 'react-native-paper';

export default function Spinner(): JSX.Element {
  return (
    <View style={{flex: 1, justifyContent: 'center'}}>
      <ActivityIndicator testID="spinner" size="large" color="#0000ff" />
    </View>
  );
}
