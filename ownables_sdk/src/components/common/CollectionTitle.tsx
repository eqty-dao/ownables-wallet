import styled from "@emotion/styled";
import { useFilters } from "../../context/FilterContext";
import { StaticCollections } from "../../services/Collection.service";
import { ReactComponent as TrashIcon } from "../../assets/trash_icon.svg";
import { ReactComponent as EditIcon } from "../../assets/pencil_icon.svg";
import { ReactComponent as CheckIcon } from "../../assets/check_icon.svg";
import { Box, Button as MButton } from "@mui/material";
import { useReducerAsState } from "../../hooks/useReducerAsState";
import { useEffect } from "react";
import LtoDrawer from "../DetailsModal/LtoDrawer";
import { useCollections } from "../../context/CollectionsContext";
import { MAX_COLLECTION_NAME_LENGTH } from "../../constants";
import { TabType } from "../OwnablesTabs";

const Title = styled.span`
  color: #ffffff;
  font-size: 20px;
  text-align: left;
  font-weight: 600;
  display: block;
`;

const Button = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Input = styled.input`
  appearance: none;
  background-color: transparent;
  border: 0;
  outline: none;
  font-size: 20px;
  color: #ffffff;
`;

const DrawerTitle = styled.span`
  font-size: 24px;
  color: #ffffff;
  font-weight: 600;
  text-align: center;
  display: block;
  margin-bottom: 16px;
`;

const DrawerHelperText = styled.span`
  font-size: 16px;
  display: block;
  text-align: center;
  color: #909092;
  font-weight: 400;
`;

interface StyledButtonProps {
  transparent: boolean;
}

const StyledButton = styled(MButton)<StyledButtonProps>`
  text-transform: none;
  height: 48px;
  color: #ffffff;
  margin-bottom: 8px;
  ${(props) =>
    props.transparent === false &&
    `
        background-color: #510094;
    `}
`;

const ClearFilterButton = styled.span`
  color: #b770ff;
  font-size: 14px;
  text-decoration: underline;
`;

interface ContainerProps {
  isEditing: boolean;
}

const Container = styled(Box)<ContainerProps>`
  margin: 0 16px 16px 16px;
  ${({ isEditing }) =>
    isEditing &&
    `
    border-bottom: 1px solid #ffffff;
  `}
`;

interface State {
  isEditing: boolean;
  collectionTitle: string;
  showDeleteDrawer: boolean;
}

const CollectionTitle = () => {
  const {
    collection,
    getCollectionName,
    filterBy,
    setSelectedTab,
    resetFilter,
    changeCollection,
  } = useFilters();
  const { remove, updateTitle, setUpdating } = useCollections();

  const [state, setState] = useReducerAsState<State>({
    isEditing: false,
    collectionTitle: "",
    showDeleteDrawer: false,
  });

  const initialize = () => {
    setState({ collectionTitle: getCollectionName(collection) });
  };

  useEffect(() => {
    initialize();
    // eslint-disable-next-line
  }, [collection]);

  const setEditing = () => {
    setState({ isEditing: !state.isEditing });
    setUpdating(!state.isEditing, collection);
  };

  const onSaveCollection = () => {
    if (!collection || !state.collectionTitle) return;
    updateTitle(collection, state.collectionTitle);
    setEditing();
  };

  const onDelete = () => {
    remove(collection);
    // DC: Filter by ALL
    filterBy("", "", StaticCollections.ALL);
    // reset state
    setState({ isEditing: false });
    // close modal
    onDeleteCollection();
  };

  const handleTitleChange = (e: any) =>
    setState({ collectionTitle: e.target.value });

  const onDeleteCollection = () =>
    setState({ showDeleteDrawer: !state.showDeleteDrawer });

  const clearFilter = () => {
    resetFilter();
    changeCollection(StaticCollections.ALL);
    setSelectedTab(TabType.COLLECTIONS);
  };

  const renderTitle = () => {
    if (
      [
        StaticCollections.ALL,
        StaticCollections.CONSUMED,
        StaticCollections.FAVORITES,
        StaticCollections.ART,
      ].includes(collection as StaticCollections)
    ) {
      <Box
        display={"flex"}
        flex={1}
        flexDirection={"row"}
        alignItems={"center"}
        gap={1}
      >
        <Title>Results</Title>
        <ClearFilterButton onClick={clearFilter}>
          Clear Filter
        </ClearFilterButton>
      </Box>;
    }

    if (!state.isEditing) {
      return (
        <Box
          display={"flex"}
          flex={1}
          flexDirection={"row"}
          alignItems={"center"}
          gap={1}
        >
          <Title>{state.collectionTitle}</Title>
          <ClearFilterButton onClick={clearFilter}>
            Clear Filter
          </ClearFilterButton>
        </Box>
      );
    }

    return (
      <Input
        value={state.collectionTitle}
        onChange={handleTitleChange}
        maxLength={MAX_COLLECTION_NAME_LENGTH}
      />
    );
  };

  const renderRightAction = () => {
    if (!collection) return;

    if (
      [
        StaticCollections.ALL,
        StaticCollections.CONSUMED,
        StaticCollections.FAVORITES,
        StaticCollections.ART,
      ].includes(collection as StaticCollections)
    ) {
      return;
    }

    if (!state.isEditing) {
      return (
        <Button onClick={setEditing}>
          <EditIcon />
        </Button>
      );
    }

    return (
      <Button onClick={onSaveCollection}>
        <CheckIcon />
      </Button>
    );
  };

  return (
    <>
      <Container
        isEditing={state.isEditing}
        display={"flex"}
        flex={1}
        flexDirection={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        {state.isEditing && (
          <Button onClick={onDeleteCollection}>
            <TrashIcon />
          </Button>
        )}
        {renderTitle()}
        {renderRightAction()}
      </Container>

      <LtoDrawer
        open={state.showDeleteDrawer}
        isPersistent={false}
        shouldHideBackdrop={false}
        onClose={onDeleteCollection}
        height="300px"
      >
        <Box pt={4} pl={2} pr={2}>
          <DrawerTitle>Delete {getCollectionName(collection)}</DrawerTitle>
          <DrawerHelperText>
            Are you sure you want to delete this collection?
          </DrawerHelperText>
          <Box height={40} />
          <Box
            display={"flex"}
            flex={1}
            flexDirection={"column"}
            width={"100%"}
          >
            <StyledButton transparent={false} onClick={onDelete}>
              Delete
            </StyledButton>
            <StyledButton transparent={true} onClick={onDeleteCollection}>
              Cancel
            </StyledButton>
          </Box>
        </Box>
      </LtoDrawer>
    </>
  );
};

export default CollectionTitle;
