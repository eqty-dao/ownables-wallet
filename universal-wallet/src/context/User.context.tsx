import { createContext, useContext, useEffect, useState } from 'react';
import LocalStorageService from '../services/LocalStorage.service';
import LTOService from '../services/LTO.service';

interface UserContextType {
  isSignOutForced: boolean;
  setForceSignOut: (value: boolean) => void;
  network: string;
  setNetwork: (network: string) => void;
}

interface Props {
  children: React.ReactElement;
}

const UserContext = createContext<UserContextType>({
  isSignOutForced: false,
  setForceSignOut: () => { },
  network: 'L',
  setNetwork: () => { },
});

export const UserProvider = ({ children }: Props) => {
  const [forceSignout, setForceSignout] = useState<boolean>(false);
  const [network, setNetwork] = useState<string>('L');


  const setForceSignOut = (value: boolean) => setForceSignout(value);

  useEffect(() => {
    getNetwork();
  }, []);

  useEffect(() => {
    LTOService.switchNetwork(network);
  }, [network]);

  const getNetwork = () => {
    LocalStorageService.getData('@network')
      .then(data => {
        if (!data) {
          _setNetwork('T');
          setNetwork('T');
          return;
        }
        if(data === 'M') {
          _setNetwork('L');
          setNetwork('L');
          return;
        }
        setNetwork(data);
      })
      .catch(error => {
        throw new Error(`Error retrieving network data. ${error}`);
      });
  }

  const _setNetwork = (network: string) => {
    LocalStorageService.storeData('@network', network)
      .then(() => {
        setNetwork(network);
      })
      .catch(error => {
        throw new Error(`Error storing network data. ${error}`);
      });
  }


  const value: UserContextType = {
    isSignOutForced: forceSignout,
    setForceSignOut,
    network,
    setNetwork: _setNetwork,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserSettings = () => {
  return useContext(UserContext);
};
