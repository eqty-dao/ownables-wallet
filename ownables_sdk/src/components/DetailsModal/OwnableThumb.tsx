import { Component, createRef, ReactNode, RefObject } from "react";
import { Paper, Tooltip } from "@mui/material";
import OwnableFrame from "../OwnableFrame";
import { Cancelled, connect as rpcConnect } from "simple-iframe-rpc";
import PackageService from "../../services/Package.service";
import { Binary, EventChain } from "@ltonetwork/lto";
import OwnableService, {
  OwnableRPC,
  StateDump,
} from "../../services/Ownable.service";
import {
  TypedMetadata,
  TypedOwnableInfo,
} from "../../interfaces/TypedOwnableInfo";
import isObject from "../../utils/isObject";
import ownableErrorMessage from "../../utils/ownableErrorMessage";
import TypedDict from "../../interfaces/TypedDict";
import { TypedPackage } from "../../interfaces/TypedPackage";
import LTOService from "../../services/LTO.service";
import EventChainService from "../../services/EventChain.service";
import { themeStyles } from "../../theme/themeStyles";
import If from "../If";
import { ReactComponent as CircleCheckIcon } from "../../assets/circle_check_icon.svg";
import LtoOverlay, { LtoOverlayBanner } from "./LtoOverlay";

export interface OwnableThumbProps {
  chain: EventChain;
  packageCid: string;
  selected: boolean;
  onConsume: (info: TypedOwnableInfo) => void;
  onError: (title: string, message: string) => void;
  onOpenModal: () => void;
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

export default class OwnableThumb extends Component<
  OwnableThumbProps,
  OwnableThumbState
> {
  private readonly pkg: TypedPackage;
  private readonly iframeRef: RefObject<HTMLIFrameElement>;
  private busy = false;

  constructor(props: OwnableThumbProps) {
    super(props);

    this.pkg = PackageService.info(props.packageCid);
    this.iframeRef = createRef();
    this.state = {
      initialized: false,
      applied: new EventChain(this.chain.id).latestHash,
      stateDump: [],
      metadata: { name: this.pkg.title, description: this.pkg.description },
    };
  }

  get chain(): EventChain {
    return this.props.chain;
  }

  get isTransferred(): boolean {
    return !!this.state.info && this.state.info.owner !== LTOService.address;
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
      await OwnableService.initStore(this.chain, this.pkg.cid);
      return;
    }

    const iframeWindow = this.iframeRef.current!.contentWindow;
    const rpc = rpcConnect<Required<OwnableRPC>>(window, iframeWindow, "*", {
      timeout: 5000,
    });

    try {
      await OwnableService.init(this.chain, this.pkg.cid, rpc);
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
    } catch (error) {
      this.props.onError(
        "The Ownable returned an error",
        ownableErrorMessage(error)
      );
      return;
    }

    await OwnableService.store(this.chain, stateDump);

    await this.refresh(stateDump);
    this.setState({ applied: this.chain.latestHash, stateDump });
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
  }

  shouldComponentUpdate(
    nextProps: OwnableThumbProps,
    nextState: OwnableThumbState
  ): boolean {
    return nextState.initialized;
  }

  async componentDidUpdate(
    _: OwnableThumbProps,
    prev: OwnableThumbState
  ): Promise<void> {
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

  paperStyle = {
    aspectRatio: "1/1",
    position: "relative",
    borderRadius: "16px",
    animation: this.props.selected ? "bounce .4s ease infinite alternate" : "",
    overflow: "hidden",
  };

  render() {
    return (
      <div>
        <Paper sx={this.paperStyle}>
          <OwnableFrame
            id={this.chain.id}
            packageCid={this.pkg.cid}
            isDynamic={this.pkg.isDynamic}
            iframeRef={this.iframeRef}
            onLoad={() => this.onLoad()}
          />
          {this.props.children}
          <If condition={this.isTransferred}>
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
        </Paper>
        <div onClick={this.props.onOpenModal}>
          <p style={ownableNameStyle}>{this.state.metadata?.name}</p>
          <p style={ownableDescStyle}>{this.state.metadata?.description}</p>
        </div>
      </div>
    );
  }
}
