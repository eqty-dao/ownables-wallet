import { Box, BoxProps } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import React, { forwardRef, Ref, useEffect, useState } from "react";
import { themeColors } from "../../theme/themeColors";
import { themeStyles } from "../../theme/themeStyles";

interface LtoOverlayProps extends BoxProps {
  disabled?: boolean | Promise<boolean>;
  zIndex?: number;
  icon?: React.ReactNode;
  isForDetailsScreen: boolean;
}

function LtoOverlay(props: LtoOverlayProps, ref: Ref<any>) {
  const { children, sx, onClick, disabled, zIndex, ...boxProps } = props;
  const [isEnabled, setIsEnabled] = useState(disabled === undefined);

  useEffect(() => {
    if (disabled instanceof Promise) {
      disabled.then((v) => setIsEnabled(!v));
    } else {
      setIsEnabled(!disabled);
    }
  }, [disabled]);

  const boxStyle = {
    position: "absolute" as "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: zIndex ?? 5,
    backgroundColor: isEnabled ? "" : "rgba(255, 255, 255, 0.8)",
    cursor: onClick && isEnabled ? "pointer" : "",
    borderRadius: "16px",
    ...sx,
  };

  return (
    <Box
      {...boxProps}
      ref={ref}
      onClick={isEnabled ? onClick : undefined}
      sx={boxStyle}
    >
      {children}
    </Box>
  );
}

export default forwardRef(LtoOverlay);

const spanStyle = {
  display: "flex",
  justifyContent: "center",
};

const iconSpanStyle = {
  marginRight: "8px",
  display: "flex",
  alignItems: "center",
};

const underBannerBoxStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(255, 255, 255, 0.5)",
  zIndex: -1,
  borderRadius: "16px",
};

export function LtoOverlayBanner(props: LtoOverlayProps) {
  const boxStyle = {
    ...(props.isForDetailsScreen
      ? { ...themeStyles.fs24fw500lh32, textAlign: "center" }
      : { ...themeStyles.fs16fw500lh32, textAlign: "center" }),
    backgroundColor: themeColors.success,
    pt: props.isForDetailsScreen ? 2 : 1,
    pb: props.isForDetailsScreen ? 2 : 1,
    cursor: "default",
    userSelect: "none",
    borderBottomLeftRadius: "16px",
    borderBottomRightRadius: "16px",
  };

  return (
    <>
      <Grid
        container
        direction="column"
        justifyContent="flex-end"
        alignItems="center"
        height="100%"
        width="100%"
        overflow="hidden"
        padding={0}
        margin={0}
      >
        <Grid width="100%" padding={0} textAlign="center">
          <Box sx={boxStyle}>
            <span style={spanStyle}>
              {props.icon && <span style={iconSpanStyle}>{props.icon}</span>}
              {props.children}
            </span>
          </Box>
        </Grid>
        <Box sx={underBannerBoxStyle} />
      </Grid>
    </>
  );
}
