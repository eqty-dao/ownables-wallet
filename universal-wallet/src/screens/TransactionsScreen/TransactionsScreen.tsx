import React, {useEffect, useState} from 'react';
import {RootStackScreenProps} from '../../../types';
import OverviewHeader from '../../components/OverviewHeader';
import {Container} from './TransactionsScreen.styles';
import {MainTitle} from '../../components/styles/NextFunctionality.styles';
import LTOService from '../../services/LTO.service';
import {List} from 'react-native-paper';
import {TypedTransaction} from '../../interfaces/TypedTransaction';
import {SectionList} from 'react-native';
import {formatDate} from '../../utils/formatDate';
import {useInterval} from '../../utils/useInterval';
import TransactionListItem from '../../components/TransactionListItem';
import {WALLET} from '../../constants/Text';

export default function TransactionsScreen({navigation}: RootStackScreenProps<'Transactions'>) {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<{date: string; data: TypedTransaction[]}[]>([]);

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
    loadTransactions();
  }, [accountAddress]);

  useInterval(
    () => {
      loadTransactions();
    },
    accountAddress ? 5 * 1000 : null,
  );

  const loadTransactions = async () => {
    if (accountAddress === null) {
      setTransactions([]);
      return;
    }

    try {
      const txs: TypedTransaction[] = await LTOService.getTransactions(accountAddress);
      const txsByDate = new Map();

      for (const tx of txs.sort((a, b) => b.timestamp! - a.timestamp!)) {
        const date = formatDate(tx.timestamp!);
        txsByDate.set(date, [...(txsByDate.get(date) || []), tx]);
      }
      const data = Array.from(txsByDate.entries()).map(([date, txs]) => ({date, data: txs}));
      setTransactions(data);
    } catch (error) {
      throw new Error(`Error retrieving latest transactions. ${error}`);
    }
  };

  return (
    <>
      <Container>
        <OverviewHeader
          marginLeft={-10}
          icon={'close'}
          onPress={() => navigation.goBack()}
          input={<MainTitle>{WALLET.TRANSACTIONS}</MainTitle>}
        />

        <SectionList
          sections={transactions}
          style={{marginLeft: 24, marginRight: 24, marginBottom: 60}}
          renderSectionHeader={({section: {date}}) => <List.Subheader>{date}</List.Subheader>}
          renderItem={({item}) => (
            <TransactionListItem direction={item.sender === accountAddress ? 'out' : 'in'} tx={item} />
          )}
          keyExtractor={item => item.id!}
        />
      </Container>
    </>
  );
}
