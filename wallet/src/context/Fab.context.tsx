import React from 'react';
import {createContext, useState} from 'react';

const FabContext = createContext({} as any);

function FabProviderWrapper(props: any) {
  const [isOpen, setFabOpen] = useState(false);

  return <FabContext.Provider value={{isOpen, setFabOpen}}>{props.children}</FabContext.Provider>;
}

export {FabContext, FabProviderWrapper};
