import {
  Button,
  Box,
  Typography,
  DialogContentText,
  Stack,
} from "@mui/material";
import { ReactNode } from "react";
import { themeColors } from "../../theme/themeColors";
import { themeStyles } from "../../theme/themeStyles";
import LtoDrawer from "./LtoDrawer";

interface ConfirmDrawerProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  title: string;
  cancel?: string;
  ok?: string;
  children: ReactNode;
  isPersistent?: boolean;
  isForDelete?: boolean;
}

const titleStyle = { ...themeStyles.fs24fw600lh29, textAlign: "center" };
const contentStyle = {
  ...themeStyles.fs16fw400lh21,
  textAlign: "center",
};
const closeBtnStyle = {
  ...themeStyles.fs16fw400lh21,
  textAlign: "center",
  color: themeColors.titleText,
  textTransform: "none",
};

export default function ConfirmDrawer(props: ConfirmDrawerProps) {
  const { open, onClose, onCancel, onConfirm } = props;
  const confirmBtnStyle = {
    ...themeStyles.fs16fw400lh21,
    textAlign: "center",
    color: props.isForDelete ? themeColors.error : themeColors.titleText,
    backgroundColor: props.isForDelete
      ? themeColors.lightBg
      : themeColors.primary,
    border: props.isForDelete ? `1px solid ${themeColors.error}` : null,
    textTransform: "none",
    marginBottom: "0px",
  };

  const onConfirmPressed = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };
  return (
    <LtoDrawer
      open={open}
      onClose={onClose}
      shouldHideBackdrop={true}
      isPersistent={props.isPersistent}
    >
      <Box p={2} textAlign="center">
        <Typography sx={titleStyle}>{props.title}</Typography>
        <Box height="16px" />
        <DialogContentText sx={contentStyle}>
          {props.children}
        </DialogContentText>
        <Box height="48px" />
        <Stack direction="column" spacing={2}>
          {onConfirm && (
            <Button
              onClick={onConfirmPressed}
              autoFocus
              sx={confirmBtnStyle}
              variant="contained"
            >
              {props.ok || "Ok"}
            </Button>
          )}
          <Button onClick={onCancel ?? onClose} sx={closeBtnStyle}>
            {props.cancel || "Cancel"}
          </Button>
        </Stack>
      </Box>
    </LtoDrawer>
  );
}
