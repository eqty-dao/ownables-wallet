import { Box, Divider, ListItemIcon } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { TypedPackage, TypedPackageStub } from "../../interfaces/TypedPackage";
import If from "./../If";
import { themeColors } from "../../theme/themeColors";
import { themeStyles } from "../../theme/themeStyles";
import LtoDrawer from "./LtoDrawer";

interface PackagesDrawerProps {
  packages: Array<TypedPackage | TypedPackageStub>;
  open: boolean;
  onClose: () => void;
  onSelect: (pkg: TypedPackage | TypedPackageStub) => void;
  onImport: () => void;
}

const listStyle = { pt: 0, minWidth: 250 };
const dividerStyle = {
  borderColor: themeColors.titleText,
  marginTop: "10px",
  marginBottom: "10px",
};
const listItemBtnStyle = { color: themeColors.titleText };
const addIconStyle = { color: themeColors.titleText };
const addIconBgStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  backgroundColor: themeColors.primary,
  width: 30,
  height: 30,
};

export default function PackagesDrawer(props: PackagesDrawerProps) {
  const { onClose, onSelect, onImport, open, packages } = props;

  const renderPackages = () => {
    return packages.map((pkg) => (
      <ListItem disablePadding disableGutters key={pkg.title}>
        <ListItemButton
          onClick={() => onSelect(pkg)}
          style={{
            ...themeStyles.fs16fw500lh19,
            color: "stub" in pkg ? themeColors.error : themeColors.titleText,
          }}
        >
          <ListItemText
            primary={pkg.title}
            secondary={pkg.description}
            primaryTypographyProps={themeStyles.fs16fw500lh19}
            secondaryTypographyProps={{
              ...themeStyles.fs12fw400lh14,
              color: "stub" in pkg ? themeColors.error : themeColors.subText,
              marginTop: "4px",
            }}
          />
        </ListItemButton>
      </ListItem>
    ));
  };

  return (
    <LtoDrawer
      open={open}
      onClose={onClose}
      paddingInline="20px"
      title="Add Ownable"
    >
      <Box height="10px" />
      <List sx={listStyle} disablePadding>
        {renderPackages()}
      </List>
      <If condition={packages.length > 0}>
        <Divider sx={dividerStyle} />
      </If>
      <List sx={{ pt: 0 }} disablePadding>
        <ListItem disablePadding disableGutters key="add">
          <ListItemButton
            autoFocus
            onClick={() => onImport()}
            style={listItemBtnStyle}
          >
            <ListItemIcon>
              <Box sx={addIconBgStyle}>
                <AddIcon sx={addIconStyle} />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="Import package"
              primaryTypographyProps={themeStyles.fs20fw600lh24}
            />
          </ListItemButton>
        </ListItem>
      </List>
      <Box height="20px" />
    </LtoDrawer>
  );
}
