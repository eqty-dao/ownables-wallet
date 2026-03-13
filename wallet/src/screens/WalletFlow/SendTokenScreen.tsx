import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput } from 'react-native';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import EvmTransactionService from '../../services/EvmTransaction.service';
import { useUserSettings } from '../../context/User.context';
import { isValidEvmAddress } from '../../utils/evmAddress';
import { useWalletFlowStyles } from './common';

export default function SendTokenScreen({ navigation, route }: WalletStackScreenProps<'SendToken'>) {
  const styles = useWalletFlowStyles();
  const { network } = useUserSettings();
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState(route.params.recipient || '');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    AccountLifecycleService.getAccount()
      .then(account => setSender(account.address))
      .catch(() => setSender(''));
  }, []);

  const submit = async () => {
    if (isSubmitting) return;

    if (route.params.token !== 'ETH') {
      setStatus('EQTY transfer flow is not available yet.');
      return;
    }

    if (!isValidEvmAddress(recipient)) {
      setStatus('Enter a valid recipient address.');
      return;
    }

    const amountNumber = Number.parseFloat(amount || '0');
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setStatus('Enter an amount greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus('Estimating transfer...');

      await EvmTransactionService.estimateNativeTransfer({
        from: sender as `0x${string}`,
        to: recipient as `0x${string}`,
        amountEth: amount,
        network,
      });

      setStatus('Submitting transfer...');
      const result = await EvmTransactionService.sendNativeTransfer({
        to: recipient as `0x${string}`,
        amountEth: amount,
        network,
      });

      setStatus('Waiting for confirmation...');
      await EvmTransactionService.waitForReceipt({
        hash: result.hash,
        network,
      });

      setStatus(`Transfer sent: ${result.hash.slice(0, 12)}...`);
    } catch (_error) {
      setStatus('Transfer failed. Please check balance, network and gas fee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Send {route.params.token}</Text>
      <Text style={styles.subtitle}>Send funds on Base network.</Text>

      <TextInput
        value={recipient}
        onChangeText={setRecipient}
        style={styles.input}
        placeholder="Recipient Address"
        placeholderTextColor="#8d94a1"
        autoCapitalize="none"
      />

      <TextInput
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
        placeholder={`Amount (${route.params.token})`}
        placeholderTextColor="#8d94a1"
        keyboardType="decimal-pad"
      />

      {status ? <Text style={styles.helper}>{status}</Text> : null}

      <Pressable style={styles.actionButton} onPress={submit}>
        <Text style={styles.actionText}>{isSubmitting ? 'Sending...' : 'Submit Transfer'}</Text>
      </Pressable>

      <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.goBack()}>
        <Text style={styles.actionTextSecondary}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
