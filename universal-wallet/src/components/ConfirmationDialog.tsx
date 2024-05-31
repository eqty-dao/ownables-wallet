import React from 'react';
import {Button, Dialog, Paragraph, Portal} from 'react-native-paper';
import {ButtonContainer} from './styles/ConfirmationDialog.styles';

export default function ConfirmationDialog(props: {
  visible: boolean;
  message?: string;
  onCancel: () => void;
  onPress: () => void;
  titleLabel?: string;
  cancelButtonLabel?: string;
  continueButtonLabel?: string;
  danger?: boolean;
  children?: React.ReactNode;
}): JSX.Element {
  const titleLabel = props.titleLabel || 'Confirm:';
  const cancelButtonLabel = props.cancelButtonLabel || 'Abort';
  const continueButtonLabel = props.continueButtonLabel || 'Confirm';

  return (
    <Portal>
      <Dialog visible={props.visible} dismissable={false} onDismiss={props.onCancel}>
        <Dialog.Title testID="dialog">{titleLabel}</Dialog.Title>
        <Dialog.Content>{props.message ? <Paragraph>{props.message}</Paragraph> : props.children}</Dialog.Content>
        <ButtonContainer>
          <Dialog.Actions>
            <Button color="#666" uppercase={false} testID="cancel" onPress={props.onCancel}>
              {cancelButtonLabel}
            </Button>
          </Dialog.Actions>
          <Dialog.Actions>
            <Button color={props.danger ? 'red' : ''} uppercase={false} testID="continue" onPress={props.onPress}>
              {continueButtonLabel}
            </Button>
          </Dialog.Actions>
        </ButtonContainer>
      </Dialog>
    </Portal>
  );
}
