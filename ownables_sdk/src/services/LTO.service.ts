import { Account, Binary, getNetwork, LTO, Transaction } from "@ltonetwork/lto";
import LocalStorageService from "./LocalStorage.service";
import SessionStorageService from "./SessionStorage.service";
import CryptoJS from "crypto-js";
import { sendRNPostMessage } from "../utils/postMessage";
import { Env, Network } from "../AppConfig";

export const getSeedFromQuery = () => {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get("seed");
}

// Function to derive Network from query parameters
export const getNetworkFromQuery: () => Network = (): Network => {
  const queryParams = new URLSearchParams(window.location.search);
  const networkValue = queryParams.get("network");

  // Map the string to the corresponding Network enum value
  if (networkValue === Network.MAINNET) {
    return Network.MAINNET;
  } else if (networkValue === Network.TESTNET) {
    return Network.TESTNET;
  }

  return Network.MAINNET;
};


const seed = getSeedFromQuery() as string;

const decryptedSeed = () => {
  sendRNPostMessage(JSON.stringify({ type: "Enterning decryptedSeed", data: seed }));
  return seed;
  // const encryptData = (data: string): string => {
  //   const key = process.env.REACT_APP_SECURE_KEY as string;
  //   console.log('key:', key);
  //   return CryptoJS.AES.encrypt(data, key).toString();
  // };

  // try {
  //   console.log('seed:', seed);
  //   console.log('process.env.REACT_APP_SECURE', process.env.REACT_APP_SECURE_KEY);
  //   const encryptedSeed = encryptData(seed);
  //   console.log('encryptedSeed:', encryptedSeed);
  //   const _ = decryptData(seed);
  //   sendRNPostMessage(JSON.stringify({ type: "decryptedSeed", data: _ }));
  //   return _;
  // } catch (error) {
  //   console.error('Error decrypting seed:', error);
  //   sendRNPostMessage(JSON.stringify({ type: "decryptedSeedError", data: JSON.stringify(error) }));
  //   return seed;
  // }
}


export var lto = new LTO(getNetworkFromQuery() as string === "T" ? "T" : "M");

if (getNetworkFromQuery() === "T") {
  lto = new LTO("T");
  lto.nodeAddress = process.env.REACT_APP_LTO_API_URL_T as string;
} else {
  lto = new LTO('L');
  lto.nodeAddress = process.env.REACT_APP_LTO_API_URL_M as string;
}

const SECURE_KEY = process.env.REACT_APP_SECURE_KEY;

const encryptData = (data: string, key: string): string => {
  return CryptoJS.AES.encrypt(data, key).toString();
};

const decryptData = (encryptedData: string): string => {
  const key = process.env.REACT_APP_SECURE_KEY as string;
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  const _ = bytes.toString(CryptoJS.enc.Utf8);
  //console.log('decryptedData:', _);
  return _;
};

export default class LTOService {
  public static readonly networkId = lto.networkId;
  private static _account?: Account;

  public static accountExists(): boolean {
    return !!LocalStorageService.get("@accountData");
  }

  public static isUnlocked(): boolean {
    return this._account !== undefined;
  }

  public static unlock(password: string): void {
    this._account = lto.account({ seed: decryptedSeed() });
  }

  public static get account(): Account {
    if (!this._account) {
      this._account = lto.account({ seed: decryptedSeed() });
    }
    return this._account;
  }

  public static get address(): string {
    if (this._account) return this._account.address;
    return lto.account({ seed: decryptedSeed() }).address;
  }

  public static storeAccount(nickname: string, password: string): void {
    if (!this._account) {
      throw new Error("Account not created");
    }

    if (!this._account.seed) {
      throw new Error("Account not created");
    }

    const encryptedSeed = encryptData(
      this._account.seed,
      password + SECURE_KEY
    );

    LocalStorageService.set("@accountData", [
      {
        nickname: nickname,
        address: this._account.address,
        seed: encryptedSeed,
      },
    ]);

    SessionStorageService.set("@pass", password);
  }

  public static createAccount(): void {
    try {
      this._account = lto.account();
    } catch (error) {
      throw new Error("Error creating account");
    }
  }

  public static importAccount(): void {
    try {
      // this._account = lto.account({ seed: decryptedSeed() });
      const network = getNetworkFromQuery() || "L";
      const seed = decryptedSeed();
      sendRNPostMessage(JSON.stringify({ type: "importAccount", data: { seed, network } }));
      lto = new LTO(network);
      lto.nodeAddress = network === "T" ? process.env.REACT_APP_LTO_API_URL_T as string : process.env.REACT_APP_LTO_API_URL_M as string;
      this._account = lto.account({ seed });
    } catch (error) {
      throw new Error("Error importing account from seeds");
    }
  }

  private static apiUrl(path: string): string {
    return lto.nodeAddress.replace(/\/$/g, "") + path;
  }

  public static async getBalance(address?: string) {
    if (!address) address = this.account.address;

    try {
      const url = this.apiUrl(`/addresses/balance/details/${address}`);
      const response = await fetch(url);
      return response.json();
    } catch (error) {
      console.error("Error fetching balance", error);
      return { regular: 0, available: 0 };
    }
  }

  public static async broadcast(transaction: Transaction): Promise<any> {
    const url = this.apiUrl("/transactions/broadcast");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    });

    if (response.status >= 400) {
      throw new Error(
        "Broadcast transaction failed: " + (await response.text())
      );
    }
    return await response.json();
  }

  public static async anchor(
    ...anchors: Array<{ key: Binary; value: Binary }> | Array<Binary>
  ): Promise<void> {
    if (anchors[0] instanceof Uint8Array) {
      await lto.anchor(this.account, ...(anchors as Array<Binary>));
    } else {
      await lto.anchor(
        this.account,
        ...(anchors as Array<{ key: Binary; value: Binary }>)
      );
    }
  }

  public static async transfer(recipient: string, amount: number | null) {
    try {
      if (!amount) {
        return;
      }
      const tx = await lto.transfer(this.account, recipient, amount);
      return tx.id;
    } catch {
      return "failed";
    }
  }

  public static async verifyAnchors(
    ...anchors: Array<{ key: Binary; value: Binary }> | Array<Binary>
  ): Promise<any> {
    const data =
      anchors[0] instanceof Uint8Array
        ? (anchors as Array<Binary>).map((anchor) => anchor.hex)
        : Object.fromEntries(
          (anchors as Array<{ key: Binary; value: Binary }>).map(
            ({ key, value }) => [key.hex, value.hex]
          )
        );
    (anchors as Array<{ key: Binary; value: Binary }>).map(
      ({ key, value }) => [key.hex, value.hex]
    )
    const url = this.apiUrl("/index/hash/verify?encoding=hex");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  }

  public static isValidAddress(address: string): boolean {
    try {
      return lto.isValidAddress(address);
    } catch (e) {
      return false;
    }
  }

  public static accountOf(publicKey: Binary | string): string {
    return lto.account({
      publicKey: publicKey instanceof Binary ? publicKey.base58 : publicKey,
    }).address;
  }

  public static getAccount = async (): Promise<Account> => {
    if (!this.account) {
      return lto.account({ seed: decryptedSeed() });
    }
    console.log('this.account:', this.account.address);
    return this.account
  }
  public static getNetwork(ltoAddress: string): string {
    return getNetwork(ltoAddress);
  }
}
