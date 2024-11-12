import styled from "@emotion/styled";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

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
  validation?: (value: string) => boolean;
}

export interface LtoInputRefMethods {
  value: () => string;
}

const LtoInput = forwardRef<LtoInputRefMethods, Props>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const handleValueChange = () => {
    console.log("handleValueChange");
    if (inputRef.current) {
      const value = inputRef.current.value;
      if (props.validation) {
        if (props.validation(value)) {
          setError("");
        } else {
          setError("Only alphanumeric characters are allowed");
        }
      }
    }
  }

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
      <Input ref={inputRef} maxLength={props.maxLength || undefined} onChange={() => { handleValueChange() }} />
      {error && <span style={{ color: "#ff4d4f" }}>{error}</span>}
    </Container>
  );
});

export default LtoInput;
