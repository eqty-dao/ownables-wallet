import { Box, Button, Typography } from "@mui/material";
import { ReactNode } from "react";
import { themeColors } from "../../theme/themeColors";
import { themeStyles } from "../../theme/themeStyles";
import { ReactComponent as AlertIcon } from "../../assets/alert_icon.svg";
import LtoDrawer from "./LtoDrawer";

interface AlertDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const boxStyle = { display: "flex", justifyContent: "center" };
const titleStyle = { ...themeStyles.fs24fw600lh29, textAlign: "center" };
const subtitleStyle = {
  ...themeStyles.fs16fw400lh21,
  pr: 3,
  textAlign: "center",
};
const btnStyle = {
  ...themeStyles.fs16fw400lh21,
  textAlign: "center",
  color: themeColors.titleText,
  backgroundColor: themeColors.primary,
  textTransform: "none",
  marginBottom: "0px",
  marginX: "16px",
};

export default function AlertDrawer(props: AlertDrawerProps) {
  const { open, onClose } = props;

  return (
    <LtoDrawer open={open} onClose={onClose}>
      <Box height="24px" />
      <Box sx={boxStyle}>
        <AlertIcon />
      </Box>
      <Box height="16px" />
      <Typography sx={titleStyle}>{props.title}</Typography>
      <Box height="16px" />
      <Box sx={subtitleStyle}>{props.children}</Box>
      <Box height="48px" />

      <Button onClick={onClose} autoFocus sx={btnStyle} variant="contained">
        {"Ok"}
      </Button>
      <Box height="53px" />
    </LtoDrawer>
  );
}
