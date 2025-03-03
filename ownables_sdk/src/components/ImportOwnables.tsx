import { Box, Typography, IconButton, List, ListItem, ListItemText, Button, Badge, useMediaQuery } from "@mui/material";
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
  background: rgba(81, 0, 148, 0.15);
  border: 1px solid rgba(81, 0, 148, 0.2);
  border-radius: 16px;
  margin-bottom: 12px;
  padding: 20px;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: rgba(81, 0, 148, 0.25);
    border-color: rgba(81, 0, 148, 0.3);
    transform: translateY(-2px);
  }
`;

const MessageTitle = styled(Typography)`
  color: ${themeColors.titleText};
  font-family: 'Satoshi', sans-serif;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: 18px;
  }
`;

const MessageHash = styled(Typography)`
  color: rgba(255, 255, 255, 0.7);
  font-family: 'monospace';
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 12px;
  word-break: break-all;
`;

const MessageTimestamp = styled(Typography)`
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
`;

const DownloadButton = styled(IconButton)`
  background: #510094;
  border-radius: 50%;
  padding: 12px;
  transition: all 0.2s ease-in-out;
  width: 48px;
  height: 48px;

  &:hover {
    background: #610094;
  }

  &:active {
    background: #3b006d;
    transform: scale(0.95);
  }

  &:disabled {
    background: rgba(81, 0, 148, 0.3);
  }

  svg {
    width: 24px;
    height: 24px;
    color: ${themeColors.titleText};
  }
`;

const ImportOwnablesDrawer = (props: Props) => {
  const { open, onClose, setOwnables } = props;
  const isMobile = useMediaQuery('(max-width:600px)');
  // const [ownables, setOwnables] = useState<OwnablePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalOwnables, setTotalOwnables] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [builderAddress, setBuilderAddress] = useState<string>("");
  const [importedHashes, setImportedHashes] = useState<Set<string>>(new Set());
  const [relayData, setRelaydata] = useState<RelayData[]>([]);

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



  const fetchOwnableByHash = async (hash: string): Promise<any | null> => {
    const ownable = await PackageService.importFromRelayByMessageHash(hash);
    if (ownable) {
      return ownable as unknown as Ownable;
    }
    return null;
  }

  const handldleImportOwnable = async (hash: string) => {
    setLoading(true);
    const ownable = await fetchOwnableByHash(hash);
    if (ownable) {
      const existing = props.existingOwnables.find((o) => o.package === ownable.package);
      if (existing) {
        enqueueSnackbar(`${getPackageDisplayName(ownable.name)} already exists`, { variant: "error" });
        setLoading(false);
        return;
      }

      props.setOwnables((prev: Ownable[]) => [...prev, { chain: ownable.chain, package: ownable.cid }]);
      setLoading(false);
      setIsFetching(false);
      setTotalOwnables(totalOwnables > 0 ? totalOwnables - 1 : 0);
      enqueueSnackbar(`Imported ${getPackageDisplayName(ownable.name)}`, { variant: "success" });
      onClose();
    } else {
      enqueueSnackbar(`Failed to import ${hash}`, { variant: "error" });
    }
    setLoading(false);
  }

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
      setRelaydata([]);
      return;
    }

    setRelaydata(metadata);
    setTotalOwnables(metadata?.length || 0);

    // for (const hash of metadata) {
    //   const ownable = await PackageService.importFromRelayByMessageHash(hash.hash);
    //   if (ownable) {
    //     setOwnables((prev) => [...prev, ownable as unknown as OwnablePreview]);
    //   }
    // }

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

  const fetchImportedHashes = async () => {
    try {
      const hashes = await LocalStorageService.get("messageHashes");
      setImportedHashes(new Set(hashes));
    } catch (error) {
      console.error("Failed to fetch imported hashes:", error);
    }
  };

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
            padding: '16px',
            borderRadius: '12px',
          }}>
            <Typography variant="body1" sx={{
              color: themeColors.titleText,
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: 500
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
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#510094',
            borderRadius: '4px',
          },
        }}>
          <List>
            {relayData.map((ownable, index) => (
              <MessageListItem key={index}>
                <Box sx={{ width: '100%' }}>
                  <MessageTitle>
                    {ownable.hash}
                  </MessageTitle>
                  <MessageHash>
                    {ownable.size ? `${(ownable.size / 1024 / 1024).toFixed(2)} MB` : "Unknown"}
                  </MessageHash>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mt: 1
                  }}>
                    <MessageTimestamp>
                      {new Date(ownable.timestamp).toLocaleString()}
                    </MessageTimestamp>
                    <Box sx={{ position: 'relative' }}>
                      <DownloadButton
                        onClick={() => handldleImportOwnable(ownable.hash)}
                        disabled={!!props.existingOwnables.find((o) => o.package === ownable.hash)}
                      >
                        <DownloadIcon />
                      </DownloadButton>
                      {!props.existingOwnables.find((o) => o.package === ownable.hash) && (
                        <Badge
                          color="success"
                          variant="dot"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            '& .MuiBadge-dot': {
                              backgroundColor: '#4caf50',
                              boxShadow: '0 0 8px #4caf50'
                            }
                          }}
                        />
                      )}
                    </Box>
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

// export interface RelayMessage {
//   type: string;
//   sender: string;
//   recipient: string;
//   timestamp: string;
//   signature: string;
//   hash: string;
//   mediaType: string;
//   size: number;
//   senderKeyType: string;
//   senderPublicKey: string;
// }

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




export interface RelayData {
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