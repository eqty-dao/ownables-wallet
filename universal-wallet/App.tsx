import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import useCachedResources from './src/hooks/useCachedResources';
import useColorScheme from './src/hooks/useColorScheme';
import Navigation from './src/navigation';
import {Provider as PaperProvider} from 'react-native-paper';
import {MessageProviderWrapper} from './src/context/UserMessage.context';
import {FabProviderWrapper} from './src/context/Fab.context';

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider style={{backgroundColor: '#0D0D0D'}}>
      <FabProviderWrapper>
        <MessageProviderWrapper>
          <PaperProvider>
            <StatusBar barStyle={"light-content"} />
            {isLoadingComplete && <Navigation colorScheme={colorScheme} />}
          </PaperProvider>
        </MessageProviderWrapper>
      </FabProviderWrapper>
    </SafeAreaProvider>
  );
}
