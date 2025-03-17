interface OwnablesSDKType {
    initialize: () => Promise<void>;
    isInitialized: () => boolean;
    safeQuery: <T>(queryFn: () => Promise<T>) => Promise<T>;
}

declare global {
    interface Window {
        OwnablesSDK: OwnablesSDKType;
    }
}

export {}; 