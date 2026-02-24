import React, {useContext, useEffect, useState} from 'react';
import {RootStackScreenProps} from '../../../types';
import {MessageContext} from '../../context/UserMessage.context';
import LTOService from '../../services/LTO.service';
import {LTO_REPRESENTATION} from '../../constants/Quantities';
import {TypedDetails} from '../../interfaces/TypedDetails';
import {formatNumber} from '../../utils/formatNumber';
import {StyledButton} from '../../components/StyledButton';
import {Card} from '../../components/Card';
import {ScreenContainer} from '../../components/ScreenContainer';
import {InputField} from '../../components/InputField';
import {StyledTitle} from '../../components/styles/Title.styles';
import {FormContainer} from '../../components/styles/FormContainer.styles';
import {WALLET} from '../../constants/Text';
import {BackButton} from '../../components/BackButton';

export default function CreateTransferScreen({navigation}: RootStackScreenProps<'CreateTransfer'>) {
  const [accountAddress, setAccountAddress] = useState('');
  const [details, setDetails] = useState<TypedDetails>({} as TypedDetails);

  const [recipient, setRecipient] = useState('');
  const [amountText, setAmountText] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [attachment, setAttachment] = useState('');

  const {setShowMessage, setMessageInfo} = useContext(MessageContext);

  const {available} = details;

  const availableLTOText = formatNumber(Math.max(available - LTO_REPRESENTATION, 0));

  useEffect(() => {
    getAccountAddress();
  }, []);

  const getAccountAddress = () => {
    LTOService.getAccount()
      .then(account => setAccountAddress(account.address))
      .catch(error => {
        throw new Error(`Error retrieving data. ${error}`);
      });
  };

  useEffect(() => {
    loadAccountDetails();
  }, [accountAddress]);

  const loadAccountDetails = async () => {
    if (accountAddress === '') {
      setDetails({} as TypedDetails);
      return;
    }

    return LTOService.getBalance(accountAddress)
      .then(accountDetails => setDetails(accountDetails))
      .catch(error => {
        throw new Error(`Error retrieving account data. ${error}`);
      });
  };

  useEffect(() => {
    if (amountText === '') {
      setAmount(0);
    } else if (!amountText.match(/^\d+(\.\d+)?$/)) {
      setAmount(null);
    } else {
      setAmount(Math.floor(parseFloat(amountText) * LTO_REPRESENTATION));
    }
  }, [amountText]);

  const handleSend = () => {
    setMessageInfo('Transfers are temporarily unavailable in this migration phase.');
    setShowMessage(true);
  };

  return (
    <ScreenContainer>
      <BackButton onPress={navigation.goBack} />
      <StyledTitle>{WALLET.TRANSFER}</StyledTitle>

      <FormContainer>
        <InputField
          label="Recipient"
          value={recipient}
          error={recipient !== '' && !LTOService.isValidAddress(recipient)}
          onChangeText={setRecipient}
          placeholder="Enter address"
        />
        <InputField
          label="Amount"
          value={amountText}
          error={amount === null || amount < 0 || amount > available}
          onChangeText={setAmountText}
          subLabel={`Available: ${availableLTOText} LTO`}
          placeholder="Enter amount"
          numeric={true}
        />
        <InputField
          label="Note (optional)"
          value={attachment}
          error={attachment.length > 100}
          onChangeText={setAttachment}
          multiline={true}
          placeholder="Write your note here..."
        />

        <Card label="0.08 LTO" subLabel="Fee" />
        <StyledButton text="Send" onPress={handleSend} disabled={false} />
      </FormContainer>
    </ScreenContainer>
  );
}
