# LTO Universal Wallet
This is the official repository for the LTO Universal Wallet. The wallet is a mobile application that allows users to manage their LTO coins and tokens. The wallet is built using React Native and is available for both Android and iOS devices.

## TL;DR
- The wallet is built using React Native and the ownable SDK.
- Ownable_SDK is a library that provides a set of functions to interact with the LTO Network blockchain.
- The ownable SDK served from the users device using react-native-rl-web-server.



## Table of Contents
- [Getting Started](#getting-started)
- [Environment](#environment)
- [Build](#build)



## Getting Started
1. Clone the repository.
2. `cd ownable_sdk && yarn && yarn build && cd ..`

This will build the ownable SDK and copy the build files to the `universal-wallet` project.
### Universal Wallet
1. Clone the repository.
2. `cd universal-wallet && yarn && cd ios && pod install && cd ..`
3. `./run patch`
4. `./run prebuild`
5. `./run android` or `./run ios`

## Environment
- node 18.18.2


## Build
Make changes to the ownable SDK and build it using the following command:
### Android
- Build apk: `cd universal-wallet/android ./run prebuild && ./run build apk`
- Build bundle: `cd universal-wallet/android ./run prebuild && ./run build bundle`
### iOS
- Build ipa: `cd universal-wallet/ios ./run prebuild && ./run build ipa`
- Build bundle: `cd universal-wallet/ios ./run prebuild && ./run build bundle`
- JS bundle: `cd universal-wallet/ios && ./run prebuild && cd ios && pod install && cd .. && npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle --assets-dest ios`


