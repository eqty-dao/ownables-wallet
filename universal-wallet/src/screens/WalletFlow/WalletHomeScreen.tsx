import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import { styles } from './common';

export default function WalletHomeScreen({ navigation }: WalletStackScreenProps<'WalletHome'>) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen}>
      <Text style={styles.title}>Wallet</Text>
      <Text style={styles.subtitle}>Base wallet with fixed tokens (ETH and EQTY).</Text>

      <Pressable style={styles.row} onPress={() => navigation.navigate('AccountManager')}>
        <Text style={styles.rowTitle}>My Wallet</Text>
        <Text style={styles.rowSubTitle}>0x742d...0bEb</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={() => navigation.navigate('WalletSettings')}>
        <Text style={styles.rowTitle}>Settings</Text>
        <Text style={styles.rowSubTitle}>Appearance, currency, network and recovery phrase</Text>
      </Pressable>

      <View style={{ marginTop: 6 }}>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>Tokens</Text>
        <Pressable style={styles.row} onPress={() => navigation.navigate('TokenDetails', { token: 'ETH' })}>
          <Text style={styles.rowTitle}>ETH</Text>
          <Text style={styles.rowSubTitle}>Ethereum</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => navigation.navigate('TokenDetails', { token: 'EQTY' })}>
          <Text style={styles.rowTitle}>EQTY</Text>
          <Text style={styles.rowSubTitle}>EQTY token</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
