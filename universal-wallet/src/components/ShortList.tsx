import {FlatListProps, View} from 'react-native';
import React from 'react';

export default function ShortList<ItemT>(props: FlatListProps<ItemT>): JSX.Element {
  const dummySeparators = {
    highlight: () => {},
    unhighlight: () => {},
    updateProps: (select: 'leading' | 'trailing', newProps: any) => {},
  };

  const renderItem = (item: ItemT, index: number) => props.renderItem!({item, index, separators: dummySeparators});

  return (
    <>
      <View style={{paddingRight: 8}}>{props.data?.map(renderItem)}</View>
    </>
  );
}
