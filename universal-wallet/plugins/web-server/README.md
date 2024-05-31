# react-native-rl-web-server

Local Web Server for React Native

React Native Secure Storage

Available for:
- [x] iOS
- [x] Android

This package is not available under NPM yet, its a WIP.

## Installation

Please refer to main README

## Before usage

1 .- Move your build app to `android/app/src/main/assets/xxx`, it should contain all your html, css and js files to be served.
2 .- Open Xcode, under project folder right click and select `Add files to xxxxxx`, then select the build folder ( it should be at the root level of your project where `node_modules` folder is ), then in `Added folders` option, select `Create folder references` and make sure that `Copy items if needed` is not selected.

## Usage

```js
import StaticWebServer from 'react-native-rl-web-server';
import WebView from 'react-native-webview'; // Package needed to display the served static site
import RNFS from 'react-native-fs'; // Package needed to read from specific folder

const appBuildFolder = 'www';
const port = 0; // select a random available port
const path =
  Platform.OS === 'ios'
    ? RNFS.MainBundlePath + '/' + appBuildFolder
    : RNFS.DocumentDirectoryPath + '/' + appBuildFolder;
const options = {
  keepAlive: true, // still under development
  localOnly: true, // local means secure, have access to crypto and https calls
};

// start function will return an url that you can pass to your WebView component
const serverUrl = await StaticWebServer.start(port, path, options);

// check if the server is running, it returns a boolean value
const isRunning = await StaticWebServer.isRunning();

// stop the web server
await StaticWebServer.stop();

```

Please refer to example folder for more info.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
