import React, { useContext, useEffect, useMemo, useState } from 'react';
import { RootStackScreenProps } from '../../../types';
import { MessageContext } from '../../context/UserMessage.context';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import EvmTransactionService from '../../services/EvmTransaction.service';
import { StyledButton } from '../../components/StyledButton';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { InputField } from '../../components/InputField';
import { StyledTitle } from '../../components/styles/Title.styles';
import { FormContainer } from '../../components/styles/FormContainer.styles';
import { WALLET } from '../../constants/Text';
import { BackButton } from '../../components/BackButton';
import { isValidEvmAddress } from '../../utils/evmAddress';
import { useUserSettings } from '../../context/User.context';

const LEGACY_DISPLAY_FACTOR = 100000000;

const toEth = (legacyAmount: number): string => {
  return (legacyAmount / LEGACY_DISPLAY_FACTOR).toFixed(8).replace(/\.?0+$/, '');
};

export default function CreateTransferScreen({ navigation }: RootStackScreenProps<'CreateTransfer'>) {
  const [accountAddress, setAccountAddress] = useState('');
  const [availableEth, setAvailableEth] = useState('0');

  const [recipient, setRecipient] = useState('');
  const [amountEth, setAmountEth] = useState('');

  const [estimatedFeeEth, setEstimatedFeeEth] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { network } = useUserSettings();

  const { setShowMessage, setMessageInfo } = useContext(MessageContext);

  useEffect(() => {
    AccountLifecycleService.getAccount()
      .then(account => setAccountAddress(account.address))
      .catch(error => {
        throw new Error(`Error retrieving data. ${error}`);
      });
  }, []);

  useEffect(() => {
    if (!accountAddress) {
      return;
    }

    EvmTransactionService.getNativeBalance(accountAddress as `0x${string}`, network)
      .then(accountDetails => {
        setAvailableEth(accountDetails.balanceEth);
      })
      .catch(error => {
        throw new Error(`Error retrieving account data. ${error}`);
      });
  }, [accountAddress, network]);

  const isAmountValid = useMemo(() => /^\d+(\.\d+)?$/.test(amountEth) && Number.parseFloat(amountEth) > 0, [amountEth]);
  const isRecipientValid = useMemo(() => isValidEvmAddress(recipient), [recipient]);

  useEffect(() => {
    let active = true;

    if (!isRecipientValid || !isAmountValid) {
      setEstimatedFeeEth('');
      return;
    }

    const run = async () => {
      try {
        setIsEstimating(true);
        const estimate = await EvmTransactionService.estimateNativeTransfer({
          from: accountAddress as `0x${string}`,
          to: recipient as `0x${string}`,
          amountEth,
          network,
        });
        if (active) {
          setEstimatedFeeEth(estimate.estimatedFeeEth);
        }
      } catch (_error) {
        if (active) {
          setEstimatedFeeEth('');
        }
      } finally {
        if (active) {
          setIsEstimating(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [recipient, amountEth, isRecipientValid, isAmountValid, accountAddress, network]);

  const insufficientFunds = useMemo(() => {
    if (!isAmountValid || !estimatedFeeEth) return false;

    const amount = Number.parseFloat(amountEth);
    const fee = Number.parseFloat(estimatedFeeEth);
    const available = Number.parseFloat(availableEth || '0');

    return amount + fee > available;
  }, [amountEth, estimatedFeeEth, availableEth, isAmountValid]);

  const handleSend = async () => {
    if (isSending) return;

    if (!isRecipientValid) {
      setShowMessage(true);
      setMessageInfo('Recipient address is not a valid EVM address.');
      return;
    }

    if (!isAmountValid) {
      setShowMessage(true);
      setMessageInfo('Enter a valid ETH amount.');
      return;
    }

    if (insufficientFunds) {
      setShowMessage(true);
      setMessageInfo('Insufficient funds for amount and network fee.');
      return;
    }

    try {
      setIsSending(true);
      const transfer = await EvmTransactionService.sendNativeTransfer({
        to: recipient as `0x${string}`,
        amountEth,
        network,
      });
      const result = await EvmTransactionService.waitForReceipt({
        hash: transfer.hash,
        network,
      });

      if (result.status === 'success') {
        setShowMessage(true);
        setMessageInfo('Transfer confirmed on-chain.');
        navigation.goBack();
      } else {
        setShowMessage(true);
        setMessageInfo('Transfer reverted on-chain.');
      }
    } catch (error) {
      setShowMessage(true);
      setMessageInfo(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScreenContainer>
      <BackButton onPress={navigation.goBack} />
      <StyledTitle>{WALLET.TRANSFER}</StyledTitle>

      <FormContainer>
        <InputField
          label="Recipient"
          value={recipient}
          error={recipient !== '' && !isRecipientValid}
          onChangeText={setRecipient}
          placeholder="Enter EVM address"
        />
        <InputField
          label="Amount"
          value={amountEth}
          error={amountEth !== '' && (!isAmountValid || insufficientFunds)}
          onChangeText={setAmountEth}
          subLabel={`Available: ${availableEth} ETH`}
          placeholder="Enter amount in ETH"
          numeric={true}
        />

        <Card label={isEstimating ? 'Estimating...' : `${estimatedFeeEth || '0'} ETH`} subLabel="Estimated Fee" />
        <StyledButton
          text={isSending ? 'Sending...' : 'Send ETH'}
          onPress={handleSend}
          disabled={isSending || !isRecipientValid || !isAmountValid || !estimatedFeeEth || insufficientFunds}
        />
      </FormContainer>
    </ScreenContainer>
  );
}
