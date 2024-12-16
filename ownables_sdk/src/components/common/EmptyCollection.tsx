import { Box } from "@mui/material";
import { ReactComponent as EmptyCollectionIcon } from "../../assets/empty_collection.svg";
import styled from "@emotion/styled";
import { StaticCollections } from "../../services/Collection.service";

const Title = styled.span`
  color: #ffffff;
  font-weight: bold;
  font-size: 24px;
  text-align: center;
  display: block;
  margin: 16px 0 8px 0;
`;

const HelperText = styled.span`
  color: #909092;
  font-size: 14px;
  line-height: 21px;
  text-align: center;
`;

const Container = styled(Box)``;

interface Props {
  title: string;
  id?: string;
}

const EmptyCollection = ({title,id}: Props) => {
  return (
    <Container
      flex={1}
      display={"flex"}
      flexDirection={"column"}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <EmptyCollectionIcon />
      <Title>{title}</Title>
      {id==StaticCollections.CONSUMED?<p
      style={{color:"white",fontSize:"14px",lineHeight:"21px"}}
      >This exciting new feature is coming soon !</p>:<HelperText>This collection is currently empty</HelperText>}
    </Container>
  );
};

export default EmptyCollection;
