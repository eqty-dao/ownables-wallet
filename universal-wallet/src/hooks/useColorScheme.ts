import {ColorSchemeName} from 'react-native';
import useEffectiveColorScheme from './useEffectiveColorScheme';

export default function useColorScheme(): NonNullable<ColorSchemeName> {
  return useEffectiveColorScheme();
}
