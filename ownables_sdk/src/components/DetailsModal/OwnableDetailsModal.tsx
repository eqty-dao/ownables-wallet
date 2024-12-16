import { Component, ReactNode, RefObject, createRef } from "react";
import { Modal, Box, Paper, Tooltip } from "@mui/material";
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
import asDownload from "../../utils/asDownload";
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
import IDBService from "../../services/IDB.service";

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
    };
  }

  get chain(): EventChain {
    return this.props.chain;
  }

  get isTransferred(): boolean {
    return !!this.state.info && this.state.info.owner !== LTOService.address;
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
      await this.execute({ transfer: { to: bridgeAddress } });
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
      enqueueSnackbar("Successfully bridged!!", { variant: "success" });
    } catch (error) {
      console.error("Error while attempting to bridge:", error);
    }
  }

  private async refresh(stateDump?: StateDump): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error during refresh:", error);
    }
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

  downloadImag = async () => {
    try {
      const images = await IDBService.getAll(`package:${this.pkg.cid}`);
      console.log('Fetched images:', images);

      if (images.length > 0) {
        const image = images.find((i: any) => ["webp", "png", "jpeg", "jpg", "gif"].includes(i.name?.split(".")[1]));
        console.log('Selected image:', image);

        if (image) {
          // const wasm = (await PackageService.getAsset(
          //   cid,
          //   "ownable_bg.wasm",
          //   (fr, file) => fr.readAsArrayBuffer(file)
          // )) as ArrayBuffer;
          const assest = await PackageService.getAsset(this.pkg.cid, image.name, (fr, file) => fr.readAsArrayBuffer(file));
          console.log('Fetched image:', assest);
          //download image
          const blob = new Blob([assest], { type: image.type });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = image.name;
          a.click();
          URL.revokeObjectURL(url);

        } else {
          console.error('No valid image found');
        }
      } else {
        console.error('No images found in IndexedDB');
      }
    } catch (e) {
      console.error("OwnableThumb -> getImage -> e", e);
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

            <If condition={this.isTransferred}>
              <Tooltip
                title="You're unable to interact with this Ownable, because it has been transferred to a different account."
                followCursor
              >
                <LtoOverlay isForDetailsScreen={true}>
                  <LtoOverlayBanner icon={checkIcon} isForDetailsScreen={true}>
                    Transferred
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
            downloadImage={this.downloadImag}
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
            title="Add to Collection"
            open={this.state.showAddToCollection}
            onClose={this.closeAddToCollection}
            pkgId={this.props.chain.id}
          />
        </Box>
      </Modal>
    );
  }
}
