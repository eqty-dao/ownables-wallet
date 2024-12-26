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
import { CurrentState, useAppContext } from '../../../providers/AppContext';
import * as pathModule from 'path';
import InAppBrowser from 'react-native-inappbrowser-reborn';

export const ASSETS_FOLDER_NAME: string = 'build';
export const DOCUMENT_FOLDER_PATH: string = `${RNFS.DocumentDirectoryPath}/${ASSETS_FOLDER_NAME}`;
const port = 30122; // select a random available port
const path = Platform.OS === 'ios' ? RNFS.MainBundlePath + '/build' : DOCUMENT_FOLDER_PATH;
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
  const { currentAction, setCurrentAction } = useAppContext();
  const { network, env } = useUserSettings();


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
  };

  const webMessage = (event: WebViewMessageEvent) => {
    const data = JSON.parse(event.nativeEvent.data);
    const sanitizedData = sanitizeData(data);
    console.log('webMessage', data);
    console.log('sanitizedData', sanitizedData);
    if (data.type === 'openFileDialog') {
      const { forceSignout } = data.data;
      setForceSignOut(forceSignout);
    }
    if (data.type === 'uploadFileStart') {
      console.log('currentAction', currentAction);
      setCurrentAction(CurrentState.CHOSE_PHOTO_DIALOG_OPEN);
    }
    if (data.type === 'uploadFileEnd') {
      setCurrentAction('');
    }
    if (data.type === 'openInfo') {
      console.log('Open Info:', data.data);
      InAppBrowser.open('https://docs.ltonetwork.com/ownables/what-are-ownables');
    }
    AsyncStorage.setItem('webData', JSON.stringify(data));
  };

  const [serverUrl, setServerUrl] = React.useState<string>();

  const copyWWWBuildFiles = async (directory: string) => {
    (await RNFS.readDirAssets(directory)).forEach(async (file: { isDirectory: () => any; path: string }) => {
      if (file.isDirectory()) {
        const dirPath = pathModule.join(RNFS.DocumentDirectoryPath, file.path);
        await RNFS.mkdir(dirPath);
        return copyWWWBuildFiles(file.path);
      } else {
        //F-2024-4593 - Potential Path Traversal
        const sanitizedPath = pathModule.normalize(file.path).replace(/^(\.\.[\/\\])+/, ''); // Prevents path traversal
        const targetPath = pathModule.join(RNFS.DocumentDirectoryPath, sanitizedPath);
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
      await copyWWWBuildFiles(ASSETS_FOLDER_NAME);
    }

    const url = await StaticWebServer.start(port, path, options);
    setServerUrl(url.startsWith('http') ? url : '');
  };

  React.useEffect(() => {
    initializeServer();
  }, []);

  const getWebViewUrl = () => {
    if (accountInfo && accountInfo.seed) {
      return `${serverUrl}?seed=${(accountInfo.seed)}&network=${network}&env=${env}`;
    }
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
          allowsUnsecureHttps={true}
          originWhitelist={['*']}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          incognito={false}
          onMessage={webMessage}
          onLoadEnd={onWebviewLoads}
          source={{
            uri: getWebViewUrl(),
            // uri: 'http://localhost:3000/?seed=lock%20visa%20vacuum%20soul%20awesome%20chuckle%20swing%20lawsuit%20trumpet%20human%20tiny%20eagle%20tone%20trust%20army&network=T&env=PROD',
            // uri: 'http://localhost:3000/?seed=run run run run run run run run run run run run run run run&network=T&env=STAGING',
            // uri:'http://localhost:3000/?seed=run%20run%20run%20run%20run%20run%20run%20run%20run%20run%20run%20run%20run%20run%20run&network=T&env=STAGING',
            cacheMode: 'LOAD_CACHE_ELSE_NETWORK',
            cacheEnabled: true,
          }}
          style={{ backgroundColor: '#0D0D0D', opacity: webViewOpacity }}
        />
      </WebViewContainer>
    </MainScreenContainer>
  );
}
