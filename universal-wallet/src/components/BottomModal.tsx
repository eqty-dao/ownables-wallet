import React from 'react';
import {Modal} from 'react-native';
import {
  CloseIconContainer,
  FlexContainer,
  ModalBody,
  ModalContainer,
  ModalSubContainer,
  ModalSubTitle,
  ModalTitle,
  TopSpace,
} from './styles/BottomModal.styles';
import {StyledButton} from './StyledButton';
import Icon from './Icon';

export const BottomModal = ({
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
}: {
  title: string;
  body: {text: string; heading?: boolean}[];
  onSubmit: () => void;
  submitButtonType: 'danger' | 'primary' | 'secondary';
  submitText: string;
  cancelText?: string;
  onCancel: () => void;
  visible: boolean;
  type?: 'default' | 'terms';
  hideCancelButton?: boolean;
}) => {
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
                <ModalSubTitle key={index}>{text}</ModalSubTitle>
              ) : (
                <ModalBody type={type} key={index}>
                  {text}
                </ModalBody>
              ),
            )}
          </ModalSubContainer>
          <ModalSubContainer>
            <StyledButton text={submitText} onPress={onSubmit} type={submitButtonType} />
            {!hideCancelButton && <StyledButton text={cancelText} onPress={onCancel} type="textOnly" />}
          </ModalSubContainer>
        </ModalContainer>
      </FlexContainer>
    </Modal>
  );
};
