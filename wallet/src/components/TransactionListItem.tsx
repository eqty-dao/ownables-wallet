import React from 'react';
import {shortAddress} from '../utils/shortAddress';
import {ActivityIndicator, List} from 'react-native-paper';
import txTypes from '../constants/TransactionTypes';
import {Text} from 'react-native';
import {formatNumber} from '../utils/formatNumber';
import {TypedTransaction} from '../interfaces/TypedTransaction';
import {navigateToTransaction} from '../utils/redirectSocialMedia';
import Colors from '../constants/Colors';
import useEffectiveColorScheme from '../hooks/useEffectiveColorScheme';

export default function TransactionListItem(params: {direction: 'in' | 'out'; tx: TypedTransaction}): JSX.Element {
  const {direction, tx} = params;
  const colorScheme = useEffectiveColorScheme();

  const color = Colors[colorScheme];

  let description = '';
  if (direction === 'out') {
    if (tx.type === 11) {
      description = `To: ${tx.transfers.length} recipients`;
    } else if (tx.lease?.recipient) {
      description = 'To: ' + shortAddress(tx.lease?.recipient);
    } else if (tx.recipient) {
      description = 'To: ' + shortAddress(tx.recipient);
    }
  } else {
    description = 'From: ' + shortAddress(tx.sender);
  }

  const amount = tx.amount ?? tx.lease?.amount;
  const displayAmount = tx.valueEth ?? (amount !== undefined ? formatNumber(amount / 100000000) : '');
  const symbol = tx.symbol || 'ETH';
  const title = tx.failed ? 'Failed Transfer' : txTypes[tx.type]?.description || 'Transfer';

  return (
    <List.Item
      key={`transaction:${tx.id}`}
      style={{padding: 0}}
      title={title}
      titleStyle={{fontSize: 14, color: color.white[100]}}
      description={description}
      descriptionStyle={{fontSize: 12, marginBottom: 0, color: color.white[200]}}
      onPress={() => navigateToTransaction(tx.id!)}
      left={({color, style}) =>
        tx.pending ? (
          <ActivityIndicator style={{...style, marginLeft: 8}} animating={true} color="#615fff" />
        ) : (
          <List.Icon
            color={color}
            style={{...style, marginLeft: 0, marginRight: 8}}
            icon={txTypes[tx.type].icon[direction]!}
            // icon={"check"}
          />
        )
      }
      right={({style}) => (
        <Text style={{...style, alignSelf: 'center'}}>
          {displayAmount ? (
            <Text style={{color: color.white[100]}}>
              {displayAmount} <Text style={{color: color.white[200]}}>{symbol}</Text>
            </Text>
          ) : (
            ''
          )}
        </Text>
      )}
    />
  );
}
