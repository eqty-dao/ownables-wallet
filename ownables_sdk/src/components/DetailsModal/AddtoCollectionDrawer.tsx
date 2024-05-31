import { Box, Button, IconButton, Typography } from "@mui/material";
import { ReactComponent as CloseDrawerIcon } from "../../assets/close_drawer_icon.svg";
import styled from "@emotion/styled";
import { themeColors } from "../../theme/themeColors";
import { themeStyles } from "../../theme/themeStyles";
import LtoDrawer from "./LtoDrawer";
import LtoSelect, { LtoSelectRefMethods } from "../common/LtoSelect";
import { useEffect, useRef } from "react";
import {
  CollectionItemType,
  StaticCollections,
} from "../../services/Collection.service";
import { useCollections } from "../../context/CollectionsContext";

interface Props {
  open: boolean;
  onClose: () => void;
  pkgId: string;
  title: string;
}

const titleStyle = { ...themeStyles.fs24fw600lh29, textAlign: "center" };

const closeModalBtnStyle = {
  padding: 0,
  color: themeColors.error,
};

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

const emptyState = {
  value: "",
  label: "-",
};

const formatOptions = (options: CollectionItemType[]) =>
  options
    .filter((item) => item.id !== StaticCollections.CONSUMED)
    .map((item) => ({ label: item.value, value: item.id }));

const AddToCollectionDrawer = (props: Props) => {
  const { open, onClose } = props;

  const collectionRef = useRef<LtoSelectRefMethods>(null);

  const { collections, getAll, addTo } = useCollections();

  const onAddToCollection = () => {
    if (!collectionRef.current && !props.pkgId) return;
    addTo(collectionRef.current!.value(), props.pkgId);
    getAll();
    onClose();
  };

  const onCancel = () => onClose();

  useEffect(() => {
    if (!open) return;
    getAll();
    // eslint-disable-next-line
  }, [open]);

  return (
    <LtoDrawer
      open={open}
      onClose={onClose}
      shouldHideBackdrop={false}
      isPersistent={false}
      height="90vh"
    >
      <Box
        flex={1}
        display={"flex"}
        justifyContent={"space-between"}
        flexDirection={"column"}
      >
        <div>
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
          <Box p={2}>
            <LtoSelect
              ref={collectionRef}
              label="Collection"
              items={[emptyState, ...formatOptions(collections)]}
            />
          </Box>
        </div>
        <Box p={2}>
          <Box height={40} />
          <Box display={"flex"} flexDirection={"column"} width={"100%"}>
            <StyledButton transparent={false} onClick={onAddToCollection}>
              Add to Collection
            </StyledButton>
            <Box height={8} />
            <StyledButton transparent={true} onClick={onCancel}>
              Cancel
            </StyledButton>
          </Box>
        </Box>
      </Box>
    </LtoDrawer>
  );
};

export default AddToCollectionDrawer;
