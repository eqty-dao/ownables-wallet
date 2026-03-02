export enum EvmErrorCode {
  RPC_UNAVAILABLE = 'RPC_UNAVAILABLE',
  SIGN_REJECTED = 'SIGN_REJECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  CHAIN_NOT_SUPPORTED = 'CHAIN_NOT_SUPPORTED',
  UNKNOWN = 'UNKNOWN',
}

export interface NormalizedEvmError {
  code: EvmErrorCode;
  message: string;
  retryable: boolean;
  cause?: unknown;
}

const toMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Unexpected EVM error';
};

export const normalizeEvmError = (error: unknown): NormalizedEvmError => {
  const message = toMessage(error);
  const lower = message.toLowerCase();

  if (lower.includes('insufficient funds')) {
    return { code: EvmErrorCode.INSUFFICIENT_FUNDS, message, retryable: false, cause: error };
  }

  if (lower.includes('user rejected') || lower.includes('rejected')) {
    return { code: EvmErrorCode.SIGN_REJECTED, message, retryable: false, cause: error };
  }

  if (lower.includes('invalid address')) {
    return { code: EvmErrorCode.INVALID_ADDRESS, message, retryable: false, cause: error };
  }

  if (
    lower.includes('network error')
    || lower.includes('failed to fetch')
    || lower.includes('timeout')
    || lower.includes('transport')
  ) {
    return { code: EvmErrorCode.RPC_UNAVAILABLE, message, retryable: true, cause: error };
  }

  return { code: EvmErrorCode.UNKNOWN, message, retryable: false, cause: error };
};
