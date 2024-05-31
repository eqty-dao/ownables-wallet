import CollectionService from "./Collection.service";
import LocalStorageService from "./LocalStorage.service";

const KEY = "packages";

export interface IssuerItemType {
  cid: string;
  collaborators: string[];
}

class IssuerService {
  static getAll() {
    // get only the issuers that belongs to an item added to a collection
    const packages = LocalStorageService.get(KEY) || [];
    if (packages.length === 0) return [];

    const filteredPackages = packages.filter(
      (item: IssuerItemType) => item.collaborators.length > 0
    );
    if (filteredPackages.length === 0) return [];

    const packageIssuers = filteredPackages.map((item: IssuerItemType) => {
      return { cid: item.cid, collaborators: item.collaborators.join(",") };
    });

    const issuers: any = [];
    packageIssuers.forEach((item: IssuerItemType) => {
      const found = CollectionService.findItem(item.cid);
      if (!found) return;

      issuers.push(item.collaborators);
    });

    return issuers;
  }
}

export default IssuerService;
