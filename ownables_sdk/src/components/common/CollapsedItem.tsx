import styled from "@emotion/styled";
import { Box } from "@mui/material";
import { useState } from "react";
import { ReactComponent as ArrowUp } from "../../assets/arrow_up.svg";
import { ReactComponent as ArrowDown } from "../../assets/arrow_down.svg";

const CollapseHeader = styled.div`
  background-color: #141414;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
  font-size: 20px;
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

interface Props {
  title: string;
  children: React.ReactElement;
}

const CollapsedItem = (props: Props) => {
  const [open, setOpen] = useState<boolean>(false);

  const toggle = () => setOpen(!open);

  return (
    <Container>
      <CollapseHeader onClick={toggle}>
        {props.title}
        {open ? <ArrowUp /> : <ArrowDown />}
      </CollapseHeader>
      {open && <CollapseContent>{props.children}</CollapseContent>}
    </Container>
  );
};

export default CollapsedItem;
