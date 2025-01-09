import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { AppState, ColorSchemeName, Dimensions } from 'react-native';
import { RootStackParamList, RootStackScreenProps, RootTabParamList, RootTabScreenProps } from '../../types';
import SnackbarMessage from '../components/Snackbar';
import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import SignUpScreen from '../screens/SignUpScreen/SignUpScreen';
import RegisterAccountScreen from '../screens/RegisterAccountScreen/RegisterAccountScreen';
import ImportSeedScreen from '../screens/ImportWithSeedScreen/ImportWithSeedScreen';
import MenuScreen from '../screens/MenuScreen/MenuScreen';
import LockedScreen from '../screens/LockedScreen/LockedScreen';
import OnboardingScreen from '../screens/OnBoardingScreen/OnBoardingScreen';
import OwnablesTabScreen from '../screens/OwnablesTabScreen/OwnablesTabScreen';
import ProfileScreen from '../screens/ProfileScreen/ProfileScreen';
import SignInScreen from '../screens/SignInScreen/SignInScreen';
import WalletTabScreen from '../screens/WalletTabScreen/WalletTabScreen';
import LocalStorageService from '../services/LocalStorage.service';
import LinkingConfiguration from './LinkingConfiguration';
import CreateTransferScreen from '../screens/CreateTransferScreen/CreateTransferScreen';
import CreateLeaseScreen from '../screens/CreateLeaseScreen/CreateLeaseScreen';
import TransactionsScreen from '../screens/TransactionsScreen/TransactionsScreen';
import LeaseScreen from '../screens/LeaseScreen/LeaseScreen';
import Icon from '../components/Icon';
import { FabContext } from '../context/Fab.context';
import { CurrentState, useAppContext } from '../../providers/AppContext';
import NewOwnablesTabScreen from '../screens/OwnablesTabScreen/NewOwnablesTabScreen';
import { useUserSettings } from '../context/User.context';
import TestNetBanner from '../components/TestNetBanner';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0D0D0D',
  },
};

export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
  return (
    <NavigationContainer linking={LinkingConfiguration} theme={colorScheme === 'dark' ? DarkTheme : navTheme}>
      <SnackbarMessage />
      <TestNetBanner />
      <RootNavigator />
    </NavigationContainer>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator(): any {
  const [state, setState] = useState({
    appFirstLaunch: false,
    userAlias: null as boolean | null,
    appStateVisible: AppState.currentState,
  });
  const { network } = useUserSettings();

  const appState = useRef(AppState.currentState);
  const navigator = useNavigation();
  const { currentAction } = useAppContext();

  const handleAppStateChange = useCallback((nextAppState: any) => {
    let lockOutTimer: any;
    if (appState.current.match(/active/) && nextAppState === 'background') {
      lockOutTimer = setTimeout(() => {
        console.log('Inactivity detected', currentAction);
        console.log('App has come to the background!', appState.current);
        if (!currentAction && !appState.current.match(/active/) && userAlias) {
          navigator.navigate('SignIn');
        }
      }, 30 * 1000);
    }
    if (appState.current.match(/background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!', appState.current, nextAppState, currentAction, lockOutTimer);
      clearTimeout(lockOutTimer);
    }

    appState.current = nextAppState;
    setState((prevState) => ({ ...prevState, appStateVisible: appState.current }));
  }, [currentAction, navigator]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
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
        const data = await LocalStorageService.getData('@userAlias');
        setState((prevState) => ({ ...prevState, userAlias: data !== null }));
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
          headerTitleStyle: { color: '#A017B7', fontWeight: '400', fontSize: 16 },
          headerTintColor: '#A017B7',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          presentation: 'card',
        }}>
        <Stack.Screen name="OnBoarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ImportSeed" component={ImportSeedScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterAccount" component={RegisterAccountScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Root" component={BottomTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="LockedScreen" component={LockedScreen} options={{ headerShown: false }} />
        <Stack.Group>
          <Stack.Screen name="Menu" component={MenuScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        </Stack.Group>
        <Stack.Screen name="CreateTransfer" component={CreateTransferScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateLease" component={CreateLeaseScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Lease" component={LeaseScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    )
  );
}

const Tab = createMaterialTopTabNavigator<RootTabParamList>();

function BottomTabNavigator() {
  const colorScheme = useColorScheme();
  const { isOpen } = React.useContext(FabContext);

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
        tabBarActiveTintColor: Colors[colorScheme].white[100],
        tabBarInactiveTintColor: Colors[colorScheme].white[200],
        tabBarStyle: {
          height: 80,
          backgroundColor: isOpen ? '#050505' : '#141414',
          justifyContent: 'center',
          borderTopColor: isOpen ? '#060606' : '#1E1E1E',
          borderTopWidth: 1,
        },
        tabBarContentContainerStyle: {
          backgroundColor: isOpen ? '#050505' : '#141414',
          opacity: isOpen ? 0.35 : 1,
        },
      }}>
      <Tab.Screen
        name="Wallet"
        component={WalletTabScreen}
        options={{
          tabBarShowIcon: true,
          tabBarIcon: ({ focused }) => (
            <Icon icon="wallet" size={26} color={Colors[colorScheme].white[focused ? 100 : 200]} />
          ),
          tabBarLabelStyle: { fontSize: 10, textTransform: 'capitalize', fontFamily: 'Urbanist' },
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
            <Icon icon="ownables" size={26} color={Colors[colorScheme].white[focused ? 100 : 200]} />
          ),
          tabBarLabelStyle: { fontSize: 10, textTransform: 'capitalize', fontFamily: 'Urbanist' },
          tabBarIndicatorStyle: { backgroundColor: Colors[colorScheme].tint, top: 0, height: 3 },
        }}
      />
    </Tab.Navigator>
  );
}
// import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// import { DarkTheme, DefaultTheme, NavigationContainer, useNavigation } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import * as React from 'react';
// import { useEffect, useState } from 'react';
// import { AppState, ColorSchemeName, Dimensions } from 'react-native';
// import { RootStackParamList, RootStackScreenProps, RootTabParamList, RootTabScreenProps } from '../../types';
// import SnackbarMessage from '../components/Snackbar';
// import Colors from '../constants/Colors';
// import useColorScheme from '../hooks/useColorScheme';
// import SignUpScreen from '../screens/SignUpScreen/SignUpScreen';
// // import CredentialsTabScreen from '../screens/CredentialsTabScreen/CredentialsTabScreen';
// import RegisterAccountScreen from '../screens/RegisterAccountScreen/RegisterAccountScreen';
// import ImportSeedScreen from '../screens/ImportWithSeedScreen/ImportWithSeedScreen';
// import MenuScreen from '../screens/MenuScreen/MenuScreen';
// import LockedScreen from '../screens/LockedScreen/LockedScreen';
// import OnboardingScreen from '../screens/OnBoardingScreen/OnBoardingScreen';
// import OwnablesTabScreen from '../screens/OwnablesTabScreen/OwnablesTabScreen';
// import ProfileScreen from '../screens/ProfileScreen/ProfileScreen';
// import SignInScreen from '../screens/SignInScreen/SignInScreen';
// import WalletTabScreen from '../screens/WalletTabScreen/WalletTabScreen';
// import LocalStorageService from '../services/LocalStorage.service';
// import LinkingConfiguration from './LinkingConfiguration';
// import CreateTransferScreen from '../screens/CreateTransferScreen/CreateTransferScreen';
// import CreateLeaseScreen from '../screens/CreateLeaseScreen/CreateLeaseScreen';
// import TransactionsScreen from '../screens/TransactionsScreen/TransactionsScreen';
// import LeaseScreen from '../screens/LeaseScreen/LeaseScreen';
// import Icon from '../components/Icon';
// import { FabContext } from '../context/Fab.context';
// import { CurrentState, useAppContext } from '../../providers/AppContext';

// const navTheme = {
//   ...DefaultTheme,
//   colors: {
//     ...DefaultTheme.colors,
//     background: '#0D0D0D',
//   },
// };

// export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
//   return (
//     <NavigationContainer linking={LinkingConfiguration} theme={colorScheme === 'dark' ? DarkTheme : navTheme}>
//       <SnackbarMessage />
//       <RootNavigator />
//     </NavigationContainer>
//   );
// }

// const Stack = createNativeStackNavigator<RootStackParamList>();

// function RootNavigator(): any {
//   const [appFirstLaunch, setAppFirstLaunch] = useState<boolean | null>(null);
//   const [userAlias, setUserAlias] = useState<boolean | null>(null);
//   const appState = React.useRef(AppState.currentState);
//   const [appStateVisible, setAppStateVisible] = useState(appState.current);

//   const navigator = useNavigation();
//   const { currentAction } = useAppContext();

//   useEffect(() => {
//     const handleAppStateChange = (nextAppState: any) => {
//       let lockOutTimer;
//       if (
//         appState.current.match(/active/) &&
//         nextAppState === 'background'
//       ) {
//         lockOutTimer = setTimeout(() => {
//           console.log("App has come to the background!", currentAction);
//           if (currentAction != CurrentState.CHOSE_PHOTO_DIALOG_OPEN && !appState.current.match(/active/)) {
//             navigator.navigate('SignIn');
//           }
//         }, 1000);
//       }
//       if (
//         appState.current.match(/background/) &&
//         nextAppState === 'active'
//       ) {
//         clearTimeout(lockOutTimer);
//       }

//       appState.current = nextAppState;
//       setAppStateVisible(appState.current);
//       console.log('AppState', appState.current);
//     };

//     const subscription = AppState.addEventListener(
//       'change',
//       handleAppStateChange
//     );

//     return () => {
//       subscription.remove();
//     };
//   }, []);


//   useEffect(() => {
//     skipOnboarding();
//   }, [appFirstLaunch]);

//   const skipOnboarding = (): void => {
//     setAppFirstLaunch(false);
//     /*LocalStorageService.getData('@appFirstLaunch')
//       .then((data) => {
//         if (data === null) {
//           setAppFirstLaunch(true)
//           LocalStorageService.storeData('@appFirstLaunch', false)
//         } else {
//           setAppFirstLaunch(false)
//         }
//       })
//       .catch((error) => {
//         throw new Error(`Error retrieving data. ${error}`)
//       })*/
//   };

//   LocalStorageService.getData('@userAlias')
//     .then(data => {
//       setUserAlias(data !== null);
//     })
//     .catch(error => {
//       throw new Error(`Error retrieving data. ${error}`);
//     });

//   return (
//     userAlias !== null && (
//       <Stack.Navigator
//         initialRouteName={appFirstLaunch ? 'OnBoarding' : userAlias ? 'SignIn' : 'SignUp'}
//         screenOptions={{
//           headerTitleStyle: { color: '#A017B7', fontWeight: '400', fontSize: 16 },
//           headerTintColor: '#A017B7',
//           headerShadowVisible: false,
//           headerStyle: { backgroundColor: '#ffffff' },
//           presentation: 'card',
//         }}>
//         <Stack.Screen name="OnBoarding" component={OnboardingScreen} options={{ headerShown: false }} />
//         <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
//         <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
//         <Stack.Screen name="ImportSeed" component={ImportSeedScreen} options={{ headerShown: false }} />
//         <Stack.Screen name="RegisterAccount" component={RegisterAccountScreen} options={{ headerShown: false }} />
//         <Stack.Screen name="Root" component={BottomTabNavigator} options={{ headerShown: false }} />
//         <Stack.Screen name="LockedScreen" component={LockedScreen} options={{ headerShown: false }} />
//         <Stack.Group>
//           <Stack.Screen
//             name="Menu"
//             component={MenuScreen}
//             options={({ navigation }: RootStackScreenProps<'Menu'>) => ({
//               headerShown: false,
//             })}
//           />
//           <Stack.Screen
//             name="Profile"
//             component={ProfileScreen}
//             options={({ navigation }: RootStackScreenProps<'Profile'>) => ({
//               headerShown: false,
//             })}
//           />
//         </Stack.Group>
//         <Stack.Screen
//           name="CreateTransfer"
//           component={CreateTransferScreen}
//           options={({ navigation }: RootStackScreenProps<'CreateTransfer'>) => ({
//             headerShown: false,
//           })}
//         />
//         <Stack.Screen
//           name="CreateLease"
//           component={CreateLeaseScreen}
//           options={({ navigation }: RootStackScreenProps<'CreateLease'>) => ({
//             headerShown: false,
//           })}
//         />
//         <Stack.Screen
//           name="Lease"
//           component={LeaseScreen}
//           options={({ navigation }: RootStackScreenProps<'Lease'>) => ({
//             headerShown: false,
//           })}
//         />
//         <Stack.Screen
//           name="Transactions"
//           component={TransactionsScreen}
//           options={({ navigation }: RootStackScreenProps<'Transactions'>) => ({
//             headerShown: false,
//           })}
//         />
//       </Stack.Navigator>
//     )
//   );
// }

// const Tab = createMaterialTopTabNavigator<RootTabParamList>();

// function BottomTabNavigator() {
//   const colorScheme = useColorScheme();
//   const { isOpen } = React.useContext(FabContext);

//   const handleTabPress = (e: any) => {
//     if (isOpen) {
//       e.preventDefault();
//       return;
//     }
//   };

//   return (
//     <Tab.Navigator
//       initialRouteName="Wallet"
//       tabBarPosition="bottom"
//       initialLayout={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
//       screenListeners={{
//         tabPress: handleTabPress,
//       }}
//       screenOptions={{
//         swipeEnabled: false,
//         animationEnabled: false,
//         tabBarIndicator: () => <></>,
//         tabBarActiveTintColor: Colors[colorScheme].white[100],
//         tabBarInactiveTintColor: Colors[colorScheme].white[200],
//         tabBarStyle: {
//           height: 80,
//           backgroundColor: isOpen ? '#050505' : '#141414',
//           justifyContent: 'center',
//           borderTopColor: isOpen ? '#060606' : '#1E1E1E',
//           borderTopWidth: 1,
//         },
//         tabBarContentContainerStyle: {
//           backgroundColor: isOpen ? '#050505' : '#141414',
//           opacity: isOpen ? 0.35 : 1,
//         },
//       }}>
//       <Tab.Screen
//         name="Wallet"
//         component={WalletTabScreen}
//         options={({ navigation }: RootTabScreenProps<'Wallet'>) => ({
//           tabBarShowIcon: true,
//           tabBarIcon: ({ focused }) => (
//             <Icon icon="wallet" size={26} color={Colors[colorScheme].white[focused ? 100 : 200]} />
//           ),
//           tabBarLabelStyle: { fontSize: 10, textTransform: 'capitalize', fontFamily: 'Urbanist' },
//           tabBarIndicatorStyle: { backgroundColor: Colors[colorScheme].tint, top: 0, height: 3 },
//         })}
//       />
//       {/* <Tab.Screen
//         name="Credentials"
//         component={CredentialsTabScreen}
//         options={({navigation}: RootTabScreenProps<'Credentials'>) => ({
//           tabBarIcon: ({focused}) => (
//             <Icon icon="profile" size={26} color={Colors[colorScheme].white[focused ? 100 : 200]} />
//           ),
//           tabBarLabelStyle: {fontSize: 10, textTransform: 'capitalize', fontFamily: 'Urbanist'},
//           tabBarIndicatorStyle: {backgroundColor: Colors[colorScheme].tint, top: 0, height: 3},
//         })}
//       /> */}
//       <Tab.Screen
//         name="Ownables"
//         component={OwnablesTabScreen}
//         options={({ navigation }: RootTabScreenProps<'Ownables'>) => ({
//           headerTitle: 'Ownables',
//           headerStyle: { height: 100 },
//           headerTitleStyle: { fontWeight: '800', marginLeft: 20 },
//           headerTitleAllowFontScaling: true,
//           tabBarIcon: ({ focused }) => (
//             <Icon icon="ownables" size={26} color={Colors[colorScheme].white[focused ? 100 : 200]} />
//           ),
//           tabBarLabelStyle: { fontSize: 10, textTransform: 'capitalize', fontFamily: 'Urbanist' },
//           tabBarIndicatorStyle: { backgroundColor: Colors[colorScheme].tint, top: 0, height: 3 },
//         })}
//       />
//     </Tab.Navigator>
//   );
// }
