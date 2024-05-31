import { Box, Button, IconButton, Typography } from "@mui/material";
import LtoDrawer from "./DetailsModal/LtoDrawer";
import { ReactComponent as CloseDrawerIcon } from "../assets/close_drawer_icon.svg";
import { useCollections } from "../context/CollectionsContext";
import styled from "@emotion/styled";
import { themeStyles } from "../theme/themeStyles";
import { themeColors } from "../theme/themeColors";
import LtoInput, { LtoInputRefMethods } from "./common/LtoInput";
import { useRef } from "react";
import { useFilters } from "../context/FilterContext";
import { CollectionItemType } from "../services/Collection.service";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  title: string;
  isPersistent?: boolean;
}

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

const titleStyle = { ...themeStyles.fs24fw600lh29, textAlign: "center" };

const closeModalBtnStyle = {
  padding: 0,
  color: themeColors.error,
};

const CreateCollectionDrawer = (props: Props) => {
  const { open, onClose } = props;
  const { create } = useCollections();
  const { filterBy } = useFilters();

  const nameCollectionRef = useRef<LtoInputRefMethods>(null);

  const onCreateCollection = () => {
    if (!nameCollectionRef.current) return;
    const recentCollection: CollectionItemType = create(
      nameCollectionRef.current.value()
    );
    filterBy("", "", recentCollection.id);
    onClose();
  };

  const onCancel = () => onClose();

  return (
    <LtoDrawer
      open={open}
      onClose={onClose}
      shouldHideBackdrop={false}
      isPersistent={props.isPersistent}
    >
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
        <LtoInput ref={nameCollectionRef} label="Name Collection" />
        <Box height={40} />
        <Box display={"flex"} flexDirection={"column"} width={"100%"}>
          <StyledButton transparent={false} onClick={onCreateCollection}>
            Create
          </StyledButton>
          <Box height={8} />
          <StyledButton transparent={true} onClick={onCancel}>
            Cancel
          </StyledButton>
        </Box>
      </Box>
    </LtoDrawer>
  );
};

export default CreateCollectionDrawer;
