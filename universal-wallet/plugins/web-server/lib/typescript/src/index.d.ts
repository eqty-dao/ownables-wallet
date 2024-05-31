declare const StaticWebServer: {
    start(port: number, fileDir: string, options: Object): Promise<string>;
    stop(): Promise<null>;
    isRunning(): Promise<boolean>;
};
export default StaticWebServer;
//# sourceMappingURL=index.d.ts.map