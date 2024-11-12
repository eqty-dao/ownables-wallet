import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Icon,
  IconButton,
  Input,
  MenuItem,
  Radio,
  RadioGroup,
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
  Alert,
  AlertTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Hidden,
} from "@mui/material";
import LTOService from "../services/LTO.service";
import useInterval from "../utils/useInterval";
import Dialog from "@mui/material/Dialog";
import JSZip from "jszip";
import axios from "axios";
import heic2any from "heic2any";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { Transfer as TransferTx } from "@ltonetwork/lto";
import { TypedOwnable } from "../interfaces/TypedOwnableInfo";
import { useSnackbar } from "notistack";
import TagInputField from "./common/TagInputField";
import Loading from "./Loading";
import Modal from "@mui/material/Modal";
import EventChainService from "../services/EventChain.service";
import { sendRNPostMessage } from "../utils/postMessage";
import { FileCopy, FileCopyOutlined } from "@mui/icons-material";

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
const contentContainerStyle = {

};

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
  const [balance, setBalance] = useState<number>();
  const [ownable, setOwnable] = useState<TypedOwnable>({
    owner: "",
    email: "",
    name: "",
    description: "",
    keywords: [],
    evmAddress: "",
    network: "ethereum",
    image: null,
  });

  const [recipient, setShowAddress] = useState<string | undefined>();
  const [noConnection, setNoConnection] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("ethereum");
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

  const fetchBuildAmount = useCallback(async () => {
    try {
      const response =
        await axios.get(
          `${process.env.REACT_APP_OBUILDER}/api/v1/availableChains`,
          // `${process.env.REACT_APP_OBUILDER}/api/v1/templateCost?templateId=1`,
          // 'http://obuilder-env.eba-ftdayif2.eu-west-1.elasticbeanstalk.com/api/v1/templateCost?templateId=1',
          // 'http://obuilder-env.eba-ftdayif2.eu-west-1.elasticbeanstalk.com/api/v1/templateCost?templateId=1&chain='+selectedNetwork,
          // 'http://localhost:3000/api/v1/templateCost?templateId=1&chain='+selectedNetwork,
          // {
          //   headers: {
          //     Accept: "*/*",
          //   },
          // }
        );
      const allBuildCosts = response.data as any;
      const availableChains = response.data as IAvailableChains;
      const selectedChain = availableChains[selectedNetwork];
      const templateCostValue = selectedChain?.templateCost["1"];
      const value = (typeof templateCostValue === 'number' ? templateCostValue / LTO_REPRESENTATION : Number(templateCostValue) / LTO_REPRESENTATION) + 1;
      setSelectedChain(selectedChain.name);
      setAvailableChains(availableChains);
      setAllBuildCosts(allBuildCosts);
      setBuildCost(value);
      const address = await axios.get(
        `${process.env.REACT_APP_OBUILDER}/api/v1/ServerWalletAddressLTO`,
        // 'http://obuilder-env.eba-ftdayif2.eu-west-1.elasticbeanstalk.com/api/v1/ServerWalletAddressLTO',
        // "http://localhost:3000/api/v1/ServerWalletAddressLTO",
        // {
        //   headers: {
        //     Accept: "*/*",
        //   },
        // }
      );
      console.log("address", address.data.serverWalletAddressLTO);
      const serverAddress = address.data.serverWalletAddressLTO;
      // for testing now use 3NBq1gTwDg2SfQvArc3C7E9PCFnS7hqqdzo
      // const serverAddress = "3NBq1gTwDg2SfQvArc3C7E9PCFnS7hqqdzo";
      console.log("serverAddress", serverAddress);
      const calculatesAmount =
        parseFloat(templateCostValue.toString()) / LTO_REPRESENTATION + 1;
      console.log("calculatesAmount", calculatesAmount);
      if (calculatesAmount < 1.1) {
        console.log("error server is not ready yet");
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
    fetchBuildAmount();
  }, [fetchBuildAmount]);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    onClose();
  };

  const handleClose = () => {
    handleCloseDialog();
    clearFields();
    clearImageAndThumbnail();
    setBlurThumbnail(false);
    onClose();
  };

  const { enqueueSnackbar } = useSnackbar();

  const handleCopy = (e: any) => {
    const value = e.currentTarget.textContent;
    if (value) {
      if (window.navigator?.clipboard) {
        window.navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement('textarea');
        el.value = value;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    }
    enqueueSnackbar("Address copied to clipboard", { variant: "success" });
  }

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
      network: "ethereum",
      image: null,
    });
    setSelectedNetwork("ethereum");
  };

  const loadBalance = () => {
    if (!LTOService.isUnlocked()) return;

    LTOService.getBalance().then(({ regular }) => {
      setBalance(parseFloat((regular / 100000000).toFixed(2)));
      setAvailable(regular);
    });
  };

  useEffect(() => loadBalance(), []);
  useInterval(() => loadBalance(), 5 * 1000);

  useEffect(() => {
    if (balance !== undefined && balance < 0.1) {
      setShowNoBalance(true);
      return;
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
      const thumbnailImage = await createThumbnail(resizedImage);
      setThumbnail(thumbnailImage);
    }
    sendRNPostMessage(JSON.stringify({ type: "uploadFileEnd" }));

    setOwnable((prevOwnable) => ({
      ...prevOwnable,
      image: file,
    }));
  };

  async function createThumbnail(blob: Blob): Promise<Blob> {
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
        return (chainCostValue / LTO_REPRESENTATION) + 1;
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
    setOpenDialog(true);
    setCreateOwnableMessage("Creating ownable...");
    const tx = new TransferTx(recipient, amount);
    setCreateOwnableMessage("Sending transaction...");
    try {
      const account = await LTOService.getAccount();
      const transaction = await LTOService.broadcast(tx!.signWith(account));
      setCreateOwnableMessage("Contacting oBuilder...");
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
              // PLACEHOLDER1_AUTHORS: ownerName + " <" + ownerEmail + ">",
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
          zip.generateAsync({ type: "blob" }).then((zipFile: Blob) => {
            const url = `${process.env.REACT_APP_OBUILDER}/api/v1/upload`;
            const formData = new FormData();
            formData.append("file", zipFile, formattedName + ".zip");
            axios
              .post(url, formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                  Accept: "*/*",
                },
              })
              .then((res) => {
                console.log(res.data);
                if (res.data.error) {
                  setBuildError(res.data.error);
                  return;
                }
                setTransactionId(res.data.rid);
              })
              .catch((err) => {
                console.log(err);
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
          p={2}
          flexDirection={"row"}
          alignItems={"flex-start"}
        >
          <Box p={1} width={"100%"}>
            {/* <Box p={2}> */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box component="div" sx={{ width: "100%" }}>
                {" "}
                {/* Make the Box full width */}
                <Typography
                  sx={{ fontSize: 12, color: "white" }}
                  color="text.secondary"
                >
                  LTO Network Address
                </Typography>
                <Typography
                  sx={{ fontSize: 12, fontWeight: 600 }}
                  component="div"
                  onClick={e => handleCopy(e)}
                  style={{ cursor: "pointer" }}
                >
                  {ltoWalletAddress}
                </Typography>
                <Typography variant="body2" sx={{}}>
                  Balance: {balance !== undefined ? balance + " LTO" : ""}
                </Typography>
                {/* <Typography variant="body2" sx={{ mt: 1 }}>
                  build cost:{" "}
                  {showAmount !== undefined ? showAmount + " LTO" : ""} (incl.
                  Fee: 1 LTO)
                </Typography> */}
              </Box>
              <Hidden smUp>
                <IconButton
                  onClick={handleClose}
                  size="small"
                  sx={{ mr: 2, mt: -1 }}
                >
                  <HighlightOffIcon />
                </IconButton>
              </Hidden>
            </Box>
            <Box p={0} width={"100%"}>
              {" "}
              {/* Make the Box full width */}
              <Box
                display="flex"
                flexDirection="column"
                width={"100%"}
              >
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
              <StyledButton transparent={false} onClick={handleFileUploadClick}>
                Choose File
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
                  Create
                </StyledButton>
                <Box height={8} />
                <StyledButton transparent={true} onClick={onCancel}>
                  Cancel
                </StyledButton>
              </Box>
            </Box>
          </Box>
          <Dialog
            open={noConnection}
            hideBackdrop
            onClose={() => setNoConnection(false)}
          >
            <Alert variant="outlined" severity="warning">
              <AlertTitle>No server Connection</AlertTitle>
              The server seems to be down, please try again later.
            </Alert>
          </Dialog>
          <Dialog
            open={showNoBalance}
            hideBackdrop
            onClose={() => setShowNoBalance(false)}
          >
            <Alert variant="outlined" severity="warning">
              <AlertTitle>Your balance is zero</AlertTitle>A minumum of{" "}
              {showAmount + 1} LTO is required to build a ownable.
            </Alert>
          </Dialog>
          <Dialog
            open={lowBalance}
            hideBackdrop
            onClose={() => setLowBalance(false)}
          >
            <Alert variant="outlined" severity="warning">
              <AlertTitle>
                Your balance is to low. A A minumum of {showAmount + 1} LTO is
                required to build a ownable.{" "}
              </AlertTitle>
              Please top up.
            </Alert>
          </Dialog>
          <Dialog open={openDialog} onClose={handleCloseDialog} sx={{
            "& .MuiDialog-paper": {
              backgroundColor: "#3a3a3c",
              color: "white",
              borderRadius: "10px",
              width: "100%",
            },
            "& .MuiDialogTitle-root": {
              borderBottom: "1px solid #3a3a3c",
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
                    src={'/brand_logo.png'}
                    alt={"oBuilder Logo"}
                    style={{ width: "2.5rem", height: "2rem", marginBottom: "10px" }}
                  />
                  <b>oBuilder Status</b>
                </div>
                {transactionId && <div style={{ display: "flex", flexDirection: "row", width: '100%' }}>
                  <Input
                    disabled
                    placeholder=""
                    value={transactionId}
                    style={{
                      width: '100%',
                      backgroundColor: '#656565',
                      borderRadius: 10,
                      color: 'white',
                      padding: '5px',
                      margin: '10px 0',
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
                  </div>
                }
                <p style={{ color: 'green', fontSize: '0.8rem', marginLeft: 10 }}>{transactionIdMessage}</p>
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} sx={{ backgroundColor: themeColors.primary, color: "white" }} disabled={transactionId === null}>
                Done
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog
            open={buildError !== null}
            onClose={() => setBuildError(null)}
          >
            <Alert severity="error">{buildError}</Alert>
          </Dialog>
        </Box>
      </Box>
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
