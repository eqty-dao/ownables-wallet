import {LTO_REPRESENTATION} from '../constants/Quantities';

export const formatNumber = (number: Number | any, digits = 2): string => {
  if (isNaN(number / LTO_REPRESENTATION)) return '';

  const fixedNumber = (number / LTO_REPRESENTATION).toFixed(digits);
  return fixedNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
