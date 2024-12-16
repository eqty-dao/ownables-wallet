import React, {useContext, useEffect, useState} from 'react';
import {RootStackScreenProps} from '../../../types';
import {MessageContext} from '../../context/UserMessage.context';
import LTOService from '../../services/LTO.service';
import {List} from 'react-native-paper';
import {LTO_REPRESENTATION} from '../../constants/Quantities';
import {TypedDetails} from '../../interfaces/TypedDetails';
import {formatNumber} from '../../utils/formatNumber';
import {confirmationMessage} from '../../utils/confirmationMessage';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import {TypedTransaction} from '../../interfaces/TypedTransaction';
import {Lease as LeaseTx} from '@ltonetwork/lto';
import {TypedCommunityNode} from '../../interfaces/TypedCommunityNode';
import CommunityNodesService from '../../services/CommunityNodes.service';
import {shuffleArray} from '../../utils/shuffleArray';
import {WALLET} from '../../constants/Text';
import {StyledTitle} from '../../components/styles/Title.styles';
import {FormContainer} from '../../components/styles/FormContainer.styles';
import {StyledButton} from '../../components/StyledButton';
import {Card} from '../../components/Card';
import {ScreenContainer} from '../../components/ScreenContainer';
import {InputField} from '../../components/InputField';
import {BackButton} from '../../components/BackButton';
import {TouchableIcon} from '../../components/TouchableIcon';

export default function CreateLeaseScreen({navigation, route}: RootStackScreenProps<'CreateLease'>) {
  const [accountAddress, setAccountAddress] = useState('');
  const [details, setDetails] = useState<TypedDetails>({} as TypedDetails);

  const [nodes, setNodes] = useState<TypedCommunityNode[]>([]);
  const [selectNode, setSelectNode] = useState(CommunityNodesService.isConfigured && !route.params?.address);

  const [recipient, setRecipient] = useState(route.params?.address || '');
  const [recipientNode, setRecipientNode] = useState<TypedCommunityNode | undefined>(undefined);
  const [amountText, setAmountText] = useState('');
  const [amount, setAmount] = useState(0);

  const [tx, setTx] = useState<LeaseTx | undefined>();

  const {setShowMessage, setMessageInfo} = useContext(MessageContext);
  const [dialogVisible, setDialogVisible] = useState(false);

  const {available} = details;
  const fee = LTO_REPRESENTATION;
  const sendButtonDisabled =
    isNaN(amount) || amount <= 0 || amount > available || recipient === '' || !LTOService.isValidAddress(recipient);
  const availableLTOText = formatNumber(Math.max(available - fee, 0));

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
    CommunityNodesService.list()
      .then(shuffleArray)
      .then(nodes => setNodes(nodes));
  }, []);

  useEffect(() => {
    CommunityNodesService.info(recipient || '').then(setRecipientNode);
  }, [recipient]);

  const renderNode = (node: TypedCommunityNode) => {
    return (
      <List.Item
        title={node.name}
        titleStyle={{fontSize: 14, fontWeight: 'bold'}}
        description={node.address}
        descriptionStyle={{fontSize: 12, marginBottom: 0}}
        onPress={() => {
          setRecipient(node.address);
          setSelectNode(false);
        }}
      />
    );
  };

  useEffect(() => {
    if (amountText === '') {
      setAmount(0);
    } else if (!amountText.match(/^\d+(\.\d+)?$/)) {
      setAmount(NaN);
    } else {
      setAmount(Math.floor(parseFloat(amountText) * LTO_REPRESENTATION));
    }
  }, [amountText]);

  const sendTx = async () => {
    try {
      if (!tx) {
        throw new Error('Transaction is not defined');
      }
      const account = await LTOService.getAccount();
      const signedTx = tx.signWith(account);
      await LTOService.broadcast(signedTx);
      setMessageInfo('Transaction sent successfully!');
      setShowMessage(true);
      navigation.goBack();
    } catch (error) {
      if (error instanceof Error) console.error(`Error sending transaction: ${error.message}`);
      setShowMessage(true);
      setMessageInfo(`Failed to send transaction. Please try again later`);
    }
  };

  const handlePressUpArrow = () => setAmountText(((available - 2 * fee) / LTO_REPRESENTATION).toString());
  const handleSend = () => {
    setTx(new LeaseTx(recipient, amount));
    setDialogVisible(true);
  };
  const handleCancel = () => {
    setTx(undefined);
    setDialogVisible(false);
  };

  return (
    <ScreenContainer>
      <BackButton onPress={navigation.goBack} />
      <StyledTitle>{WALLET.LEASE}</StyledTitle>
      <FormContainer>
        <InputField
          label="Node Address"
          value={recipient}
          onChangeText={setRecipient}
          error={!LTOService.isValidAddress(recipient)}
          placeholder="Enter address"
        />
        <InputField
          label="Amount"
          value={amountText}
          onChangeText={setAmountText}
          error={isNaN(amount) || amount < 0 || amount + fee > available}
          placeholder="Enter amount"
          subLabel={`Available: ${availableLTOText} LTO`}
          numeric={true}
        />
        <Card label="0.08 LTO" subLabel="Fee" />
        <StyledButton text="Start Lease" onPress={handleSend} disabled={sendButtonDisabled} />
      </FormContainer>
      <ConfirmationDialog
        visible={dialogVisible}
        message={tx ? confirmationMessage(tx.toJSON() as TypedTransaction) : ''}
        onPress={sendTx}
        onCancel={handleCancel}
      />
    </ScreenContainer>
  );
}
