import { Box, Drawer, Typography, IconButton } from "@mui/material";
import { ReactComponent as CloseDrawerIcon } from "../../assets/close_drawer_icon.svg";
import { ReactNode } from "react";
import { themeColors } from "../../theme/themeColors";
import { themeStyles } from "../../theme/themeStyles";

interface LtoDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  isPersistent?: boolean;
  shouldHideBackdrop?: boolean;
  height?: string;
  paddingInline?: string;
}

const drawerStyle = {
  backgroundColor: themeColors.lightBg,
  borderTopLeftRadius: "16px",
  borderTopRightRadius: "16px",
};

const titleStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

export default function LtoDrawer(props: LtoDrawerProps) {
  const { open, onClose, title, children } = props;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      transitionDuration={300}
      style={{ zIndex: 1300 }}
      PaperProps={{
        sx: {
          ...drawerStyle,
          height: props.height,
          paddingInline: props.paddingInline,
        },
      }}
      variant={props.isPersistent ? "persistent" : "temporary"}
      hideBackdrop={props.shouldHideBackdrop ?? false}
    >
      {title && (
        <>
          <Box height="16px" />
          <Box sx={titleStyle}>
            <Typography sx={themeStyles.fs20fw600lh24}>{title}</Typography>
            <IconButton
              aria-label="close"
              onClick={onClose}
              style={{ margin: "-10px" }}
            >
              <CloseDrawerIcon />
            </IconButton>
          </Box>
        </>
      )}
      {children}
    </Drawer>
  );
}
