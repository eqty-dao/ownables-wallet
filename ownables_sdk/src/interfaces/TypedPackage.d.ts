export interface TypedPackageCapabilities {
  isDynamic: boolean;
  hasMetadata: boolean;
  hasWidgetState: boolean;
  isConsumable: boolean;
  isConsumer: boolean;
  isTransferable: boolean;
}

export interface TypedPackage extends TypedPackageCapabilities {
  // DC: custom id
  id: string;
  title: string;
  detail?;
  name: string;
  description?: string;
  cid: string;
  versions: Array<{ date: Date; cid: string }>;
  // DC: keywords
  keywords: string[];
  // DC: collaborators
  collaborators: string[];
  // DC: chanIds
  chainIds: Array<string>;
}

export interface TypedPackageStub {
  title: string;
  name: string;
  description?: string;
  stub: true;
}
