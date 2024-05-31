# environment

node 18.18.2

# quick setup

After downloading repository:

```
pnpm install
cd ios; pod install ; cd ..

# Patches webview to allow local embedded content
./run patch
# copy static html files to native project folders
./run prebuild
```

# Running app

```
./run android
./run ios
```
