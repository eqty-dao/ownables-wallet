import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  start(port: number, fileDir: string, options: Object): Promise<string>;
  stop(): Promise<null>;
  isRunning(): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RlWebServer');
