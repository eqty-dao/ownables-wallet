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
import * as Sentry from "@sentry/react";

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
    <ThemeProvider theme={theme}>
      <FilterProvider>
        <IssuersProvider>
          <CollectionsProvider>
            <App />
          </CollectionsProvider>
        </IssuersProvider>
      </FilterProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
