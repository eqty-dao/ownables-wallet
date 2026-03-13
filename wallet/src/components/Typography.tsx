import styled from 'styled-components/native';
import {Dimensions, PixelRatio, Text} from 'react-native';

const {width} = Dimensions.get('window');

const responsiveSize = (size: number) => {
  const screenWidth = width;
  const elemWidth = size;
  return PixelRatio.roundToNearestPixel((screenWidth * elemWidth) / 100);
};

interface Props {
  size: number;
  color?: string;
  family?: string;
  bold?: boolean;
}

const Typography = styled(Text)<Props>`
  color: ${({color}) => color ?? '#000000'};
  font-size: ${({size}) => responsiveSize(size)}px;
  font-family: ${({family}) => family ?? 'Inter'};

  ${({bold}) =>
    bold &&
    `
        font-weight: bold;
    `}
`;

export default Typography;
