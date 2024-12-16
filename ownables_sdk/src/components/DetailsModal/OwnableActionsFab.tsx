import * as React from "react";
import { AlertColor } from "@mui/material";
import { ReactComponent as MenuIcon } from "../../assets/actions_menu_icon.svg";
import { ReactComponent as CloseIcon } from "../../assets/close_icon.svg";
import { ReactComponent as DeleteIcon } from "../../assets/delete_icon.svg";
import { ReactComponent as ConsumeIcon } from "../../assets/consume_icon.svg";
import { ReactComponent as TransferIcon } from "../../assets/transfer_icon.svg";
import { ReactComponent as InfoIcon } from "../../assets/info_icon.svg";
import { ReactComponent as PlusIcon } from "../../assets/plus_icon.svg";
import { ReactComponent as Download } from "../../assets/arrow_down.svg";
import { SwapHoriz } from "@mui/icons-material"
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

enum OwnableActionType {
  Consume = "Consume",
  Transfer = "Transfer",
  Delete = "Delete",
  Info = "Info",
  AddToCollection = "AddToCollection",
  Bridge = "Bridge",
  Download = "Download"
}

interface OwnableActionsFabProps {
  open: boolean;
  isConsumable: boolean;
  isTransferable: boolean;
  packageCid: string;
  chain: EventChain;
  metadata?: TypedMetadata;
  isBridgeable: boolean;
  closeModal: () => void;
  onOpen: () => void;
  onClose: () => void;
  onConsume: () => void;
  onShowInfo: () => void;
  onDelete: () => void;
  onTransfer: (address: string) => void;
  onAddToCollection: (pkg: string) => void;
  showBridge: () => void;
  downloadOwnable: () => void;
}

const wasConsumed = (chain: EventChain): boolean => {
  return chain.events.some((event) => "consume" in event.parsedData);
};

export default function OwnableActionsFab(props: OwnableActionsFabProps) {
  const { open, onOpen, onClose } = props;

  const { removeFromAll } = useCollections();
  const { collection, filterBy, selectedTab, resetFilter } = useFilters();
  const { getAllIssuers } = useIssuers();

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
        props.downloadOwnable();
        break
      default:
        console.error("Unknown action:", action);
    }
  };

  const makeActionsList = (): any => {
    const actions = [
      {
        id: OwnableActionType.AddToCollection,
        title: "Add to Collection",
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
      },
      {
        id: OwnableActionType.Download,
        title: "Download",
        icon: Download,
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
    </>
  );
}
