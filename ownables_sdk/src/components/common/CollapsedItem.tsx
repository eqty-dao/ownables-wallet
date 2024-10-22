import styled from "@emotion/styled";
import { Box, Button as MButton } from "@mui/material";
import { useEffect, useState } from "react";
import { ReactComponent as ArrowUp } from "../../assets/arrow_up.svg";
import { ReactComponent as ArrowDown } from "../../assets/arrow_down.svg";
import { useCollections } from "../../context/CollectionsContext";
import { ReactComponent as TrashIcon } from "../../assets/trash_icon.svg";
import { ReactComponent as EditIcon } from "../../assets/pencil_icon.svg";
import { ReactComponent as CheckIcon } from "../../assets/check_icon.svg";
import { useReducerAsState } from "../../hooks/useReducerAsState";
import { MAX_COLLECTION_NAME_LENGTH } from "../../constants";
import React from "react";
import LtoDrawer from "../DetailsModal/LtoDrawer";
import { StaticCollections } from "../../services/Collection.service";

const CollapseHeader = styled.div`
  background-color: #141414;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CollapseContent = styled.div`
  position: relative;
  background-color: #141414;
  padding: 16px;
  overflow: hidden;
`;

const Container = styled(Box)`
  margin-bottom: 8px;
`;

const TitleContainer = styled.div<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 8px;
  height: 34px;
  ${({ isOpen }) =>
    isOpen &&
    `
    border-bottom: 1px solid #ffffff;
    width: 90%;
    justify-content: space-between;
  `}
`;

const Title = styled.span<{ titleColor?: string }>`
  color: ${(props) => props.titleColor || "#ffffff"};
  font-size: 20px;
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

const Input = styled.input`
  appearance: none;
  background-color: transparent;
  border: 0;
  outline: none;
  font-size: 20px;
  color: #ffffff;
  text-align: center;
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

interface Props {
  title: string;
  collectionId: string;
  children: React.ReactElement;
  titleColor?: string;
  isOpen: boolean;
  onEdit?: (value: boolean) => void;
}

const CollapsedItem = (props: Props) => {
  const [open, setOpen] = useState<boolean>(false);
  const { updateOpenState } = useCollections();

  const toggle = () => {
    setOpen(!open);
    updateOpenState(props.collectionId, !open);
    props.onEdit && props.onEdit(false);
  };

  const toggleCanDelete = (value: boolean) => {
    props.onEdit && props.onEdit(value);
  };

  useEffect(() => {
    setOpen(props.isOpen);
  }, [props.isOpen]);

  return (
    <Container>
      <CollapseHeader>
        <CollapsedItemWithTitle
          {...props}
          onEdit={toggleCanDelete}
          isOpen={open}
        />
        {open ? <ArrowUp onClick={toggle} /> : <ArrowDown onClick={toggle} />}
      </CollapseHeader>
      {open && <CollapseContent>{props.children}</CollapseContent>}
    </Container>
  );
};

interface CollapsedItemWithTitleProps {
  isOpen: boolean;
}

type CollapsedItemWithTitlePropsType = CollapsedItemWithTitleProps & Props;

const CollapsedItemWithTitle = (props: CollapsedItemWithTitlePropsType) => {
  const { remove, updateTitle } = useCollections();

  const [state, setState] = useReducerAsState<{
    isEditing: boolean;
    collectionTitle: string;
    showDeleteDrawer: boolean;
  }>({
    isEditing: false,
    collectionTitle: props.title,
    showDeleteDrawer: false,
  });

  const handleEdit = () => {
    setState({ isEditing: !state.isEditing });
    props.onEdit && props.onEdit(!state.isEditing);
  };

  const onSaveCollection = () => {
    if (!props.collectionId || !state.collectionTitle) return;
    updateTitle(props.collectionId, state.collectionTitle);
    setState({ isEditing: false });
    props.onEdit && props.onEdit(false);
  };

  const handleTitleChange = (e: any) =>
    setState({ collectionTitle: e.target.value });

  const handleOnDelete = () =>
    setState({ showDeleteDrawer: !state.showDeleteDrawer });

  const onDeleteCollection = () => {
    remove(props.collectionId);
  };

  const renderEditIcon = () => {
    const nonEditable = [
      StaticCollections.ALL,
      StaticCollections.CONSUMED,
      StaticCollections.FAVORITES,
      StaticCollections.ART,
    ].includes(props.collectionId as StaticCollections);

    if (props.isOpen && !nonEditable) {
      return <EditIcon onClick={handleEdit} />;
    }

    return <React.Fragment />;
  };

  const render = () => {
    if (state.isEditing) {
      return (
        <React.Fragment>
          <TrashIcon onClick={handleOnDelete} />
          <Input
            value={state.collectionTitle}
            onChange={handleTitleChange}
            maxLength={MAX_COLLECTION_NAME_LENGTH}
          />
          <CheckIcon onClick={onSaveCollection} />
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <Title titleColor={props.titleColor}>{props.title}</Title>
        {renderEditIcon()}
      </React.Fragment>
    );
  };

  useEffect(() => {
    setState({ isEditing: false });
    // eslint-disable-next-line
  }, [props.isOpen]);

  return (
    <React.Fragment>
      <TitleContainer isOpen={state.isEditing}>{render()}</TitleContainer>
      <LtoDrawer
        open={state.showDeleteDrawer}
        isPersistent={false}
        shouldHideBackdrop={false}
        onClose={handleOnDelete}
        height="300px"
      >
        <Box pt={4} pl={2} pr={2}>
          <DrawerTitle>Delete {props.title}</DrawerTitle>
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
            <StyledButton transparent={false} onClick={onDeleteCollection}>
              Delete
            </StyledButton>
            <StyledButton transparent={true} onClick={handleOnDelete}>
              Cancel
            </StyledButton>
          </Box>
        </Box>
      </LtoDrawer>
    </React.Fragment>
  );
};

export default CollapsedItem;
