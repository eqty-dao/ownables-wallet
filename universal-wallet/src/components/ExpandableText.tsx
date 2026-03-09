import React from 'react';
import {
  ExpandableTextContainer,
  ExpandableTextHeading,
  ExpandableTextHeadingContainer,
} from './styles/ExpandableText.styles';
import Icon from './Icon';

export const ExpandableText = ({text, content}: {text: string; content: React.ReactNode}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <ExpandableTextContainer>
      <ExpandableTextHeadingContainer onPress={() => setIsExpanded(!isExpanded)}>
        <ExpandableTextHeading>{text}</ExpandableTextHeading>
        <Icon icon={isExpanded ? 'chevronUp' : 'chevronDown'} color="#615fff" size={20} />
      </ExpandableTextHeadingContainer>
      {isExpanded && content}
    </ExpandableTextContainer>
  );
};
