export const shuffleArray = <Type>(array: Array<Type>): Array<Type> =>
  array
    .map(value => ({value, sort: Math.random()}))
    .sort((a, b) => a.sort - b.sort)
    .map(({value}) => value);
