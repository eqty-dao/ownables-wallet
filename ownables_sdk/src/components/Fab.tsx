import TypedFabItem from "../interfaces/TypedFabItem";
import React, { useState } from "react";
import { Badge, Button } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { themeColors } from "../theme/themeColors";
import { themeStyles } from "../theme/themeStyles";
import zIndex from "@mui/material/styles/zIndex";

interface FabProps {
  actions: Array<TypedFabItem>;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (item: TypedFabItem) => void;
  closeIcon: React.ComponentType;
  openIcon: React.ComponentType;
  badgeCount?: number;
}

interface OverlayProps {
  show: boolean;
}

const Fab = (props: FabProps) => {

  const { open, onOpen, onClose, actions, onSelect } = props;


  const buttonStyle = {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    minWidth: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: open ? themeColors.titleText : themeColors.primary,
    "&:hover": {
      backgroundColor: open ? themeColors.titleText : themeColors.primary,
    },
    display: "flex",
    zIndex: 1300,
  };

  const Overlay: React.FC<OverlayProps> = ({ show }) => {
    if (!show) return null;
    const overlayStyle = {
      position: "fixed" as "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      zIndex: 1200,
    };
    return <div style={overlayStyle}></div>;
  };

  const handleClick = () => {
    if (!open) {
      onOpen();
    }
  };

  return (
    <>
      <Button sx={buttonStyle} onClick={handleClick} aria-label="actions" >
        {open ? <props.closeIcon /> : <props.openIcon />}
        {
          props.badgeCount && props.badgeCount > 0 ? (
            <Badge
              badgeContent={props.badgeCount}
              color="error"
              sx={{
                position: "absolute", top: 5, right: 5
              }}
            />
          ) : null
        }
      </Button>
      <ActionsDialog
        actions={actions}
        open={open}
        onClose={onClose}
        onSelect={onSelect}
        onOpen={() => { }}
      />
      <Overlay show={open} />
    </>
  );

}

interface ActionProps {
  actions: Array<TypedFabItem>;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (item: TypedFabItem) => void;
}

const ActionsDialog = (props: ActionProps) => {
  const { onClose, onSelect, open, actions } = props;
  const dialogStyle = {
    position: "fixed" as "fixed",
    bottom: "50px",
    right: "-16px",
    backgroundColor: "transparent",
    boxShadow: "none",
  };

  const listItemButtonStyle = {
    textAlign: "right" as "right",
    display: "flex",
    justifyContent: "flex-end",
  };

  const itemContainerStyle = {
    backgroundColor: themeColors.actionBtn,
    color: "white",
    borderRadius: "60px",
    padding: "10px 15px",
    display: "flex",
    alignItems: "center",
    marginRight: "-16px",
    marginBottom: "-8px",
    justifyContent: "flex-end",
  };

  const iconCircleStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeColors.iconLiner,
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    marginRight: "16px",
    padding: "5px",
  };

  const renderActionItems = () => {
    return actions.map((item) => (
      <ListItem disablePadding disableGutters key={item.id}>
        <ListItemButton
          onClick={() => onSelect(item)}
          style={listItemButtonStyle}
        >
          <span style={itemContainerStyle}>
            <span style={iconCircleStyle}><item.icon /></span>
            <ListItemText
              primary={
                <span
                  style={{
                    ...themeStyles.fs16fw400lh21,
                    color: themeColors.titleText,
                  }}
                >
                  {item.title}
                </span>
              }
            />
          </span>
        </ListItemButton>
      </ListItem>
    ));
  };

  return (
    <Dialog onClose={onClose} open={open} PaperProps={{ style: dialogStyle }}>
      <List sx={{ pt: 0 }} disablePadding>
        {renderActionItems()}
      </List>
    </Dialog>
  );
}

export default Fab;
