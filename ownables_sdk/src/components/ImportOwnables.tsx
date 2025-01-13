import { Box, Button, IconButton, Table, Typography, useMediaQuery } from "@mui/material";
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
import { ReactComponent as RefreshIcon } from "../assets/refresh_icon.svg";
import { ReactComponent as DownloadIcon } from "../assets/receive_icon.svg";

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
  setOwnables: (ownables: Ownable[]) => void;
  existingOwnables: Ownable[];
}

interface StyledButtonProps {
  transparent: boolean;
}

const StyledButton = styled(Button) <StyledButtonProps>`
  text-transform: none;
  height: 48px;
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

const ImportOwnablesDrawer = (props: Props) => {

  const { open, onClose } = props;
  const isMobile = useMediaQuery('(max-width:600px)');
  const [ownables, setOwnables] = useState<OwnablePreview[]>([]);
  const onCancel = () => onClose();
  const [loading, setLoading] = useState(false);
  const [debugMessage, setDebugMessage] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [totalOwnables, setTotalOwnables] = useState(0);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setStartTime(Date.now());
      setOwnables([]);
      setDebugMessage("");
      setDebugMessage("Fetching ownables...");
      try {
        await fetchOwnables();
      }
      catch (e) {
        console.error(e);
        setDebugMessage("Error fetching ownables");
      }
    };
    fetchData();
  }, [open]);

  const fetchOwnables = async () => {
    if (isFetching) return;
    setIsFetching(true);
    window.localStorage.removeItem("messageHashes");
    setOwnables([]);
    setLastResponse(null);

    sendRNPostMessage(JSON.stringify({ type: "clear_cache", data: "clear cache" }));
    setDebugMessage("Fetching ownables...");
    setStartTime(Date.now());
    setTotalOwnables(0);


    let metadata = await RelayService.listOwnables();

    if (metadata.length === 0) {
      setDebugMessage("No ownables found");
      setLoading(false);
      return;
    }
    setTotalOwnables(metadata?.length || 0);
    setDebugMessage(`Ownables found: ${metadata.length}`);
    for (const hash of metadata) {
      const index = ownables.findIndex((o) => o.uniqueMessageHash === hash.hash);
      setDebugMessage(`Fetching ownable: ${hash.hash}`);
      const ownable = await PackageService.importFromRelayByMessageHash(hash.hash);
      setDebugMessage(`Done Fetching ownable: ${hash.hash}`);
      setLastResponse(ownable ? ownable.name : "No response");
      if (ownable) {
        setOwnables((prev) => [...prev, ownable as unknown as OwnablePreview]);
      }
    }
    setDebugMessage(`Done Fetching all ownables`);
    setEndTime(Date.now());
    setLoading(false);
    setIsFetching(false);
  }
  const getPackageDisplayName = (str: string) => {
    if (!str) return '';
    const regex = new RegExp(/ownable/i);
    return str?.replace(regex, "").replace(/[-_]+/, " ").trim()
      .replace(/\b\w/, (c) => c.toUpperCase());
  }



  return (
    <LtoDrawer
      open={open}
      onClose={onClose}
      shouldHideBackdrop={false}
      isPersistent={true}
      height="100%"
    >
      <Box
        display={"flex"}
        p={2}
        flexDirection={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography sx={titleStyle}>{props.title}</Typography>
        <IconButton
          aria-label="close"
          onClick={props.onClose}
          sx={closeModalBtnStyle}
        >
          <CloseDrawerIcon />
        </IconButton>
      </Box>
      {/* Refresh button*/}
      <StyledButton
        variant="contained"
        style={{ width: "50px", fontSize: "12px", marginLeft: 10, alignSelf: 'center' }}
        onClick={() => {
          fetchOwnables();
        }}
        transparent={false}
      >
        <RefreshIcon />
      </StyledButton>
      <b>
        <p style={{ color: 'white', fontSize: '0.8rem', marginLeft: 10 }}>Total Ownables: {totalOwnables}</p>
      </b>
      <Box
        p={2} sx={{ overflowX: 'auto' }}
        style={{ alignSelf: 'center', alignContent: 'center', justifyContent: 'center', textAlign: 'center', marginLeft: '5px', marginRight: 'auto' }}
      >
        {
          <><Table
            sx={{
              tableLayout: "fixed",
              borderCollapse: "separate",
              borderSpacing: "0 8px",
              width: "100%",
              "& th, & td": {
                wordWrap: "break-word",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
              "& th": {
                ...themeStyles.fs12fw400lh14,
                color: themeColors.subText,
                padding: isMobile ? "4px 0" : "8px 0",
                textAlign: "left",
                fontSize: isMobile ? '12px' : '14px',
              },
              "& td": {
                ...themeStyles.fs14fw400lh18,
                color: themeColors.titleText,
                padding: isMobile ? "4px 0" : "8px 0",
                textAlign: "left",
                fontSize: isMobile ? '12px' : '14px',
              },
              whiteSpace: isMobile ? "normal" : "nowrap",
            }}
          >
            <thead
              style={{
                borderBottom: "1px solid #E4E4E4",
              }}
            >
              <tr>
                <th
                  style={{
                    width: "5%",
                  }}
                >#</th>
                {/* <th>cid</th> */}
                <th>Name</th>
                {/* <th>Description</th> */}
                <th>Actions</th>
                <th>Existing</th>
              </tr>
            </thead>
            <tbody>
              {ownables.map((_ownable, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  {/* <td>{_ownable.cid}</td> */}
                  {/* <td>
                    <ImageComponent _ownable={_ownable} />
                  </td> */}
                  <td>{getPackageDisplayName(_ownable.name)}</td>
                  {/* <td>{_ownable.description}</td> */}
                  <td>
                    <StyledButton
                      variant="contained"
                      transparent={false}
                      style={{ width: "50px", fontSize: "12px" }}
                      onClick={() => {
                        setLoading(true);
                        let existing = props.existingOwnables.find((o) => o.package === _ownable.cid);
                        if (existing) {
                          //remove existing
                          //@ts-ignore
                          props.setOwnables((prev: Ownable[]) => prev.filter((o) => o.package !== _ownable.cid));
                        }
                        //@ts-ignore
                        props.setOwnables((prev: Ownable[]) => [...prev, { chain: _ownable.chain, package: _ownable.cid }]);
                        onClose();
                      }}
                    >
                      <DownloadIcon />
                    </StyledButton>
                  </td>
                  <td>
                    {props.existingOwnables.find((o) => o.package === _ownable.cid) ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
            <Loading show={loading} />
          </Table></>
        }
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
export interface RelayData {
  type: string;
  sender: {
    keyType: string;
    publicKey: string;
  };
  recipient: string;
  timestamp: string;
  signature: string;
  hash: string;
  mediaType: string;
  data: string;
}
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
