import { Box, Typography, IconButton, List, ListItem, ListItemText, Button, Badge, useMediaQuery, ListItemSecondaryAction } from "@mui/material";
import LtoDrawer from "./DetailsModal/LtoDrawer";
import { ReactComponent as CloseDrawerIcon } from "../assets/close_drawer_icon.svg";
import styled from "@emotion/styled";
import { themeStyles } from "../theme/themeStyles";
import { themeColors } from "../theme/themeColors";
import { useEffect, useState } from "react";
import { RelayService } from "../services/Relay.service";
import { EventChain } from "@ltonetwork/lto";
import Loading from "./Loading";
import PackageService from "../services/Package.service";
import IDBService from "../services/IDB.service";
import { sendRNPostMessage } from "../utils/postMessage";
import { ReactComponent as DownloadIcon } from "../assets/receive_icon.svg";
import LocalStorageService from "../services/LocalStorage.service";
import { enqueueSnackbar } from "notistack";

export interface Ownable {
  chain: EventChain;
  package: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  title: string;
  isPersistent?: boolean;
  setOwnables: React.Dispatch<React.SetStateAction<Ownable[]>>;
  existingOwnables: Ownable[];
  messageCount: number;
}

interface StyledButtonProps {
  transparent: boolean;
}

const StyledButton = styled(Button) <StyledButtonProps>`
  text-transform: none;
  height: 36px;
  color: #ffffff;
  ${(props) =>
    props.transparent === false &&
    `
        background-color: #510094;
    `}
`;

const titleStyle = { ...themeStyles.fs24fw600lh29, textAlign: "center" };

const closeModalBtnStyle = {
  padding: 0,
  color: themeColors.error,
};

const MessageListItem = styled(ListItem)`
  background: rgba(81, 0, 148, 0.1);
  border: 1px solid rgba(81, 0, 148, 0.2);
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 16px;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: rgba(81, 0, 148, 0.2);
    border-color: rgba(81, 0, 148, 0.3);
    transform: translateY(-2px);
  }
`;

const MessageText = styled(Typography)`
  color: ${themeColors.titleText};
  font-family: 'Satoshi', sans-serif;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-all;
`;

const DownloadButton = styled(IconButton)`
  background: rgba(81, 0, 148, 0.3);
  border-radius: 50%;
  padding: 8px;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: rgba(81, 0, 148, 0.5);
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${themeColors.titleText};
  }
`;

const ImportOwnablesDrawer = (props: Props) => {
  const { open, onClose } = props;
  const isMobile = useMediaQuery('(max-width:600px)');
  const [ownables, setOwnables] = useState<OwnablePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalOwnables, setTotalOwnables] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [builderAddress, setBuilderAddress] = useState<string>("");
  // const [messages, setMessages] = useState<RelayData[]>([]);
  const [importedHashes, setImportedHashes] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<RelayMessage[]>([]);
  


  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      try {
        await fetchOwnables();
      }
      catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [open]);

  const fetchOwnables = async () => {
    if (isFetching) return;
    setIsFetching(true);
    setLoading(true);
    window.localStorage.removeItem("messageHashes");
    setOwnables([]);

    sendRNPostMessage(JSON.stringify({ type: "clear_cache", data: "clear cache" }));

    let metadata = await RelayService.listOwnables();

    if (metadata.length === 0) {
      setLoading(false);
      return;
    }

    setTotalOwnables(metadata?.length || 0);

    for (const hash of metadata) {
      const ownable = await PackageService.importFromRelayByMessageHash(hash.hash);
      if (ownable) {
        setOwnables((prev) => [...prev, ownable as unknown as OwnablePreview]);
      }
    }

    setLoading(false);
    setIsFetching(false);
  }

  const getPackageDisplayName = (str: string) => {
    if (!str) return '';
    const regex = new RegExp(/ownable/i);
    return str?.replace(regex, "").replace(/[-_]+/, " ").trim()
      .replace(/\b\w/, (c) => c.toUpperCase());
  }

  const fetchBuilderAddress = async () => {
    const builderAddress = await IDBService.getAll("builderAddress");
    if (builderAddress.length > 0) {
      setBuilderAddress(builderAddress[0].address);
    }
  }

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const relayData = await RelayService.listRelayMetaData();
      if (relayData && Array.isArray(relayData)) {
        setMessages(relayData as RelayMessage[]);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    }
    setLoading(false);
  };

  const fetchImportedHashes = async () => {
    try {
      const hashes = await LocalStorageService.get("messageHashes");
      setImportedHashes(new Set(hashes));
    } catch (error) {
      console.error("Failed to fetch imported hashes:", error);
    }
  };


  const handleImportMessage = async (hash: string) => {
    try {
      const importedPackage = await PackageService.importFromRelayByMessageHash(hash);
      console.log(importedPackage);

      if (importedPackage) {
        const chain = importedPackage.chain ? importedPackage.chain : null;

        if (chain) {
          setOwnables((prev) => [...prev, importedPackage as unknown as OwnablePreview]);

          // Update imported hashes
          setImportedHashes((prev) => new Set(prev).add(hash));
          const messageCount = await LocalStorageService.get("messageCount");
          const newCount = Math.max(0, parseInt(messageCount || "0", 10) - 1);
          await LocalStorageService.set("messageCount", newCount);
          enqueueSnackbar(`Ownable imported successfully!`, {
            variant: "success",
          });
        } else {
          enqueueSnackbar(`Failed to parse import`, {
            variant: "error",
          });
        }
      } else {
        enqueueSnackbar(`Ownable already imported!`, {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error importing message:", error);
      enqueueSnackbar(`Failed to import ownable`, {
        variant: "error",
      });
    }
  };

  useEffect(() => {
    fetchBuilderAddress();
  }, []);

  useEffect(() => {
    if (open) {
      fetchMessages();
      fetchImportedHashes();
    }
  }, [open]);

  return (
    <LtoDrawer
      open={open}
      onClose={onClose}
      shouldHideBackdrop={false}
      isPersistent={true}
      height="100%"
    >
      <Box sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1a0033',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box
          sx={{
            p: 2,
            background: 'linear-gradient(180deg, rgba(81, 0, 148, 0.4) 0%, rgba(81, 0, 148, 0) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography sx={{
              ...titleStyle,
              fontSize: isMobile ? '1.5rem' : '2rem',
              textAlign: 'left'
            }}>
              {props.title}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={props.onClose}
              sx={{
                ...closeModalBtnStyle,
                width: '40px',
                height: '40px'
              }}
            >
              <CloseDrawerIcon />
            </IconButton>
          </Box>

          <Box sx={{
            mt: 2,
            background: 'rgba(81, 0, 148, 0.2)',
            padding: '12px',
            borderRadius: '8px',
          }}>
            <Typography variant="body1" sx={{
              color: themeColors.titleText,
              fontSize: isMobile ? '0.9rem' : '1rem'
            }}>
              {totalOwnables > 0
                ? `You have ${totalOwnables} ownables available.`
                : "No ownables available"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
        }}>
          <List>
            {messages.map((message) => (
              <MessageListItem key={message.hash}>
                <Box sx={{ width: '100%' }}>
                  <MessageText>
                    {message.hash}
                  </MessageText>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mt: 1 
                  }}>
                    <Typography sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '12px'
                    }}>
                      {new Date(message.timestamp).toLocaleString()}
                    </Typography>
                    <DownloadButton
                      onClick={() => handleImportMessage(message.hash)}
                      disabled={importedHashes.has(message.hash)}
                    >
                      <DownloadIcon />
                    </DownloadButton>
                  </Box>
                </Box>
              </MessageListItem>
            ))}
          </List>
          {loading && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mt: 2 
            }}>
              <Loading show={true} />
            </Box>
          )}
        </Box>
      </Box>
    </LtoDrawer>
  );
};

export default ImportOwnablesDrawer;

const ImageComponent = ({ _ownable }: { _ownable: { cid: string } }) => {
  const [imageSrc, setImageSrc] = useState<string>("");

  const getImage = async (cid: string) => {
    try {
      const _ = await IDBService.getAll(`package:${cid}`)
      if (_.length > 0) {
        const image = _.find((i: any) => i.name?.split(".")[1] === "webp" && i.name?.split(".")[0] !== "thumbnail")
        if (!image) {
          // try thumbnail
          const thumbnail = _.find((i: any) => i.name?.split(".")[1] === "webp" && i.name?.split(".")[0] === "thumbnail")
          if (thumbnail) {
            return (URL.createObjectURL(thumbnail))
          } else {
            // find any image with webp,.png,.jpg,.jpeg,.gif
            const _image = _.find((i: any) => i.name?.split(".")[1] === "webp" || i.name?.split(".")[1] === "png" || i.name?.split(".")[1] === "jpg" || i.name?.split(".")[1] === "jpeg" || i.name?.split(".")[1] === "gif")
            if (_image) {
              return (URL.createObjectURL(_image))
            }
          }
        }
        if (image) {
          return (URL.createObjectURL(image))
        }
      }
    } catch (e) {
      console.error("OwnableThumb -> getImage -> e", e)
    }
  }

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const result = await getImage(_ownable.cid);
        if (result) {
          setImageSrc(result);
        }
      } catch (error) {
        console.error("Error fetching image:", error);
      }
    };

    fetchImage();
  }, [_ownable.cid]);

  return (
    <td>
      <img
        src={imageSrc || "default-image-path.png"}
        alt="oBuilder Logo"
        style={{ /* your styles here */ }}
      />
    </td>
  );
};

export interface RelayMessage {
  type: string;
  sender: string;
  recipient: string;
  timestamp: string;
  signature: string;
  hash: string;
  mediaType: string;
  size: number;
  senderKeyType: string;
  senderPublicKey: string;
}
// {
//   type: "basic",
//   sender: "3JspbVJUYARdp1NryxNfNxXzU4RbZHuRbJm",
//   recipient: "3JmLEA9NRihPnwQ5Je4KNNuqPa2W7AvjkvH",
//   timestamp: "2025-01-31T04:32:17.300Z",
//   signature: "4vj3jRdzrH9JVFSRQj12TMPQFSiZXpYNB85XdkTZczZ3jeNXm147KvRyUj5yZAGCWUJrsDx3wJP15i9wXsq32BNM",
//   hash: "B2SdmcJMp1hPW89HwGTk6UikUGjoyCguqVT2B1qQvxqE",
//   mediaType: "application/octet-stream",
//   size: 13711836,
//   senderKeyType: "ed25519",
//   senderPublicKey: "GwHVCWSMsJEmWCuteHycJNeRF4W3GnZ3o9Qu7zcpM87u",
// }
export interface RelayMessage {
  type: string;
  sender: string;
  recipient: string;
  timestamp: string;
  signature: string;
  hash: string;
  mediaType: string;
  size: number;
  senderKeyType: string;
  senderPublicKey: string;
}
// export interface RelayData {
//   type: string;
//   sender: {
//     keyType: string;
//     publicKey: string;
//   };
//   recipient: string;
//   timestamp: string;
//   signature: string;
//   hash: string;
//   mediaType: string;
//   data: string;
// }
export interface OwnablePreview {
  title: string;
  name: string;
  description?: string | undefined;
  cid: string;
  keywords?: string[];
  isNotLocal?: boolean;
  isDynamic: boolean;
  hasMetadata: boolean;
  hasWidgetState: boolean;
  isConsumable: boolean;
  isConsumer: boolean;
  isTransferable: boolean;
  uniqueMessageHash: string;
  versions?: Version[];
  chain: EventChain;
}

export interface Chain {
  id: string;
  events: Event[];
}
export interface Event {
  timestamp: number;
  previous: string;
  signKey: SignKey;
  signature: string;
  hash: string;
  mediaType: string;
  data: string;
  attachments: any[];
}
export interface SignKey {
  keyType: string;
  publicKey: string;
}

export interface Version {
  date: string;
  cid: string;
  uniqueMessageHash: string;
}
