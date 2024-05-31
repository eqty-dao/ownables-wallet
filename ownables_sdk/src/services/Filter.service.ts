import LocalStorageService from "./LocalStorage.service";
import CollectionService, { StaticCollections } from "./Collection.service";
import { EventChain } from "@ltonetwork/lto";

const PACKAGES = "packages";

class FilterService {
  static getAll(): Array<{ chain: EventChain; package: string }> {
    const packages = LocalStorageService.get(PACKAGES) || [];
    if (packages.length === 0) return [];

    return packages;
  }

  // DC: TODO implement type when added in package.json
  static filterBy(issuer: string, type: string, collection?: string): any {
    let packages: any = FilterService.getAll();
    if (packages.length === 0) return [];

    if (!collection) return FilterService.getAll();

    if (issuer.length > 0) {
      // Filter packages by issuer
      packages =
        packages.filter((item: any) => item.collaborators.includes(issuer)) ||
        [];
    }

    if (type.length > 0) {
      // TODO: include type when LTO team added in
      // packages = packages.filter((item: any) => item.type.includes(type)) || [];
    }

    // Get package names from the filtered packages
    const packageIds = packages
      .map((item: any) => item.chainIds)
      .flatMap((item: string) => item);
    // Get items from the specified collection

    const collectionItems =
      collection === StaticCollections.ALL
        ? CollectionService.getAllItems()
        : CollectionService.getAllItemsFrom(collection);
    if (collectionItems.length === 0) return [];

    // Filter packageIds to only include those present in collectionItems
    const validPackageIds = packageIds.filter((id: any) => {
      return collectionItems.includes(id);
    });
    return validPackageIds;
  }

  static updateChainId(chainId: string, packageCid: string) {
    let packages: any = FilterService.getAll();
    if (packages.length === 0) return [];

    const itemIndex = packages.findIndex(
      (item: any) => item.cid === packageCid
    );

    if (itemIndex > -1) {
      packages[itemIndex].chainIds.push(chainId);
      LocalStorageService.set(PACKAGES, packages);
      return;
    }
  }
}

export default FilterService;
