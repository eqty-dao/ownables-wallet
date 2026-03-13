import React, {useContext} from 'react';
import {THREE_SECONDS_SNACK_DURATION} from '../constants/Quantities';
import {MessageContext} from '../context/UserMessage.context';
import {StyledSnackbar} from './styles/Snackbar.styles';

export default function SnackbarMessage(): JSX.Element {
  const {showMessage, setShowMessage, setMessageInfo, messageInfo} = useContext(MessageContext);

  return (
    <StyledSnackbar
      wrapperStyle={{bottom: 150, zIndex: 10000}}
      visible={showMessage}
      duration={THREE_SECONDS_SNACK_DURATION}
      onDismiss={() => {
        setShowMessage(false);
        setMessageInfo('');
      }}>
      {messageInfo}
    </StyledSnackbar>
  );
}
