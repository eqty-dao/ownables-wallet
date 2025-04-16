import { Box, Typography, IconButton, List, ListItem, ListItemText, Button, Badge, useMediaQuery } from "@mui/material";
import LtoDrawer from "./DetailsModal/LtoDrawer";
import { ReactComponent as CloseDrawerIcon } from "../assets/close_drawer_icon.svg";
import styled from "@emotion/styled";
import { themeStyles } from "../theme/themeStyles";
import { themeColors } from "../theme/themeColors";
import { useCallback, useEffect, useState } from "react";
import { RelayService } from "../services/Relay.service";
import { EventChain } from "@ltonetwork/lto";
import Loading from "./Loading";
import PackageService from "../services/Package.service";
import IDBService from "../services/IDB.service";
import { sendRNPostMessage } from "../utils/postMessage";
import { ReactComponent as DownloadIcon } from "../assets/receive_icon.svg";
import { ReactComponent as CheckmarkIcon } from "../assets/checkmark_icon.svg";
import LocalStorageService from "../services/LocalStorage.service";
import { enqueueSnackbar } from "notistack";
import { ReactComponent as DownloadAllIcon } from "../assets/download_all_icon.svg";
import DownloadProgressModal from "./DownloadProgressModal";
import { useCollections } from "../context/CollectionsContext";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from "axios";
import { AppConfig } from "../AppConfig";
import defaultCube from "../assets/cube.png";

export interface Ownable {
  chain: EventChain;
  package: string;
  uniqueMessageHash?: string;
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
  padding: 16px;
  transition: all 0.2s ease-in-out;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  width: 100%;

  @media (max-width: 600px) {
    padding: 12px;
    gap: 12px;
  }

  &:hover {
    background: rgba(81, 0, 148, 0.25);
    border-color: rgba(81, 0, 148, 0.3);
    transform: translateY(-2px);
  }
`;

const ThumbnailImage = styled('img')`
  width: 80px;
  height: 80px;
  min-width: 80px;
  border-radius: 8px;
  object-fit: cover;
  background: rgba(81, 0, 148, 0.2);

  @media (max-width: 600px) {
    width: 60px;
    height: 60px;
    min-width: 60px;
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
  width: 100%;

  @media (max-width: 600px) {
    font-size: 16px;
  }
`;

const MessageHash = styled(Typography)`
  color: rgba(255, 255, 255, 0.7);
  font-family: 'monospace';
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;

  @media (max-width: 600px) {
    font-size: 12px;
    margin-bottom: 8px;
  }
`;

const MessageTimestamp = styled(Typography)`
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: 11px;
  }
`;

const DownloadButton = styled(IconButton)`
  background: #510094;
  border-radius: 50%;
  padding: 12px;
  transition: all 0.2s ease-in-out;
  width: 48px;
  height: 48px;

  @media (max-width: 600px) {
    width: 40px;
    height: 40px;
    padding: 8px;
  }

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

    @media (max-width: 600px) {
      width: 20px;
      height: 20px;
    }
  }

  &.completed {
    background: rgba(76, 175, 80, 0.15);
    
    &:hover {
      background: rgba(76, 175, 80, 0.25);
    }

    svg {
      color: #4CAF50;
    }
  }
`;

interface DownloadItem {
  id: string;
  name: string;
  hash: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  size?: number;
}

const ImportOwnablesDrawer = (props: Props) => {
  const { open, onClose, setOwnables } = props;

  const [messages, setMessages] = useState<RelayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [builderAddress, setBuilderAddress] = useState<string | null>(null);
  const [importedHashes, setImportedHashes] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      try {
        await fetchMessages();
      }
      catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [open]);

  useEffect(() => {
    fetchMessages();
  }, [currentPage, itemsPerPage]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const limit = itemsPerPage;
      const relayData = await RelayService.list(offset, limit);

      if (relayData && Array.isArray(relayData.messages)) {
        setTotalCount(relayData.total);
        setMessages(relayData.messages);
      } else {
        setTotalCount(0);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setTotalCount(0);
      setMessages([]);
    }
    setLoading(false);
  }, [currentPage, itemsPerPage]);

  const updateDownloadProgress = (hash: string, progress: number, status: DownloadItem['status']) => {
    setDownloadItems(items => 
      items.map(item => 
        item.hash === hash 
          ? { ...item, progress, status }
          : item
      )
    );
  };

  const handleImportMessage = async (hash: string, isBulkDownload: boolean = false) => {
    try {
      const newItem: DownloadItem = {
        id: hash,
        name: hash.substring(0, 12) + '...',
        hash,
        progress: 0,
        status: 'downloading',
        size: messages.find(m => m.hash === hash)?.size
      };
      
      setDownloadItems(prev => [...prev, newItem]);
      setShowDownloadModal(true);

      const importedPackage = await RelayService.readSingleMessage(hash);

      if (importedPackage) {
        const chain = importedPackage.chain ? importedPackage.chain : null;

        if (chain) {
          setOwnables((prevOwnables) => [
            ...prevOwnables,
            {
              chain,
              package: importedPackage.cid,
              uniqueMessageHash: importedPackage.uniqueMessageHash,
            },
          ]);

          updateDownloadProgress(hash, 100, 'completed');
          setImportedHashes((prev) => new Set(prev).add(hash));
          
          const messageCount = await LocalStorageService.get("messageCount");
          const newCount = Math.max(0, parseInt(messageCount || "0", 10) - 1);
          await LocalStorageService.set("messageCount", newCount);
          
          if (!isBulkDownload) {
            enqueueSnackbar(`Ownable imported successfully!`, {
              variant: "success",
            });
          }
        } else {
          updateDownloadProgress(hash, 0, 'failed');
          if (!isBulkDownload) {
            enqueueSnackbar(`Failed to parse import`, {
              variant: "error",
            });
          }
        }
      } else {
        updateDownloadProgress(hash, 0, 'failed');
        if (!isBulkDownload) {
          enqueueSnackbar(`Ownable already imported!`, {
            variant: "error",
          });
        }
      }
    } catch (error) {
      console.error("Error importing message:", error);
      updateDownloadProgress(hash, 0, 'failed');
      if (!isBulkDownload) {
        enqueueSnackbar(`Failed to import ownable`, {
          variant: "error",
        });
      }
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    setShowDownloadModal(true);

    const items: DownloadItem[] = messages.map(message => ({
      id: message.hash,
      name: message.metadata?.title || message.hash.substring(0, 12) + '...',
      hash: message.hash,
      progress: 0,
      status: 'pending',
      size: message.size
    }));

    setDownloadItems(items);

    const batchSize = 3;
    const chunks = [];
    
    for (let i = 0; i < messages.length; i += batchSize) {
      chunks.push(messages.slice(i, i + batchSize));
    }

    try {
      for (const chunk of chunks) {
        await Promise.all(chunk.map(message => handleImportMessage(message.hash, true)));
      }

      enqueueSnackbar("All downloads completed!", { 
        variant: "success",
        autoHideDuration: 3000
      });
    } catch (error) {
      console.error("Error in bulk download:", error);
      enqueueSnackbar("Some downloads failed. Check the download modal for details.", {
        variant: "warning",
        autoHideDuration: 5000
      });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleCancelAllDownloads = () => {
    setDownloadItems([]);
    setIsDownloadingAll(false);
    setShowDownloadModal(false);
    enqueueSnackbar("All downloads cancelled", { variant: "info" });
  };

  const handleCloseDownloadModal = () => {
    if (!downloadItems.some(item => item.status === 'downloading')) {
      setShowDownloadModal(false);
    }
  };

  const getPackageDisplayName = (str: string) => {
    if (!str) return '';
    const regex = new RegExp(/ownable/i);
    return str?.replace(regex, "").replace(/[-_]+/, " ").trim()
      .replace(/\b\w/, (c) => c.toUpperCase());
  }

  const fetchBuilderAddress = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_OBUILDER}/api/v1/GetServerInfo`,
        {
          headers: {
            "X-API-Key": `${process.env.REACT_APP_OBUILDER_API_SECRET_KEY}`,
            Accept: "*/*",
          },
        }
      );
      const serverAddress =
        AppConfig.Network() === "T"
          ? response.data.serverLtoWalletAddress_T
          : response.data.serverLtoWalletAddress_L;
      setBuilderAddress(serverAddress);
    } catch (error) {
      console.error("Failed to fetch builder address:", error);
      setBuilderAddress(null);
    }
  };

  const isMobile = useMediaQuery('(max-width:600px)');
  return (
    <>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {messages.length > 0 && (
                  <Button
                    onClick={handleDownloadAll}
                    startIcon={<CloudDownloadIcon />}
                    sx={{
                      background: '#510094',
                      color: themeColors.titleText,
                      textTransform: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      '&:hover': {
                        background: '#610094',
                      },
                      '&:disabled': {
                        background: 'rgba(81, 0, 148, 0.3)',
                        color: 'rgba(255, 255, 255, 0.5)',
                      }
                    }}
                  >
                    Download All
                  </Button>
                )}
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
              {messages.map((ownable, index) => (
                <MessageListItem key={index}>
                  <ThumbnailImage 
                    src={ownable.metadata?.thumbnail || defaultCube} 
                    alt={ownable.metadata?.title || "Ownable thumbnail"}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = defaultCube;
                    }}
                  />
                  <Box sx={{ 
                    width: '100%',
                    minWidth: 0,
                  }}>
                    <MessageTitle>
                      {ownable.metadata?.title || ownable.hash}
                    </MessageTitle>
                    <MessageHash>
                      {ownable.size ? `${(ownable.size / 1024 / 1024).toFixed(2)} MB` : "Unknown"}
                    </MessageHash>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: 1,
                      gap: 2
                    }}>
                      <MessageTimestamp>
                        {new Date(ownable.timestamp).toLocaleString()}
                      </MessageTimestamp>
                      <Box sx={{ flexShrink: 0 }}>
                        <DownloadButton
                          onClick={() => handleImportMessage(ownable.hash)}
                          disabled={!!props.existingOwnables.find((o) => o.uniqueMessageHash === ownable.hash)}
                          className={props.existingOwnables.find((o) => o.uniqueMessageHash === ownable.hash) ? 'completed' : ''}
                        >
                          {props.existingOwnables.find((o) => o.uniqueMessageHash === ownable.hash) ? (
                            <CheckCircleIcon />
                          ) : (
                            <DownloadIcon />
                          )}
                        </DownloadButton>
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

      <DownloadProgressModal
        open={showDownloadModal}
        onClose={handleCloseDownloadModal}
        downloadItems={downloadItems}
        onCancelAll={handleCancelAllDownloads}
        title="Import Ownables"
      />
    </>
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
          const thumbnail = _.find((i: any) => i.name?.split(".")[1] === "webp" && i.name?.split(".")[0] === "thumbnail")
          if (thumbnail) {
            return (URL.createObjectURL(thumbnail))
          } else {
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
  metadata?:{
    timestamp: string;
    size: number;
    title: string;
    thumbnail: string;
  }
}