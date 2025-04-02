import axios from "axios";
import LTOService from "./LTO.service";
import { sign } from "@ltonetwork/http-message-signatures";
import SessionStorageService from "./SessionStorage.service";
import { AppConfig, Env } from "../AppConfig";

export class BridgeService {
  private static obridgeUrl = AppConfig.OBRIDGE();
  private static netWork = AppConfig.Network();

  //Get cost of bridging
  static async getBridgeCost(templateId: number) {
    const url = `${this.obridgeUrl}/oBridgeCost?templateId=${templateId}`;
    try {
      const response = await axios.get(url);
      let bridgeCost = response.data[`${this.netWork}`];
      return bridgeCost;
    } catch (error) {
      console.error(`Error fetching bridge cost: ${error}`);
      return null;
    }
  }

  //get the bridge address
  static async getBridgeAddress() {
    const url = `${this.obridgeUrl}/ServerLtoWalletAddresses`;
    try {
      const response = await axios.get(url);
      let bridgeAddress;
      if (this.netWork === "L") {
        bridgeAddress = response.data.serverLtoWalletAddress_L;
      } else {
        bridgeAddress = response.data.serverLtoWalletAddress_T;
      }
      SessionStorageService.set("bridgeWalletAddress", bridgeAddress);
      return bridgeAddress;
    } catch (error) {
      console.log(`Error fetching bridge address: ${error}`);
      return null;
    }
  }

  //Pay bridging fee
  static async payBridgingFee(fee: number | null, bridgeAddress: string) {
    try {
      if (fee != null) {
        const amount = fee * Math.pow(10, 8);
        const transactionId = await LTOService.transfer(bridgeAddress, amount);
        return transactionId;
      }
    } catch (err) {
      console.error("Fee not provided", err);
    }
  }

  //Bridge the ownable
  static async bridgeOwnableToNft(
    nftReceiverAddress: string,
    txId: string,
    filename: string,
    ownable: Blob
  ) {
    // let tx: TransferTx;

    try {
      let bridgingCosts;
      let bridgeAddress;
      bridgingCosts = await this.getBridgeCost(1);
      console.log("bridgingCosts", bridgingCosts);
      if (bridgingCosts === null) {
        console.log("Bridging Costs undefined. Maybe oBridge not reachable?");
      }
      bridgeAddress = await this.getBridgeAddress();
      console.log("bridgeAddress", bridgeAddress);
      if (bridgeAddress === null) {
        console.log("Bridge Address undefined. Maybe oBridge not reachable?");
      }
      // tx = new TransferTx(bridgeAddress, bridgingCosts);


    } catch (err) {
      console.log("Error:", err);
    }
    try {
      const account = await LTOService.getAccount();
      const ltoNetworkId = LTOService.getNetwork(account.address);

      if (!account) {
        return;
      }



      const urlToSign = `${this.obridgeUrl}/bridgeOwnable`;
      const request = {
        headers: {},
        method: "POST",
        url: urlToSign,
      };
      const signedRequest = await sign(request, { signer: account });
      request.url =
        request.url + `?ltoNetworkId=${ltoNetworkId}&ltoTransactionId=${txId}&nftReceiverAddress=${nftReceiverAddress}`;

      const headers1 = {
        "Content-Type": "multipart/form-data",
        Accept: "*/*",
      };
      const combinedHeaders = { ...signedRequest.headers, ...headers1 };
      //   console.log("combinedHeaders", combinedHeaders);

      const formData = new FormData();
      formData.append("file", ownable, filename);
      const response = await axios.post(request.url, formData, {
        headers: combinedHeaders
      });
      console.log("response", response);
    } catch (err) {
      console.error("bridging failed", err);
    }
  }
}
