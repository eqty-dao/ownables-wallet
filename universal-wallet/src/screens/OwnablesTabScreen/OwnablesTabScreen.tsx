import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Linking, Platform } from 'react-native';
import LTOService from '../../services/LTO.service';
import { RootTabScreenProps } from '../../../types';
import OverviewHeader from '../../components/OverviewHeader';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import styled from 'styled-components/native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import StaticWebServer from 'react-native-rl-web-server';
import { MainScreenContainer } from '../../components/MainScreenContainer';
import { StyledImage } from '../../components/styles/OverviewHeader.styles';
import { logoTitle } from '../../utils/images';
import { useUserSettings } from '../../context/User.context';
import { Account } from '@ltonetwork/lto';

const port = 30122; // select a random available port
const path = Platform.OS === 'ios' ? RNFS.MainBundlePath + '/www' : RNFS.DocumentDirectoryPath + '/html';
const options = {
  keepAlive: true,
  localOnly: true, // local means secure, have access to crypto and https calls
};

const WebViewContainer = styled.View`
  flex: 1;
  background-color: #0d0d0d;
`;

export default function OwnablesTabScreen({ navigation }: RootTabScreenProps<'Ownables'>) {
  const [accountInfo, setAccountInfo] = useState<Account | null>(null);
  const [webViewOpacity, setWebViewOpacity] = useState(0);
  const { setForceSignOut } = useUserSettings();
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigation.canGoBack()) {
        //DC: Redirect user to wallet screen
        navigation.replace('Root');
      }
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const readStorage = async () => {
    return await LTOService.getAccount()
      .then(account => {
        setAccountInfo(account);
        return account;
      })
      .catch(error => {
        throw new Error(`Error retrieving data. ${error}`);
        //console.log(`Error retrieving data. ${error}`);
        return null;
      });
  };

  useFocusEffect(
    React.useCallback(() => {
      readStorage();
    }, []),
  );
  const sanitizeData = (data: any) => {
    //ensure its a json of form e.g { type: "openFileDialog", data: { forceSignout: false } }
    if (typeof data === 'object') {
      return data.type === 'openFileDialog' && typeof data.data === 'object' ? data : null;
    }
    return null;
  }

  const webMessage = async (event: WebViewMessageEvent) => {
    const data = JSON.parse(event.nativeEvent.data);
    const sanitizedData = sanitizeData(data);
    if (data.type === 'openFileDialog') {
      const { forceSignout } = data.data;
      setForceSignOut(forceSignout);
    }
    if (data.type === 'ready') {
      let seed = "";
      if (accountInfo && accountInfo.seed) {
        seed = accountInfo.seed;
      } else {
        seed = (await readStorage())?.seed as string;
      }
      webViewRef.current?.injectJavaScript(`window.localStorage.setItem('seed', '${seed}')`);
    }
    AsyncStorage.setItem('webData', JSON.stringify(sanitizedData));
  };

  const [serverUrl, setServerUrl] = React.useState<string>();

  const copyWWWBuildFiles = async (directory: string) => {
    // If the directory does not exist, proceed with copying
    (await RNFS.readDirAssets(directory)).forEach(async (file: { isDirectory: () => any; path: string }) => {
      if (file.isDirectory()) {
        await RNFS.mkdir(RNFS.DocumentDirectoryPath + '/' + file.path);
        return copyWWWBuildFiles(file.path);
      } else {
        //await RNFS.copyFileAssets(file.path, RNFS.DocumentDirectoryPath + '/' + file.path);
        const sanitizedPath = file.path;
        const targetPath = `${RNFS.DocumentDirectoryPath}/${sanitizedPath}`;
        await RNFS.copyFileAssets(file.path, targetPath);
      }
    });
  };

  const onWebviewLoads = () => {
    setTimeout(() => {
      setWebViewOpacity(1);
    }, 250);
  };

  const initializeServer = async () => {
    if (Platform.OS === 'android') {
      await RNFS.mkdir(path);
      await copyWWWBuildFiles('html');
    }

    const url = await StaticWebServer.start(port, path, options);
    // setServerUrl('http://10.0.167:3000')
    setServerUrl(url.startsWith('http') ? url : '');
  };

  React.useEffect(() => {
    initializeServer();
  }, []);

  const getWebViewUrl = () => {
    return serverUrl; // Fallback to just serverUrl if accountInfo or seed is not available
  };

  // Needed to open the LTO documentation in the browser rather than
  // inside the web view on IOS
  const handleShouldStartLoadWithRequest = (request: WebViewNavigation): boolean => {
    console.log('handleShouldStartLoadWithRequest', request.url);
    if (Platform.OS === 'ios' && request.url.includes('docs.')) {
      Linking.openURL(request.url).catch(err => console.error('An error occurred', err));
      return false;
    }
    return true;
  };

  return (
    <MainScreenContainer disableScroll={true}>
      <OverviewHeader
        icon={'menu'}
        onPress={() => navigation.navigate('Menu')}
        hideQR={true}
        input={<StyledImage testID="logo-title" source={logoTitle} />}
      />
      <WebViewContainer>
        <WebView
          backgroundColor="#0D0D0D"
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          originWhitelist={['*']}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          incognito={false}
          onMessage={webMessage}
          onLoadEnd={onWebviewLoads}
          source={{
            uri: getWebViewUrl(),
            cacheMode: 'LOAD_CACHE_ELSE_NETWORK',
            cacheEnabled: true,
          }}
          style={{ backgroundColor: '#0D0D0D', opacity: webViewOpacity }}
          ref={webViewRef}
        />
      </WebViewContainer>
    </MainScreenContainer>
  );
}
