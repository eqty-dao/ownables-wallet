import * as React from 'react';

import { StyleSheet, View, Platform } from 'react-native';
import WebView from 'react-native-webview';
import RNFS from 'react-native-fs';
import StaticWebServer from 'react-native-rl-web-server';
const port = 0; // select a random available port
const path =
  Platform.OS === 'ios'
    ? RNFS.MainBundlePath + '/www'
    : RNFS.DocumentDirectoryPath + '/www';
const options = {
  keepAlive: true,
  localOnly: true, // local means secure, have access to crypto and https calls
};

export default function App() {
  const [serverUrl, setServerUrl] = React.useState<string>();
  const [running, setServerRunning] = React.useState<boolean>();

  const copyWWWBuildFiles = async (directory: string) => {
    (await RNFS.readDirAssets(directory)).forEach(async (file) => {
      if (file.isDirectory()) {
        await RNFS.mkdir(RNFS.DocumentDirectoryPath + '/' + file.path);
        return copyWWWBuildFiles(file.path);
      } else {
        await RNFS.copyFileAssets(
          file.path,
          RNFS.DocumentDirectoryPath + '/' + file.path
        );
      }
    });
  };

  const initializeServer = async () => {
    if (Platform.OS === 'android') {
      // move web files to documents directory
      await RNFS.mkdir(path);
      await copyWWWBuildFiles('www');
    }

    const url = await StaticWebServer.start(port, path, options);
    const isRunning = await StaticWebServer.isRunning();
    setServerUrl(url.startsWith('http') ? url : '');
    setServerRunning(isRunning);
  };

  React.useEffect(() => {
    initializeServer();
  }, []);

  return (
    <View style={styles.container}>
      {running && serverUrl && (
        <WebView
          source={{
            uri: serverUrl,
          }}
          onMessage={(evt) => {}}
          javaScriptEnabled
          allowFileAccess
          originWhitelist={['*']}
          allowFileAccessFromFileURLs
          style={{
            flex: 1,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
