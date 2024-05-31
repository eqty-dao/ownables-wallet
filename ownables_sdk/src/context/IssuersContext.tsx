import { createContext, useState, useContext } from "react";
import IssuerService from "../services/Issuer.service";

interface IssuerContextType {
  issuers: string[];
  findIssuer: (issuerName: string) => any;
  getAllIssuers: () => any;
}

const IssuerContext = createContext<IssuerContextType>({
  issuers: [],
  findIssuer: () => {},
  getAllIssuers: () => {},
});

interface Props {
  children: React.ReactElement;
}

export const IssuersProvider = (props: Props) => {
  const [issuers, setIssuers] = useState<Array<string>>(IssuerService.getAll());

  const findIssuer = (issuerName: string) => {
    //return IssuerService.find(collectionId) || false;
  };

  const getAllIssuers = () => setIssuers(IssuerService.getAll())

  const contextValue: IssuerContextType = {
    issuers,
    findIssuer,
    getAllIssuers
  };

  return (
    <IssuerContext.Provider value={contextValue}>
      {props.children}
    </IssuerContext.Provider>
  );
};

export const useIssuers = () => useContext(IssuerContext);
