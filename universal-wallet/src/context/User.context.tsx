import { createContext, useContext, useEffect, useState } from 'react';
import LocalStorageService from '../services/LocalStorage.service';
import LTOService from '../services/LTO.service';
import { ENABLE_ENV_SWITCH } from '@env';

export enum Network {
  MAINNET = 'L',
  TESTNET = 'T',
}

export enum Env {
  PROD = 'PROD',
  STAGING = 'STAGING',
}

interface UserContextType {
  isSignOutForced: boolean;
  setForceSignOut: (value: boolean) => void;
  network: Network;
  setNetwork: (network: Network) => void;
  env: Env;
  setEnv: (env: Env) => void;
}

interface Props {
  children: React.ReactElement;
}

const UserContext = createContext<UserContextType>({
  isSignOutForced: false,
  setForceSignOut: () => { },
  network: Network.MAINNET,
  setNetwork: () => { },
  env: Env.PROD,
  setEnv: () => { },
});

export const UserProvider = ({ children }: Props) => {
  const [forceSignout, setForceSignout] = useState<boolean>(false);
  const [network, setNetwork] = useState<Network>(Network.MAINNET);
  const [env, setEnv] = useState<Env>(Env.PROD);


  const setForceSignOut = (value: boolean) => setForceSignout(value);

  useEffect(() => {
    getNetwork();
    getEnv();
  }, []);

  useEffect(() => {
    LTOService.switchNetwork(network);
  }, [network]);

  const getNetwork = () => {
    LocalStorageService.getData('@network')
      .then(data => {
        if (!data) {
          _setNetwork(Network.MAINNET);
          setNetwork(Network.MAINNET);
          return;
        }
        if (data === 'M') {
          _setNetwork(Network.MAINNET);
          setNetwork(Network.MAINNET);
          return;
        }
        setNetwork(data);
      })
      .catch(error => {
        throw new Error(`Error retrieving network data. ${error}`);
      });
  }

  const _setNetwork = (network: Network) => {
    LocalStorageService.storeData('@network', network)
      .then(() => {
        setNetwork(network);
      })
      .catch(error => {
        throw new Error(`Error storing network data. ${error}`);
      });
  }

  const getEnv = () => {
    if (ENABLE_ENV_SWITCH === 'true') {
      LocalStorageService.getData('@env')
        .then(data => {
          if (!data) {
            setEnv(Env.PROD);
            return;
          }
          setEnv(data as Env);
        })
        .catch(error => {
          throw new Error(`Error retrieving env data. ${error}`);
        });
    } else {
      setEnv(Env.PROD);
    }
  }

  const _setEnv = (env: Env) => {
    if (ENABLE_ENV_SWITCH === 'true') {
      LocalStorageService.storeData('@env', env)
        .then(() => {
          setEnv(env as Env);
        })
        .catch(error => {
          throw new Error(`Error storing env data. ${error}`);
        });
    } else {
      setEnv(Env.PROD);
    }
  }


  const value: UserContextType = {
    isSignOutForced: forceSignout,
    setForceSignOut,
    network,
    setNetwork: _setNetwork,
    env,
    setEnv: _setEnv,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserSettings = () => {
  return useContext(UserContext);
};
