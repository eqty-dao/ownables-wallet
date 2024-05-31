import {TypedCommunityNode} from '../interfaces/TypedCommunityNode';

const COMMUNITY_NODES_URL = process.env.COMMUNITY_NODES_URL;

export default class CommunityNodesService {
  public static readonly isConfigured = !!COMMUNITY_NODES_URL;
  private static nodes: TypedCommunityNode[];

  private static loadNodes = async () => {
    if (!COMMUNITY_NODES_URL) {
      CommunityNodesService.nodes = [];
      return;
    }

    const response = await fetch(COMMUNITY_NODES_URL!);
    const {nodes} = await response.json();

    CommunityNodesService.nodes = nodes;
  };

  public static info = async (address: string): Promise<TypedCommunityNode | undefined> => {
    if (!CommunityNodesService.nodes) await CommunityNodesService.loadNodes();
    return CommunityNodesService.nodes.find(node => node.address.toLowerCase() === address.toLowerCase());
  };

  public static list = async (): Promise<TypedCommunityNode[]> => {
    if (!CommunityNodesService.nodes) await CommunityNodesService.loadNodes();
    return CommunityNodesService.nodes.filter(node => !node.hide);
  };
}
