import styled from "@emotion/styled";
import { forwardRef, useImperativeHandle, useRef } from "react";

const Label = styled.label`
  color: #fcfcf7;
  font-size: 14px;
  font-weight: 400;
  display: block;
  margin-bottom: 8px;
`;

const Container = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Input = styled.input`
  height: 62px;
  border: 1px solid #3a3a3c;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  background-color: transparent;
  padding: 0 16px;
  appearance: none;
  outline: none;
`;

interface Props {
  label: string;
  value?: string;
  maxLength?: number;
}

export interface LtoInputRefMethods {
  value: () => string;
}

const LtoInput = forwardRef<LtoInputRefMethods, Props>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    value: () => {
      if (inputRef.current) {
        return inputRef.current.value;
      }
      return "";
    },
  }));

  return (
    <Container>
      <Label>{props.label}</Label>
      <Input ref={inputRef} maxLength={props.maxLength || undefined} />
    </Container>
  );
});

export default LtoInput;
