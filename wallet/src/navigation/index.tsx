import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Box, WalletMinimal } from 'lucide-react-native';
import * as React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { AppState, ColorSchemeName, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, RootTabParamList } from '../../types';
import SnackbarMessage from '../components/Snackbar';
import Colors from '../constants/Colors';
import useEffectiveColorScheme from '../hooks/useEffectiveColorScheme';
import SignUpScreen from '../screens/SignUpScreen/SignUpScreen';
import RegisterAccountScreen from '../screens/RegisterAccountScreen/RegisterAccountScreen';
import ImportSeedScreen from '../screens/ImportWithSeedScreen/ImportWithSeedScreen';
import LockedScreen from '../screens/LockedScreen/LockedScreen';
import OnboardingScreen from '../screens/OnBoardingScreen/OnBoardingScreen';
import SignInScreen from '../screens/SignInScreen/SignInScreen';
import LocalStorageService from '../services/LocalStorage.service';
import LinkingConfiguration from './LinkingConfiguration';
import { FabContext } from '../context/Fab.context';
import { useAppContext } from '../../providers/AppContext';
import NewOwnablesTabScreen from '../screens/OwnablesTabScreen/NewOwnablesTabScreen';
import TestNetBanner from '../components/TestNetBanner';
import QrReaderScreen from '../screens/QrReaderScreen/QrReaderScreen';
import AccountLifecycleService from '../services/AccountLifecycle.service';
import WalletStackNavigator from './WalletStackNavigator';

const lightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#141414',
    primary: '#615fff',
    border: '#E7E7EF',
  },
};

const darkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#1a1a1a',
    card: '#252525',
    text: '#FFFFFF',
    primary: '#615fff',
    border: '#1E1E1E',
  },
};

export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
  return (
    <NavigationContainer linking={LinkingConfiguration} theme={colorScheme === 'dark' ? darkNavTheme : lightNavTheme}>
      <SnackbarMessage />
      <TestNetBanner />
      <RootNavigator />
    </NavigationContainer>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator(): any {
  const colorScheme = useEffectiveColorScheme();
  const [state, setState] = useState({
    appFirstLaunch: false,
    userAlias: null as boolean | null,
    appStateVisible: AppState.currentState,
  });
  const appState = useRef(AppState.currentState);
  const lockOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigator = useNavigation();
  const { currentAction } = useAppContext();

  const handleAppStateChange = useCallback((nextAppState: any) => {
    if (appState.current.match(/active/) && nextAppState === 'background') {
      if (lockOutTimerRef.current) {
        clearTimeout(lockOutTimerRef.current);
      }

      lockOutTimerRef.current = setTimeout(() => {
        if (!currentAction && !appState.current.match(/active/) && userAlias) {
          AccountLifecycleService.lock();
          navigator.navigate('LockedScreen');
        }
      }, 30 * 1000);
    }

    if (appState.current.match(/background/) && nextAppState === 'active') {
      if (lockOutTimerRef.current) {
        clearTimeout(lockOutTimerRef.current);
        lockOutTimerRef.current = null;
      }
    }

    appState.current = nextAppState;
    setState((prevState) => ({ ...prevState, appStateVisible: appState.current }));
  }, [currentAction, navigator, userAlias]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      if (lockOutTimerRef.current) {
        clearTimeout(lockOutTimerRef.current);
      }
      subscription.remove();
    };
  }, [handleAppStateChange]);

  useEffect(() => {
    const skipOnboarding = async () => {
      setState((prevState) => ({ ...prevState, appFirstLaunch: false }));
      try {
        const data = await LocalStorageService.getData('@appFirstLaunch');
        if (data === null) {
          setState((prevState) => ({ ...prevState, appFirstLaunch: true }));
          await LocalStorageService.storeData('@appFirstLaunch', false);
        } else {
          setState((prevState) => ({ ...prevState, appFirstLaunch: false }));
        }
      } catch (error) {
        throw new Error(`Error retrieving data. ${error}`);
      }
    };

    //skipOnboarding();

  }, []);

  useEffect(() => {
    const fetchUserAlias = async () => {
      try {
        const hasStoredAccount = await AccountLifecycleService.hasStoredAccount();
        setState((prevState) => ({ ...prevState, userAlias: hasStoredAccount }));
      } catch (error) {
        throw new Error(`Error retrieving data. ${error}`);
      }
    };

    fetchUserAlias();
  }, []);

  const { appFirstLaunch, userAlias } = state;

  return (
    userAlias !== null && (
      <Stack.Navigator
        initialRouteName={appFirstLaunch ? 'OnBoarding' : userAlias ? 'SignIn' : 'SignUp'}
        screenOptions={{
          headerTitleStyle: { color: '#615fff', fontWeight: '400', fontSize: 16 },
          headerTintColor: '#615fff',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF' },
          statusBarStyle: colorScheme === 'dark' ? 'light' : 'dark',
          statusBarColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF',
          navigationBarColor: colorScheme === 'dark' ? '#252525' : '#FFFFFF',
          presentation: 'card',
        }}>
        <Stack.Screen name="OnBoarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ImportSeed" component={ImportSeedScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterAccount" component={RegisterAccountScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Root" component={BottomTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="LockedScreen" component={LockedScreen} options={{ headerShown: false }} />
        <Stack.Screen name="QrReader" component={QrReaderScreen} options={{ headerShown: false, presentation: 'containedModal' }} />
      </Stack.Navigator>
    )
  );
}

const Tab = createMaterialTopTabNavigator<RootTabParamList>();

function BottomTabNavigator() {
  const colorScheme = useEffectiveColorScheme();
  const insets = useSafeAreaInsets();
  const { isOpen } = React.useContext(FabContext);
  const tabBarBottomInset = Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + tabBarBottomInset;

  const handleTabPress = (e: any) => {
    if (isOpen) {
      e.preventDefault();
    }
  };

  return (
    <Tab.Navigator
      initialRouteName="Wallet"
      tabBarPosition="bottom"
      initialLayout={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
      screenListeners={{
        tabPress: handleTabPress,
      }}
      screenOptions={{
        swipeEnabled: false,
        animationEnabled: false,
        tabBarIndicator: () => <></>,
        tabBarActiveTintColor: colorScheme === 'dark' ? Colors.dark.white[100] : '#635BFF',
        tabBarInactiveTintColor: colorScheme === 'dark' ? Colors.dark.white[200] : '#707070',
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: tabBarBottomInset,
          backgroundColor: colorScheme === 'dark' ? (isOpen ? '#1a1a1a' : '#252525') : '#FFFFFF',
          justifyContent: 'center',
          borderTopColor: colorScheme === 'dark' ? '#343434' : 'rgba(0, 0, 0, 0.1)',
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 2,
        },
        tabBarContentContainerStyle: {
          backgroundColor: colorScheme === 'dark' ? (isOpen ? '#1a1a1a' : '#252525') : '#FFFFFF',
          opacity: isOpen ? 0.35 : 1,
        },
      }}>
      <Tab.Screen
        name="Wallet"
        component={WalletStackNavigator}
        options={{
          tabBarShowIcon: true,
          tabBarIcon: ({ focused }) => (
            <WalletMinimal
              size={24}
              color={
                colorScheme === 'dark'
                  ? Colors.dark.white[focused ? 100 : 200]
                  : focused
                    ? '#635BFF'
                    : '#707070'
              }
              strokeWidth={2}
            />
          ),
          tabBarLabelStyle: { fontSize: 12, lineHeight: 16, textTransform: 'capitalize', fontWeight: '600' },
          tabBarIndicatorStyle: { backgroundColor: Colors[colorScheme].tint, top: 0, height: 3 },
        }}
      />
      <Tab.Screen
        name="Ownables"
        component={NewOwnablesTabScreen}
        options={{
          headerTitle: 'Ownables',
          headerStyle: { height: 100 },
          headerTitleStyle: { fontWeight: '800', marginLeft: 20 },
          headerTitleAllowFontScaling: true,
          tabBarIcon: ({ focused }) => (
            <Box
              size={24}
              color={
                colorScheme === 'dark'
                  ? Colors.dark.white[focused ? 100 : 200]
                  : focused
                    ? '#635BFF'
                    : '#707070'
              }
              strokeWidth={2}
            />
          ),
          tabBarLabelStyle: { fontSize: 12, lineHeight: 16, textTransform: 'capitalize', fontWeight: '600' },
          tabBarIndicatorStyle: { backgroundColor: Colors[colorScheme].tint, top: 0, height: 3 },
        }}
      />
    </Tab.Navigator>
  );
}
