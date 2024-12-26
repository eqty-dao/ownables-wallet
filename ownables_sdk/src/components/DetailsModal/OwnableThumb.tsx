import { Binary, EventChain } from "@ltonetwork/lto";
import { Card, CircularProgress, Paper, Tooltip } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { Component, ReactNode, RefObject, createRef, useEffect, useState } from "react";
import { isObject } from "util";
import TypedDict from "../../interfaces/TypedDict";
import { TypedOwnableInfo, TypedMetadata } from "../../interfaces/TypedOwnableInfo";
import { TypedPackage } from "../../interfaces/TypedPackage";
import { BridgeService } from "../../services/Bridge.service";
import EventChainService from "../../services/EventChain.service";
import LTOService from "../../services/LTO.service";
import OwnableService, { StateDump, OwnableRPC } from "../../services/Ownable.service";
import PackageService from "../../services/Package.service";
import { RelayService } from "../../services/Relay.service";
import SessionStorageService from "../../services/SessionStorage.service";
import ownableErrorMessage from "../../utils/ownableErrorMessage";
import { sendRNPostMessage } from "../../utils/postMessage";
import shortId from "../../utils/shortId";
import If from "../If";
import OwnableFrame from "../OwnableFrame";
import LtoOverlay, { LtoOverlayBanner } from "./LtoOverlay";
import { themeStyles } from "../../theme/themeStyles";
import { Cancelled, connect as rpcConnect } from "simple-iframe-rpc";
import { ReactComponent as CircleCheckIcon } from "../../assets/circle_check_icon.svg";
import IDBService from "../../services/IDB.service";


interface OwnableProps {
  chain: EventChain;
  packageCid: string;
  selected: boolean;
  onConsume: (info: TypedOwnableInfo) => void;
  onError: (title: string, message: string) => void;
  children?: ReactNode;
  onOpenModal: () => void;
  onDeleted?: () => void;
}

interface OwnableState {
  initialized: boolean;
  applied: Binary;
  stateDump: StateDump;
  info?: TypedOwnableInfo;
  metadata: TypedMetadata;
}
export interface OwnableThumbProps {
  chain: EventChain;
  packageCid: string;
  selected: boolean;
  onConsume: (info: TypedOwnableInfo) => void;
  onError: (title: string, message: string) => void;
  onOpenModal: () => void;
  onDeleted?: () => void;
  children?: ReactNode;
}

export interface OwnableThumbState {
  initialized: boolean;
  applied: Binary;
  stateDump: StateDump;
  info?: TypedOwnableInfo;
  metadata: TypedMetadata;
}

const ownableNameStyle = {
  ...themeStyles.fs16fw500lh19,
  marginTop: "12px",
  marginBottom: "0px",
};
const ownableDescStyle = {
  ...themeStyles.fs12fw400lh14,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as "nowrap",
  marginTop: "4px",
  marginBottom: "0px",
};

const checkIcon = <CircleCheckIcon style={{ width: "20px", height: "20px" }} />;


export default class OwnableThumb extends Component<OwnableProps, OwnableState> {
  private readonly pkg: TypedPackage;
  private readonly iframeRef: RefObject<HTMLIFrameElement>;
  private busy = false;

  constructor(props: OwnableProps) {
    super(props);
    this.pkg = PackageService.info(props.packageCid) as TypedPackage;
    this.iframeRef = createRef();
    this.state = {
      initialized: false,
      applied: new EventChain(this.chain.id).latestHash,
      stateDump: [],
      metadata: { name: this?.pkg?.title || "", description: this?.pkg?.description || "" },
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
          await RelayService.removeOwnable(this.pkg.uniqueMessageHash);
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
      await OwnableService.initStore(this.chain, this.pkg.cid, this.pkg.uniqueMessageHash);
      return;
    }

    const iframeWindow = this.iframeRef.current!.contentWindow;
    const rpc = rpcConnect<Required<OwnableRPC>>(window, iframeWindow, "*", {
      timeout: 5000,
    });

    try {
      await OwnableService.init(this.chain, this.pkg.cid, rpc, this.pkg.uniqueMessageHash);
      this.setState({ initialized: true });
    } catch (e) {
      if (e instanceof Cancelled) return;
      this.props.onError("Failed to forge Ownable", ownableErrorMessage(e));
      // sendRNPostMessage(JSON.stringify({ type: "sdkerror", message: e }));
      console.error("Failed to forge Ownable", e);
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
    nextProps: OwnableProps,
    nextState: OwnableState
  ): boolean {
    return nextState.initialized;
  }

  async componentDidUpdate(_: OwnableProps, prev: OwnableState): Promise<void> {
    const partial = this.chain.startingAfter(this.state.applied);
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
  // private readonly pkg: TypedPackage;
  // private readonly iframeRef: RefObject<HTMLIFrameElement>;
  // private busy = false;

  // constructor(props: OwnableThumbProps) {
  //   super(props);

  //   this.pkg = PackageService.info(props.packageCid);
  //   this.iframeRef = createRef();
  //   this.state = {
  //     initialized: false,
  //     applied: new EventChain(this.chain.id).latestHash,
  //     stateDump: [],
  //     metadata: { name: this.pkg.title, description: this.pkg.description },
  //   };
  // }

  // get chain(): EventChain {
  //   return this.props.chain;
  // }

  // get isTransferred(): boolean {
  //   return !!this.state.info && this.state.info.owner !== LTOService.address;
  // }

  // private async refresh(stateDump?: StateDump): Promise<void> {
  //   if (!stateDump) stateDump = this.state.stateDump;

  //   if (this.pkg.hasWidgetState)
  //     await OwnableService.rpc(this.chain.id).refresh(stateDump);

  //   const info = (await OwnableService.rpc(this.chain.id).query(
  //     { get_info: {} },
  //     stateDump
  //   )) as TypedOwnableInfo;
  //   const metadata = this.pkg.hasMetadata
  //     ? ((await OwnableService.rpc(this.chain.id).query(
  //       { get_metadata: {} },
  //       stateDump
  //     )) as TypedMetadata)
  //     : this.state.metadata;

  //   this.setState({ info, metadata });
  // }

  // private async apply(partialChain: EventChain): Promise<void> {
  //   if (this.busy) return;
  //   this.busy = true;

  //   const stateDump =
  //     (await EventChainService.getStateDump(
  //       this.chain.id,
  //       partialChain.state
  //     )) || // Use stored state dump if available
  //     (await OwnableService.apply(partialChain, this.state.stateDump));

  //   await this.refresh(stateDump);

  //   this.setState({ applied: this.chain.latestHash, stateDump });
  //   this.busy = false;
  // }

  // async onLoad(): Promise<void> {
  //   if (!this.pkg.isDynamic) {
  //     await OwnableService.initStore(this.chain, this.pkg.cid);
  //     return;
  //   }

  //   const iframeWindow = this.iframeRef.current!.contentWindow;
  //   const rpc = rpcConnect<Required<OwnableRPC>>(window, iframeWindow, "*", {
  //     timeout: 5000,
  //   });

  //   try {
  //     await OwnableService.init(this.chain, this.pkg.cid, rpc);
  //     this.setState({ initialized: true });
  //   } catch (e) {
  //     if (e instanceof Cancelled) return;
  //     this.props.onError("Failed to forge Ownable", ownableErrorMessage(e));
  //     sendRNPostMessage(JSON.stringify({ type: "sdkerror", data: { error: e } }));
  //   }
  // }

  // get isBridged() {
  //   const bridgeAddress = SessionStorageService.get("bridgeAddress");
  //   const currentOwner = this.state.info?.owner;
  //   if (!bridgeAddress || !currentOwner) return false;
  //   return currentOwner === bridgeAddress;
  // }

  // private async execute(msg: TypedDict): Promise<void> {
  //   let stateDump: StateDump;

  //   try {
  //     stateDump = await OwnableService.execute(
  //       this.chain,
  //       msg,
  //       this.state.stateDump
  //     );

  //     await OwnableService.store(this.chain, stateDump);
  //     await this.refresh(stateDump);
  //     this.setState({ applied: this.chain.latestHash, stateDump });
  //   } catch (error) {
  //     this.props.onError(
  //       "The Ownable returned an error",
  //       ownableErrorMessage(error)
  //     );
  //     return;
  //   }
  // }


  // // private async execute(msg: TypedDict): Promise<void> {
  // //   let stateDump: StateDump;

  // //   try {
  // //     stateDump = await OwnableService.execute(
  // //       this.chain,
  // //       msg,
  // //       this.state.stateDump
  // //     );
  // //   } catch (error) {
  // //     this.props.onError(
  // //       "The Ownable returned an error",
  // //       ownableErrorMessage(error)
  // //     );
  // //     return;
  // //   }

  // //   await OwnableService.store(this.chain, stateDump);

  // //   await this.refresh(stateDump);
  // //   this.setState({ applied: this.chain.latestHash, stateDump });
  // // }

  // private windowMessageHandler = async (event: MessageEvent) => {
  //   if (
  //     !isObject(event.data) ||
  //     !("ownable_id" in event.data) ||
  //     event.data.ownable_id !== this.chain.id
  //   )
  //     return;
  //   if (this.iframeRef.current!.contentWindow !== event.source)
  //     throw Error("Not allowed to execute msg on other Ownable");

  //   await this.execute(event.data.msg);
  // };

  // async componentDidMount() {
  //   window.addEventListener("message", this.windowMessageHandler);
  // }

  // shouldComponentUpdate(
  //   nextProps: OwnableThumbProps,
  //   nextState: OwnableThumbState
  // ): boolean {
  //   return nextState.initialized;
  // }

  // async componentDidUpdate(
  //   _: OwnableThumbProps,
  //   prev: OwnableThumbState
  // ): Promise<void> {
  //   const partial = this.chain.startingAfter(this.state.applied);

  //   if (partial.events.length > 0) await this.apply(partial);
  //   else if (
  //     this.state.initialized !== prev.initialized ||
  //     this.state.applied.hex !== prev.applied.hex
  //   )
  //     await this.refresh();
  // }

  // componentWillUnmount() {
  //   OwnableService.clearRpc(this.chain.id);
  //   window.removeEventListener("message", this.windowMessageHandler);
  // }

  paperStyle = {
    aspectRatio: "1/1",
    position: "relative",
    borderRadius: "16px",
    animation: this.props.selected ? "bounce .4s ease infinite alternate" : "",
    overflow: "hidden",
    backgroundColor: "transparent",
  };

  render() {
    return (
      <div onClick={this.props.onOpenModal}>
        <Paper sx={this.paperStyle}>
          <OwnableFrame
            id={this.chain.id}
            packageCid={this.pkg.cid}
            isDynamic={this.pkg.isDynamic}
            iframeRef={this.iframeRef}
            onLoad={() => this.onLoad()}
          />
          {this.props.children}
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
        </Paper>
        <div onClick={this.props.onOpenModal}>
          <p style={ownableNameStyle}>{this.state.metadata?.name}</p>
          <p style={ownableDescStyle}>{this.state.metadata?.description}</p>
        </div>
      </div>
    );
  }
}




// import { Component, createRef, ReactNode, RefObject, useEffect, useState } from "react";
// import { Card, CircularProgress, Paper, Tooltip } from "@mui/material";
// import OwnableFrame from "../OwnableFrame";
// import PackageService from "../../services/Package.service";
// import { Binary, EventChain } from "@ltonetwork/lto";
// import OwnableService, {
//   OwnableRPC,
//   StateDump,
// } from "../../services/Ownable.service";
// import {
//   TypedMetadata,
//   TypedOwnableInfo,
// } from "../../interfaces/TypedOwnableInfo";
// import isObject from "../../utils/isObject";
// import ownableErrorMessage from "../../utils/ownableErrorMessage";
// import TypedDict from "../../interfaces/TypedDict";
// import { TypedPackage } from "../../interfaces/TypedPackage";
// import LTOService from "../../services/LTO.service";
// import EventChainService from "../../services/EventChain.service";
// import { themeStyles } from "../../theme/themeStyles";
// import If from "../If";
// import LtoOverlay, { LtoOverlayBanner } from "./LtoOverlay";
// import SessionStorageService from "../../services/SessionStorage.service";
// import { sendRNPostMessage } from "../../utils/postMessage";
// import { BridgeService } from "../../services/Bridge.service";
// import { RelayService } from "../../services/Relay.service";
// import { enqueueSnackbar } from "notistack";
// import shortId from "../../utils/shortId";
// import IDBService from "../../services/IDB.service";
// import Loading from "../Loading";
// import LocalStorageService from "../../services/LocalStorage.service";



// export default function OwnableThumb(props: OwnableThumbProps) {

//   const [image, setImage] = useState<string | null>(null)
//   const [info, setInfo] = useState<TypedPackage | null>(null)
//   const [owner, setOwner] = useState<string | null>(null)
//   const getImage = async () => {
//     try {
//       const _ = await IDBService.getAll(`package:${props.packageCid}`)
//       if (_.length > 0) {
//         const image = _.find((i: any) => i.name?.split(".")[1] === "webp" && i.name?.split(".")[0] !== "thumbnail")
//         if (!image) {
//           // try thumbnail
//           const thumbnail = _.find((i: any) => i.name?.split(".")[1] === "webp" && i.name?.split(".")[0] === "thumbnail")
//           if (thumbnail) {
//             setImage(URL.createObjectURL(thumbnail))
//           } else {
//             // find any image with webp,.png,.jpg,.jpeg,.gif
//             const _image = _.find((i: any) => i.name?.split(".")[1] === "webp" || i.name?.split(".")[1] === "png" || i.name?.split(".")[1] === "jpg" || i.name?.split(".")[1] === "jpeg" || i.name?.split(".")[1] === "gif")
//             if (_image) {
//               setImage(URL.createObjectURL(_image))
//             }
//           }
//         }
//         if (image) {
//           setImage(URL.createObjectURL(image))
//         }
//         const metadata = PackageService.info(props.packageCid)
//         if (metadata) {
//           // console.log("OwnableThumb -> metadata", metadata)
//           OwnableService.initStore(props.chain, metadata.cid, metadata.uniqueMessageHash)
//         }
//       }
//     } catch (e) {
//       console.error("OwnableThumb -> getImage -> e", e)
//     }
//   }
//   const getOwnableName = (name: string) => {
//     if (!name) return ""
//     if (name.length > 20) {
//       return name.slice(0, 20) + "..."
//     }
//     //remove the term ownable from the start of the name case insensitive
//     const regex = new RegExp(/ownable/i)
//     const _name = name.replace(regex, "")
//     return _name
//   }
//   useEffect(() => {
//     getImage()
//     const _info = PackageService.info(props.packageCid)
//     const allEvents = props.chain.events;
//     const lastEvent = allEvents[allEvents.length - 1];
//     const _owner = lastEvent?.parsedData?.transfer?.to
//     setOwner(_owner)
//     setInfo(_info)
//     return () => {
//       URL.revokeObjectURL(image as string)
//     }
//   }, [])



//   const isTransferred = () => {
//     return owner !== LTOService.address
//   }

//   const isBridged = () => {
//     const bridgeAddress = SessionStorageService.get("bridgeAddress")
//     const currentOwner = owner
//     if (!bridgeAddress || !currentOwner) return false
//     return currentOwner === bridgeAddress
//   }

//   const hasNFT = () => {
//     return info?.keywords?.includes("hasNFT") ?? false
//   }

//   return (

//     <><Card
//       sx={{
//         aspectRatio: "1/1",
//         position: "relative",
//         borderRadius: "16px",
//         animation: props.selected ? "bounce .4s ease infinite alternate" : "",
//         overflow: "hidden",
//         backgroundColor: "transparent",
//       }}
//       onClick={props.onOpenModal}
//       component={"div"}

//     >
//       {image ?
//         <div>
//           <img src={image} alt="Ownable" style={{ width: "100%", height: "100%" }} />
//           <If condition={props.selected}>
//             <LtoOverlay isForDetailsScreen={false}>
//               <LtoOverlayBanner icon={checkIcon} isForDetailsScreen={false}>
//                 Selected
//               </LtoOverlayBanner>
//             </LtoOverlay>
//           </If>
//           <If condition={isTransferred() && !isBridged()}>
//             <Tooltip
//               title="You're unable to interact with this Ownable, because it has been transferred to a different account."
//               followCursor
//             >
//               <LtoOverlay isForDetailsScreen={false}>
//                 <LtoOverlayBanner icon={checkIcon} isForDetailsScreen={false}>
//                   Transferred
//                 </LtoOverlayBanner>
//               </LtoOverlay>
//             </Tooltip>
//           </If>
//           <If condition={isBridged()}>
//             <Tooltip
//               title="You're unable to interact with this Ownable, because it has been transferred to a different account."
//               followCursor
//             >
//               <LtoOverlay isForDetailsScreen={false}>
//                 <LtoOverlayBanner icon={checkIcon} isForDetailsScreen={false}>
//                   Bridged
//                 </LtoOverlayBanner>
//               </LtoOverlay>
//             </Tooltip>
//           </If>

//         </div>
//         :
//         <CircularProgress style={{ alignSelf: "center", justifySelf: "center", marginTop: "50%" }} />}
//     </Card><div onClick={props.onOpenModal}>
//         <p style={ownableNameStyle}>{getOwnableName(info?.title || "")}</p>
//         <p style={ownableDescStyle}>{info?.description || ""}</p>
//       </div></>

//   );
//}
