import {RootStackScreenProps} from '../../../types';
import OverviewHeader from '../../components/OverviewHeader';
import {MainTitle} from '../../components/styles/NextFunctionality.styles';
import {WALLET} from '../../constants/Text';
import React, {useContext, useState} from 'react';
import {NodeCard, NodeCardActions, NodeAddress, NodeName, OverviewContainer} from './LeaseScreen.styles';
import {ImageBackground, Pressable, useWindowDimensions} from 'react-native';
import {TypedCommunityNode} from '../../interfaces/TypedCommunityNode';
import {TypedTransaction} from '../../interfaces/TypedTransaction';
import LTOService from '../../services/LTO.service';
import CommunityNodesService from '../../services/CommunityNodes.service';
import {useFocusEffect} from '@react-navigation/native';
import {formatDate} from '../../utils/formatDate';
import {backgroundImage, socialMediaIcons} from '../../utils/images';
import {ActivityIndicator, Card, IconButton, List, Paragraph} from 'react-native-paper';
import If from '../../components/If';
import SocialMediaIcon from '../../components/SocialMediaIcon';
import {nagivateTo} from '../../utils/redirectSocialMedia';
import PageFAB from '../../components/PageFAB';
import {
  ActivityCard,
  Amount,
  AmountContainer,
  BottomCard,
  BottomCardsContainer,
  FieldName,
} from '../WalletTabScreen/WalletTabScreen.styles';
import {formatNumber} from '../../utils/formatNumber';
import {TypedDetails} from '../../interfaces/TypedDetails';
import Loader from '../../components/Loader';
import {useInterval} from '../../utils/useInterval';
import ShortSectionList from '../../components/ShortSectionList';
import {shortAddress} from '../../utils/shortAddress';
import {MessageContext} from '../../context/UserMessage.context';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import {confirmationMessage} from '../../utils/confirmationMessage';
import {CancelLease as CancelLeaseTx} from '@ltonetwork/lto';
import PressToCopy from '../../components/PressToCopy';

export default function LeaseScreen({navigation, route}: RootStackScreenProps<'Lease'>) {
  const {width, height} = useWindowDimensions();

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const nodeAddress = route.params.address;
  const [node, setNode] = useState<TypedCommunityNode | undefined>(undefined);

  const [accountAddress, setAccountAddress] = useState('');
  const [details, setDetails] = useState<TypedDetails>({} as TypedDetails);
  const [totalAmount, setTotalAmount] = useState(0);
  const [leases, setLeases] = useState<{date: string; data: TypedTransaction[]}[]>([]);

  const {available} = details;

  const [tx, setTx] = useState<CancelLeaseTx | undefined>();
  const {setShowMessage, setMessageInfo} = useContext(MessageContext);
  const [dialogVisible, setDialogVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      LTOService.getAccount().then(account => setAccountAddress(account.address));
    }, []),
  );

  useFocusEffect(
    React.useCallback(() => {
      CommunityNodesService.info(nodeAddress).then(info => setNode(info));
    }, []),
  );

  useFocusEffect(
    React.useCallback(() => {
      Promise.all([loadAccountDetails(), loadLeases()]).then(() => setIsLoading(false));
    }, [accountAddress]),
  );

  useInterval(() => {
    loadAccountDetails();
    loadLeases();
  }, 5 * 1000);

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

  const loadLeases = async () => {
    if (accountAddress === '') {
      setLeases([]);
      return;
    }

    try {
      const txs: TypedTransaction[] = await LTOService.getLeases(accountAddress);
      const leases = txs.filter(tx => tx.recipient === nodeAddress).sort((a, b) => b.timestamp! - a.timestamp!);

      const leasesByDate = new Map();

      for (const lease of leases) {
        const date = formatDate(lease.timestamp!);
        leasesByDate.set(date, [...(leasesByDate.get(date) || []), lease]);
      }

      setLeases(Array.from(leasesByDate.entries()).map(([date, txs]) => ({date, data: txs})));
      setTotalAmount(leases.reduce((amount, tx) => amount + tx.amount!, 0));
    } catch (error) {
      throw new Error(`Error retrieving lease transactions. ${error}`);
    }
  };

  const sendTx = async () => {
    const account = await LTOService.getAccount();
    await LTOService.broadcast(tx!.signWith(account));

    setMessageInfo('Transaction sent successfully!');
    setShowMessage(true);
  };

  const NodeDetail = (props: {value: string | undefined; description?: string | undefined; icon: string}) => (
    <If condition={!!props.value}>
      <List.Item
        title={props.value}
        style={{margin: 0, paddingTop: 0, paddingBottom: 0}}
        description={props.description}
        left={({style, color}) => (
          <List.Icon color={color} style={{...style, marginLeft: -15, marginRight: 0}} icon={props.icon} />
        )}
      />
    </If>
  );

  return (
    <Loader loading={isLoading}>
      <ImageBackground source={backgroundImage} style={{width, height, position: 'absolute'}} />
      <OverviewContainer style={{height}}>
        <OverviewHeader
          marginLeft={-10}
          icon={'close'}
          onPress={() => navigation.goBack()}
          input={<MainTitle>{WALLET.LEASE}</MainTitle>}
        />

        <NodeCard>
          <Card.Content>
            <NodeName>{node?.name ?? 'Node'}</NodeName>
            <PressToCopy value={nodeAddress}>
              <NodeAddress>{nodeAddress}</NodeAddress>
            </PressToCopy>
            <NodeDetail value={node?.sharing} description={node?.payoutSchedule} icon="hand-coin-outline" />
            <NodeDetail value={node?.comment} icon="alert-octagram-outline" />
          </Card.Content>
          <NodeCardActions>
            <If condition={!!node?.website?.match(/^https:\/\/t.me\//)}>
              <SocialMediaIcon
                style={{marginTop: 0}}
                source={socialMediaIcons.telegram}
                onPress={() => nagivateTo(node?.website!)}
              />
            </If>
            <If condition={!node?.website?.match(/^https:\/\/t.me\//)}>
              <If condition={!!node?.website}>
                <IconButton icon="web" onPress={() => nagivateTo(node?.website!)} />
              </If>
              <If condition={!!node?.tgContact}>
                <SocialMediaIcon
                  style={{marginTop: 0}}
                  source={socialMediaIcons.telegram}
                  onPress={() => nagivateTo('https://t.me/' + node?.tgContact!.replace(/^@/, ''))}
                />
              </If>
            </If>
          </NodeCardActions>
        </NodeCard>

        <BottomCardsContainer>
          <BottomCard>
            <Card.Content>
              <FieldName>{WALLET.LEASING}</FieldName>
              <AmountContainer>
                <Amount>{formatNumber(totalAmount)}</Amount>
                <Paragraph>{WALLET.LTO}</Paragraph>
              </AmountContainer>
            </Card.Content>
          </BottomCard>

          <BottomCard>
            <Card.Content>
              <FieldName>{WALLET.AVAILABLE}</FieldName>
              <AmountContainer style={{opacity: 0.5}}>
                <Amount>{formatNumber(available)}</Amount>
                <Paragraph>{WALLET.LTO}</Paragraph>
              </AmountContainer>
            </Card.Content>
          </BottomCard>
        </BottomCardsContainer>

        <If condition={leases.length > 0}>
          <ActivityCard>
            <Card.Title title={WALLET.ACTIVE_LEASES} />
            <Card.Content>
              <ShortSectionList
                sections={leases}
                renderSectionHeader={({section: {date}}) => (
                  <List.Subheader key={`transaction.section:${date}`}>{date}</List.Subheader>
                )}
                renderItem={({item}) => (
                  <List.Item
                    key={`lease:${item.id}`}
                    style={{padding: 0}}
                    title={formatNumber(item.amount) + ' LTO'}
                    titleStyle={{fontSize: 14}}
                    descriptionStyle={{fontSize: 12, marginBottom: 0}}
                    description={shortAddress(item.id!)}
                    left={({color, style}) =>
                      item.pending ? (
                        <ActivityIndicator style={{...style, marginLeft: 8}} animating={true} color="#A017B7" />
                      ) : (
                        <List.Icon
                          color={color}
                          style={{...style, marginLeft: 0, marginRight: 8}}
                          icon="bank-outline"
                        />
                      )
                    }
                    right={({style}) =>
                      !item.pending ? (
                        <Pressable
                          onPress={() => {
                            setTx(new CancelLeaseTx(item.id!));
                            setDialogVisible(true);
                          }}>
                          <List.Icon color="red" style={{...style, marginLeft: 0, marginRight: 8}} icon="close" />
                        </Pressable>
                      ) : undefined
                    }
                  />
                )}
              />
            </Card.Content>
          </ActivityCard>
        </If>
      </OverviewContainer>
      <PageFAB onPress={() => navigation.navigate('CreateLease', {address: nodeAddress})} />

      <ConfirmationDialog
        visible={dialogVisible}
        message={tx ? confirmationMessage(tx.toJSON() as TypedTransaction) : ''}
        onPress={() => {
          sendTx();
          setDialogVisible(false);
        }}
        onCancel={() => {
          setTx(undefined);
          setDialogVisible(false);
        }}
      />
    </Loader>
  );
}
