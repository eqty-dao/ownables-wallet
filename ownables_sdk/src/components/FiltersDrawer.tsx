import { Button, Box, Typography, IconButton } from "@mui/material";
import { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { themeColors } from "../theme/themeColors";
import { themeStyles } from "../theme/themeStyles";
import LtoDrawer from "./DetailsModal/LtoDrawer";
import { ReactComponent as CloseDrawerIcon } from "../assets/close_drawer_icon.svg";
import LtoSelect, { LtoSelectRefMethods } from "./common/LtoSelect";
import { useCollections } from "../context/CollectionsContext";
import {
  CollectionItemType,
  StaticCollections,
} from "../services/Collection.service";
import { useIssuers } from "../context/IssuersContext";
import { useFilters } from "../context/FilterContext";
import { TabType } from "./OwnablesTabs";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  title: string;
  isPersistent?: boolean;
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
  color: #ff3b30;
  ${(props) =>
    props.transparent === false &&
    `
        background-color: #510094;
        color: #ffffff !important;
    `}
`;

const formatSelectCollection = (collections: CollectionItemType[]) =>
  collections.map((item) => {
    return {
      value: item.id,
      label: item.value,
    };
  });

const emptyState = {
  value: "",
  label: "-",
};

const formatIssuers = (issuers: string[]) => {
  // Use a Set to store unique values
  const uniqueIssuersSet = new Set(issuers);
  // Convert Set back to an array
  const uniqueIssuersArray = Array.from(uniqueIssuersSet);

  // Map the unique issuers to the desired format
  const formattedIssuers = uniqueIssuersArray.map((item) => ({
    value: item,
    label: item,
  }));

  return formattedIssuers;
};

const FiltersDrawer = (props: Props) => {
  const { open, onClose } = props;

  const { collections, getAll } = useCollections();
  const { issuers, getAllIssuers } = useIssuers();
  const { collection, filterBy, resetFilter, setSelectedTab } = useFilters();

  const issuerRef = useRef<LtoSelectRefMethods>(null);
  const typeRef = useRef<LtoSelectRefMethods>(null);
  const collectionRef = useRef<LtoSelectRefMethods>(null);

  const refreshFilters = () => {
    getAllIssuers();
    getAll();
  };

  useEffect(() => {
    refreshFilters();
    // eslint-disable-next-line
  }, []);

  const handleResetFilters = () => {
    if (issuerRef.current && typeRef.current && collectionRef.current) {
      issuerRef.current.reset();
      typeRef.current.reset();
      collectionRef.current.reset();
      filterBy("", "", StaticCollections.ALL);
      setSelectedTab(TabType.COLLECTIONS);
      resetFilter();
      onClose();
    }
  };

  const handleApplyFilters = () => {
    setSelectedTab(TabType.COLLECTIONS);
    filterBy(
      issuerRef.current?.value() || "",
      typeRef.current?.value() || "",
      collectionRef.current?.value() || StaticCollections.ALL
    );
    onClose();
  };

  return (
    <>
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
          <LtoSelect
            ref={issuerRef}
            label="Issuer"
            items={[emptyState, ...formatIssuers(issuers)]}
          />
          <LtoSelect
            ref={typeRef}
            label="Type"
            items={[
              emptyState,
              // TODO: add types
            ]}
          />
          <LtoSelect
            ref={collectionRef}
            label="Collection"
            value={formatSelectCollection(collections).find(
              (item) => item.value === (collection || StaticCollections.ALL)
            )}
            items={formatSelectCollection(collections)}
          />
          <Box height={40} />
          <Box display={"flex"} flexDirection={"column"} width={"100%"}>
            <StyledButton transparent={false} onClick={handleApplyFilters}>
              Apply Filters
            </StyledButton>
            <Box height={8} />
            <StyledButton transparent={true} onClick={handleResetFilters}>
              Reset Filters
            </StyledButton>
          </Box>
        </Box>
      </LtoDrawer>
    </>
  );
};

export default FiltersDrawer;
