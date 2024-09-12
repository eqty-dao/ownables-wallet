import { EventChain } from "@ltonetwork/lto";
import LtoOverlay from "./DetailsModal/LtoOverlay";
import { ReactComponent as DeleteIcon } from "../assets/delete_ownable.svg";
import { useCollections } from "../context/CollectionsContext";
import { useFilters } from "../context/FilterContext";
import styled from "@emotion/styled";

interface Props {
  chain: EventChain;
  collectionId?: string;
  deleteFromTab?: boolean;
}

const Container = styled.div`
  position: absolute;
  top: 0px;
  right: 0px;
  padding: 10px;
`;

const DeleteOwnableOverlay = (props: Props) => {
  const { removeFrom } = useCollections();
  const { collection, filterBy, issuer, type } = useFilters();

  const handleDelete = () => {
    if (!props.chain) return;

    if (props.deleteFromTab && props.collectionId) {
      removeFrom(props.collectionId, props.chain.id);
      return;
    }

    if (!collection) return;

    removeFrom(collection, props.chain.id);
    filterBy(issuer, type, collection);
  };

  return (
    <LtoOverlay isForDetailsScreen={false} zIndex={1000}>
      <Container>
        <DeleteIcon onClick={handleDelete} />
      </Container>
    </LtoOverlay>
  );
};

export default DeleteOwnableOverlay;
