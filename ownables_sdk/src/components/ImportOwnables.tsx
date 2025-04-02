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
import { ReactComponent as CheckmarkIcon } from "../assets/checkmark_icon.svg";
import LocalStorageService from "../services/LocalStorage.service";
import { enqueueSnackbar } from "notistack";
import { ReactComponent as DownloadAllIcon } from "../assets/download_all_icon.svg";
import DownloadProgressModal from "./DownloadProgressModal";
import { useCollections } from "../context/CollectionsContext";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadItems, setDownloadItems] = useState<any[]>([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const { isDownloading, setIsDownloading } = useCollections();

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

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    const items = relayData.map(ownable => ({
      id: ownable.hash,
      name: ownable.hash.substring(0, 15) + '...',
      hash: ownable.hash,
      progress: 0,
      status: 'pending' as const,
      size: ownable.size
    }));
    
    setDownloadItems(items);
    setShowDownloadModal(true);
    setIsDownloadingAll(true);
    
    // Start download process
    setTimeout(async () => {
      for (let i = 0; i < items.length; i++) {
        try {
          const ownable = relayData[i];
          const existing = props.existingOwnables.find((o) => o.package === ownable.hash);
          
          if (!existing) {
            // Update status to downloading
            setDownloadItems(prev => 
              prev.map(item => 
                item.id === ownable.hash 
                  ? { ...item, status: 'downloading' as const } 
                  : item
              )
            );
            
            // Simulate progress updates
            const progressInterval = setInterval(() => {
              setDownloadItems(prev => 
                prev.map(item => 
                  item.id === ownable.hash && item.status === 'downloading'
                    ? { ...item, progress: Math.min(item.progress + Math.random() * 10, 95) } 
                    : item
                )
              );
            }, 300);
            
            // Perform actual download
            const downloadedOwnable = await fetchOwnableByHash(ownable.hash);
            
            // Clear interval
            clearInterval(progressInterval);
            
            if (downloadedOwnable) {
              props.setOwnables((prev: Ownable[]) => [...prev, { chain: downloadedOwnable.chain, package: downloadedOwnable.cid, uniqueMessageHash: ownable.hash }]);
              
              // Update status to completed
              setDownloadItems(prev => 
                prev.map(item => 
                  item.id === ownable.hash 
                    ? { ...item, progress: 100, status: 'completed' as const } 
                    : item
                )
              );
            } else {
              // Update status to failed
              setDownloadItems(prev => 
                prev.map(item => 
                  item.id === ownable.hash 
                    ? { ...item, status: 'failed' as const } 
                    : item
                )
              );
            }
          } else {
            // Already exists, mark as completed
            setDownloadItems(prev => 
              prev.map(item => 
                item.id === ownable.hash 
                  ? { ...item, progress: 100, status: 'completed' as const } 
                  : item
              )
            );
          }
        } catch (error) {
          console.error(`Failed to download ownable ${relayData[i].hash}:`, error);
          
          // Update status to failed
          setDownloadItems(prev => 
            prev.map(item => 
              item.id === relayData[i].hash 
                ? { ...item, status: 'failed' as const } 
                : item
            )
          );
        }
      }
      
      setIsDownloadingAll(false);
      
      // Show final notification after 2 seconds to let user see the completed state
      setTimeout(() => {
        setIsDownloading(false);
        const successCount = downloadItems.filter(item => item.status === 'completed').length;
        enqueueSnackbar(`Import All ownables completed`, { 
          variant: "success",
          autoHideDuration: 5000,
        });
        window.location.reload();
        onClose();
      }, 2000);
    }, 100);
    setIsDownloading(false);
  };

  const handleCancelAllDownloads = () => {
    setIsDownloadingAll(false);
    setShowDownloadModal(false);
    setDownloadItems([]);
    enqueueSnackbar("All downloads cancelled", { variant: "info" });
  };
  
  const handleCloseDownloadModal = () => {
    setIsDownloading(false);
    // If downloads are still in progress, just minimize instead of close
    if (isDownloadingAll) {
      return;
    }
    
    setShowDownloadModal(false);
    window.location.reload();
  };

  const handldleImportOwnable = async (hash: string) => {
    setIsDownloading(true);
    // Create a download item for the modal
    const downloadItem = {
      id: hash,
      name: hash.substring(0, 15) + '...',
      hash: hash,
      progress: 0,
      status: 'downloading' as const,
      size: relayData.find(o => o.hash === hash)?.size
    };
    
    setDownloadItems([downloadItem]);
    setShowDownloadModal(true);
    setLoading(true);
    
    const progressInterval = setInterval(() => {
      setDownloadItems(prev => 
        prev.map(item => 
          item.id === hash && item.status === 'downloading'
            ? { ...item, progress: Math.min(item.progress + Math.random() * 10, 95) } 
            : item
        )
      );
    }, 300);
    
    try {
      const ownable = await fetchOwnableByHash(hash);
      
      // Clear interval
      clearInterval(progressInterval);
      
      if (ownable) {
        const existing = props.existingOwnables.find((o) => o.package === ownable.package);
        if (existing) {
          // Update status to failed
          setDownloadItems(prev => 
            prev.map(item => 
              item.id === hash 
                ? { ...item, status: 'failed' as const } 
                : item
            )
          );
          
          enqueueSnackbar(`${getPackageDisplayName(ownable.name)} already exists`, { variant: "error" });
          setLoading(false);
          return;
        }

        props.setOwnables((prev: Ownable[]) => [...prev, { chain: ownable.chain, package: ownable.cid, uniqueMessageHash: hash }]);
        
        // Update status to completed
        setDownloadItems(prev => 
          prev.map(item => 
            item.id === hash 
              ? { ...item, progress: 100, status: 'completed' as const } 
              : item
          )
        );
        
        setLoading(false);
        setIsFetching(false);
        setTotalOwnables(totalOwnables > 0 ? totalOwnables - 1 : 0);
        
        // Close after a short delay to show the completed state
        setTimeout(() => {
          setShowDownloadModal(false);
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        // Update status to failed
        setDownloadItems(prev => 
          prev.map(item => 
            item.id === hash 
              ? { ...item, status: 'failed' as const } 
              : item
          )
        );
        
        enqueueSnackbar(`Failed to import ${hash}`, { variant: "error" });
      }
    } catch (error) {
      // Clear interval
      clearInterval(progressInterval);
      
      // Update status to failed
      setDownloadItems(prev => 
        prev.map(item => 
          item.id === hash 
            ? { ...item, status: 'failed' as const } 
            : item
        )
      );
      
      console.error(`Failed to download ownable ${hash}:`, error);
      enqueueSnackbar(`Failed to import ${hash}`, { variant: "error" });
    }
    
    setLoading(false);
    setIsDownloading(false);
  };

  const fetchOwnables = async () => {
    setIsDownloading(true);
    if (isFetching) return;
    setIsFetching(true);


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
    setIsDownloading(false);
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
                {relayData.length > 0 && (
                  <Button
                    onClick={handleDownloadAll}
                    startIcon={<CloudDownloadIcon />}
                    disabled={isDownloadingAll}
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

          {/* <Box sx={{
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
          </Box> */}
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