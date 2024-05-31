import React from 'react';
import {StatusBar} from 'react-native';
import {Container} from './styles/StatusBarIOS.styles';

export default function StatusBarIOS({backgroundColor, ...props}: {backgroundColor: string}): JSX.Element {
  return (
    <Container style={[{backgroundColor}]}>
      <StatusBar translucent backgroundColor={backgroundColor} {...props} />
    </Container>
  );
}
