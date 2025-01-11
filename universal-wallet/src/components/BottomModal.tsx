import React, { useContext } from 'react';
import { Alert, Modal, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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
import { StyledButton } from './StyledButton';
import Icon from './Icon';
import { Text } from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import PressToCopy from './PressToCopy';
import { Card } from './Card';
import { useClipboard } from '@react-native-clipboard/clipboard';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { Input } from 'react-native-elements';
import { MessageContext } from '../context/UserMessage.context';

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
  copyText,
}: {
  title: string;
  body: { text: string; heading?: boolean }[];
  onSubmit: () => void;
  submitButtonType: 'danger' | 'primary' | 'secondary';
  submitText: string;
  cancelText?: string;
  onCancel: () => void;
  visible: boolean;
  type?: 'default' | 'terms' | 'biometric';
  hideCancelButton?: boolean;
  copyText?: string;
}) => {
  const [data, setString] = useClipboard();
  const { width } = useWindowDimensions();
  const { setShowMessage, setMessageInfo } = useContext(MessageContext);


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
            {body.map(({ text, heading }: { text: string; heading?: boolean }, index: number) =>
              heading ? (
                <ModalSubTitle key={index}>{text}</ModalSubTitle>
              ) : (
                <ModalBody type={type} key={index}>
                  {text}
                </ModalBody>
              ),
            )}
            {copyText &&
              <View style={{ flexDirection: 'row', width: '50%', alignSelf: 'center' }}>
                <Input
                  placeholder={copyText}
                  value={copyText}
                  editable={false}
                  inputContainerStyle={{ borderBottomWidth: 0 }}
                  inputStyle={{ color: '#ffff', fontSize: width * 0.035 }}
                  style={{
                    maxWidth: '100%',
                    backgroundColor: '#656565',
                    borderRadius: 10,
                    paddingLeft: 10,
                    marginBottom: 10
                  }}
                  label=""
                  labelStyle={{ color: '#ffff', fontSize: width * 0.035 }}
                />
                <FontAwesome6
                  name="copy"
                  onPress={() => {
                    setString(copyText);
                    Alert.alert('Copied to clipboard!');
                  }}
                  size={24}
                  color="#909092"
                  style={{}}
                />
              </View>
            }
          </ModalSubContainer>
          {
            // If the type is 'terms', we don't need to show the buttons
            type === 'biometric' && (
              <ModalSubContainer>
                {/* Would you like to enable biometric authentication for this app?\n\nThis feature allows you to use the available biometric technology such as Face ID, Fingerprint, or Iris to access your account securely and conveniently, without having to enter your password each time. By enabling biometric authentication, you agree to our Privacy Policy and Terms of Service.\n\n Would you like to proceed? */}
                {/* Biometric authentication  Privacy Policy  adn Terms of Service */}
                <ModalBody
                  type={type}
                >
                  Would you like to enable biometric authentication for this app?
                </ModalBody>
                <ModalBody
                  type={type}
                >
                  This feature allows you to use the available biometric technology such as Face ID, Fingerprint, or Iris to access your account securely and conveniently, without having to enter your password each time. By enabling biometric authentication, you agree to our
                  <TouchableOpacity onPress={() => {
                    InAppBrowser.open("https://www.ltonetwork.com/documents/privacy-policy.html");
                  }} style={{}}>
                    <Text style={{ color: '#909092', textDecorationLine: 'underline' }}> Privacy Policy </Text>
                  </TouchableOpacity>
                  and {""}
                  <TouchableOpacity onPress={() => {
                    InAppBrowser.open("https://www.ltonetwork.com/documents/Terms%20and%20Conditions%20LTO%20Network%20B.V.%20-%2016.01.2019.pdf");
                  }}>
                    <Text style={{ color: '#909092', textDecorationLine: 'underline' }}> Terms of Service </Text>
                  </TouchableOpacity>
                </ModalBody>
                <ModalBody
                  type={type}
                >
                  Would you like to proceed?
                </ModalBody>

              </ModalSubContainer>
            )
          }
          <ModalSubContainer>
            <StyledButton text={submitText} onPress={onSubmit} type={submitButtonType} />
            {!hideCancelButton && <StyledButton text={cancelText} onPress={onCancel} type="textOnly" />}
          </ModalSubContainer>
        </ModalContainer>
      </FlexContainer>
    </Modal>
  );
};
