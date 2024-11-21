import React, { useEffect } from 'react';
import {createContext, useState} from 'react';

const MessageContext = createContext({} as any);

//F-2024-4549 - Insecure Use of Context
const sanitizeHTML = (input: string) => {
  return input.replace(/<script.*?>.*?<\/script>/gi, '').replace(/<.*?>/g, '');
};
function MessageProviderWrapper(props: any) {
  const [showMessage, setShowMessage] = useState(false);
  const [messageInfo, setMessageInfo] = useState('');

  useEffect(() => {
    // sanitize message
    if (messageInfo) {
      setMessageInfo(sanitizeHTML(messageInfo));
    }
  }, [showMessage]);

  return (
    <MessageContext.Provider value={{showMessage, setShowMessage, messageInfo, setMessageInfo}}>
      {props.children}
    </MessageContext.Provider>
  );
}

export {MessageContext, MessageProviderWrapper};
