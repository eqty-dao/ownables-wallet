import { Box } from "@mui/material";
import { ReactComponent as EmptyCollectionIcon } from "../../assets/empty_collection.svg";
import styled from "@emotion/styled";

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
}

const EmptyCollection = ({title}: Props) => {
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
      <HelperText>This collection is currently empty</HelperText>
    </Container>
  );
};

export default EmptyCollection;
