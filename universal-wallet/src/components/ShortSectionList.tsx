import {DefaultSectionT, SectionListData, SectionListProps, View} from 'react-native';
import React from 'react';

export default function ShortSectionList<ItemT, SectionT = DefaultSectionT>(
  props: SectionListProps<ItemT, SectionT>,
): JSX.Element {
  const dummySeparators = {
    highlight: () => {},
    unhighlight: () => {},
    updateProps: (select: 'leading' | 'trailing', newProps: any) => {},
  };

  const renderSection = (section: SectionListData<ItemT, SectionT>) => [
    props.renderSectionHeader ? props.renderSectionHeader({section}) : undefined,
    //@TODO: BT: This is a bug, renderItem is not a prop of SectionListProps
    // props.renderItem
    //   ? section.data.map((item, index) => props.renderItem!({item, index, section, separators: dummySeparators}))
    //   : undefined,
    props.renderSectionFooter ? props.renderSectionFooter({section}) : undefined,
  ];

  return (
    <>
      <View>{props.sections.map(renderSection)}</View>
    </>
  );
}
