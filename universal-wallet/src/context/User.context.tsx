import {createContext, useContext, useState} from 'react';

interface UserContextType {
  isSignOutForced: boolean;
  setForceSignOut: (value: boolean) => void;
}

interface Props {
  children: React.ReactElement;
}

const UserContext = createContext<UserContextType>({
  isSignOutForced: false,
  setForceSignOut: () => {},
});

export const UserProvider = ({children}: Props) => {
  const [forceSignout, setForceSignout] = useState<boolean>(false);

  const setForceSignOut = (value: boolean) => setForceSignout(value);

  const value: UserContextType = {
    isSignOutForced: forceSignout,
    setForceSignOut,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserSettings = () => {
  return useContext(UserContext);
};
