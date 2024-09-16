import {
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
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

const StyledButton = styled(Button)<StyledButtonProps>`
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
  const [available, setAvailable] = useState(0);
  const [lowBalance, setLowBalance] = useState(false);
  const [amount, setAmount] = useState(0);
  const [showAmount, setShowAmount] = useState<number>(0);
  const [recipient, setShowAddress] = useState<string | undefined>();
  const [noConnection, setNoConnection] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("ethereum");
  const [thumbnail, setThumbnail] = useState<Blob | null>(null);
  const [blurThumbnail, setBlurThumbnail] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  const fetchBuildAmount = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_OBUILDER}/api/v1/templateCost?templateId=1`,
        // 'http://obuilder-env.eba-ftdayif2.eu-west-1.elasticbeanstalk.com/api/v1/templateCost?templateId=1',
        // 'http://obuilder-env.eba-ftdayif2.eu-west-1.elasticbeanstalk.com/api/v1/templateCost?templateId=1&chain='+selectedNetwork,
        // 'http://localhost:3000/api/v1/templateCost?templateId=1&chain='+selectedNetwork,
        {
          headers: {
            Accept: "*/*",
          },
        }
      );
      console.log("response", response);
      console.log("response.data", response.data[selectedNetwork]);
      const value = +response.data[selectedNetwork];
      console.log("BuildAmount", value);
      const address = await axios.get(
        `${process.env.REACT_APP_OBUILDER}/api/v1/ServerWalletAddressLTO`,
        // 'http://obuilder-env.eba-ftdayif2.eu-west-1.elasticbeanstalk.com/api/v1/ServerWalletAddressLTO',
        // "http://localhost:3000/api/v1/ServerWalletAddressLTO",
        {
          headers: {
            Accept: "*/*",
          },
        }
      );
      console.log("address", address.data.serverWalletAddressLTO);
      const serverAddress = address.data.serverWalletAddressLTO;
      // for testing now use 3NBq1gTwDg2SfQvArc3C7E9PCFnS7hqqdzo
      // const serverAddress = "3NBq1gTwDg2SfQvArc3C7E9PCFnS7hqqdzo";
      console.log("serverAddress", serverAddress);
      const LTO_REPRESENTATION = 100000000;
      const calculatesAmount =
        parseFloat(value.toString()) / LTO_REPRESENTATION + 1;
      console.log("calculatesAmount", calculatesAmount);
      if (calculatesAmount < 1.1) {
        console.log("error server is not ready yet");
        return;
      } else {
        setAmount(value);
        setShowAmount(calculatesAmount);
        setShowAddress(serverAddress);
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
  };

  const handleClose = () => {
    handleCloseDialog();
    clearFields();
    clearImageAndThumbnail();
    setBlurThumbnail(false);
    onClose();
  };

  const { enqueueSnackbar } = useSnackbar();

  const handleCopy = () => {
    navigator.clipboard.writeText(ltoWalletAddress);
    enqueueSnackbar("Address copied to clipboard", { variant: "success" });
  };

  const handleFileUploadClick = () => {
    // fileInputRef.current?.click();
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

  const handleNetworkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setOwnable((prevOwnable) => ({
      ...prevOwnable,
      network: value,
    }));
    fetchBuildAmount();
  };

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

  const handleCreateOwnable = async () => {
    const ownerName = nameOwnerRef.current?.value() || "";
    const ownerEmail = emailOwnerRef.current?.value() || "";
    const ownableName = nameOwnableRef.current?.value() || "";
    const description = descriptionRef.current?.value() || "";
    const image = fileInputRef.current?.files?.[0] || null;

    console.log("description", description);
    console.log("ownerName", ownerName);
    console.log("ownerEmail", ownerEmail);
    console.log("ownableName", ownableName);
    console.log("tags", tags);

    const requiredFields = [
      { name: "Owner name", value: ownerName },
      { name: "Owner email", value: ownerEmail },
      { name: "Ownable name", value: ownableName },
      { name: "Image", value: image },
    ];

    let newMissingFields: string[] = [];
    for (let field of requiredFields) {
      if (!field.value) {
        console.error(`Missing required field: ${field.name}`);
        newMissingFields.push(field.name);
      }
    }

    setErrorMessage(
      newMissingFields.length > 0
        ? `Missing required fields: ${newMissingFields.join(", ")}`
        : null
    );
    if (newMissingFields.length > 0) {
      return;
    }
    if (!recipient || !amount) {
      console.error("Recipient or amount is not defined");
      setNoConnection(true);
      return;
    }
    const tx = new TransferTx(recipient, amount);
    try {
      const account = await LTOService.getAccount();
      const info = await LTOService.broadcast(tx!.signWith(account));
      // console.log('Transaction id', info.id);
      console.log("Transaction info", info);
      setTimeout(() => {
        if (info.id) {
          console.log("Transaction id", info.id, "ready");
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
              OWNABLE_LTO_TRANSACTION_ID: info.id,
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
          console.log("zip", zip);
          zip.generateAsync({ type: "blob" }).then((zipFile: Blob) => {
            // for testing creating download zip file, remove for live version
            // Create a temporary link element
            const link = document.createElement("a");
            link.href = URL.createObjectURL(zipFile);
            link.download = formattedName + ".zip";
            // Simulate a click on the link to trigger the download
            link.click();

            setOpenDialog(true);
          });
          handleCloseDialog();
        }
      }, 1000);
    } catch (error) {
      console.error("Error sending transaction:", error);
      setLowBalance(true);
    }
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
      {/* <Box p={2} width={"100%"}> Make the Box full width */}
      <Box sx={{ color: "white" }}>
        <Box
          display={"flex"}
          p={2}
          flexDirection={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          <Box p={2} width={"100%"}>
            {/* <Box p={2}> */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              // width={"100%"} // Make the Box full width
            >
              <Box component="div" sx={{ mt: 1, width: "100%" }}>
                {" "}
                {/* Make the Box full width */}
                <Typography
                  sx={{ fontSize: 12, color: "white" }}
                  color="text.secondary"
                >
                  LTO Network address
                </Typography>
                <Typography
                  sx={{ fontSize: 12, fontWeight: 600 }}
                  component="div"
                  onClick={handleCopy}
                  style={{ cursor: "pointer" }}
                >
                  {ltoWalletAddress}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  balance: {balance !== undefined ? balance + " LTO" : ""}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  build cost:{" "}
                  {showAmount !== undefined ? showAmount + " LTO" : ""} (incl.
                  Fee: 1 LTO)
                </Typography>
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
            <Box p={2} width={"100%"}>
              {" "}
              {/* Make the Box full width */}
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                width={"100%"}
              >
                {" "}
                {/* Make the Box full width */}
                <Typography
                  sx={{ fontSize: 12, color: "white" }}
                  color="text.secondary"
                >
                  Choose your network
                </Typography>
                <RadioGroup
                  row
                  name="network"
                  value={ownable.network}
                  onChange={(event) => {
                    handleNetworkChange(event);
                    setSelectedNetwork(event.target.value);
                  }}
                  sx={{
                    justifyContent: "center",
                    color: "white",
                    width: "100%",
                  }} // Make the RadioGroup full width
                >
                  <FormControlLabel
                    value="ethereum"
                    control={
                      <Radio
                        sx={{
                          width: { xs: "12px", sm: "16px" },
                          height: { xs: "12px", sm: "16px" },
                          color: "white",
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontSize: {
                            xs: "0.7rem",
                            sm: "0.9rem",
                            md: "1.1rem",
                          },
                          ml: 1,
                        }}
                      >
                        Ethereum
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    value="arbitrum"
                    control={
                      <Radio
                        sx={{
                          width: { xs: "12px", sm: "16px" },
                          height: { xs: "12px", sm: "16px" },
                          color: "white",
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontSize: {
                            xs: "0.7rem",
                            sm: "0.9rem",
                            md: "1.1rem",
                          },
                          ml: 1,
                        }}
                      >
                        Arbitrum
                      </Typography>
                    }
                  />
                </RadioGroup>
              </Box>
              <br></br>
              <LtoInput ref={nameOwnerRef} label="Owner name" />
              <LtoInput ref={emailOwnerRef} label="Owner email" />
              <LtoInput ref={nameOwnableRef} label="Ownable name" />
              <LtoInput ref={descriptionRef} label="Description" />
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
                style={{ marginBottom: "10px", display: "none" }}
              />
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
                      style={{ width: "100px", height: "auto" }}
                    />
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
                        }}
                      />
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
                    style={{ marginBottom: "10px", display: "none" }}
                  />
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
                  disabled={isNaN(amount) || amount <= 0 || amount > available}
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
          <Dialog open={openDialog} onClose={handleCloseDialog}>
            <DialogTitle>Ownable Sent</DialogTitle>
            <DialogContent>
              <DialogContentText>
                The ownable has been successfully sent.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} sx={{ color: "white" }}>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </LtoDrawer>
  );
};
export default CreateOwnablesDrawer;
