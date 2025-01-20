import {
  Box,
  Button,
  CircularProgress,
  Icon,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import LtoDrawer from "./DetailsModal/LtoDrawer";
import { ReactComponent as CloseDrawerIcon } from "../assets/close_drawer_icon.svg";
import styled from "@emotion/styled";
import { themeStyles } from "../theme/themeStyles";
import { themeColors } from "../theme/themeColors";
import LtoInput, { LtoInputRefMethods } from "./common/LtoInput";
import { useRef } from "react";
import React, { useCallback, useEffect, useState } from "react";
import {
  DialogContent,
  DialogContentText,
} from "@mui/material";
import LTOService, { getNetworkFromQuery } from "../services/LTO.service";
import useInterval from "../utils/useInterval";
import Dialog from "@mui/material/Dialog";
import JSZip from "jszip";
import axios from "axios";
import heic2any from "heic2any";
import { getNetwork, Transfer as TransferTx } from "@ltonetwork/lto";
import { TypedOwnable } from "../interfaces/TypedOwnableInfo";
import { useSnackbar } from "notistack";
import TagInputField from "./common/TagInputField";
import Loading from "./Loading";
import EventChainService from "../services/EventChain.service";
import { sendRNPostMessage } from "../utils/postMessage";
import { FileCopyOutlined, InfoRounded } from "@mui/icons-material";
import { activityLogService } from "../services/ActivityLog.service";
import { sign } from "@ltonetwork/http-message-signatures";
import { AppConfig, Network } from "../AppConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  title: string;
  isPersistent?: boolean;
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

const Input = styled.input`
  height: 42px;
  width: 100%;
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
`;
const titleStyle = { ...themeStyles.fs24fw600lh29, textAlign: "center" };

const closeModalBtnStyle = {
  padding: 0,
  color: themeColors.error,
};
const infoButtonStyle = {
  color: themeColors.iconLiner,
  cursor: "pointer",
};
const LTO_REPRESENTATION = 100000000;

const CreateOwnablesDrawer = (props: Props) => {
  const { open, onClose } = props;

  const onCancel = () => onClose();

  const nameOwnerRef = useRef<LtoInputRefMethods>(null);
  const emailOwnerRef = useRef<LtoInputRefMethods>(null);
  const nameOwnableRef = useRef<LtoInputRefMethods>(null);
  const descriptionRef = useRef<LtoInputRefMethods>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ltoWalletAddress = LTOService.address;
  const [showNoBalance, setShowNoBalance] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [ownable, setOwnable] = useState<TypedOwnable>({
    owner: "",
    email: "",
    name: "",
    description: "",
    keywords: [],
    evmAddress: "",
    network: "arbitrum",
    image: null,
  });

  const [recipient, setShowAddress] = useState<string | undefined>();
  const [noConnection, setNoConnection] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("arbitrum");
  const [thumbnail, setThumbnail] = useState<Blob | null>(null);
  const [blurThumbnail, setBlurThumbnail] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [availableChains, setAvailableChains] = useState<IAvailableChains | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [allBuildCosts, setAllBuildCosts] = useState<any>(null);
  const [available, setAvailable] = useState(0);
  const [lowBalance, setLowBalance] = useState(false);
  const [buildCost, setBuildCost] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [showAmount, setShowAmount] = useState<number>(0);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [transactionIdMessage, setTransactionIdMessage] = useState<string | null>(null);
  const [createOwnableMessage, setCreateOwnableMessage] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const network = getNetworkFromQuery();

  const fetchBuildAmount = useCallback(async () => {
    try {
      const response =
        await axios.get(
          `${AppConfig.OBUILDER(await activityLogService.checkToUseBackupOBuilder())}/api/v1/availableChains`,
        );
      let _ = new Object();
      Object.keys(response.data).forEach((key) => {
        //@ts-ignore
        _[key] = response.data[key].testnet;
      });
      const allBuildCosts = _;
      const availableChains = _ as IAvailableChains;
      //@ts-ignore
      let selectedChain = availableChains[selectedNetwork] || availableChains["arbitrum"];
      if (!selectedChain) {
        //check if there is a chain available and select the first one
        const keys = Object.keys(availableChains);
        if (keys.length > 0) {
          selectedChain = availableChains[keys[0]];
        }
      }
      console.log("selectedChain", selectedChain);
      setSelectedChain(selectedChain.name);
      const templateCostValue = selectedChain?.templateCost["1"];
      const value = (typeof templateCostValue === 'number' ? templateCostValue / LTO_REPRESENTATION : Number(templateCostValue) / LTO_REPRESENTATION) + 1;
      setAvailableChains(availableChains);
      setAllBuildCosts(allBuildCosts);
      setBuildCost(value);
      console.log("OBUILDER", AppConfig.OBUILDER(await activityLogService.checkToUseBackupOBuilder()));
      const address = await axios.get(
        `${AppConfig.OBUILDER(await activityLogService.checkToUseBackupOBuilder())}/api/v1/GetServerInfo`,
      );
      let serverAddress;
      if (network === Network.MAINNET) {
        serverAddress = address.data.serverLtoWalletAddress_L;
      } else {
        serverAddress = address.data.serverLtoWalletAddress_T;
      }
      console.log("serverAddress", serverAddress);
      const calculatesAmount =
        parseFloat(templateCostValue.toString()) / LTO_REPRESENTATION + 1;
      console.log("calculatesAmount", calculatesAmount);
      if (calculatesAmount < 1.1) {
        console.log("error server is not ready yet");
        setNoConnection(true);
        return;
      } else {
        setBuildCost(calculatesAmount);
        setShowAmount(calculatesAmount);
        setShowAddress(serverAddress);
        setAmount(+templateCostValue);
      }
    } catch (error) {
      console.error("Error fetching build amount:", error);
      setNoConnection(true);
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (open) {
      fetchBuildAmount();
    }
  }, [fetchBuildAmount, open]);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCreateOwnableMessage(null);
    setTransactionId(null);
    onClose();
  };

  const handleClose = () => {
    handleCloseDialog();
    clearFields();
    clearImageAndThumbnail();
    setBlurThumbnail(false);
    onClose();
  };

  const handleFileUploadClick = () => {
    // let rn app know that the user wants to upload a file so to set the state
    // properly
    sendRNPostMessage(JSON.stringify({ type: "uploadFileStart" }));
    const fileInput = fileInputRef.current;
    if (fileInput) {
      fileInput.click();

      // Add an event listener to handle the case when no file is selected
      fileInput.addEventListener(
        "change",
        () => {
          if (!fileInput.files || fileInput.files.length === 0) {
            clearImageAndThumbnail();
          }
        },
        { once: true }
      ); // Ensure the event listener is called only once
    }
  };

  const clearFields = () => {
    setOwnable({
      owner: "",
      email: "",
      name: "",
      description: "",
      keywords: [],
      evmAddress: "",
      network: "arbitrum",
      image: null,
    });
    setSelectedNetwork("arbitrum");
  };

  const loadBalance = () => {
    LTOService.getBalance().then(({ regular }) => {
      setBalance(parseFloat((regular / 100000000).toFixed(2)));
      setAvailable(regular);
      sendRNPostMessage(JSON.stringify({ type: "balance", data: balance }));
      sendRNPostMessage(JSON.stringify({ type: "buildCost", data: buildCost }));
      if (balance < 0.1) {
        setLowBalance(true);
      }
      if (buildCost > balance) {
        setLowBalance(true);
      } else {
        setLowBalance(false);
      }
    });
  };

  useEffect(() => loadBalance(), []);
  useInterval(() => loadBalance(), 5 * 1000);

  useEffect(() => {
    if (balance !== undefined && balance < 0.1) {
      setShowNoBalance(true);
    } else {
      setShowNoBalance(false);
    }
  }, [balance]);

  const handleNetworkChange = (value: string) => {
    setOwnable((prevOwnable) => ({
      ...prevOwnable,
      network: value,
    }));
    fetchBuildAmount();
  }

  const clearImageAndThumbnail = () => {
    setThumbnail(null);
    setOwnable((prevOwnable) => ({
      ...prevOwnable,
      image: null,
    }));
    // Reset file input
    const fileInput = document.getElementById("fileUpload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    let file = e.target.files?.[0] || null;

    if (file && file.type === "image/heic") {
      const blob = await heic2any({
        blob: file,
        toType: "image/webp",
        quality: 0.7,
      });
      if (blob instanceof Blob) {
        file = new File([blob], file.name, { type: "image/webp" });
      }
    }

    if (file) {
      const resizedImage = await resizeImage(file);
      file = new File([resizedImage], file.name, { type: "image/webp" });
      // Create a thumbnail from the resized image
      setOwnable((prevOwnable) => ({
        ...prevOwnable,
        image: file,
      }));
      const thumbnailImage = await createThumbnail(resizedImage);
      setThumbnail(thumbnailImage);
    }
    sendRNPostMessage(JSON.stringify({ type: "uploadFileEnd" }));
    setLoading(false);

  };

  async function createThumbnail(blob: Blob): Promise<Blob> {
    return blob;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        // Set thumbnail size
        canvas.width = 50; // Example thumbnail width
        canvas.height = 50; // Example thumbnail height
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Could not create thumbnail blob"));
          }
        }, "image/webp");
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }

  // Handler for uploading a different thumbnail
  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let file = e.target.files?.[0] || null;
    if (file && file.type === "image/heic") {
      const blob = await heic2any({
        blob: file,
        toType: "image/webp",
        quality: 0.7,
      });
      if (blob instanceof Blob) {
        file = new File([blob], file.name, { type: "image/webp" });
      }
    }

    if (file) {
      const resizedImage = await resizeImage(file);
      console.log(resizedImage);
      file = new File([resizedImage], file.name, { type: "image/webp" });
      // Create a thumbnail from the resized image
      const thumbnailImage = await createThumbnail(resizedImage);
      setThumbnail(thumbnailImage);
    }
  };

  async function resizeImage(file: File): Promise<Blob> {
    return file;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // If the image is already square, no need to resize
        if (width === height) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = width;
          canvas.height = height;
          ctx!.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Could not create blob"));
            }
          }, "image/webp");
          // }, file.type);
        } else {
          // Determine the larger dimension and set the canvas size to create a square
          const maxSize = Math.max(width, height);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = maxSize;
          canvas.height = maxSize;

          // Fill the canvas with a transparent background
          ctx!.fillStyle = "rgba(0, 0, 0, 0)";
          ctx!.fillRect(0, 0, maxSize, maxSize);

          // Draw the image in the center of the canvas
          const x = maxSize / 2 - width / 2;
          const y = maxSize / 2 - height / 2;
          ctx!.drawImage(img, x, y, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Could not create blob"));
            }
          }, "image/webp");
        }
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  async function getThumbnailBlob(
    thumbnail: File | Blob,
    blur: boolean
  ): Promise<Blob> {
    if (!blur) {
      return thumbnail; // No blur needed, return original
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("2D context could not be created"));
        return;
      }
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.filter = "blur(5px)"; // Apply blur effect
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Blob conversion failed"));
          }
        }, "image/webp");
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(thumbnail);
    });
  }

  const getBuildCostInLTO = (chain: string) => {
    const chainCost = allBuildCosts[chain];
    if (chainCost) {
      const value = chainCost?.templateCost["1"];
      const chainCostValue = typeof value === 'number' ? value : Number(value);
      if (chainCostValue) {
        const _ = (chainCostValue / LTO_REPRESENTATION) + 1;
        return _?.toFixed(4) || 0;
      } else {
        return 0;
      }
    }
    return 0;
  }

  const handleCreateOwnable = async () => {


    const ownerName = nameOwnerRef.current?.value() || "";
    const ownerEmail = emailOwnerRef.current?.value() || "";
    const ownableName = nameOwnableRef.current?.value() || "";
    const description = descriptionRef.current?.value() || "";
    const image = fileInputRef.current?.files?.[0] || null;


    const requiredFields = [
      { name: "Owner name", value: ownerName },
      { name: "Ownable name", value: ownableName },
      { name: "Image", value: image },
    ];

    let newMissingFields: string[] = [];
    let newInvalidFields: string[] = [];
    for (let field of requiredFields) {
      if (!field.value) {
        console.error(`Missing required field: ${field.name}`);
        newMissingFields.push(field.name);
      }
    }

    for (let field of [ownerName, ownableName, description]) {
      if (!validateInput(field)) {
        console.error(`Invalid characters in field: ${field}`);
        newInvalidFields.push(field);
      }
    }



    setErrorMessage(
      newMissingFields.length > 0 || newInvalidFields.length > 0
        ? `Missing required fields: ${newMissingFields.join(", ")} ${newInvalidFields.length > 0 ? `and Invalid characters in fields: ${newInvalidFields.join(", ")}` : ""}`
        : null
    );
    EventChainService.anchoring = true;
    if (newMissingFields.length > 0) {
      return;
    }
    if (!recipient || !buildCost) {
      console.error("Recipient or amount is not defined");
      setNoConnection(true);
      return;
    }
    activityLogService.logActivity({
      activity: `Creating ownable ${ownableName}`,
      timestamp: Date.now(),
    });
    setOpenDialog(true);
    setCreateOwnableMessage("Creating ownable...");
    const tx = new TransferTx(recipient, amount);
    setCreateOwnableMessage("Sending transaction...");
    try {
      const account = await LTOService.getAccount();
      const transaction = await LTOService.broadcast(tx!.signWith(account));
      setCreateOwnableMessage("Contacting oBuilder...");
      const url = `${AppConfig.OBUILDER(await activityLogService.checkToUseBackupOBuilder())}/api/v1/upload`;
      const request = {
        headers: {},
        method: "POST",
        url,
      };
      const signedRequest = await sign(request, { signer: account });
      request.url =
        request.url + `?ltoNetworkId=${getNetworkFromQuery()}`;
      console.log("signedRequest", signedRequest);
      const headers1 = {
        "Content-Type": "multipart/form-data",
        Accept: "*/*",
      };
      const combinedHeaders = { ...signedRequest.headers, ...headers1 };
      console.log("combinedHeaders", combinedHeaders);
      setTimeout(() => {
        if (transaction.id) {
          const imageType = "webp";
          const imageName = ownableName.replace(/\s+/g, "-");
          const formattedName = ownableName.toLowerCase().replace(/\s+/g, "_");

          const ownableData = [
            {
              template: "template1",
              CREATE_NFT: "true",
              NFT_BLOCKCHAIN: ownable.network,
              NFT_TOKEN_URI:
                "https://black-rigid-chickadee-743.mypinata.cloud/ipfs/QmSHE3ReBy7b8kmVVbyzA2PdiYyxWsQNU89SsAnWycwMhB",
              OWNABLE_THUMBNAIL: "thumbnail.webp",
              OWNABLE_LTO_TRANSACTION_ID: transaction.id,
              PLACEHOLDER1_NAME: "ownable_" + formattedName,
              PLACEHOLDER1_DESCRIPTION: description,
              PLACEHOLDER1_VERSION: "0.1.0",
              PLACEHOLDER1_AUTHORS: ownerName + " <" + ownerEmail + ">",
              PLACEHOLDER1_KEYWORDS: tags,
              PLACEHOLDER2_TITLE: ownableName,
              PLACEHOLDER2_IMG: imageName + "." + imageType,
              PLACEHOLDER4_TYPE: ownableName,
              PLACEHOLDER4_DESCRIPTION: description,
              PLACEHOLDER4_NAME: ownableName,
            },
          ];
          const zip = new JSZip();
          zip.file("ownableData.json", JSON.stringify(ownableData, null, 2));
          if (ownable.image) {
            zip.file(`${imageName}.${imageType}`, ownable.image);
          }

          if (thumbnail) {
            const thumbnailBlob = getThumbnailBlob(thumbnail, blurThumbnail);
            zip.file(`thumbnail.webp`, thumbnailBlob);
          }
          zip.generateAsync({ type: "blob" }).then(async (zipFile: Blob) => {
            const url = `${AppConfig.OBUILDER(await activityLogService.checkToUseBackupOBuilder())}/api/v1/upload?ltoNetworkId=${getNetwork(account.address)}`;
            const formData = new FormData();
            formData.append("file", zipFile, formattedName + ".zip");

            axios
              .post(request.url, formData, {
                headers: combinedHeaders,
                onUploadProgress: (progressEvent) => {
                  let _progress = progressEvent.total ?
                    Math.round((progressEvent.loaded * 100) / progressEvent.total) : progressEvent.progress || 0;
                  setProgress(_progress);
                },
              })
              .then((res) => {
                console.log(res.data);
                if (res.data.error) {
                  setBuildError(res.data.error);
                  activityLogService.logActivity({
                    activity: `Error creating ownable ${ownableName} ${res.data.error}`,
                    timestamp: Date.now(),
                  });
                  return;
                }
                setTransactionId(res.data.rid);
                activityLogService.logActivity({
                  activity: `Ownable ${ownableName} created id: ${res.data.rid}`,
                  timestamp: Date.now(),
                });
              })
              .catch((err) => {
                console.log(err);
                setOpenDialog(false);
                setBuildError("Something went wrong. Please try again");
                activityLogService.logActivity({
                  activity: `Error creating ownable ${ownableName} ${err}`,
                  timestamp: Date.now(),
                });
              });
          });
        }
      }, 1000);
    } catch (error) {
      setOpenDialog(false);
      console.error("Error sending transaction:", error);
      setBuildError("Something went wrong. Please try again");
    }
  };

  // only allow alphanumeric characters and spaces
  const validateInput = (value: string) => {
    if (!value) return true;
    return /^[a-zA-Z0-9\s]*$/.test(value);
  };

  return (
    <LtoDrawer
      open={open}
      onClose={onClose}
      shouldHideBackdrop={false}
      isPersistent={props.isPersistent}
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
      <Box sx={{ color: "white" }}>
        <Box
          display={"flex"}
          p={1}
          flexDirection={"row"}
          alignItems={"flex-start"}
        >
          <Box p={0} width={"100%"}>

            <Box p={0} width={"100%"}>
              {" "}
              {/* Make the Box full width */}
              <Box
                display="flex"
                flexDirection="column"
                width={"100%"}
              >
                {/* <Box p={2}> */}
                <p className="text">
                  Welcome to the oBuilder. Here you can create your very own Ownables and  for a small fee they will register on the LTO Network blockchain.<br /><br />
                  Learn More
                  <IconButton
                    aria-label="info"
                    onClick={() => sendRNPostMessage(JSON.stringify({ type: "openInfo" }))}
                    sx={infoButtonStyle}
                  >
                    <InfoRounded style={{ fontSize: 20, color: 'white' }} />
                  </IconButton>
                </p>
                <StyledButton transparent={false} onClick={handleFileUploadClick}>
                  Choose an Image
                </StyledButton>
                <br></br>
                <input
                  id="fileUpload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.heic"
                  onChange={handleImageUpload}
                  style={{ marginBottom: "10px", display: "none" }} />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                    width: "100%", // Make the div full width
                  }}
                >
                  {ownable.image && (
                    <div>
                      <img
                        src={URL.createObjectURL(ownable.image)}
                        alt="Selected"
                        style={{ width: "100px", height: "auto" }} />
                    </div>
                  )}
                  {thumbnail && (
                    <>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "smaller", lineHeight: "1" }}>
                          Wallet
                          <br />
                          thumbnail
                        </div>
                        <img
                          src={URL.createObjectURL(thumbnail)}
                          alt="Thumbnail"
                          style={{
                            width: "50px",
                            height: "auto",
                            filter: blurThumbnail ? "blur(5px)" : "none",
                          }} />
                      </div>
                    </>
                  )}
                </div>
                <br></br>
                {thumbnail && (
                  <>
                    <Button onClick={() => setBlurThumbnail(!blurThumbnail)}>
                      {blurThumbnail ? "Unblur Thumbnail" : "Blur Thumbnail"}
                    </Button>
                    <br></br>
                    <Button>
                      <label htmlFor="thumbUpload" className="custom-file-upload">
                        Change Thumbnail
                      </label>
                    </Button>
                    <input
                      id="thumbUpload"
                      type="file"
                      accept="image/*,.heic"
                      onChange={handleThumbnailUpload}
                      style={{ marginBottom: "10px", display: "none" }} />
                  </>
                )}
                {" "}
                {/* Make the Box full width */}
                <Typography
                  sx={{
                    fontSize: {
                      xs: "0.8rem",
                      sm: "0.9rem",
                      md: "1.1rem",
                    },
                    color: "white",
                    marginBottom: "5px",
                  }}
                >
                  Choose NFT network
                </Typography>
                {!availableChains || !buildCost ? <Loading show={true} /> : <>
                  <Select
                    value={selectedNetwork}
                    onChange={(e) => {
                      handleNetworkChange(e.target.value);
                      setSelectedNetwork(e.target.value);
                    }}
                    sx={{
                      width: "100%",
                      backgroundColor: "transparent",
                      color: "white",
                      border: "1px solid #3a3a3c",
                    }}
                    inputProps={{
                      MenuProps: {
                        PaperProps: {
                          style: {
                            backgroundColor: "#3a3a3c",
                            color: "white",
                          },
                        },
                      },
                    }}

                  >
                    {!availableChains || !buildCost ? <Loading show={true} /> : Object.keys(availableChains).map((chain) => {
                      return (
                        <MenuItem key={chain} value={chain}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <Typography
                              sx={{
                                fontSize: {
                                  xs: "0.7rem",
                                  sm: "0.9rem",
                                  md: "1.1rem",
                                },
                                color: "white",
                              }}
                              color="text.secondary"
                            >{availableChains[chain]?.logo &&
                              <img src={availableChains[chain].logo} alt={chain} style={{ width: "20px", height: "20px", marginRight: "10px" }} />}
                              {uppercaseFirstLetter(chain)}
                              {getBuildCostInLTO(chain) && <span style={{ marginLeft: "10px" }}>Build cost: {getBuildCostInLTO(chain)} LTO</span>} (incl. Fee: 1 LTO)
                            </Typography>
                          </div>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </>
                }
              </Box>
              <br></br>
              <LtoInput ref={nameOwnerRef} label="Owner name" validation={(value) => validateInput(value)} />
              {/* <LtoInput ref={emailOwnerRef} label="Owner email" /> */}
              <LtoInput ref={nameOwnableRef} label="Ownable name" validation={(value) => validateInput(value)} />
              <LtoInput ref={descriptionRef} label="Description" validation={(value) => validateInput(value)} />
              <TagInputField onTagsChange={setTags} />
              <br></br>
              <br></br>
              <br></br>

              {errorMessage && (
                <div style={{ color: "red" }}>{errorMessage}</div>
              )}
              <Box height={40} />
              <Box display={"flex"} flexDirection={"column"} width={"100%"}>
                <StyledButton
                  transparent={false}
                  onClick={handleCreateOwnable}
                  disabled={isNaN(buildCost) || buildCost <= 0 || buildCost > available}
                  size="large"
                  style={{ color: "white" }}
                >
                  Build
                </StyledButton>
                <Box height={8} />
                <StyledButton transparent={true} onClick={onCancel}>
                  Cancel
                </StyledButton>
              </Box>
            </Box>
          </Box>
          {/* Server Connection Dialog */}
          <Dialog
            open={noConnection}
            hideBackdrop
            onClose={() => setNoConnection(false)}
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
              <DialogContentText sx={{ color: "white", fontSize: "1.2rem" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={'/logo_popup.png'}
                    alt={"oBuilder Logo"}
                    style={{}}
                  />
                  <b>Error Connecting to Server</b>
                  <p>
                    The server seems to be down, please try again later.
                  </p>
                  <Button onClick={() => {
                    setNoConnection(false);
                    setLowBalance(false);
                    setShowNoBalance(false);
                    props.onClose();
                  }
                  } sx={{ backgroundColor: themeColors.primary, color: "white" }}>
                    Ok
                  </Button>
                </div>
              </DialogContentText>
            </DialogContent>
          </Dialog>
          <Dialog
            open={lowBalance || showNoBalance}
            hideBackdrop
            onClose={() => setLowBalance(false)}
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
                  <br />
                  <b>WARNING</b>
                  <>
                    Your balance is too low.<br /> A minimum of {(showAmount + 1).toFixed(4)} LTO is
                    required to build an ownable.
                  </>
                </div>
                <Button onClick={() => {
                  setLowBalance(false);
                  setNoConnection(false);
                  props.onClose();
                }} sx={{ backgroundColor: themeColors.primary, color: "white" }}>
                  Ok
                </Button>
              </DialogContentText>
            </DialogContent>
          </Dialog>
          <Dialog open={openDialog} onClose={handleCloseDialog}
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
                  <b>oBuilder Status</b>
                </div>
                {transactionId && <div style={{ display: "flex", flexDirection: "row", width: '100%', color: 'white', justifyContent: 'center', alignItems: 'center' }}>
                  <Input
                    disabled
                    placeholder=""
                    value={transactionId}
                    style={{

                    }}
                  />
                  <IconButton
                    onClick={() => {
                      console.log("transactionId", transactionId);
                      navigator.clipboard.writeText(transactionId || '');
                      setTransactionIdMessage("Copied to clipboard");
                      setTimeout(() => setTransactionIdMessage(null), 2000);
                    }}
                  >
                    <FileCopyOutlined style={{ color: 'white' }} />
                  </IconButton>
                </div>}
                {
                  !transactionId &&
                  <div>
                    <p style={{ color: 'green', fontSize: '0.8rem', marginLeft: 10 }}>{createOwnableMessage}</p>
                    <CircularProgress />
                    <LinearProgress variant="determinate" value={progress} />
                  </div>
                }
                <p style={{ color: 'white', fontSize: '0.8rem', marginLeft: 10 }}>{transactionIdMessage}</p>

                {transactionId && <Button onClick={handleClose} sx={{ backgroundColor: themeColors.primary, color: "white" }} disabled={transactionId === null}>
                  Done
                </Button>
                }
              </DialogContentText>
            </DialogContent>
          </Dialog>
          <Dialog
            open={buildError !== null}
            onClose={() => setBuildError(null)}
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
                  <b>oBuilder Status</b>
                  <p>{buildError}</p>
                </div>
              </DialogContentText>
            </DialogContent>
          </Dialog>
        </Box>
      </Box>
      <Loading show={loading} />
    </LtoDrawer>
  );
};
export default CreateOwnablesDrawer;

export interface IAvailableChains {
  [key: string]: {
    name: string;
    logo: string;
    smartContractAddress: string;
    totalAmountNFTs: string;
    templateCost: {
      [key: string]: string;
    };
  };
}


const uppercaseFirstLetter = (string: string) => {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
}
