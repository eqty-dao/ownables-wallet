import {TypedTransaction} from '../interfaces/TypedTransaction';

export const confirmationMessage = (tx: TypedTransaction) => {
  switch (tx.type) {
    case 4:
      return `Are you sure you want to transfer ${tx.amount! / 100000000} LTO to ${tx.recipient}?`;
    case 8:
      return `Do you want to lease ${tx.amount! / 100000000} LTO to ${tx.recipient}?`;
    case 9:
      return 'Do you want to cancel the lease?';
    case 11:
      if (!Array.isArray(tx.transfers)) throw new Error('Invalid mass transfer transaction');
      const amount = tx.transfers.reduce((a: number, tx: TypedTransaction) => a + (tx.amount ?? 0), 0);
      return tx.transfers.length === 1
        ? `Are you sure you want to transfer ${amount / 100000000} LTO to ${tx.transfers[0].recipient}?`
        : `Are you sure you want to transfer a total of ${(amount / 10) ^ 8} LTO to ${tx.transfers.length} recipients?`;
    case 12:
      return 'Do you want to set data of your account?';
    case 13:
      return 'Are you sure you want to set a script for this account? This could result in a loss of funds.';
    case 15:
      if (!Array.isArray(tx.anchors)) throw new Error('Invalid anchor transaction');
      return tx.anchors.length <= 1
        ? 'Do you want to submit an anchor to the blockchain?'
        : `Do you want to submit ${tx.anchors.length} anchors to the blockchain?`;
    case 16:
      return ((tx.associationType ?? 0) & 0x100) > 0
        ? 'Do you want to add a DID verification method?'
        : `Do you want to create an association with ${tx.recipient}?`;
    case 17:
      return ((tx.associationType ?? 0) & 0x100) > 0
        ? 'Do you want to remove a DID verification method?'
        : `Do you want to revoke an association with ${tx.recipient}?`;
    case 18:
      return `Are you sure you want to sponsor fees for all transactions done by ${tx.recipient}?`;
    case 19:
      return `Do you want to stop sponsoring ${tx.recipient}?`;
    case 20:
      if (!Array.isArray(tx.accounts)) throw new Error('Invalid register transaction');
      return `Do you want to register ${tx.accounts.length} public ${tx.accounts.length === 1 ? 'key' : 'keys'}?`;
    case 21:
      return `Are you sure you want to burn ${tx.amount! / 100000000} LTO?`;

    default:
      throw new Error(`Unsupported transaction type ${tx.type}`);
  }
};
