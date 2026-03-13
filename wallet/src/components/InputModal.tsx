import React, {useState} from 'react';
import {Modal} from 'react-native';
import {
  CloseIconContainer,
  FlexContainer,
  ModalBody,
  ModalContainer,
  ModalSubContainer,
  ModalTitle,
  TopSpace,
  ErrorText,
} from './styles/InputModal.styles';
import {StyledButton} from './StyledButton';
import {InputField} from './InputField';
import Icon from './Icon';

export const InputModal = ({
  title,
  body,
  submitText,
  submitButtonType,
  onSubmit,
  cancelText = 'Cancel',
  onCancel,
  visible,
  type = 'default',
  hideCancelButton,
  placeholder,
  inputType = 'text',
  onInputChange,
  errorMessage,
}: {
  title: string;
  body: {text: string; heading?: boolean}[];
  onSubmit: (input: string) => void;
  submitButtonType: 'danger' | 'primary' | 'secondary';
  submitText: string;
  cancelText?: string;
  onCancel: () => void;
  visible: boolean;
  type?: 'default' | 'terms';
  hideCancelButton?: boolean;
  placeholder: string;
  inputType?: 'text' | 'password';
  onInputChange: (input: string) => void;
  errorMessage?: string;
}) => {
  const [input, setInput] = useState<string>('');

  const handleInputChange = (value: string) => {
    setInput(value);
    onInputChange(value);
  };

  const handleSubmit = () => {
    onSubmit(input);
    setInput('');
  };

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <FlexContainer>
        <TopSpace onPress={onCancel} />
        <ModalContainer>
          <ModalSubContainer>
            <CloseIconContainer onPress={onCancel}>
              <Icon icon="xmark" color="#909092" size={20} />
            </CloseIconContainer>
            <ModalTitle type={type}>{title}</ModalTitle>
            {body.map(({text, heading}: {text: string; heading?: boolean}, index: number) =>
              heading ? (
                <ModalBody type={type} key={index}>
                  {text}
                </ModalBody>
              ) : (
                <ModalBody type={type} key={index}>
                  {text}
                </ModalBody>
              ),
            )}
            {/* InputField */}
            <InputField
              label=""
              placeholder={placeholder}
              value={input}
              onChangeText={handleInputChange}
              secureTextEntry={inputType === 'password'}
            />
            {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
          </ModalSubContainer>
          <ModalSubContainer>
            <StyledButton text={submitText} onPress={handleSubmit} type={submitButtonType} />
            {!hideCancelButton && <StyledButton text={cancelText} onPress={onCancel} type="textOnly" />}
          </ModalSubContainer>
        </ModalContainer>
      </FlexContainer>
    </Modal>
  );
};
