import React from "react";
import ReactDOM from "react-dom/client";

import "@fontsource/montserrat/300.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";
import "./index.css";

import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { createTheme, ThemeProvider } from "@mui/material";
import { CollectionsProvider } from "./context/CollectionsContext";
import { IssuersProvider } from "./context/IssuersContext";
import { FilterProvider } from "./context/FilterContext";
import ErrorBoundary from "./components/ErrorBoundary";
import * as Sentry from "@sentry/react";
import { DB_NAME } from "./services/IDB.service";
import { getSeedFromQuery } from "./services/LTO.service";

Sentry.init({
  dsn: "https://685698fe0f712e487bdf1a2a29ff3ef6@o4508215075733504.ingest.us.sentry.io/4508236178653184",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

// Helper function to send errors to React Native
const sendErrorToRN = (error: any) => {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'sdkerror',
      data: {
        message: error.message || 'Unknown error',
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    }));
  }
};

// Handle IndexedDB errors specifically
const handleIndexedDBError = (event: Event) => {
  const error = (event.target as any).error;
  if (error && error.name === 'InvalidStateError') {
    sendErrorToRN({
      message: 'IndexedDB not initialized properly. Restarting application...',
      name: 'IndexedDBError',
      stack: error.stack
    });
  }
};

// Add specific IndexedDB error listeners
window.addEventListener('error', (event) => {
  if (event.message.includes('IDBDatabase') || event.message.includes('transaction')) {
    sendErrorToRN({
      message: 'Database operation failed. Please restart the application.',
      name: 'IndexedDBError',
      originalError: event.error
    });
    event.preventDefault(); // Prevent default error handling
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  if (error && (
    error.name === 'TransactionError' ||
    (error.message && error.message.includes('IDBDatabase'))
  )) {
    sendErrorToRN({
      message: 'Database transaction failed. Please try again.',
      name: 'TransactionError',
      originalError: error
    });
    event.preventDefault(); // Prevent default error handling
  }
});

// Generic error handler
window.onerror = function (message, source, lineno, colno, error) {
  sendErrorToRN({
    message: message,
    source: source,
    line: lineno,
    column: colno,
    error: error?.toString()
  });
  return false; // Let the error propagate
};

// Add listeners for IndexedDB events
const indexedDB = window.indexedDB;
if (indexedDB) {
  const request = indexedDB.open(DB_NAME);
  request.onerror = (event) => handleIndexedDBError(event);
  request.onblocked = (event) => {
    sendErrorToRN({
      message: 'Database blocked. Please close other tabs or restart the application.',
      name: 'IndexedDBBlocked'
    });
  };
}

const theme = createTheme({
  palette: {
    primary: {
      main: "#1caaff",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#666666",
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Sentry.ErrorBoundary fallback={<div>An error occurred</div>}>
        <ThemeProvider theme={theme}>
          <FilterProvider>
            <IssuersProvider>
              <CollectionsProvider>
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
              </CollectionsProvider>
            </IssuersProvider>
          </FilterProvider>
        </ThemeProvider>
      </Sentry.ErrorBoundary>
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// SDK State Management
type SDKStateType = 'UNINITIALIZED' | 'INITIALIZING' | 'INITIALIZED' | 'FAILED';

let sdkState: SDKStateType = 'UNINITIALIZED';
let initializationPromise: Promise<void> | null = null;
let isSDKInitialized = false;

// RPC State Management
let rpcConnectionAttempts = 0;
const MAX_RPC_RECONNECT_ATTEMPTS = 5;
const activeRPCConnections = new Set<string>();

// RPC State and Queue Management
interface RPCRefreshRequest {
  id: string;
  timestamp: number;
  retryCount: number;
}

class RPCQueueManager {
  private refreshQueue: Map<string, RPCRefreshRequest> = new Map();
  private readonly MAX_REFRESH_RETRIES = 5;
  private readonly REFRESH_TIMEOUT = 15000; // 15 seconds
  private readonly MIN_REFRESH_INTERVAL = 2000; // 2 seconds
  private processingQueue = false;

  addRefreshRequest(id: string) {
    this.refreshQueue.set(id, {
      id,
      timestamp: Date.now(),
      retryCount: 0
    });
    this.processQueue();
  }

  private async processQueue() {
    if (this.processingQueue) return;
    this.processingQueue = true;

    try {
      for (const [id, request] of this.refreshQueue.entries()) {
        // Skip if not enough time has passed since last attempt
        if (Date.now() - request.timestamp < this.MIN_REFRESH_INTERVAL) {
          continue;
        }

        try {
          await this.handleRefresh(request);
          this.refreshQueue.delete(id);
        } catch (error) {
          console.warn(`Refresh failed for ${id}:`, error);
          
          if (request.retryCount < this.MAX_REFRESH_RETRIES) {
            // Update retry count and timestamp
            this.refreshQueue.set(id, {
              ...request,
              retryCount: request.retryCount + 1,
              timestamp: Date.now()
            });
          } else {
            console.error(`Max retries reached for ${id}, removing from queue`);
            this.refreshQueue.delete(id);
            // Try to reinitialize SDK on max retries
            try {
              await initializeSDK();
            } catch (initError) {
              console.error('Failed to reinitialize SDK after refresh failures:', initError);
            }
          }
        }
      }
    } finally {
      this.processingQueue = false;
      // If there are still items in the queue, schedule another process
      if (this.refreshQueue.size > 0) {
        setTimeout(() => this.processQueue(), this.MIN_REFRESH_INTERVAL);
      }
    }
  }

  private async handleRefresh(request: RPCRefreshRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Refresh timeout'));
      }, this.REFRESH_TIMEOUT);

      Promise.race([
        this.executeRefresh(request),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Refresh timeout')), this.REFRESH_TIMEOUT)
        )
      ])
        .then(() => {
          clearTimeout(timeoutId);
          resolve();
        })
        .catch(reject);
    });
  }

  private async executeRefresh(request: RPCRefreshRequest): Promise<void> {
    Sentry.captureMessage('Refreshing RPC connection');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

const rpcQueueManager = new RPCQueueManager();

// Actual initialization logic with retries
const performInitialization = async (attempt = 0, maxAttempts = 3): Promise<boolean> => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    // 1. Check IndexedDB availability and setup
    if (!window.indexedDB) {
      throw new Error('IndexedDB not supported');
    }

    // 2. Open/verify IndexedDB connection with retry
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME);
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      request.onsuccess = (event) => resolve((event.target as any).result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        // Create necessary object stores if they don't exist
        if (!db.objectStoreNames.contains('packages')) {
          db.createObjectStore('packages', { keyPath: 'id' });
        }
      };
    });

    // 3. Verify localStorage availability and setup
    if (!window.localStorage) {
      throw new Error('LocalStorage not supported');
    }

    // 4. Initialize required storage data
    const seed = getSeedFromQuery();
    if (!seed) {
      // Wait briefly for React Native to potentially set the seed
      await delay(1000);
      const retryCount = attempt + 1;
      if (retryCount < maxAttempts) {
        console.log(`Seed not found, retrying (${retryCount}/${maxAttempts})...`);
        await delay(1000 * retryCount);
        return performInitialization(retryCount, maxAttempts);
      }
      throw new Error('Required seed data not found after retries');
    }

    // // 5. Verify React Native WebView bridge
    // if (!window.ReactNativeWebView) {
    //   throw new Error('React Native WebView bridge not available');
    // }

    // 6. Clear any stale state
    rpcConnectionAttempts = 0;
    activeRPCConnections.clear();

    return true;
  } catch (error) {
    if (attempt < maxAttempts - 1) {
      console.warn(`Initialization attempt ${attempt + 1} failed, retrying...`, error);
      await delay(1000 * Math.pow(2, attempt));
      return performInitialization(attempt + 1, maxAttempts);
    }
    throw error;
  }
};

// Enhanced initialization function
const initializeSDK = async (): Promise<void> => {
  // If already successfully initialized, return immediately
  if (sdkState === 'INITIALIZED' && isSDKInitialized) {
    return Promise.resolve();
  }

  // If already initializing, return existing promise
  if (sdkState === 'INITIALIZING' && initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  sdkState = 'INITIALIZING';
  console.log('Starting SDK initialization...');
  
  initializationPromise = (async () => {
    try {
      await performInitialization();
      
      sdkState = 'INITIALIZED';
      isSDKInitialized = true;
      
      // Notify React Native
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'sdkstatus',
        data: { status: 'initialized' }
      }));
      
      console.log('SDK successfully initialized');
    } catch (error) {
      sdkState = 'FAILED';
      isSDKInitialized = false;
      
      console.error('SDK initialization failed:', error);
      sendErrorToRN({
        message: 'SDK initialization failed',
        name: 'InitializationError',
        error: error instanceof Error ? error.toString() : 'Unknown error'
      });
      
      throw error;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
};

// Enhanced safeQuery with better refresh handling
const safeQuery = async function<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  const executeQuery = async function(attempt = 0): Promise<T> {
    try {
      // Always try to initialize if not already initialized
      if (!isSDKInitialized || sdkState !== 'INITIALIZED') {
        await initializeSDK();
      }

      // Check if this is a refresh call
      const isRefreshCall = queryFn.toString().includes('refresh');
      const queryId = Math.random().toString(36).substring(7);

      if (isRefreshCall) {
        rpcQueueManager.addRefreshRequest(queryId);
      }
      
      const result = await Promise.race([
        queryFn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timed out')), isRefreshCall ? 15000 : 10000)
        )
      ]);

      return result;
    } catch (error) {
      console.warn(`Query attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries) {
        const backoffTime = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        // Try to reinitialize on each retry
        if (!isSDKInitialized || sdkState !== 'INITIALIZED') {
          try {
            await initializeSDK();
          } catch (initError) {
            console.warn('Reinitialization failed during retry:', initError);
          }
        }
        
        return executeQuery(attempt + 1);
      }
      
      throw error;
    }
  };

  return executeQuery();
};

// Start initialization immediately when the SDK is loaded
initializeSDK().catch(error => {
  console.error('Initial SDK initialization failed:', error);
});

// Export these functions to be used in your application
window.OwnablesSDK = {
  initialize: initializeSDK,
  isInitialized: () => isSDKInitialized,
  safeQuery
};

