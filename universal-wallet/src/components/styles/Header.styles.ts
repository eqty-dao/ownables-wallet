import styled from 'styled-components/native';
import {Button} from 'react-native-paper';

export const HeaderView = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 0px;
  margin-right: 30px;
  margin-left: 30px;
`;

export const HeaderBtn = styled(Button)`
  font-size: 15px;
  color: #615fff;
  height: 35px;
  width: 130px;
`;
