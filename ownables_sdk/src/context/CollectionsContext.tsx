import { createContext, useState, useContext } from "react";
import CollectionService, {
  CollectionItemType,
} from "../services/Collection.service";

interface CollectionContextType {
  collections: CollectionItemType[];
  create: (collectionName: string) => any;
  remove: (collectionName: string) => void;
  removeFrom: (collectionName: string, pkgId: string) => void;
  removeFromAll: (pkgId: string) => void;
  find: (collectionName: string) => any;
  findFrom: (collectionName: string, pkg: string) => boolean;
  addTo: (collectionName: string, pkg: string) => void;
  updateTitle: (collectionName: string, newName: string) => void;
  getAll: () => void;
  getFromCollection: (collectionName: string) => any;
  setUpdating: (value: boolean, collectionId: string) => any;
  updateOpenState: (collectionId: string, isOpen: boolean) => void;
  isUpdatingCollection: boolean;
  updatingCollectionId: string;
  isDownloading: boolean;
  setIsDownloading: (value: boolean) => void;
}

const CollectionContext = createContext<CollectionContextType>({
  collections: [],
  create: () => {},
  remove: () => {},
  find: () => {},
  findFrom: () => false,
  getAll: () => {},
  removeFrom: () => {},
  removeFromAll: () => {},
  addTo: () => {},
  updateTitle: () => {},
  getFromCollection: () => {},
  setUpdating: () => {},
  updateOpenState: () => {},
  isUpdatingCollection: false,
  updatingCollectionId: "",
  isDownloading: false,
  setIsDownloading: () => {},
});

interface Props {
  children: React.ReactElement;
}

const createSlug = (str: string): string => {
  // Replace special characters with hyphens
  const sanitizedStr = str.replace(/[^\w\s-]/g, "").trim();
  // Replace spaces with hyphens
  return sanitizedStr.replace(/\s+/g, "-").toLowerCase();
};

export const CollectionsProvider = (props: Props) => {
  const [collections, setCollections] = useState<Array<CollectionItemType>>(
    CollectionService.getAll()
  );
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isUpdatingCollection, setIsUpdating] = useState<boolean>(false);
  const [updatingCollectionId, setUpdatingCollectionId] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const create = (collectionName: string): CollectionItemType => {
    const collectionId = createSlug(collectionName);
    const newCollection = {
      id: collectionId,
      value: collectionName,
      static: 0,
      items: [],
      isOpen: true,
    };
    CollectionService.add(newCollection);
    setCollections(CollectionService.getAll());
    return newCollection;
  };

  const addTo = (collection: string, pkg: string) => {
    CollectionService.addItemToCollection(collection, pkg);
    setCollections(CollectionService.getAll());
  };

  const find = (collectionId: string) => {
    return CollectionService.find(collectionId) || false;
  };

  const findFrom = (collectionName: string, pkg: string) => {
    const found = CollectionService.findItemFrom(collectionName, pkg);
    if (!found) return false;

    return found;
  };

  const remove = (collectionId: string) => {
    CollectionService.remove(collectionId);
    setCollections(CollectionService.getAll());
  };

  const getAll = () => setCollections(CollectionService.getAll());

  const getFromCollection = (collectionId: string) =>
    CollectionService.findItemsFromCollection(collectionId);

  const removeFrom = (collectionName: string, pkg: string) => {
    CollectionService.removeItemFromCollection(collectionName, pkg);
    setCollections(CollectionService.getAll());
  };

  const removeFromAll = (pkg: string) => {
    CollectionService.removeItemAllCollections(pkg);
    setCollections(CollectionService.getAll());
  };

  const updateTitle = (collectionName: string, newName: string) => {
    CollectionService.updateCollectionName(collectionName, newName);
    setCollections(CollectionService.getAll());
  };

  const updateOpenState = (collectionId: string, isOpen: boolean) => {
    CollectionService.updateOpenState(collectionId, isOpen);
    setCollections(CollectionService.getAll());
  };

  const setUpdating = (value: boolean, collectionId: string) => {
    setIsUpdating(value);
    setUpdatingCollectionId(collectionId);
  };

  const contextValue: CollectionContextType = {
    collections,
    create,
    addTo,
    find,
    findFrom,
    remove,
    getAll,
    removeFrom,
    removeFromAll,
    updateTitle,
    getFromCollection,
    setUpdating,
    isUpdatingCollection,
    updatingCollectionId,
    updateOpenState,
    isDownloading,
    setIsDownloading,
  };

  return (
    <CollectionContext.Provider value={contextValue}>
      {props.children}
    </CollectionContext.Provider>
  );
};

export const useCollections = () => useContext(CollectionContext);
