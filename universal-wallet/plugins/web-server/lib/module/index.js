import { NativeModules, Platform } from 'react-native';
const LINKING_ERROR = `The package 'react-native-rl-web-server' doesn't seem to be linked. Make sure: \n\n` + Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;
const RlWebServerModule = isTurboModuleEnabled ? require('./NativeRlWebServer').default : NativeModules.RlWebServer;
const RlWebServer = RlWebServerModule ? RlWebServerModule : new Proxy({}, {
  get() {
    throw new Error(LINKING_ERROR);
  }
});
const StaticWebServer = {
  async start(port, fileDir, options) {
    return await RlWebServer.start(port, fileDir, options);
  },
  async stop() {
    return await RlWebServer.stop();
  },
  async isRunning() {
    return await RlWebServer.isRunning();
  }
};
export default StaticWebServer;
//# sourceMappingURL=index.js.map