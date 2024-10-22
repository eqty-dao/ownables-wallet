import styled from 'styled-components/native';

export const FlexContainer = styled.ScrollView.attrs({
  bounces: false,
  contentContainerStyle: {
    flexGrow: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
})``;

export const TopSpace = styled.TouchableOpacity`
  flex: 1;
`;

export const ModalContainer = styled.View.attrs({activeOpacity: 1})`
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  background-color: #141414;
  padding: 32px 16px;
  gap: 32px;
`;

export const CloseIconContainer = styled.TouchableOpacity`
  border-radius: 16px;
  background-color: #212227;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  align-self: flex-end;
`;

export const ModalSubContainer = styled.View`
  gap: 16px;
`;

export const ModalTitle = styled.Text<{type: 'default' | 'terms'}>`
  color: #fcfcf7;
  font-family: Inter;
  font-size: ${({type}) => (type == 'terms' ? 16 : 24)}px;
  font-weight: 600;
  text-align: center;
`;

export const ModalSubTitle = styled.Text`
  color: #fcfcf7;
  font-family: Inter;
  font-weight: 600;
`;

export const ModalBody = styled.Text<{type: 'default' | 'terms'}>`
  color: #909092;
  font-size: ${({type}) => (type == 'terms' ? 14 : 16)}px;
  text-align: ${({type}) => (type == 'terms' ? 'left' : 'center')};
  font-family: Inter;
`;

export const ErrorText = styled.Text`
  color: #ff4d4f;
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
`;
