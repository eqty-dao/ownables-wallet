import styled from 'styled-components/native';

export const Container = styled.SafeAreaView`
  flex: 1;
  justify-content: center;
  align-items: center;
  margin-top: 22px;
`;

export const ModalView = styled.View`
  margin: 12px;
  background-color: #ffffff;
  border-radius: 20px;
  padding: 35px;
  align-items: center;
  shadow-color: #000000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
  elevation: 5;
`;

export const ModalText = styled.Text`
  text-align: left;
`;

export const TextContainer = styled.ScrollView`
  width: 100%;
`;
