import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styled from "@emotion/styled";

export interface LtoSelectOptionTyped {
  value: string;
  label: string;
}

interface Props {
  label: string;
  items: LtoSelectOptionTyped[];
  value?: LtoSelectOptionTyped;
}

export interface LtoSelectRefMethods {
  reset: () => void;
  value: () => string;
}

const StyledSelect = styled.select`
  width: 100%;
  height: 62px;
  border: 1px solid #3a3a3c;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  background-color: transparent;
  padding: 0 16px;
  appearance: none;
  background-repeat: no-repeat;
  background-position-x: 97%;
  background-position-y: 50%;
  background-image: url('data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 768 768" fill="white"><path d="M169.376 310.624l192 192c12.512 12.512 32.768 12.512 45.248 0l192-192c12.512-12.512 12.512-32.768 0-45.248s-32.768-12.512-45.248 0l-169.376 169.376-169.376-169.376c-12.512-12.512-32.768-12.512-45.248 0s-12.512 32.768 0 45.248z"></path></svg>');
  outline: none;

  &:hover {
    border: 1px solid #9d8ee6;
  }
`;

const StyledLabel = styled.label`
  color: #fcfcf7;
  font-size: 14px;
  font-weight: 400;
  display: block;
  margin-bottom: 8px;
`;

const Container = styled.div`
  margin-bottom: 16px;
`;

const LtoSelect = forwardRef<LtoSelectRefMethods, Props>((props, ref) => {
  const [selectedOption, setSelectedOption] =
    useState<LtoSelectOptionTyped | null>(props.value || null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    setSelectedOption(props.value || null);
  }, [props.value]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (selectRef.current) {
        selectRef.current.value = "";
      }
    },
    value: () => {
      if (selectRef.current) {
        return selectRef.current.value;
      }
      return "";
    },
  }));

  const checkSelected = (item: LtoSelectOptionTyped): boolean => {
    if (!selectedOption) return false;
    return item.value === selectedOption.value;
  };

  return (
    <Container>
      <StyledLabel>{props.label}</StyledLabel>
      <StyledSelect ref={selectRef}>
        {props.items.map((option: LtoSelectOptionTyped) => {
          const isSelected = checkSelected(option);
          return (
            <option
              value={option.value}
              key={option.value}
              selected={isSelected}
            >
              {option.label}
            </option>
          );
        })}
      </StyledSelect>
    </Container>
  );
});

export default LtoSelect;
