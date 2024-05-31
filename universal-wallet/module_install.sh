#!/bin/sh

# any packages added to this project should be added here first

# react-native-screens react-native-safe-area-context required by @react-navigation/native
# react-native-gesture-handler required by @react-navigation/stack

yarn add @ltonetwork/lto @react-native-async-storage/async-storage @react-native-clipboard/clipboard \
    @react-navigation/bottom-tabs @react-navigation/material-top-tabs @react-navigation/native \
    @react-navigation/native-stack @testing-library/jest-native @tradle/react-native-http @types/styled-components-react-native \
    axios browserify browserify-global browserify-zlib buffer dns.js events https-browserify path-browserify \
    punycode react react-dom react-native react-native-biometrics react-native-collapsible react-native-crypto \
    react-native-dotenv react-native-fs react-native-get-random-values react-native-inappbrowser-reborn \
    react-native-level-fs react-native-pager-view react-native-paper react-native-randombytes react-native-safe-area-context \
    react-native-screens react-native-svg react-native-tab-view react-native-udp react-native-web react-native-webview \
    readable-stream stream-browserify string_decoder styled-components text-decoding tty-browserify url util vm-browserify
# pnpm add --prefer-offline styled-components react-native-svg \
#   react-native-gesture-handler @react-navigation/stack \
#   @react-native-async-storage/async-storage

# pnpm add --prefer-offline -D @types/styled-components @types/styled-components-react-native \
#   @svgr/cli

# Good extras to include in projects
# pnpm add moment-timezone
# pnpm add -D @types/moment

# Also install IOS cocoapods
# cd ios ; pod install ; cd ..

# ./run update-app-icon
# ./run update-app-splash 508aa8
