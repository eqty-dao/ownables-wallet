import * as React from "react";
import { AlertColor, Button, CircularProgress, Dialog, DialogContent, DialogContentText, Icon } from "@mui/material";
import { ReactComponent as MenuIcon } from "../../assets/actions_menu_icon.svg";
import { ReactComponent as CloseIcon } from "../../assets/close_icon.svg";
import { ReactComponent as DeleteIcon } from "../../assets/delete_icon.svg";
import { ReactComponent as ConsumeIcon } from "../../assets/consume_icon.svg";
import { ReactComponent as TransferIcon } from "../../assets/transfer_icon.svg";
import { ReactComponent as InfoIcon } from "../../assets/info_icon.svg";
import { ReactComponent as PlusIcon } from "../../assets/plus_icon.svg";
import { ReactComponent as SwapIcon } from "../../assets/redeem.svg";
import { ReactComponent as DownloadIcon } from "../../assets/consume_icon.svg";
import { ReactComponent as RWAIcon } from "../../assets/EQTY_BADGE.svg";
import { Download, SwapHoriz } from "@mui/icons-material"
import { EventChain } from "@ltonetwork/lto";
import { TypedMetadata } from "../../interfaces/TypedOwnableInfo";
import { useState } from "react";
import PackageService from "../../services/Package.service";
import ConfirmDrawer from "./ConfirmDrawer";
import { useCollections } from "../../context/CollectionsContext";
import Fab from "../Fab";
import TypedFabItem from "../../interfaces/TypedFabItem";
import { useFilters } from "../../context/FilterContext";
import { StaticCollections } from "../../services/Collection.service";
import { useIssuers } from "../../context/IssuersContext";
import { TabType } from "../OwnablesTabs";
import { RedeemService } from "../../services/Redeem.service";
import { themeColors } from "../../theme/themeColors";
import styled from "@emotion/styled";

enum OwnableActionType {
  Consume = "Consume",
  Transfer = "Transfer",
  Delete = "Delete",
  Info = "Info",
  AddToCollection = "AddToCollection",
  Bridge = "Bridge",
  Download = "Download",
  Redeem = "Redeem",
  RWA = "RWA"
}

interface OwnableActionsFabProps {
  open: boolean;
  isConsumable: boolean;
  isTransferable: boolean;
  packageCid: string;
  chain: EventChain;
  metadata?: TypedMetadata;
  isBridgeable: boolean;
  isRedeemable: boolean;
  closeModal: () => void;
  onOpen: () => void;
  onClose: () => void;
  onConsume: () => void;
  onShowInfo: () => void;
  onDelete: () => void;
  onTransfer: (address: string) => void;
  onRedeem: (value: number | null) => void;
  onAddToCollection: (pkg: string) => void;
  showBridge: () => void;
  downloadImage: () => void;
  title: string;
  hasRWA: boolean;
  onShowRWA: () => void;
}

const wasConsumed = (chain: EventChain): boolean => {
  return chain.events.some((event) => "consume" in event.parsedData);
};


const Input = styled.input`
  height: 42px;
  width: 90%;
  border: 1px solid #2d2c2e;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  background-color: transparent;
  padding: 0 16px;
  appearance: none;
  outline: none;
  &:disabled {
    background-color: #2d2c2e;
    color: #ffffff !important;
  }
  &::placeholder {
    color: #ffffff;
  }
  align-items: center;
`;

export default function OwnableActionsFab(props: OwnableActionsFabProps) {
  const { open, onOpen, onClose } = props;

  const { removeFromAll } = useCollections();
  const { collection, filterBy, selectedTab, resetFilter } = useFilters();
  const { getAllIssuers } = useIssuers();
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [redeemValue, setRedeemValue] = useState<number | null>(null);

  const [confirmDel, setConfirmDel] = useState<{
    title: string;
    message: React.ReactNode;
    severity?: AlertColor;
    ok?: string;
    onConfirm: () => void;
  } | null>(null);

  const deleteOwnable = () => {
    props.onClose();
    const pkg = PackageService.info(props.packageCid);
    setConfirmDel({
      severity: "error",
      title: "Delete Ownable",
      message: (
        <span>
          Are you sure you want to delete the <em>{pkg?.title || ""}</em> Ownable? This
          action can not be undone.
        </span>
      ),
      ok: "Delete Forever",
      onConfirm: () => {
        setTimeout(() => {
          removeFromAll(props.chain.id);
          if (selectedTab === TabType.ALL) {
            resetFilter();
          } else {
            filterBy("", "", collection || StaticCollections.ALL);
          }
          getAllIssuers();
        }, 1);
        props.closeModal();
        props.onDelete();
      },
    });
  };

  const selectAction = (action: TypedFabItem) => {
    switch (action.id) {
      case OwnableActionType.AddToCollection:
        props.onClose();
        props.onAddToCollection(props.packageCid);
        break;
      case OwnableActionType.Consume:
        props.closeModal();
        props.onConsume();
        break;
      case OwnableActionType.Transfer:
        props.onClose();
        props.onTransfer("address");
        break;
      case OwnableActionType.Delete:
        deleteOwnable();
        break;
      case OwnableActionType.Info:
        props.onClose();
        props.onShowInfo();
        break;
      case OwnableActionType.Bridge:
        props.onClose();
        props.showBridge();
        break
      case OwnableActionType.Download:
        props.onClose();
        props.downloadImage();
        break
      case OwnableActionType.Redeem:
        setShowRedeemDialog(true);
        fetchRedeemValue();
        break;
      case OwnableActionType.RWA:
        props.onClose();
        props.onShowRWA();
        break;
      default:
        console.error("Unknown action:", action);
    }
  };

  const fetchRedeemValue = async () => {
    try {
      const genesisAddress = await RedeemService.getOwnableCreator(
        props.chain.events
      );
      const response = await RedeemService.isRedeemable(
        genesisAddress,
        props.title
      );
      console.log("Redeem value:", response);
      setRedeemValue(response?.value || 0);
    } catch (error) {
      console.error("Error fetching redeem value:", error);
      setRedeemValue(null);
    }
  };

  const makeActionsList = (): TypedFabItem[] => {
    const actions: TypedFabItem[] = [
      {
        id: OwnableActionType.AddToCollection,
        title: "Add to Category",
        icon: PlusIcon,
      },
      {
        id: OwnableActionType.Delete,
        title: "Delete",
        icon: DeleteIcon,
      },
      {
        id: OwnableActionType.Info,
        title: "Info",
        icon: InfoIcon,
      }
    ];

    if (props.isConsumable) {
      if (!wasConsumed(props.chain)) {
        actions.push({
          id: OwnableActionType.Consume,
          title: "Consume",
          icon: ConsumeIcon,
        });
      }
    }

    if (props.isBridgeable) {
      actions.push({
        id: OwnableActionType.Bridge,
        title: "Bridge",
        icon: () => <SwapHoriz />,
      });
    }

    if (props.isTransferable) {
      actions.push({
        id: OwnableActionType.Transfer,
        title: "Transfer",
        icon: TransferIcon,
      });
      actions.push({
        id: OwnableActionType.Download,
        title: "Download",
        icon: Download,
      });
    }
    if (props.isRedeemable && props.isTransferable) {
      actions.push({
        id: OwnableActionType.Redeem,
        title: "Redeem",
        icon: () => <SwapIcon />,
        backgroundColor: themeColors.primary,
      });
    }
    if (props.hasRWA && props.isTransferable) {
      actions.push({
        id: OwnableActionType.RWA,
        title: "RWA",
        icon: () => <img src={require("../../assets/EQTY_BADGE.png")} style={{ width: "35px", height: "35px" }} />,
        backgroundColor: 'rgb(110, 176, 77)',
      });
    }

    return actions;
  };

  return (
    <>
      <Fab
        open={open}
        actions={makeActionsList()}
        onClose={onClose}
        onOpen={onOpen}
        onSelect={selectAction}
        openIcon={MenuIcon}
        closeIcon={CloseIcon}
      />
      <ConfirmDrawer
        isForDelete={true}
        open={confirmDel !== null}
        onClose={() => setConfirmDel(null)}
        {...confirmDel!}
      >
        {confirmDel?.message}
      </ConfirmDrawer>
      <Dialog
        open={showRedeemDialog}
        onClose={() => setShowRedeemDialog(false)}
        transitionDuration={0}
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: "#141414",
            color: "white",
            borderRadius: "10px",
            width: "100%",
          },
          "& .MuiDialogTitle-root": {
            borderBottom: "1px solid #141414",
            color: "white",
          },
          "& .MuiDialogActions-root": {
            padding: "10px",
            justifyContent: "center",
          },
          "& .MuiDialogContent-root": {
            padding: "20px",
          },
        }}
      >
        <DialogContent>
          <DialogContentText sx={{ color: "white", fontSize: "1rem", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <img
                src={'/logo_popup.png'}
                alt={"oBuilder Logo"}
                style={{}}
              />
              <b>Redeem Ownable to LTO</b>
            </div>
            {
              redeemValue === null ? <CircularProgress style={{ color: "white" }} /> :
                <>
                  <p>
                    You can redeem this Ownable for <b>{redeemValue} LTO</b>
                  </p>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setShowRedeemDialog(false);
                      props.onRedeem(redeemValue);
                    }}
                    sx={{ backgroundColor: themeColors.primary, color: "white" }}
                  >
                    Redeem
                  </Button>
                </>
            }
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  );
}