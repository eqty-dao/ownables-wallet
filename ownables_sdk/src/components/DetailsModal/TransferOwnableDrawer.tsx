import { Button, TextField, TextFieldProps, Box, Stack } from "@mui/material";
import { useState } from "react";
import { themeColors } from "../../theme/themeColors";
import { themeStyles } from "../../theme/themeStyles";
import LtoDrawer from "./LtoDrawer";

interface TransferOwnableDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: string) => void;
  title: string;
  cancel?: string;
  ok?: string;
  TextFieldProps?: TextFieldProps;
  validate?: (value: string) => string | undefined;
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

export default function TransferOwnableDrawer(
  props: TransferOwnableDrawerProps
) {
  const { open, onClose, onSubmit, validate } = props;
  const [value, setValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    setValue("");
    onClose();
  };

  const submit = () => {
    const validationError = validate && validate(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSubmit(value);
    close();
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setError(null);
    setValue(e.target.value);
  };

  return (
    <LtoDrawer
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
        value={value}
        onChange={onChange}
        InputLabelProps={{ style: inputLabelPropsStyle }}
        FormHelperTextProps={{ style: formHelperTextPropsStyle }}
        InputProps={{
          style: inputPropsStyle,
        }}
        sx={textFieldStyle}
      />
      <Box height="32px" />

      <Stack direction="column" spacing={2}>
        <Button onClick={submit} sx={submitBtnStyle} variant="contained">
          {props.ok || "Ok"}
        </Button>

        <Button onClick={onClose} sx={closeBtnStyle}>
          {props.cancel || "Cancel"}
        </Button>
      </Stack>
      <Box height="63px" />
    </LtoDrawer>
  );
}
