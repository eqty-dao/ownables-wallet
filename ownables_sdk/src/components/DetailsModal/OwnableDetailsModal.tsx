import { Component, ReactNode, RefObject, createRef } from "react";
import { Modal, Box, Paper, Tooltip, Dialog, IconButton, Typography, DialogContent, DialogTitle } from "@mui/material";
import OwnableActionsFab from "./OwnableActionsFab";
import { themeColors } from "../../theme/themeColors";
import { themeStyles } from "../../theme/themeStyles";
import PackageService from "../../services/Package.service";
import { ReactComponent as BackIcon } from "../../assets/back_icon.svg";
import { Binary, EventChain } from "@ltonetwork/lto";
import LTOService from "../../services/LTO.service";
import OwnableService, {
  OwnableRPC,
  StateDump,
} from "../../services/Ownable.service";
import TypedDict from "../../interfaces/TypedDict";
import { TypedPackage } from "../../interfaces/TypedPackage";
import { ReactComponent as CircleCheckIcon } from "../../assets/circle_check_icon.svg";
import {
  TypedMetadata,
  TypedOwnableInfo,
} from "../../interfaces/TypedOwnableInfo";
import ownableErrorMessage from "../../utils/ownableErrorMessage";
import shortId from "../../utils/shortId";
import EventChainService from "../../services/EventChain.service";
import isObject from "../../utils/isObject";
import OwnableFrame from "../OwnableFrame";
import If from "../If";
import { Cancelled, connect as rpcConnect } from "simple-iframe-rpc";
import LtoOverlay, { LtoOverlayBanner } from "./LtoOverlay";
import OwnableInfoDrawer from "./OwnableInfoDrawer";
import TransferOwnableDrawer from "./TransferOwnableDrawer";
import FavoriteButton from "./FavoriteButton";
import AddToCollectionDrawer from "./AddtoCollectionDrawer";
import BridgeOwnableDrawer from "./BridgeOwnableDrawer";
import { BridgeService } from "../../services/Bridge.service";
import { RelayService } from "../../services/Relay.service";
import { enqueueSnackbar } from "notistack";
import { sendRNPostMessage } from "../../utils/postMessage";
import SessionStorageService from "../../services/SessionStorage.service";
import LocalStorageService from "../../services/LocalStorage.service";
import { RedeemService } from "../../services/Redeem.service";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import IDBService from "../../services/IDB.service";
import { activityLogService } from "../../services/ActivityLog.service";

interface OwnableProps {
  chain: EventChain;
  packageCid: string;
  selected: boolean;
  onDelete: () => void;
  onConsume: (info: TypedOwnableInfo) => void;
  onError: (title: string, message: string) => void;
  children?: ReactNode;
  onOpenModal: () => void;
  onDeleted: () => void;
}

interface OwnableState {
  initialized: boolean;
  applied: Binary;
  stateDump: StateDump;
  info?: TypedOwnableInfo;
  metadata: TypedMetadata;
}

interface OwnableDetailsModalProps {
  chain: EventChain;
  packageCid: string;
  uniqueMessageHash: string;
  onDelete: () => void;
  onConsume: (info: TypedOwnableInfo) => void;
  onError: (title: string, message: string) => void;
  onClose: (shouldRefresh: boolean) => void;
  children?: ReactNode;

}

interface OwnableDetailsModalState {
  showMenu: boolean;
  showInfo: boolean;
  showAddToCollection: boolean;
  showTransferDialog: boolean;
  initialized: boolean;
  applied: Binary;
  stateDump: StateDump;
  info?: TypedOwnableInfo;
  metadata: TypedMetadata;
  pkgId: string;
  showBridgeDialog: boolean;
  isRedeemable: boolean;
  redeemAddress?: string;
  redeemLoading: boolean;
  redeemStatus: string;
}

const backButtonStyle = {
  border: "none",
  background: "none",
  paddingTop: "30px",
  paddingLeft: "0px",
  paddingBottom: "0px",
};

const modalStyle = {
  overflowY: "auto",
  height: "100%",
  position: "fixed",
  top: "auto",
  bottom: 0,
  left: 0,
  right: 0,
  bgcolor: themeColors.darkBg,
  boxShadow: 24,
  p: 0,
  zIndex: 1300,
  transition: "transform 0.3s ease-out",
};

const ownableNameStyle = {
  ...themeStyles.fs24fw500lh32,
  marginTop: "17px",
  marginBottom: "0px",
  textAlign: "center" as const,
};

const ownableDescStyle = {
  ...themeStyles.fs16fw400lh21,
  overflow: "auto" as any,
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as any,
  WebkitLineClamp: 3,
  marginTop: "5px",
  marginBottom: "16px",
  textAlign: "center" as const,
};

const paperStyle = {
  aspectRatio: "1/1",
  position: "relative",
  borderRadius: "16px",
  overflow: "hidden",
  backgroundColor: "transparent",
};

const checkIcon = <CircleCheckIcon style={{ width: "40px", height: "40px" }} />;

export default class OwnableDetailsModal extends Component<OwnableDetailsModalProps, OwnableDetailsModalState> {
  private readonly pkg: TypedPackage;
  private readonly iframeRef: RefObject<HTMLIFrameElement>;
  private busy = false;
  private hasRWA = false;
  private showRWAModal = false;
  private rwaHtmlContent = '';
  private mnemonic = '';
  private publicKey = '';

  constructor(props: OwnableDetailsModalProps) {
    super(props);
    this.pkg = PackageService.info(props.packageCid) as TypedPackage || { title: "", name: "", cid: "", versions: [] };
    this.iframeRef = createRef();
    this.state = {
      showMenu: false,
      showInfo: false,
      showAddToCollection: false,
      pkgId: "",
      showTransferDialog: false,
      initialized: false,
      applied: new EventChain(this.props.chain.id).latestHash,
      stateDump: [],
      metadata: {
        name: this.pkg.title,
        description: this.pkg.description,
      },
      showBridgeDialog: false,
      isRedeemable: false,
      redeemLoading: false,
      redeemStatus: '',
    };
  }

  get chain(): EventChain {
    return this.props.chain;
  }

  get isTransferred(): boolean {
    const thisOwner = LTOService.address;
    const allEvents = this.chain.events;
    const lastEvent = allEvents[allEvents.length - 1];
    return !!lastEvent?.parsedData?.transfer?.to && lastEvent?.parsedData?.transfer?.to !== thisOwner;
  }

  get isBridged() {
    const bridgeAddress = SessionStorageService.get("bridgeAddress");
    const currentOwner = this.state.info?.owner;
    if (!bridgeAddress || !currentOwner) return false;
    return currentOwner === bridgeAddress;
  }

  get hasNFT(): boolean {
    return this.pkg.keywords?.includes("hasNFT") ?? false;
  }

  get nftNetwork(): string {
    const nftNetwork = this.state.info?.nft?.network;
    return nftNetwork || "";
  }

  private async checkRedeemable(): Promise<boolean> {
    try {
      const genesisAddress = await RedeemService.getOwnableCreator(
        this.chain.events
      );

      this.chain.validate();

      const response = await RedeemService.isRedeemable(
        genesisAddress,
        this.pkg.name
      );
      return response.isRedeemable;
    } catch (error) {
      console.error("Error checking redeemable status:", error);
      return false;
    }
  }

  get isRedeemed(): boolean {
    const ownedBySwap =
      !!this.state.info && this.state.info.owner === this.state.redeemAddress;
    return (
      this.isTransferred && ownedBySwap && this.state.isRedeemable === true
    );
  }


  private async transfer(to: string): Promise<void> {
    try {
      const value = await RelayService.isRelayUp();

      if (value) {
        await this.execute({ transfer: { to: to } });
        const zip = await OwnableService.zip(this.chain);
        const content = await zip.generateAsync({
          type: "uint8array",
        });
        const messageHash = await RelayService.sendOwnable(to, content);
        enqueueSnackbar(`Ownable ${messageHash} sent Successfully!!`, {
          variant: "success",
        });
        //Remove ownable from relay's inbox
        if (this.pkg.uniqueMessageHash) {
          console.log(this.pkg.uniqueMessageHash);
          //Remove ownable from relay's inbox
          await RelayService.removeOwnable(this.pkg.uniqueMessageHash);

          //remove ownable from IDB
          //await OwnableService.delete(this.chain.id);

          //remove hash from localstorage messageHashes
          await LocalStorageService.removeItem(
            "messageHashes",
            this.pkg.uniqueMessageHash
          );

          //remove package from localstorage packages
          // await LocalStorageService.removeByField(
          //   "packages",
          //   "uniqueMessageHash",
          //   this.pkg.uniqueMessageHash
          // );

          //this.props.onRemove();
        }
      } else {
        enqueueSnackbar("Server is down", { variant: "error" });
      }

      // const filename = `ownable.${shortId(this.chain.id, 12, "")}.${shortId(
      //   this.chain.state?.base58,
      //   8,
      //   ""
      // )}.zip`;
      // asDownload(content, filename);
    } catch (error) {
      console.error("Error during transfer:", error);
    }
  }

  // private async transfer(to: string): Promise<void> {
  //   try {
  //     const value = await RelayService.isRelayUp();

  //     if (value) {
  //       await this.execute({ transfer: { to: to } });
  //       const zip = await OwnableService.zip(this.chain);
  //       const content = await zip.generateAsync({
  //         type: "uint8array",
  //       });
  //       const messageHash = await RelayService.sendOwnable(to, content);
  //       enqueueSnackbar(`Ownable ${messageHash} sent Successfully!!`, {
  //         variant: "success",
  //       });
  //       //Remove ownable from relay's inbox
  //       if (this.pkg.uniqueMessageHash) {
  //         await RelayService.removeOwnable(this.pkg.uniqueMessageHash);
  //       }
  //     } else {
  //       enqueueSnackbar("Server is down", { variant: "error" });
  //     }

  //     // const filename = `ownable.${shortId(this.chain.id, 12, "")}.${shortId(
  //     //   this.chain.state?.base58,
  //     //   8,
  //     //   ""
  //     // )}.zip`;
  //     // asDownload(content, filename);
  //   } catch (error) {
  //     console.error("Error during transfer:", error);
  //   }
  // }

  private async bridge(
    address: string,
    fee: number | null,
    nftNetwork?: string
  ): Promise<void> {
    try {
      const bridgeAddress = await BridgeService.getBridgeAddress();

      if (!bridgeAddress) {
        enqueueSnackbar("Bridge not available, please try again later", { variant: "error" });
        return;
      }

      //   const previousHash: string = this.chain.latestHash.hex;

      await this.execute({ transfer: { to: bridgeAddress } });

      this.chain.validate();

      const zip = await OwnableService.zip(this.chain);
      const content = await zip.generateAsync({
        type: "uint8array",
      });
      const filename = `ownable.${shortId(this.chain.id, 12, "")}.${shortId(
        this.chain.state?.base58,
        8,
        ""
      )}.zip`;
      const transactionId = await BridgeService.payBridgingFee(
        fee,
        bridgeAddress
      );
      const contentBlob = new Blob([content], {
        type: "application/octet-stream",
      });
      if (transactionId) {

        await BridgeService.bridgeOwnableToNft(
          address,
          transactionId,
          filename,
          contentBlob
        );
      }
      //remove ownable from relay's inbox
      if (this.pkg.uniqueMessageHash) {
        await RelayService.removeOwnable(this.pkg.uniqueMessageHash);
      }
      const hashes = JSON.parse(localStorage.getItem("messageHashes") || "[]");

      const updatedHashes = hashes.filter(
        (item: any) => item.uniqueMessageHash !== this.pkg.uniqueMessageHash
      );
      localStorage.setItem("messageHashes", JSON.stringify(updatedHashes));
      enqueueSnackbar("Successfully bridged!!", { variant: "success" });
    } catch (error) {
      console.error("Error while attempting to bridge:", error);
    }
  }

  private async refresh(stateDump?: StateDump): Promise<void> {
    if (!stateDump) stateDump = this.state.stateDump;

    if (this.pkg.hasWidgetState)
      await OwnableService.rpc(this.chain.id).refresh(stateDump);

    const info = (await OwnableService.rpc(this.chain.id).query(
      { get_info: {} },
      stateDump
    )) as TypedOwnableInfo;
    const metadata = this.pkg.hasMetadata
      ? ((await OwnableService.rpc(this.chain.id).query(
        { get_metadata: {} },
        stateDump
      )) as TypedMetadata)
      : this.state.metadata;

    this.setState({ info, metadata });
  }

  private async apply(partialChain: EventChain): Promise<void> {
    if (this.busy) return;
    this.busy = true;

    const stateDump =
      (await EventChainService.getStateDump(
        this.chain.id,
        partialChain.state
      )) || // Use stored state dump if available
      (await OwnableService.apply(partialChain, this.state.stateDump));

    await this.refresh(stateDump);

    this.setState({ applied: this.chain.latestHash, stateDump });
    this.busy = false;
  }

  async onLoad(): Promise<void> {
    if (!this.pkg.isDynamic) {
      await OwnableService.initStore(
        this.chain,
        this.pkg.cid,
        this.pkg.uniqueMessageHash
      );
      return;
    }

    const iframeWindow = this.iframeRef.current!.contentWindow;
    const rpc = rpcConnect<Required<OwnableRPC>>(window, iframeWindow, "*", {
      timeout: 5000,
    });

    try {
      await OwnableService.init(
        this.chain,
        this.pkg.cid,
        rpc,
        this.props.uniqueMessageHash
      );
      this.setState({ initialized: true });
    } catch (e) {
      if (e instanceof Cancelled) return;
      this.props.onError("Failed to forge Ownable", ownableErrorMessage(e));
    }
  }

  private async execute(msg: TypedDict): Promise<void> {
    let stateDump: StateDump;

    try {
      stateDump = await OwnableService.execute(
        this.chain,
        msg,
        this.state.stateDump
      );

      await OwnableService.store(this.chain, stateDump);
      await this.refresh(stateDump);
      this.setState({ applied: this.chain.latestHash, stateDump });
    } catch (error) {
      this.props.onError(
        "The Ownable returned an error",
        ownableErrorMessage(error)
      );
      return;
    }
  }
  //@ts-ignore
  private windowMessageHandler = async (event: MessageEvent) => {
    if (
      !isObject(event.data) ||
      !("ownable_id" in event.data) ||
      event.data.ownable_id !== this.chain.id
    )
      return;
    if (this.iframeRef.current!.contentWindow !== event.source)
      throw Error("Not allowed to execute msg on other Ownable");

    await this.execute(event.data.msg);
  };
  downloadOwnable = async () => {
    try {
      // find any image with webp,.png,.jpg,.jpeg,.gif
      const imageFormatExtension = ["webp", "png", "jpg", "jpeg", "gif"]
      const _package = await IDBService.getAll(`package:${this.pkg.cid}`)
      const image = _package.find((i: any) => imageFormatExtension.includes(i.name?.split(".")[1]))
      if (!image) {
        throw new Error("No image found");
      }

      // Ensure we have a valid filename
      const filename = this.pkg.name || 'ownable';
      const extension = image.type || 'webp';
      const safeFilename = `${filename}.webp`;

      // Create a new blob with the correct type
      const imageBlob = new Blob([image], { type: `${image.type || 'image/webp'}` });

      // Convert to base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            // Remove the data URL prefix if it exists
            const base64 = result.includes('base64,') ?
              result.split('base64,')[1] :
              result;
            resolve(base64);
          } else {
            reject(new Error("Failed to convert image to base64"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(imageBlob);
      });

      // Send the image data to the mobile app with guaranteed non-null values
      sendRNPostMessage(JSON.stringify({
        type: "downloadOwnable",
        base64Data: `data:image/${extension};base64,${base64Data}`,
        filename: safeFilename
      }));
    } catch (error) {
      console.error('Error in downloadOwnable:', error);
      // Send error to React Native
      sendRNPostMessage(JSON.stringify({
        type: "error",
        message: "Failed to prepare image for download"
      }));
    }
  }

  downloadImage = async () => {
    try {
      const { image, type } = await OwnableService.getImageAndType(this.chain);
      if (!image) {
        console.error("No image found");
        enqueueSnackbar("Requested data is not available", { variant: "error" });
        return;
      }
      const filename = `${this.state.metadata?.name || 'ownable'}.${type}`;
      sendRNPostMessage(JSON.stringify({ type: "downloadImage", image: image, filename: filename }));
    } catch (e) {
      console.error("OwnableThumb -> getImage -> e", e);
    }
  }

  private async redeem(): Promise<void> {
    this.setState({
      redeemLoading: true,
      redeemStatus: 'Initializing redeem process...'
    });

    try {
      // check the wallet balance
      const balance = await LTOService.getBalance();
      if (balance < 0.000000000000000001) {
        throw new Error('Insufficient balance to redeem ownable');
      }
      // Get redeem address
      this.setState({ redeemStatus: 'Fetching redeem address...' });
      const redeemAddress = await RedeemService.redeemAddress();

      // Get genesis address
      this.setState({ redeemStatus: 'Verifying ownable creator...' });
      const genesisAddress = await RedeemService.getOwnableCreator(
        this.chain.events
      );

      // Log start of redemption
      activityLogService.logActivity({
        activity: `Started Redeeming Ownable ${this.pkg.name} - for ${redeemAddress}`,
        timestamp: new Date().getTime(),
      });

      // Check if redeemable
      this.setState({ redeemStatus: 'Checking validity of ownable...' });
      const response = await RedeemService.isRedeemable(
        genesisAddress,
        this.pkg.name
      );

      if (!response.isRedeemable) {
        throw new Error('This ownable is not redeemable at this time.');
      }

      // Execute transfer
      this.setState({ redeemStatus: 'Transferring ownable...' });
      await this.execute({ transfer: { to: redeemAddress } });

      // Prepare and send ownable
      this.setState({ redeemStatus: 'Preparing ownable for transfer...' });
      const zip = await OwnableService.zip(this.chain);
      const content = await zip.generateAsync({
        type: "uint8array",
      });

      this.setState({ redeemStatus: 'Almost done...' });
      await RelayService.sendOwnable(redeemAddress, content);

      // Store redemption details
      this.setState({ redeemStatus: 'Storing redemption details...' });
      const account = LTOService.getAccount();
      const address = (await account).address;
      await RedeemService.storeDetail(address, response.value, this.chain.id);

      // Clean up if necessary
      if (this.pkg.uniqueMessageHash) {
        this.setState({ redeemStatus: 'Cleaning up...' });
        await RelayService.removeOwnable(this.pkg.uniqueMessageHash);
      }

      // Log successful redemption
      activityLogService.logActivity({
        activity: `Successfully Redeemed Ownable ${this.pkg.name} - for ${redeemAddress}`,
        timestamp: new Date().getTime(),
      });

      enqueueSnackbar("Successfully redeemed!", {
        variant: "success",
        autoHideDuration: 5000
      });

    } catch (error: any) {
      console.error("Error during redeem:", error);

      // Log failed redemption
      activityLogService.logActivity({
        activity: `Failed to Redeem Ownable ${this.pkg.name} - Error: ${error.message}`,
        timestamp: new Date().getTime(),
      });

      enqueueSnackbar(error.message || "Failed to redeem. Please try again.", {
        variant: "error",
        autoHideDuration: 5000
      });
    } finally {
      this.setState({
        redeemLoading: false,
        redeemStatus: ''
      });
    }
  }

  async componentDidMount() {
    window.addEventListener("message", this.windowMessageHandler);

    let bridgeAddress = SessionStorageService.get("bridgeAddress");

    if (!bridgeAddress) {
      bridgeAddress = await BridgeService.getBridgeAddress();
      if (bridgeAddress) {
        SessionStorageService.set("bridgeAddress", bridgeAddress); // Ensure it's stored in sessionStorage after fetching
      }
    }
    //this.setState({ bridgeAddress });
    try {
      const [isRedeemable, redeemAddress] = await Promise.all([
        this.checkRedeemable(),
        RedeemService.redeemAddress(),
      ]);
      this.setState({ isRedeemable, redeemAddress });
    } catch (error) {
      console.error("Error checking redeemable status:", error);
    }

    try {
      const exists = await PackageService.exists(this.pkg.cid, "rwa.html");
      this.hasRWA = exists;
    } catch (error) {
      this.hasRWA = false;
      console.error("Error checking RWA status:", error);
    }
  }

  shouldComponentUpdate(
    nextProps: OwnableDetailsModalProps,
    nextState: OwnableState
  ): boolean {
    return nextState.initialized;
  }
  async componentDidUpdate(
    _: OwnableDetailsModalProps,
    prev: OwnableDetailsModalState
  ): Promise<void> {
    const partial = this.props.chain.startingAfter(this.state.applied);

    if (partial.events.length > 0) await this.apply(partial);
    else if (
      this.state.initialized !== prev.initialized ||
      this.state.applied.hex !== prev.applied.hex
    )
      await this.refresh();
  }


  componentWillUnmount() {
    OwnableService.clearRpc(this.chain.id);
    window.removeEventListener("message", this.windowMessageHandler);
  }

  toggleMenu = () => {
    this.setState((prevState) => ({
      showMenu: !prevState.showMenu,
    }));
  };

  toggleShowInfo = () => {
    this.setState((prevState) => ({
      showInfo: !prevState.showInfo,
    }));
  };

  toggleShowTransferDialog = () => {
    this.setState((prevState) => ({
      showTransferDialog: !prevState.showTransferDialog,
    }));
  };

  BackButton = () => (
    <button onClick={() => this.props.onClose(true)} style={backButtonStyle}>
      <BackIcon />
    </button>
  );

  showRWAContent = async () => {
    try {
      const html = await PackageService.getAssetAsText(this.pkg.cid, "rwa.html");
      const doc = new DOMParser().parseFromString(html, "text/html");
      const bodyText = doc.body.textContent || '';

      // Extract mnemonic and public key with more precise patterns
      const mnemonicMatch = bodyText.match(/Mnemonic:\s*((?:\w+\s+){11}\w+)/);
      const publicKeyMatch = bodyText.match(/Public Key:\s*([A-Za-z0-9]+)$/);

      const mnemonic = mnemonicMatch ? mnemonicMatch[1].trim() : null;
      const publicKey = publicKeyMatch ? publicKeyMatch[1].trim() : null;
    } catch (error) {
      console.error("Error loading RWA content:", error);
      enqueueSnackbar("Failed to load RWA content", { variant: "error" });
    }
  }

  private copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      enqueueSnackbar(`${label} copied to clipboard!`, {
        variant: "success",
        autoHideDuration: 2000
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
      enqueueSnackbar("Failed to copy to clipboard", { variant: "error" });
    });
  }



  onConsumePressed = () => {
    !!this.state.info && this.props.onConsume(this.state.info);
  };

  onClose = () => this.props.onClose(false);

  onValidate = (address: string) => {
    if (!LTOService.isValidAddress(address)) return "Invalid address";
    if (LTOService.address === address) return "Can't transfer to own account";
  };

  toggleAddToCollection = (pkg: string) =>
    this.setState({
      showAddToCollection: !this.state.showAddToCollection,
      pkgId: pkg,
    });

  closeAddToCollection = () =>
    this.setState({ showAddToCollection: false, pkgId: "" });



  render() {
    return (
      <Modal
        open={true}
        onClose={this.props.onClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        sx={modalStyle}
      >
        <Box component="div">
          <Box sx={{ ...modalStyle, p: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <this.BackButton />
              <FavoriteButton packageName={this.props.chain.id} />
            </Box>
            <p style={ownableNameStyle}>{this.state.metadata?.name}</p>
            <p style={ownableDescStyle}>{this.state.metadata?.description}</p>

            <Paper sx={paperStyle}>
              <OwnableFrame
                id={this.chain.id}
                packageCid={this.pkg.cid}
                isDynamic={this.pkg.isDynamic}
                iframeRef={this.iframeRef}
                onLoad={() => this.onLoad()}
              />

              <If condition={this.isTransferred && !this.isBridged}>
                <Tooltip
                  title="You're unable to interact with this Ownable, because it has been transferred to a different account."
                  followCursor
                >
                  <LtoOverlay isForDetailsScreen={false}>
                    <LtoOverlayBanner icon={checkIcon} isForDetailsScreen={false}>
                      Transferred
                    </LtoOverlayBanner>
                  </LtoOverlay>
                </Tooltip>
              </If>
              <If condition={this.isBridged && this.isTransferred}>
                <Tooltip
                  title="You're unable to interact with this Ownable, because it has been transferred to a different account."
                  followCursor
                >
                  <LtoOverlay isForDetailsScreen={false}>
                    <LtoOverlayBanner icon={checkIcon} isForDetailsScreen={false}>
                      Bridged
                    </LtoOverlayBanner>
                  </LtoOverlay>
                </Tooltip>
              </If>
              <If condition={this.isRedeemed}>
                <Tooltip
                  title="You're unable to interact with this Ownable, because it has been sent to the redeemed."
                  followCursor
                >
                  <LtoOverlay isForDetailsScreen={false}>
                    <LtoOverlayBanner icon={checkIcon} isForDetailsScreen={false}>
                      Redeemed
                    </LtoOverlayBanner>
                  </LtoOverlay>
                </Tooltip>
              </If>
            </Paper>
            <OwnableActionsFab
              onDelete={this.props.onDelete}
              open={this.state.showMenu}
              onOpen={this.toggleMenu}
              onClose={this.toggleMenu}
              closeModal={this.onClose}
              packageCid={this.props.packageCid}
              isConsumable={this.pkg.isConsumable && !this.isTransferred}
              isTransferable={this.pkg.isTransferable && !this.isTransferred}
              isBridgeable={!this.isTransferred && this.hasNFT}
              chain={this.props.chain}
              metadata={this.state.metadata}
              onShowInfo={this.toggleShowInfo}
              onConsume={this.onConsumePressed}
              onTransfer={this.toggleShowTransferDialog}
              onAddToCollection={this.toggleAddToCollection}
              showBridge={() => this.setState({ showBridgeDialog: true })}
              title={this.pkg.name}
              onRedeem={(value: number | null) => {
                if (value !== null) {
                  try {
                    this.redeem();
                  } catch (error) {
                    console.error("Error during redeem:", error);
                  }
                }
              }}
              isRedeemable={this.state.isRedeemable && !this.isRedeemed}
              hasRWA={this.hasRWA}
              onShowRWA={this.showRWAContent}
              downloadImage={this.downloadImage}
            />
            <OwnableInfoDrawer
              open={this.state.showInfo}
              onClose={this.toggleShowInfo}
              chain={this.props.chain}
              metadata={this.state.metadata}
            />
            <TransferOwnableDrawer
              title="Transfer Ownable"
              open={this.state.showTransferDialog}
              onClose={this.toggleShowTransferDialog}
              onSubmit={(address) => this.transfer(address)}
              ok="Transfer"
              validate={this.onValidate}
              TextFieldProps={{ label: "Recipient address" }}
            />
            <BridgeOwnableDrawer
              title="Bridge Ownable"
              open={this.state.showBridgeDialog}
              onClose={() => this.setState({ showBridgeDialog: false })}
              onSubmit={(address: string, fee: number | null, nftNetwork: string) =>
                this.bridge(address, fee, nftNetwork)
              }
              validate={() => ""}
              nftNetwork={this.nftNetwork}
            />
            <AddToCollectionDrawer
              title="Add to Category"
              open={this.state.showAddToCollection}
              onClose={this.closeAddToCollection}
              pkgId={this.props.chain.id}
            />
          </Box>
          {this.showRWAModal && (
            <Dialog
              open={this.showRWAModal}
              onClose={() => this.showRWAContent()}
              maxWidth="sm"
              fullWidth
              sx={{
                "& .MuiDialog-paper": {
                  backgroundColor: "#141414",
                  color: "white",
                  borderRadius: "10px",
                  width: "100%",
                  margin: "16px",
                  maxHeight: "calc(100% - 32px)"
                },
                "& .MuiDialogTitle-root": {
                  padding: "16px",
                  borderBottom: "1px solid #2d2d2d",
                  color: "white",
                  fontSize: "18px"
                },
                "& .MuiDialogContent-root": {
                  padding: "16px",
                }
              }}
            >
              <DialogTitle>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={'/logo_popup.png'}
                    alt={"oBuilder Logo"}
                    style={{}}
                  />
                  <b>RWA Details</b>
                </div>
                <IconButton
                  onClick={() => this.showRWAContent()}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: 'white'
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  {(this.mnemonic || this.publicKey) ? (
                    <>
                      {this.mnemonic && (
                        <Box sx={{
                          backgroundColor: '#2d2d2d',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <Typography
                            color="grey.500"
                            variant="caption"
                            sx={{
                              display: 'block',
                              padding: '8px 16px',
                              borderBottom: '1px solid #3d3d3d'
                            }}
                          >
                            Mnemonic
                          </Typography>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            gap: 2
                          }}>
                            <Typography
                              color="white"
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                lineHeight: 1.5,
                                wordBreak: 'break-word',
                                flex: 1
                              }}
                            >
                              {this.mnemonic}
                            </Typography>
                            <IconButton
                              onClick={() => this.copyToClipboard(this.mnemonic!, 'Mnemonic')}
                              sx={{
                                color: 'white',
                                padding: '8px',
                                marginLeft: '8px'
                              }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      )}
                      {this.publicKey && (
                        <Box sx={{
                          backgroundColor: '#2d2d2d',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <Typography
                            color="grey.500"
                            variant="caption"
                            sx={{
                              display: 'block',
                              padding: '8px 16px',
                              borderBottom: '1px solid #3d3d3d'
                            }}
                          >
                            Public Key
                          </Typography>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            gap: 2
                          }}>
                            <Typography
                              color="white"
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                lineHeight: 1.5,
                                wordBreak: 'break-word',
                                flex: 1
                              }}
                            >
                              {this.publicKey}
                            </Typography>
                            <IconButton
                              onClick={() => this.copyToClipboard(this.publicKey!, 'Public Key')}
                              sx={{
                                color: 'white',
                                padding: '8px',
                                marginLeft: '8px'
                              }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box sx={{
                      backgroundColor: '#2d2d2d',
                      borderRadius: 1,
                      padding: '16px',
                      color: 'white',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: this.rwaHtmlContent }} />
                    </Box>
                  )}
                </Box>
              </DialogContent>
            </Dialog>
          )}
        </Box>
      </Modal>
    );
  }
}
