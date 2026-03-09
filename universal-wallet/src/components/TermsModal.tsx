import React from 'react';
import {Modal} from 'react-native';
import {REGISTER, TERMS_AND_CONDITIONS_CONTENT} from '../constants/Text';
import {Container, ModalText, ModalView, TextContainer} from '././styles/TermsModal.styles';
import {StyledButton} from './styles/StyledButton.styles';

export default function TermsModal(props: {visible: boolean; onClose: any; onRequestClose: any}): JSX.Element {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={props.visible}
      onRequestClose={() => props.onRequestClose()}>
      <Container>
        <ModalView>
          <ModalText>{REGISTER.MODAL_TITLE}</ModalText>
          <TextContainer showsVerticalScrollIndicator={false}>
            <ModalText>{TERMS_AND_CONDITIONS_CONTENT}</ModalText>
            <Container>
              <StyledButton
                mode="contained"
                color="#615fff"
                uppercase={false}
                labelStyle={{fontWeight: '400', fontSize: 16, width: '100%'}}
                onPress={() => {
                  props.onClose();
                }}>
                {REGISTER.BUTTON_MODAL}
              </StyledButton>
            </Container>
          </TextContainer>
        </ModalView>
      </Container>
    </Modal>
  );
}
