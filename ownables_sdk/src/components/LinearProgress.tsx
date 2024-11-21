import { Label } from "@mui/icons-material";
import { Backdrop, CircularProgress, LinearProgress } from "@mui/material";
import React from "react";

export default function AppLinearProgress(props: { show: boolean, label: string }) {
  return <Backdrop open={props.show} sx={{ zIndex: (theme) => theme.zIndex.modal + 100 }}
    style={{
      display: "flex",
      flexDirection: "column",
      backgroundColor: "rgba(0, 0, 0)",
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      alignContent: "center",
      alignSelf: "center",
    }}>
    <h3 style={{ color: "white" }}>{props.label}</h3>
    <LinearProgress variant="indeterminate" color="primary" style={{ width: "90%" }} />
  </Backdrop>
}
