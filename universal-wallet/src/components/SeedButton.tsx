import React, {useState} from 'react';
import {StyledSeedButton} from './styles/StyledSeedButton.styles';

export default function SeedButton(props: {text: string; onPress: () => void}): JSX.Element {
  const [showButton, setShowButton] = useState<boolean>(true);

  return (
    <StyledSeedButton
      style={!showButton && {display: 'none'}}
      mode="outlined"
      uppercase={false}
      onPress={() => {
        props.onPress();
        setShowButton(false);
      }}>
      {props.text}
    </StyledSeedButton>
  );
}
