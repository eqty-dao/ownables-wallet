import 'react-native-get-random-values';

//F-2024-4519 - Insecure Random Number Generation
export const shuffleArray = <Type>(array: Array<Type>): Array<Type> => {
  const cryptoRandom = () => {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    return randomArray[0] / (0xffffffff + 1);
  };

  return array
    .map(value => ({value, sort: cryptoRandom()}))
    .sort((a, b) => a.sort - b.sort)
    .map(({value}) => value);
};
