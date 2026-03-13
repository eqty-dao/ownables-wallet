export interface TypedTransaction {
  id?: string;
  hash?: string;
  type: number;
  version: string;
  fee: number;
  feeEth?: string;
  timestamp?: number;
  sender: string;
  transfers?: any;
  anchors?: any;
  associationType?: number;
  accounts?: any;
  amount?: number;
  recipient?: string;
  valueEth?: string;
  symbol?: string;
  status?: 'pending' | 'success' | 'failed';
  failed?: boolean;
  leaseId?: string;
  lease?: {id: string; recipient: string; amount: number};
  pending?: boolean;
}
