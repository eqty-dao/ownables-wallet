import {Card, Paragraph, Surface, Title, TouchableRipple} from 'react-native-paper';
import styled from 'styled-components/native';
import {Platform} from 'react-native';

export const Container = styled.View`
  background-color: #0d0d0d;
  width: 100%;
  height: 100%;
  padding-top: ${Platform.OS === 'ios' ? 20 : 40}px;
`;

export const OverviewContainer = styled.SafeAreaView`
  align-content: center;
  margin-top: 1px;
`;

export const AmountContainer = styled.View`
  flex-direction: row;
  align-items: baseline;
`;

export const TopContainer = styled(Surface)`
  background-color: transparent;
`;

export const TopCardsRipple = styled(TouchableRipple)`
  border: none;
  padding-top: 0;
`;

export const TopCardsContainer = styled.View`
  display: flex;
  margin-top: 2px;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  background-color: transparent;
`;

export const TopCard = styled(Card)`
  width: auto;
  height: auto;
  box-shadow: 0 0 0 transparent;
  background-color: transparent;
  align-items: center;
`;

export const BottomCardsContainer = styled.View`
  width: 93%;
  margin-top: 70px;
  background-color: #141414;
  border-radius: 16px;
  padding: 16px;
`;

export const BottomAvatarContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

export const BottomAvatar = styled.View`
  width: 50px;
  height: 50px;
  background-color: #212227;
  border-radius: 10px;
`;

export const BottomCard = styled.View`
  background-color: transparent;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const ActivityCard = styled(Card)`
  width: 93%;
  margin: 16px auto 0 auto;
  background-color: #141414;
  border-radius: 16px;
`;

export const ActivityCardTitle = styled.View`
  padding: 12px 16px;
`;

export const WhiteText = styled(Paragraph)`
  color: #ffffff;
`;

export const FieldName = styled(Paragraph)`
  opacity: 0.5;
`;

export const Amount = styled(Title)`
  font-family: ${Platform.OS === 'android' ? 'Overpass-Regular' : 'Arial'};
  font-size: 23px;
  font-weight: 400;
`;

export const BackgroundImage = styled.View`
  position: absolute;
`;
