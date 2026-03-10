import React from 'react';
import {BottomCard, BottomAvatar, BottomAvatarContainer, AmountContainer} from './WalletTabScreen.styles';
import Spacer from '../../components/Spacer';
import Typography from '../../components/Typography';
import Colors from '../../constants/Colors';
import useEffectiveColorScheme from '../../hooks/useEffectiveColorScheme';

interface Props {
  title: string;
  value: string;
  suffix: string;
}

const BottomTile = ({title, value, suffix}: Props) => {
  const colorScheme = useEffectiveColorScheme();

  return (
    <BottomCard>
      <BottomAvatarContainer>
        <BottomAvatar />
        <Spacer size={20} />
        <Typography size={4} color={Colors[colorScheme].white[100]}>
          {title}
        </Typography>
      </BottomAvatarContainer>
      <AmountContainer>
        <Typography size={4} color={Colors[colorScheme].white[100]}>
          {value}
        </Typography>
        <Spacer size={6} />
        <Typography size={4} color={Colors[colorScheme].white[200]}>
          {suffix}
        </Typography>
      </AmountContainer>
    </BottomCard>
  );
};

export default BottomTile;
