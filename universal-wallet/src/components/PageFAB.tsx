import * as React from 'react';
import {FAB, Portal, Provider} from 'react-native-paper';
import {StyleSheet} from 'react-native';

export default function PageFAB(props: {icon?: string; onPress: () => void}): JSX.Element {
  const styles = StyleSheet.create({
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: '#615fff',
    },
  });

  return (
    <Provider>
      <Portal>
        <FAB icon={props.icon || 'plus'} style={styles.fab} onPress={props.onPress} />
      </Portal>
    </Provider>
  );
}
