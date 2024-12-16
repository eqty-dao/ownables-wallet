export enum Network {
  MAINNET = 'L',
  TESTNET = 'T',
}

export enum Env {
  PROD = 'PROD',
  STAGING = 'STAGING',
}

export const getEnvFromQuery: () => Env = (): Env => {
  const queryParams = new URLSearchParams(window.location.search);
  const envValue = queryParams.get("env");

  if (envValue === Env.PROD) {
    return Env.PROD;
  } else if (envValue === Env.STAGING) {
    return Env.STAGING;
  }

  return Env.PROD;
}
const env = getEnvFromQuery();
export var AppConfig = {

  OBUILDER: () => {
    if (env === Env.STAGING) {
      return process.env.REACT_APP_OBUILDER_STAGING;
    } else {
      return process.env.REACT_APP_OBUILDER_PROD;
    }
  },
  OBRIDGE: () => {
    if (env === Env.STAGING) {
      return process.env.REACT_APP_OBRIDGE_STAGING;
    } else {
      return process.env.REACT_APP_OBRIDGE_PROD;
    }
  },
  RELAY: () => {
    if (env === Env.STAGING) {
      return process.env.REACT_APP_RELAY_STAGING;
    } else {
      return process.env.REACT_APP_RELAY_PROD;
    }
  },
}

