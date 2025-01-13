#!/bin/zsh

# fail if any command fails
set -e

# debug log
set -x

echo "🧩 Stage: Post-clone is activated .... "
export CI="false"

chmod +x /Volumes/workspace/repository/universal-wallet/ios/ci_scripts/ci_post_clone.sh

# Set base directory relative to the script for easier navigation
BASE_DIR="/Volumes/workspace/repository/universal-wallet/"
OWNABLES_DIR="/Volumes/workspace/repository/ownables_sdk/"
DESTINATION_ENV_FILE="/Volumes/workspace/repository/universal-wallet/.env"
SOURCE_ENV_FILE="/Volumes/workspace/repository/universal-wallet/.env.stg"


#copy the appropriate environment file to the root directory based on the branch
if [[ "$CI_COMMIT_REF_NAME" == "main" ]]; then
    SOURCE_ENV_FILE="/Volumes/workspace/repository/universal-wallet/.env.prod"
fi

cp $SOURCE_ENV_FILE $DESTINATION_ENV_FILE && echo "🔧 $SOURCE_ENV_FILE file is copied to $DESTINATION_ENV_FILE"

#print the environment file
cat $DESTINATION_ENV_FILE

# Install dependencies using Homebrew. This is MUST! Do not delete.
brew install node cocoapods

cd $OWNABLES_DIR
npm i && echo "🔧 NPM dependencies are installed successfully for ownables"

cd $BASE_DIR
npm i && echo "🔧 NPM dependencies are installed successfully"

cd $BASE_DIR/ios
pod install

cd $BASE_DIR

echo "🔧 Build SDK"
cd $OWNABLES_DIR
npm i && npm run rustup && npm run build

echo "🔧 Build SDK is done successfully"

echo "🔧 Prebuild"
./run prebuild && cd ios && pod install && cd .. && npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle --assets-dest ios && echo "🔧 Prebuild is done successfully"

echo "🎯 Stage: Post-clone is done .... "
# BASE_CLIENT_DIR="/Volumes/workspace/repository/universal-wallet/"

# # detect the branch name and set the environment variable
# # if branch name is 'master' use '.env.production' file else use '.env.develop' file
# ENV_FILE=".env"
# ENV_SOURCE="$BASE_DIR"
# pwd

# if [[ "$CI_COMMIT_REF_NAME" == "main" ]]; then
#     ENV_SOURCE="$BASE_DIR.env.prod"
# fi
# ls -la $ENV_SOURCE

# cp $ENV_SOURCE $BASE_DIR$ENV_FILE && echo "🔧 $ENV_SOURCE file is copied to $ENV_FILE"
# [[ "$CI_COMMIT_REF_NAME" != "main" ]] && cp $ENV_SOURCE "$BASE_DIR.env.prod"

# # Install dependencies using Homebrew. This is MUST! Do not delete.
# brew install node yarn cocoapods

# # Navigate to the appropriate directory before running pod-install and yarn commands
# cd $BASE_CLIENT_DIR
# pwd
# yarn && echo "🔧 Yarn dependencies are installed successfully"

# # Navigate to ios directory and run prebuild
# cd $BASE_CLIENT_DIR/ios
# npx pod-install
# cd $BASE_CLIENT_DIR
# ./run prebuild && echo "🔧 Prebuild is done successfully"

# echo "🎯 Stage: Post-clone is done .... "

# The exit command is implicit in scripts if no error occurs, and because we use set -e, it will exit on error automatically