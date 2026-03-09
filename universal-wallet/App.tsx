import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useCachedResources from './src/hooks/useCachedResources';
import Navigation from './src/navigation';
import { Provider as PaperProvider } from 'react-native-paper';
import { MessageProviderWrapper } from './src/context/UserMessage.context';
import { FabProviderWrapper } from './src/context/Fab.context';
import { UserProvider } from './src/context/User.context';
import { AppProvider } from './providers/AppContext';
import { UpdateRequiredModal } from './src/components/UpdateRequiredModal';
import { checkAppVersion } from './src/services/versionCheckService';
import DeviceInfo from 'react-native-device-info';
import useEffectiveColorScheme from './src/hooks/useEffectiveColorScheme';

function AppContainer() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useEffectiveColorScheme();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [minVersion, setMinVersion] = useState('');

  useEffect(() => {
    const checkVersion = async () => {
      const version = DeviceInfo.getVersion() || '0.2.21';
      console.log('version', version);
      const { needsUpdate, minVersion: minVer } = await checkAppVersion(version);
      if (needsUpdate) {
        setMinVersion(minVer);
        setShowUpdateModal(true);
      }
    };

    checkVersion();
  }, []);

  return (
    <SafeAreaProvider style={{ backgroundColor: '#0D0D0D' }}>
      <FabProviderWrapper>
        <MessageProviderWrapper>
          <PaperProvider>
            <StatusBar barStyle={colorScheme === 'light' ? 'dark-content' : 'light-content'} />
            {isLoadingComplete && <Navigation colorScheme={colorScheme} />}
            <UpdateRequiredModal
              visible={showUpdateModal}
              minVersion={minVersion}
            />
          </PaperProvider>
        </MessageProviderWrapper>
      </FabProviderWrapper>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <UserProvider>
        <AppContainer />
      </UserProvider>
    </AppProvider>
  );
}
