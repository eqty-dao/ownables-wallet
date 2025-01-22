import React from 'react';
import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import {HeaderContainer} from './styles/OverviewHeader.styles';
import {View} from 'react-native';
import Icon from './Icon';
import IconButton from './IconButton';
import Spacer from './Spacer';
import { useNavigation } from '@react-navigation/native';

export default function OverviewHeader(props: {
  onPress?: () => void;
  onQrPress?: () => void;
  icon: React.ComponentProps<typeof IconButton>['icon'];
  input: any;
  marginLeft?: number | undefined;
  hideQR?: boolean;
}): JSX.Element {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();

  return (
    <HeaderContainer {...props}>
      <>{props.input}</>
      <View style={{flexDirection: 'row'}}>
        {props.hideQR && (
          <IconButton onPress={() => {
            navigation.navigate('QrReader');
          }}>
            <Icon icon="qr" size={25} color={Colors[colorScheme].white[100]} />
          </IconButton>
        )}
        <Spacer size={20} />
        <IconButton onPress={props.onPress}>
          <Icon icon={props.icon} color={Colors[colorScheme].white[100]} size={25} />
        </IconButton>
      </View>
    </HeaderContainer>
  );
}
