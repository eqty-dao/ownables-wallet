import { createContext, useState, useContext } from "react";
import FilterService from "../services/Filter.service";
import CollectionService, {
  StaticCollections,
} from "../services/Collection.service";
import { EventChain } from "@ltonetwork/lto";
import { TabType } from "../components/OwnablesTabs";

interface FilterContextType {
  filteredPackages: Array<string>;
  collection: string;
  issuer: string;
  type: string;
  isFiltering: boolean;
  selectedTab: TabType;
  filterBy: (issuer: string, type: string, collection: string) => any;
  addPackages: (packages: Array<{ chain: EventChain; package: string }>) => any;
  getCollectionName: (slug: string) => any;
  resetFilter: () => any;
  setSelectedTab: (tab: TabType) => any;
  changeCollection: (collection: string) => any;
}

const FilterContext = createContext<FilterContextType>({
  filteredPackages: [],
  collection: "",
  selectedTab: TabType.COLLECTIONS,
  issuer: "",
  type: "",
  isFiltering: false,
  filterBy: () => {},
  addPackages: () => {},
  getCollectionName: () => {},
  resetFilter: () => {},
  setSelectedTab: () => {},
  changeCollection: () => {},
});

interface Props {
  children: React.ReactElement;
}

export const FilterProvider = (props: Props) => {
  const [filteredPackages, setPackages] = useState<Array<string>>(
    FilterService.filterBy("", "", StaticCollections.ALL)
  );

  const [selectedTab, setSelectedTab] = useState<TabType>(TabType.COLLECTIONS);

  const [collection, setCollection] = useState<string>(StaticCollections.ALL);
  const [issuer, setIssuer] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [isFiltering, setFiltering] = useState<boolean>(false);

  const addPackages = (packages: any) => setPackages(packages);

  const filterBy = (issuer: string, type: string, collection: string) => {
    const results = FilterService.filterBy(issuer, type, collection);
    setFiltering(true);
    setPackages(results);
    setCollection(collection);
    setIssuer(issuer);
    setType(type);
  };

  const resetFilter = () => setFiltering(false);

  const getCollectionName = (slug: string) => {
    const found = CollectionService.find(slug);
    if (!found || found.length === 0) return "";

    return found[0].value;
  };

  const changeCollection = (collection: string) => setCollection(collection);

  const contextValue: FilterContextType = {
    collection,
    issuer,
    type,
    filteredPackages,
    isFiltering,
    filterBy,
    addPackages,
    getCollectionName,
    resetFilter,
    selectedTab,
    setSelectedTab,
    changeCollection,
  };

  return (
    <FilterContext.Provider value={contextValue}>
      {props.children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => useContext(FilterContext);
