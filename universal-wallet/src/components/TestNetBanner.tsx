import React from 'react';
import { Text, StyleSheet, SafeAreaView } from 'react-native';
import { useUserSettings } from '../context/User.context';

const TestNetBanner = () => {
  const { network } = useUserSettings();

  if (network !== 'T') return null;
  return (
    <SafeAreaView style={styles.banner}>
      <Text style={styles.text}>Test Net</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ffcc00',
    padding: 5,
    alignItems: 'center',
  },
  text: {
    color: '#000', // Black text color
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default TestNetBanner;