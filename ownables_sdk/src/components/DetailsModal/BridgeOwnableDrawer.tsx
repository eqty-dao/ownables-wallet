import { Button, TextField, TextFieldProps, Box, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { themeColors } from "../../theme/themeColors";
import { themeStyles } from "../../theme/themeStyles";
import LtoDrawer from "./LtoDrawer";
import { BridgeService } from "../../services/Bridge.service";
import { Label } from "@mui/icons-material";

interface BridgeOwnableDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (address: string, fee: number | null, nftNetwork: string) => void;
  title: string;
  cancel?: string;
  ok?: string;
  TextFieldProps?: TextFieldProps;
  validate?: (value: string) => string | undefined;
  nftNetwork: string;
}

const inputLabelPropsStyle = { color: themeColors.titleText };
const formHelperTextPropsStyle = { color: themeColors.error };
const inputPropsStyle = {
  ...themeStyles.fs16fw400lh21,
  borderRadius: "4px",
  borderColor: themeColors.secondary,
  color: themeColors.titleText,
};
const textFieldStyle = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: themeColors.secondary,
    },
    "&:hover fieldset": {
      borderColor: themeColors.secondary,
    },
    "&.Mui-focused fieldset": {
      borderColor: themeColors.secondary,
    },
    "&.Mui-error .MuiOutlinedInput-notchedOutline": {
      borderColor: themeColors.error,
    },
  },
};

const submitBtnStyle = {
  ...themeStyles.fs16fw400lh21,
  textAlign: "center",
  color: themeColors.titleText,
  backgroundColor: themeColors.primary,
  textTransform: "none",
  marginBottom: "0px",
  "&:hover": {
    backgroundColor: themeColors.primary,
  },
  "&.Mui-disabled": {
    backgroundColor: themeColors.primary,
  },
};
const closeBtnStyle = {
  ...themeStyles.fs16fw400lh21,
  textAlign: "center",
  color: themeColors.titleText,
  textTransform: "none",
};

export default function BridgeOwnableDrawer(
  props: BridgeOwnableDrawerProps
) {
  const { open, onClose, onSubmit, validate } = props;
  const [value, setValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [bridgeFee, setBridgeFee] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("");

  const close = () => {
    setError(null);
    setValue("");
    onClose();
  };

  const submit = () => {
    const validationError = validate && validate(address);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSubmit(address, bridgeFee, props.nftNetwork);
    close();
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    setError(null);
    setAddress(e.target.value);
  };

  const getChainLabel = () => {
    switch (props.nftNetwork) {
      case "ethereum":
        return "Enter valid Ethereum address";
      case "arbitrum":
        return "Enter valid Arbitrum address";
      default:
        return "Enter valid wallet address";
    }
  };


  const handleFee = async () => {
    try {
      const feeObject = await BridgeService.getBridgeCost(1);
      let fee = feeObject[props.nftNetwork];
      if(fee === undefined) {
        fee = feeObject['arbitrum'];
      }
      setBridgeFee(fee / 100000000);
    } catch (error) {
      console.error("Error fetching fee:", error);
      setBridgeFee(null);
    }
  };

  useEffect(() => {
    if (open) {
      handleFee();
    }
  }, [open]);


  return (
    <><LtoDrawer
      open={open}
      onClose={close}
      paddingInline="20px"
      title={props.title}
      isPersistent={true}
    >
      <Box height="32px" />
      <TextField
        {...props.TextFieldProps}
        variant="outlined"
        autoFocus
        required
        error={!!error}
        helperText={error}
        value={address}
        onChange={onChange}
        InputLabelProps={{ style: inputLabelPropsStyle }}
        FormHelperTextProps={{ style: formHelperTextPropsStyle }}
        InputProps={{
          style: inputPropsStyle,
        }}
        sx={textFieldStyle}
        label={getChainLabel()} />
      <Typography variant="body2" color="#ffff">
        Bridge Fee: <span style={{ color: "white" }}>{bridgeFee} LTO</span>
      </Typography>
      <Box height="32px" /><Stack direction="column" spacing={2}>
        <Button onClick={submit} sx={submitBtnStyle} variant="contained">
          {props.ok || "Ok"}
        </Button>

        <Button onClick={onClose} sx={closeBtnStyle}>
          {props.cancel || "Cancel"}
        </Button>
      </Stack><Box height="63px" />
    </LtoDrawer>
    </>
  );
}
