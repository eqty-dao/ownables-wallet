import React from 'react';
import {IconButton} from 'react-native-paper';

export default function TabBarIcon(props: {
  icon: React.ComponentProps<typeof IconButton>['icon'];
  color: string;
}): JSX.Element {
  return <IconButton testID="tab-bar-icon" size={35} style={{marginHorizontal: -15, marginVertical: -15}} {...props} />;
}
