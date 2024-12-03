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

  useEffect(() => {
    console.log("ImportOwnablesDrawer -> open", open);
    if (!open) return;
    const fetchData = async () => {
      setStartTime(Date.now());
      setOwnables([]);
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
    window.localStorage.removeItem("messageHashes");
    setOwnables([]);
    let metadata = await RelayService.listOwnables();
    if(metadata.length === 0) {
      setDebugMessage("No ownables found");
      setLoading(false);
      return;
    }
    console.log("ImportOwnablesDrawer -> metadata", metadata);
    setTotalOwnables(metadata?.length || 0);
    setDebugMessage(`Ownables found: ${metadata.length}`);
    for (const hash of metadata) {
      const index = ownables.findIndex((o) => o.uniqueMessageHash === hash.hash);
      setDebugMessage(`Fetching ownable: ${hash.hash}`);
      const ownable = await PackageService.importFromRelayByMessageHash(hash.hash);
      console.log("ImportOwnablesDrawer -> ownable", ownable);
      setDebugMessage(`Done Fetching ownable: ${hash.hash}`);
      setLastResponse(ownable ? ownable.name : "No response");
      if (ownable) {
        setOwnables((prev) => [...prev, ownable as unknown as OwnablePreview]);
      }
    }
    setDebugMessage(`Done Fetching all ownables`);
    setEndTime(Date.now());
    setLoading(false);
  }



  return (
    <LtoDrawer
      open={open}
      onClose={onClose}
      shouldHideBackdrop={false}
      isPersistent={props.isPersistent}
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
      <Box
        display={"flex"}
        p={1}
        flexDirection={"row"}
        justifyContent={"center"}
        alignItems={"center"}
        width={"100%"}
      >
        <StyledButton
          variant="contained"
          transparent={false}
          onClick={() => {
            fetchOwnables();
          }}
        >
          Refresh
        </StyledButton>
        </Box>
      <b>
        <p style={{ color: 'white', fontSize: '0.8rem', marginLeft: 10 }}>Total Ownables: {totalOwnables}</p>
      </b>
      <p style={{ color: 'white', fontSize: '0.8rem', marginLeft: 10 }}>{debugMessage}</p>
      {ownables.length === 0 && <Loading show={true} />}
      {ownables.length > 0 && <p style={{ color: 'white', fontSize: '0.8rem', marginLeft: 10 }}>Available Ownables</p>}
      {/* {endTime ? <p style={{ color: 'white', fontSize: '0.8rem', marginLeft: 10 }}>Time taken: {endTime - startTime} ms</p> : null} */}
      {lastResponse ? <p style={{ color: 'white', fontSize: '0.8rem', marginLeft: 10 }}>Last Response: {lastResponse}</p> : null}
      <Box
        display={"flex"}
        p={2}
        flexDirection={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        width={"100%"}
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
                <th>#</th>
                <th>cid</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ownables.map((_ownable, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{_ownable.cid}</td>
                  {/* <td>
                    <ImageComponent _ownable={_ownable} />
                  </td> */}
                  <td>{_ownable.name}</td>
                  <td>{_ownable.description}</td>
                  <td>
                    <StyledButton
                      variant="contained"
                      transparent={false}
                      onClick={() => {
                        setLoading(true);
                        //@ts-ignore
                        props.setOwnables((prev: Ownable[]) => [...prev, { chain: _ownable.chain, package: _ownable.cid }]);
                        onClose();
                      }}
                    >
                      Accept
                    </StyledButton>
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
// {
//   "title": "Ownabletest",
//   "name": "ownabletest",
//   "description": "test",
//   "cid": "bafybeihteqaeziitvlbunkoeljetjx7pmesnjjmjcgd2tfr2gxtiudiq3q",
//   "keywords": [
//       "tesrt",
//       "hasNFT"
//   ],
//   "isNotLocal": true,
//   "isDynamic": true,
//   "hasMetadata": true,
//   "hasWidgetState": true,
//   "isConsumable": false,
//   "isConsumer": false,
//   "isTransferable": true,
//   "uniqueMessageHash": "7wFNqa7ypxExdzANfb41386gXh6ATvh8Y1jpQgi5Wqt3",
//   "versions": [
//       {
//           "date": "2024-12-03T00:11:29.571Z",
//           "cid": "bafybeihteqaeziitvlbunkoeljetjx7pmesnjjmjcgd2tfr2gxtiudiq3q",
//           "uniqueMessageHash": "7wFNqa7ypxExdzANfb41386gXh6ATvh8Y1jpQgi5Wqt3"
//       }
//   ],
//   "chain": {
//       "id": "8F99LsweSGzvhnMU9c2DF7jhDL7zQVRwkeLkX8CG7fbpahq5cujZJfJSFF8VfQq",
//       "events": [
//           {
//               "timestamp": 1733158346191,
//               "previous": "Dc8CqiP54w9xxa9Yt2pAYzc4uKGBMYuHQKs3VK4pJoBB",
//               "signKey": {
//                   "keyType": "ed25519",
//                   "publicKey": "A1A7kRkyLZqnJVkCwdhaRt44b2xwNEng6TAjn5qJHVMN"
//               },
//               "signature": "3ogCFbrpUytLUJHTkAJPbgBSe1vjbwMiZhkMbjdY3gPneKpuc3rrjaVjeTu31TuvKJcA2RtLhDuiPMzHKVNghW63",
//               "hash": "Cj1RaNjRvyJPHPGMEJzGGtMWmiuvX6nenWA5ja54q4hR",
//               "mediaType": "application/json",
//               "data": "base64:eyJAY29udGV4dCI6Imluc3RhbnRpYXRlX21zZy5qc29uIiwib3duYWJsZV9pZCI6IjhGOTlMc3dlU0d6dmhuTVU5YzJERjdqaERMN3pRVlJ3a2VMa1g4Q0c3ZmJwYWhxNWN1alpKZkpTRkY4VmZRcSIsInBhY2thZ2UiOiJiYWZ5YmVpaHRlcWFlemlpdHZsYnVua29lbGpldGp4N3BtZXNuamptamNnZDJ0ZnIyZ3h0aXVkaXEzcSIsIm5ldHdvcmtfaWQiOiJUIiwia2V5d29yZHMiOlsidGVzcnQiLCJoYXNORlQiXSwibmZ0Ijp7Im5ldHdvcmsiOiJhcmJpdHJ1bSIsImlkIjoiNTMiLCJhZGRyZXNzIjoiMHgwMjljM2I5NDZmMjhCNTM3OTMwZDA5OGJCRTAzOUQyMjFERTk2OGU2In19",
//               "attachments": []
//           },
//           {
//               "timestamp": 1733158346195,
//               "previous": "Cj1RaNjRvyJPHPGMEJzGGtMWmiuvX6nenWA5ja54q4hR",
//               "signKey": {
//                   "keyType": "ed25519",
//                   "publicKey": "A1A7kRkyLZqnJVkCwdhaRt44b2xwNEng6TAjn5qJHVMN"
//               },
//               "signature": "3kx5nbKJQCdTEjkT6WdQzuvJ3p19k9Py9zjysGaTYrmR148xagFWyftonVq351Fs5K4Yo2Syh87BEWGPnzkTngdR",
//               "hash": "3L4tnbNRHC1x7eVXqyWnox8QNnfstmtdsxN9ee9PhDQG",
//               "mediaType": "application/json",
//               "data": "base64:eyJAY29udGV4dCI6ImV4ZWN1dGVfbXNnLmpzb24iLCJ0cmFuc2ZlciI6eyJ0byI6IjNOMjJURkxMeTJNZXNrQXF3RkRjSzFoRE1yZGc0S3ptV2E1In19",
//               "attachments": []
//           }
//       ]
//   }
// }

// {
//   type: "basic",
//   sender: "3N5vwNey9aFkyrQ5KUzMt3qfuwg5jKKzrLB",
//   recipient: "3N22TFLLy2MeskAqwFDcK1hDMrdg4KzmWa5",
//   timestamp: "2024-12-02T16:52:29.953Z",
//   signature: "2qB51WEFz7MLWxusmYfKZbq9ukMR3vnpf1pPpQyueg1od9CsR7AXkhgsDyBHYe92sTzn7TbkWgxHzo5YAKx3Ew51",
//   hash: "7wFNqa7ypxExdzANfb41386gXh6ATvh8Y1jpQgi5Wqt3",
//   mediaType: "application/octet-stream",
//   size: 421372,
//   senderKeyType: "ed25519",
//   senderPublicKey: "A1A7kRkyLZqnJVkCwdhaRt44b2xwNEng6TAjn5qJHVMN",
// }
{/* <Dialog
open={showImportPackage}
onClose={() => setShowImportPackage(false)}
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
  <DialogContentText sx={{ color: "white", fontSize: "1.2rem", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <img
        src={'/logo_popup.png'}
        alt={"oBuilder Logo"}
        style={{}}
      />
      <b>Ownables Import</b>
    </div>
    <p style={{ color: 'white', fontSize: '0.8rem', marginLeft: 10 }}>Available Ownables</p>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" , width: "50%", marginBottom: "10px"}}>
          <img
            src={'https://picsum.photos/200'}
            alt={"oBuilder Logo"}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              marginRight: "16px",
            }}
          />
          <b>Test</b>          <span style={{}}>
            <span style={iconCircleStyle}><ReceiveIcon /></span>
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" , width: "50%",marginBottom: "10px"}}>
          <img
            src={'https://picsum.photos/200'}
            alt={"oBuilder Logo"}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              marginRight: "16px",
            }}
          />
          <b>Test</b>          <span style={{}}>
            <span style={iconCircleStyle}><ReceiveIcon /></span>
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" , width: "50%",marginBottom: "10px"}}>
          <img
            src={'https://picsum.photos/200'}
            alt={"oBuilder Logo"}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              marginRight: "16px",
            }}
          />
          <b>Test</b>          <span style={{}}>
            <span style={iconCircleStyle}><ReceiveIcon /></span>
          </span>
        </div>
    </div>
  </DialogContentText>
</DialogContent>
</Dialog> */}
