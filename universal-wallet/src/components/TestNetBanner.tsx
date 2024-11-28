import React from 'react';
import { Text, StyleSheet, SafeAreaView } from 'react-native';
import { Env, Network, useUserSettings } from '../context/User.context';

const TestNetBanner = () => {
  const { network, env } = useUserSettings();

  if (network === Network.MAINNET && env === Env.PROD) {
    return null;
  }
  return (
    <SafeAreaView style={styles.banner}>
      <Text style={styles.text}>{`${network === Network.MAINNET ? 'Mainnet' : 'Testnet'} (${env})`}</Text>
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