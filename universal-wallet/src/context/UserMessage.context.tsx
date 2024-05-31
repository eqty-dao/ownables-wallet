import React from 'react';
import {createContext, useState} from 'react';

const MessageContext = createContext({} as any);

function MessageProviderWrapper(props: any) {
  const [showMessage, setShowMessage] = useState(false);
  const [messageInfo, setMessageInfo] = useState('');

  return (
    <MessageContext.Provider value={{showMessage, setShowMessage, messageInfo, setMessageInfo}}>
      {props.children}
    </MessageContext.Provider>
  );
}

export {MessageContext, MessageProviderWrapper};
