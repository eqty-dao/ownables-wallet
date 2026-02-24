import * as React from 'react';
import {FAB, Portal, Provider} from 'react-native-paper';
import {useState} from 'react';
import Icon from './Icon';
import {useColorScheme} from 'react-native';
import Colors from '../constants/Colors';
import styled from 'styled-components/native';
import Typography from './Typography';
import Spacer from './Spacer';
import {FabContext} from '../context/Fab.context';

interface StyledFabProps {
  width: number;
  height: number;
  top: number;
}

const StyledFabItem = styled.View<StyledFabProps>`
  align-items: center;
  flex-direction: row;
  width: ${({width}) => width}px;
  height: ${({height}) => height}px;
  top: -${({top}) => top}px;
`;

const IconWrapper = styled.View`
  background-color: #35363b;
  border-radius: 100px;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
`;

// DC: match webview color and size
const StyledIcon = styled(Icon)`
  font-size: 21px;
  left: 2px;
  top: 1px;
`;

const openIconColor = 'rgba(252,252,247,0.85)';
interface FabProps {
  transfer: () => void;
}

const WalletFAB = ({transfer}: FabProps): JSX.Element => {
  const [state, setState] = useState({open: false});
  const {open} = state;
  const colorScheme = useColorScheme();
  const {setFabOpen} = React.useContext(FabContext);

  const handleStateChange = ({open}) => {
    setState({open});
    setFabOpen(open);
  };

  return (
    <Provider>
      <Portal>
        <FAB.Group
          open={open}
          visible
          icon={({color}) =>
            open ? (
              <StyledIcon icon={'close'} size={21} color={color} />
            ) : (
              <StyledIcon icon={'add'} size={21} color={openIconColor} />
            )
          }
          fabStyle={{backgroundColor: open ? '#ffffff' : '#510094'}}
          color={open ? Colors[colorScheme].black[100] : Colors[colorScheme].white[100]}
          actions={[
            {
              icon: () => (
                <StyledFabItem width={112} height={40} top={8}>
                  <IconWrapper>
                    <Icon icon="transfer" size={24} color={Colors[colorScheme].white[100]} />
                  </IconWrapper>
                  <Spacer size={15} />
                  <Typography family="Satoshi" size={4} color={Colors[colorScheme].white[100]}>
                    Transfer
                  </Typography>
                </StyledFabItem>
              ),
              label: '',
              onPress: transfer,
              style: {backgroundColor: '#212227', justifyContent: 'center', width: 140, height: 60, right: -8},
              color: '#212227',
            },
          ]}
          onStateChange={handleStateChange}
        />
      </Portal>
    </Provider>
  );
};

export default React.memo(WalletFAB);
