import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useUserSettings } from '../context/User.context';

export default function useEffectiveColorScheme(): 'light' | 'dark' {
  const nativeScheme = useNativeColorScheme();
  const { appearance } = useUserSettings();

  if (appearance === 'light' || appearance === 'dark') {
    return appearance;
  }

  // "system" preference: follow the system scheme, and fallback to light when unavailable.
  return nativeScheme === 'dark' ? 'dark' : 'light';
}
