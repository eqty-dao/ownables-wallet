import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  AppState,
  AppStateStatus,
  BackHandler,
  ImageBackground,
  Linking,
  Text,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import {Button, Card, List} from 'react-native-paper';
import {RootTabScreenProps} from '../../../types';
import OverviewHeader from '../../components/OverviewHeader';
import {StyledImage} from '../../components/styles/OverviewHeader.styles';
import {LATEST_TRANSACTIONS} from '../../constants/Quantities';
import {WALLET} from '../../constants/Text';
import {TypedCoinData} from '../../interfaces/TypedCoinData';
import {TypedDetails} from '../../interfaces/TypedDetails';
import {TypedTransaction} from '../../interfaces/TypedTransaction';
import LTOService from '../../services/LTO.service';
import {formatNumber} from '../../utils/formatNumber';
import {backgroundImage, logoTitle} from '../../utils/images';
import {
  AmountContainer,
  BottomCardsContainer,
  OverviewContainer,
  TopCard,
  TopCardsContainer,
  TopCardsRipple,
  TopContainer,
  ActivityCard,
  Container,
  ActivityCardTitle,
} from './WalletTabScreen.styles';
import {useInterval} from '../../utils/useInterval';
import {formatDate} from '../../utils/formatDate';
import {shortAddress} from '../../utils/shortAddress';
import If from '../../components/If';
import {TypedLease} from '../../interfaces/TypedLease';
import CommunityNodesService from '../../services/CommunityNodes.service';
import WalletFAB from '../../components/WalletFAB';
import Collapsible from 'react-native-collapsible';
import ShortSectionList from '../../components/ShortSectionList';
import ShortList from '../../components/ShortList';
import ScrollContainer from '../../components/ScrollContainer';
import TransactionListItem from '../../components/TransactionListItem';
import Loader from '../../components/Loader';
import CoinPriceService from '../../services/CoinPrice.service';
import Typography from '../../components/Typography';
import Colors from '../../constants/Colors';
import Spacer from '../../components/Spacer';
import BottomTile from './BottomTile';
import styled from 'styled-components/native';
import {useUserSettings} from '../../context/User.context';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import {LTO_EXPLORER_URL} from '@env';
const WALLET_URL = LTO_EXPLORER_URL;

const ExitPopup = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const ExitMessage = styled.View`
  padding: 8px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #000000;
  border-radius: 8px;
`;

const MainTab = ({children, navigation}) => {
  const {width, height} = useWindowDimensions();

  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [accountAddress, setAccountAddress] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showBalanceDetails, setShowBalanceDetails] = useState<boolean>(false);
  const [leases, setLeases] = useState<{address: string; name?: string; amount: number}[]>([]);
  const [transactions, setTransactions] = useState<{date: string; data: TypedTransaction[]}[]>([]);
  const [details, setDetails] = useState<TypedDetails>({} as TypedDetails);
  const [coinData, setCoinData] = useState<TypedCoinData>({} as TypedCoinData);

  const {available, effective, leasing, regular, unbonding} = details;
  const {price, percent_change_24h} = coinData;

  const isFocused = useIsFocused();

  const colorScheme = useColorScheme() ?? 'dark';

  const {isSignOutForced} = useUserSettings();

  const [isExitPopupVisible, setExitPopupVisible] = useState(false);

  const onBackPress = () => {
    if (!isFocused) return false;

    if (isExitPopupVisible) {
      BackHandler.exitApp();
      return true;
    }

    setExitPopupVisible(true);
    setTimeout(() => {
      setExitPopupVisible(false);
    }, 2000); // Reset exit popup after 2 seconds
    return true;
  };

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [isFocused, isExitPopupVisible, onBackPress]);

  useEffect(() => {
    if (isFocused) {
      loadAccount();
    }
  }, [isFocused]);

  useFocusEffect(
    React.useCallback(() => {
      loadAccount();
    }, []),
  );

  useFocusEffect(
    React.useCallback(() => {
      Promise.all([loadAccountDetails(), loadLeases(), loadTransactions()]).then(() => setIsLoading(false));
    }, [accountAddress]),
  );

  useInterval(() => {
    loadAccountDetails();
    loadLeases();
    loadTransactions();
  }, null);

  const loadAccount = async () => {
    try {
      const account = await LTOService.getAccount();
      setAccountAddress(account.address);
    } catch (error) {
      console.error('Error loading account:', error);
    }
  };

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
    // TODO: DC, uncomment this section to view the design of the component when empty data.
    /*setLeases(
      [
        {
          address: '3123123213123',
          amount: 15,
          name: 'sss'
        },
        {
          address: '3123123213123',
          amount: 15,
          name: 'sss'
        }
      ]
    )*/

    if (accountAddress === '') {
      setLeases([]);
      return;
    }

    try {
      const leases: TypedLease[] = await LTOService.getLeases(accountAddress);
      const groupedLeases: Map<string, number> = new Map();

      for (const lease of leases) {
        if (lease.sender !== accountAddress) continue;
        groupedLeases.set(lease.recipient, lease.amount + (groupedLeases.get(lease.recipient) || 0));
      }

      const activeLeases: {address: string; name?: string; amount: number}[] = [];
      for (const [address, amount] of groupedLeases.entries()) {
        const node = await CommunityNodesService.info(address);
        activeLeases.push({address, name: node?.name, amount});
      }

      setLeases(activeLeases.sort((a, b) => b.amount - a.amount));
    } catch (error) {
      throw new Error(`Error retrieving active leases. ${error}`);
    }
  };

  const loadTransactions = async () => {
    // TODO: DC, uncomment this section to view the design of the component when empty data.
    /*setTransactions([
      {
        date: 'NOW',
        data: [
          {
            id: 'ss',
            type: 1,
            version: '0',
            fee: 1,
            timestamp: 1000000,
            sender: "sender",
            transfers: "transfers",
            anchors: "anchors",
            associationType: 1,
            accounts: "accounts",
            amount: 1,
            recipient: "recipient",
            leaseId: "leaseId",
            lease: { id: "1", recipient: "recipient", amount: 1 },
            pending: false,
          }
        ]
      },
      {
        date: 'NOW',
        data: [
          {
            id: 'ss',
            type: 1,
            version: '0',
            fee: 1,
            timestamp: 1000000,
            sender: "sender",
            transfers: "transfers",
            anchors: "anchors",
            associationType: 1,
            accounts: "accounts",
            amount: 1,
            recipient: "recipient",
            leaseId: "leaseId",
            lease: { id: "1", recipient: "recipient", amount: 1 },
            pending: false,
          }
        ]
      }
    ])*/
    if (accountAddress === '') {
      setTransactions([]);
      return;
    }

    try {
      const txs: TypedTransaction[] = await LTOService.getTransactions(accountAddress, LATEST_TRANSACTIONS);
      const txsByDate = new Map();

      for (const tx of txs.sort((a, b) => b.timestamp! - a.timestamp!)) {
        const date = formatDate(tx.timestamp!);
        txsByDate.set(date, [...(txsByDate.get(date) || []), tx]);
      }
      setTransactions(Array.from(txsByDate.entries()).map(([date, txs]) => ({date, data: txs})));
    } catch (error) {
      // throw new Error(`Error retrieving latest transactions. ${error}`)
      console.log('>> ERROR: Error retrieving latest transactions');
    }
  };

  useEffect(() => {
    const controller = updatePriceInfo();
    return () => controller.abort();
  }, []);

  useInterval(() => {
    updatePriceInfo();
  }, 30 * 1000);

  const updatePriceInfo = () => {
    const controller = new AbortController();
    const signal = controller.signal;

    CoinPriceService.getCoinInfo(signal)
      .then(price => {
        setCoinData(price);
      })
      .catch(error => {
        throw new Error(`Error retrieving coin data. ${error}`);
      });

    return controller;
  };

  const effectiveAmount = () => {
    return regular * price;
  };

  const change = effectiveAmount();

  const checkPositiveNegative = (value: number) => {
    if (value > 0) {
      return (
        <Typography color={'#34C759'} size={4}>
          {value?.toFixed(2)}%{' '}
          <Typography size={4} color={'#ffffff'}>
            (last 24 hrs)
          </Typography>
        </Typography>
      );
    } else if (value < 0) {
      return (
        <Typography color={'#dd4794'} size={4}>
          {value?.toFixed(2)}%{' '}
          <Typography size={4} color={'#ffffff'}>
            (last 24 hrs)
          </Typography>
        </Typography>
      );
    } else {
      return (
        <Typography color={'#34C759'} size={4.5}>
          {value?.toFixed(2)}%{' '}
          <Typography size={4.5} color={'#ffffff'}>
            (last 24 hrs)
          </Typography>
        </Typography>
      );
    }
  };

  const renderLease = (lease: {address: string; name?: string; amount: number}) => {
    const color = Colors[colorScheme];
    return (
      <List.Item
        key={`lease:${lease.address}`}
        title={lease.name ?? shortAddress(lease.address)}
        titleStyle={{fontSize: 14, color: color.white[100], textTransform: 'uppercase'}}
        description={lease.name || true ? shortAddress(lease.address) : ''}
        descriptionStyle={{fontSize: 12, marginBottom: 0, color: color.white[200]}}
        right={({style}) => (
          <Text style={{...style, alignSelf: 'center', color: color.white[100]}}>
            {formatNumber(lease.amount)} <Text style={{color: color.white[200]}}>LTO</Text>
          </Text>
        )}
        onPress={() => navigation.navigate('Lease', {address: lease.address})}
      />
    );
  };

  const handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState?.match(/background/) && isSignOutForced) {
      console.log('>>> Locking screen');
      navigation.replace('SignIn');
    }
    setAppState(nextAppState);
  };

  useEffect(() => {
    const unsubscribeAppState = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      unsubscribeAppState.remove();
    };
  }, [isSignOutForced]);

  const handleMoreTransactionPressed = () => {
    //open external link
    const url = `${WALLET_URL}/address/${accountAddress}`;
    InAppBrowser.open(url);
  };

  return (
    <>
      {isExitPopupVisible && (
        <ExitPopup>
          <ExitMessage>
            <Text style={{color: '#ffffff'}}>Tap again to exit</Text>
          </ExitMessage>
        </ExitPopup>
      )}
      <Loader loading={isLoading}>
        <Container>
          <ImageBackground source={backgroundImage} style={{width, height: height / 2, position: 'absolute'}} />
          <OverviewContainer style={{height}}>
            <TopContainer>
              <OverviewHeader
                icon={'menu'}
                hideQR
                onPress={() => navigation.navigate('Menu')}
                input={<StyledImage testID="logo-title" source={logoTitle} />}
              />

              <Spacer size={40} />

              <TopCardsRipple
                onPress={() => setShowBalanceDetails(!showBalanceDetails)}
                borderless={true}
                style={{
                  paddingLeft: 16,
                  paddingRight: 16,
                }}>
                <TopCardsContainer>
                  <TopCard>
                    <Card.Content>
                      <Typography color={Colors[colorScheme].white[200]} size={4}>
                        {WALLET.REGULAR}
                      </Typography>
                      <AmountContainer>
                        <Typography color={Colors[colorScheme].white[100]} size={12} bold>
                          {formatNumber(regular)}
                        </Typography>
                        <Spacer size={4} />
                        <Typography color={Colors[colorScheme].white[100]} size={5} bold>
                          LTO
                        </Typography>
                      </AmountContainer>
                      <Typography color={Colors[colorScheme].white[100]} size={4}>
                        {WALLET.EQUIVALENT}{' '}
                        <Typography color={Colors[colorScheme].purple[100]} size={4}>
                          {formatNumber(change)}
                          {WALLET.DOLLAR_SYMBOL}
                        </Typography>
                      </Typography>
                    </Card.Content>
                  </TopCard>

                  <TopCard>
                    <Card.Content>
                      <Typography color={Colors[colorScheme].white[200]} size={4}>
                        {WALLET.PRICE}
                      </Typography>
                      <AmountContainer>
                        <Typography color={Colors[colorScheme].white[100]} size={12} bold>
                          {price?.toFixed(3)}
                        </Typography>
                        <Spacer size={4} />
                        <Typography color={Colors[colorScheme].white[100]} size={5} bold>
                          {WALLET.DOLLAR_SYMBOL}
                        </Typography>
                      </AmountContainer>
                      {checkPositiveNegative(percent_change_24h)}
                    </Card.Content>
                  </TopCard>
                </TopCardsContainer>
              </TopCardsRipple>
            </TopContainer>

            <ScrollContainer style={{marginTop: 2}} innerStyle={{paddingBottom: 130}}>
              <Collapsible
                collapsed={!showBalanceDetails}
                style={{
                  alignItems: 'center',
                }}>
                <BottomCardsContainer>
                  <BottomTile title={WALLET.LEASING} value={formatNumber(leasing, 0)} suffix={WALLET.LTO} />
                  <Spacer size={25} />
                  <BottomTile title={WALLET.UNBONDING} value={formatNumber(unbonding, 0)} suffix={WALLET.LTO} />
                  <Spacer size={25} />
                  <BottomTile title={WALLET.AVAILABLE} value={formatNumber(available, 0)} suffix={WALLET.LTO} />
                  <Spacer size={25} />
                  <BottomTile title={WALLET.EFFECTIVE} value={formatNumber(effective, 0)} suffix={WALLET.LTO} />
                </BottomCardsContainer>
              </Collapsible>

              <If condition={leases.length > 0}>
                <ActivityCard>
                  <ActivityCardTitle>
                    <Typography size={6} color={Colors[colorScheme ?? 'dark'].white[100]} bold>
                      {WALLET.ACTIVE_LEASES}
                    </Typography>
                  </ActivityCardTitle>
                  <ShortList data={leases} renderItem={({item}) => renderLease(item)} />
                </ActivityCard>
              </If>

              <If condition={transactions.length > 0}>
                <ActivityCard>
                  <ActivityCardTitle>
                    <Typography size={6} color={Colors[colorScheme ?? 'dark'].white[100]} bold>
                      {WALLET.RECENT_ACTIVITY}
                    </Typography>
                  </ActivityCardTitle>
                  <Card.Content>
                    <ShortSectionList
                      sections={transactions}
                      renderSectionHeader={({section: {date}}) => (
                        <List.Subheader
                          key={`transaction.section:${date}`}
                          style={{color: Colors[colorScheme ?? 'dark'].white[200]}}>
                          {date}
                        </List.Subheader>
                      )}
                      renderItem={({item}) => (
                        <TransactionListItem direction={item.sender === accountAddress ? 'out' : 'in'} tx={item} />
                      )}
                    />
                  </Card.Content>
                  <Card.Actions>
                    <Button color="#9D8EE6" style={{width: '100%'}} onPress={() => handleMoreTransactionPressed()}>
                      {WALLET.MORE}
                    </Button>
                  </Card.Actions>
                </ActivityCard>
              </If>
            </ScrollContainer>
          </OverviewContainer>
        </Container>

        {children}
      </Loader>
    </>
  );
};

export default function WalletTabScreen({navigation}: RootTabScreenProps<'Wallet'>) {
  return (
    <React.Fragment>
      <MainTab navigation={navigation}>
        <WalletFAB
          transfer={() => navigation.navigate('CreateTransfer')}
          lease={() => navigation.navigate('CreateLease')}
        />
      </MainTab>
    </React.Fragment>
  );
}
