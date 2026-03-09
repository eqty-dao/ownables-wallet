import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  AppState,
  AppStateStatus,
  BackHandler,
  ImageBackground,
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
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import EvmTransactionService from '../../services/EvmTransaction.service';
import WalletNetworkService from '../../services/WalletNetwork.service';
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
import If from '../../components/If';
import WalletFAB from '../../components/WalletFAB';
import Collapsible from 'react-native-collapsible';
import ShortSectionList from '../../components/ShortSectionList';
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
import { toLegacyDetails, toLegacyTransactions } from '../../utils/legacyWalletAdapters';
const LEGACY_DISPLAY_FACTOR = 100000000;

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
  const [transactions, setTransactions] = useState<{date: string; data: TypedTransaction[]}[]>([]);
  const [details, setDetails] = useState<TypedDetails>({} as TypedDetails);
  const [coinData, setCoinData] = useState<TypedCoinData>({} as TypedCoinData);

  const {available, effective, regular, unbonding} = details;
  const {price, percent_change_24h} = coinData;

  const isFocused = useIsFocused();

  const colorScheme = useColorScheme() ?? 'dark';

  const {isSignOutForced, network} = useUserSettings();

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
      Promise.all([loadAccountDetails(), loadTransactions()]).then(() => setIsLoading(false));
    }, [accountAddress]),
  );

  useInterval(() => {
    loadAccountDetails();
    loadTransactions();
  }, null);

  //F-2024-4601 - Exposed Sensitive Information in Console Logs
  const loadAccount = async () => {
    try {
      const account = await AccountLifecycleService.getAccount();
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
    const accountDetails = await EvmTransactionService.getNativeBalance(accountAddress as `0x${string}`, network);
    if (accountDetails) {
      setDetails(toLegacyDetails(accountDetails.balanceEth));
    } else {
      setDetails({} as TypedDetails);
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
      const explorerTxs = await EvmTransactionService.getAddressTransactions({
        address: accountAddress,
        network,
      });
      const txs: TypedTransaction[] = toLegacyTransactions(explorerTxs).slice(0, LATEST_TRANSACTIONS);
      // console.log('txs', txs);
      const txsByDate = new Map();

      for (const tx of txs.sort((a, b) => b.timestamp! - a.timestamp!)) {
        const date = formatDate(tx.timestamp!);
        txsByDate.set(date, [...(txsByDate.get(date) || []), tx]);
      }
      setTransactions(Array.from(txsByDate.entries()).map(([date, txs]) => ({date, data: txs})));
    } catch (error) {
      // throw new Error(`Error retrieving latest transactions. ${error}`)
      console.log(`WalletScreen: loadTransactions: Error retrieving latest transactions. ${error}`);
      setTransactions([]);
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
    return (regular / LEGACY_DISPLAY_FACTOR) * price;
  };

  const change = effectiveAmount();
  const regularEth = regular / LEGACY_DISPLAY_FACTOR;
  const unbondingEth = unbonding / LEGACY_DISPLAY_FACTOR;
  const availableEth = available / LEGACY_DISPLAY_FACTOR;
  const effectiveEth = effective / LEGACY_DISPLAY_FACTOR;

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
    const url = WalletNetworkService.getExplorerAddressUrl(accountAddress, network);
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
                          {formatNumber(regularEth)}
                        </Typography>
                        <Spacer size={4} />
                        <Typography color={Colors[colorScheme].white[100]} size={5} bold>
                          ETH
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
                  <BottomTile title={WALLET.UNBONDING} value={formatNumber(unbondingEth)} suffix={WALLET.LTO} />
                  <Spacer size={25} />
                  <BottomTile title={WALLET.AVAILABLE} value={formatNumber(availableEth)} suffix={WALLET.LTO} />
                  <Spacer size={25} />
                  <BottomTile title={WALLET.EFFECTIVE} value={formatNumber(effectiveEth)} suffix={WALLET.LTO} />
                </BottomCardsContainer>
              </Collapsible>

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
                    <Button color="#615fff" style={{width: '100%'}} onPress={() => handleMoreTransactionPressed()}>
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
        <WalletFAB transfer={() => navigation.navigate('CreateTransfer')} />
      </MainTab>
    </React.Fragment>
  );
}
