import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useUserSettings } from '../context/User.context';

export default function useEffectiveColorScheme(): 'light' | 'dark' {
  const nativeScheme = useNativeColorScheme();
  const { appearance } = useUserSettings();

  if (appearance === 'light' || appearance === 'dark') {
    return appearance;
  }

  return nativeScheme === 'light' ? 'light' : 'dark';
}

