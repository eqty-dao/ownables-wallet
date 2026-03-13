import Spinner from './Spinner';
import React from 'react';

export default function Loader(props: {loading: boolean; children: any}): JSX.Element {
  return props.loading ? <Spinner /> : <>{props.children}</>;
}
