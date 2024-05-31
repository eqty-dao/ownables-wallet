import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    start(port: number, fileDir: string, options: Object): Promise<string>;
    stop(): Promise<null>;
    isRunning(): Promise<boolean>;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativeRlWebServer.d.ts.map