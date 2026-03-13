import styled from 'styled-components/native';
import {Card, Subheading} from 'react-native-paper';
import Title from 'react-native-paper/src/components/Typography/Title';

export const OverviewContainer = styled.SafeAreaView`
  align-content: center;
  margin-top: 30px;
`;

export const NodeCard = styled(Card)`
  margin: 20px;
`;

export const NodeCardActions = styled(Card.Actions)`
  display: flex;
  justify-content: flex-end;
  margin-right: 10px;
  margin-bottom: 5px;
`;

export const NodeName = styled(Title)``;

export const NodeAddress = styled(Subheading)`
  font-size: 14px;
  color: #999;
`;
