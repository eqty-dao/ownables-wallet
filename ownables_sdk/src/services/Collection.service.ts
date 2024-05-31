import LocalStorageService from "./LocalStorage.service";

const KEY = "lto.collections";

export interface CollectionItemType {
  id: string;
  value: string;
  static: number;
  items: string[];
}

export enum StaticCollections {
  ALL = "all",
  FAVORITES = "favorites",
  CONSUMED = "consumed",
  ART = "art",
}

const staticCollections: CollectionItemType[] = [
  {
    id: StaticCollections.ALL,
    value: "All",
    static: 1,
    items: [],
  },
  {
    id: StaticCollections.FAVORITES,
    value: "Favorites",
    static: 1,
    items: [],
  },
  {
    id: StaticCollections.ART,
    value: "Art",
    static: 1,
    items: [],
  },
  {
    id: StaticCollections.CONSUMED,
    value: "Used Consumables",
    static: 1,
    items: [],
  },
];

class CollectionService {
  // initialize collections with default values
  static init() {
    // check if static collections are set
    const isInitialized =
      CollectionService.getAll().filter(
        (collection: CollectionItemType) => collection.static === 1
      ).length === staticCollections.length;
    if (isInitialized) return;

    LocalStorageService.set(KEY, staticCollections);
  }

  static getAll() {
    return LocalStorageService.get(KEY) || [];
  }

  static getAllItems() {
    const collections = CollectionService.getAll();
    if (collections.length === 0) return [];

    return collections.flatMap(
      (collection: CollectionItemType) => collection.items
    );
  }

  static getAllItemsFrom(collection: string) {
    const collections = CollectionService.getAll();
    if (collections.length === 0) return [];

    const foundCollection = CollectionService.find(collection);
    if (foundCollection.length === 0) return [];

    return foundCollection[0].items || [];
  }

  static add(collection: CollectionItemType) {
    const all = CollectionService.getAll();
    const newCollections = [...all, collection];
    LocalStorageService.set(KEY, newCollections);
  }

  static addItemToCollection(collection: string, packageName: string) {
    const collections = CollectionService.getAll();
    const foundCollectionIndex = collections.findIndex(
      (item: CollectionItemType) => item.id === collection
    );

    if (foundCollectionIndex > -1) {
      collections[foundCollectionIndex].items.push(packageName);
      LocalStorageService.set(KEY, collections);
      return;
    }

    console.error(`${collection} could not be found`);
  }

  static updateCollectionName(collectionId: string, newName: string) {
    const collections = CollectionService.getAll();
    const foundCollectionIndex = collections.findIndex(
      (item: CollectionItemType) => item.id === collectionId
    );

    if (foundCollectionIndex > -1) {
      collections[foundCollectionIndex].value = newName;
      LocalStorageService.set(KEY, collections);
    } else {
      console.error(`${collectionId} could not be found`);
    }
  }

  static find(name: string) {
    const collections = CollectionService.getAll();
    if (collections.length === 0) return false;

    return collections.filter(
      (collection: CollectionItemType) => collection.id === name
    );
  }

  static findItemsFromCollection(collection: string) {
    const items = CollectionService.getAllItemsFrom(collection);
    if (items.length === 0) return [];
    return items;
  }

  static findItem(packageName: string) {
    const collections = CollectionService.getAll();

    for (const collection of collections) {
      const items = collection.items; //CollectionService.getAllItemsFrom(collection);
      // Check if the item exists in the current collection
      const foundItem = items.find((item: string) => item === packageName);
      if (foundItem) {
        // Return the collection name if item is found
        return collection;
      }
    }

    return false; // Item not found in any collection
  }

  static findItemFrom(collection: string, packageName: string) {
    const items = CollectionService.getAllItemsFrom(collection);
    if (items.length === 0) return false;

    const foundItem = items.find((item: string) => item === packageName);
    if (!foundItem) return false;

    return foundItem;
  }

  static remove(name: string) {
    const all = CollectionService.getAll();
    const newCollections = all.filter(
      (collection: CollectionItemType) => collection.id !== name
    );
    LocalStorageService.set(KEY, newCollections);
  }

  static removeItemFromCollection(collection: string, packageName: string) {
    const collections = CollectionService.getAll();
    const foundCollectionIndex = collections.findIndex(
      (item: CollectionItemType) => item.id === collection
    );

    if (foundCollectionIndex > -1) {
      // Find the index of the package name in the items array
      const packageIndex =
        collections[foundCollectionIndex].items.indexOf(packageName);

      if (packageIndex > -1) {
        // Remove the package name from the items array
        collections[foundCollectionIndex].items.splice(packageIndex, 1);
        // Save the updated collections array to local storage
        LocalStorageService.set(KEY, collections);
        return;
      } else {
        console.log(
          `Package '${packageName}' not found in collection '${collection}'.`
        );
      }
    }

    console.log(`Collection '${collection}' not found.`);
  }

  static update(collection: CollectionItemType) {
    // Retrieve all collections from local storage
    const collections = CollectionService.getAll(); //this.getAll();

    // Find the index of the collection to be updated
    const index = collections.findIndex(
      (c: CollectionItemType) => c.id === collection.id
    );

    if (index !== -1) {
      // Update the collection at the found index
      collections[index] = collection;

      // Save the updated collections array to local storage
      LocalStorageService.set(KEY, collections);

      console.log(`Collection '${collection.value}' updated successfully.`);
    } else {
      console.log(`Collection '${collection.value}' not found.`);
    }
  }

  static removeItemAllCollections(packageName: string) {
    const collections = CollectionService.getAll();

    collections.forEach((collection: CollectionItemType) => {
      const items = collection.items;

      const packageIndex = items.indexOf(packageName);
      if (packageIndex > -1) {
        // Remove the package name from the items array
        collection.items.splice(packageIndex, 1);

        // Remove duplicates by creating a Set and converting back to an array
        collection.items = [...new Set(items)];

        // Save the updated collections array to local storage
        CollectionService.update(collection);
      } else {
        console.log(
          `Package '${packageName}' not found in collection '${collection.value}'.`
        );
      }
    });
  }
}

export default CollectionService;
