import React from 'react';
import {Button} from 'react-native-paper';

export default function ModalButton(props: {onPress: () => void; text: string; bold?: boolean}): JSX.Element {
  return (
    <Button
      mode={'text'}
      color={'#615fff'}
      uppercase={false}
      labelStyle={{fontWeight: '400', fontSize: 15, color: props.bold ? '#303030' : '#888888'}}
      contentStyle={{height: 45, justifyContent: 'center'}}
      style={{width: 300, borderRadius: 20, marginBottom: 10}}
      onPress={props.onPress}>
      {props.text}
    </Button>
  );
}
