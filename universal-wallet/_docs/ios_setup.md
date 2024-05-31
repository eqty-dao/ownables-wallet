# Description

You will need to code sign your IOS app if you wish to upload it to the App Store or to install on a device.
This document describes how to create the required code signing files and making a build with these files.
You do not need to code sign your app to install it in the simulator.


# Terminology

Appstore distribution:  When you distribute your app through the app store

https://developer.apple.com/account/resources/profiles/list

Adhoc distribution: When you distribute your app to people who have registered their device ID (UUID) to the developer account
    This is usually done through an IPA file

Provisioning profile:  A provisioning profile allows your app to run on a device.  There are 2 types.
    1 - A provisioning profile created for Appstore distribution does not expire (it might auto renew)
    2 - A profile for adhoc distribution contains a list of devices registered to the developer account at the time you generated the profile.
    If you add new devices you need to re-generate a new adhoc provisioning profile
    An adhoc provisioning profile expires in 1 year


# Setup Code signing

To setup building for IOS devices do the following

1. If you do not have a `.env` file make a copy from the file `env.sample`

2. Fill in the variables `APP_NAME`, `APP_BUNDLEID`,
`IOS_CSR_TEAM_NAME`, `IOS_CSR_EMAIL`, `IOS_CSR_COUNTRY`,
`SECRETS_PASSWORD`, `IOS_CERT_P12_PASSWORD`
`IOS_TEAM_ID`, `IOS_KEYCHAIN_NAME`
  in the files `env.settings` and `.env`

3. Once those variables are set, type this command to generate 2 request files to upload to the Apple Developer account:

`./appsign ios-key-request`

this should produce two filenames in the folder `_ios_secrets` named <IOS_CSR_TEAM_NAME>-dev.csr and <IOS_CSR_TEAM_NAME>-dist.csr

4. Login to the Apple developer account and create 2 new certificate using these two files.
  Go to this page: https://developer.apple.com/account/resources/certificates/list

5. Click the plus sign and select `iOS Distribution (App Store and Ad Hoc)` then choose the <IOS_CSR_TEAM_NAME>-dist.csr file
  download and save the result in the `_ios_secrets` folder as <IOS_CSR_TEAM_NAME>-dist.cer

6. Click the plus sign and select `iOS App Development` then choose the <IOS_CSR_TEAM_NAME>-dev.csr file
  download and save the result in the `_ios_secrets` folder as <IOS_CSR_TEAM_NAME>-dev.cer

7. Add any device you want for testing in the devices section on this page:
  https://developer.apple.com/account/resources/devices/list

8. Once the device have been added you can now create provisioning profiles from the profiles page here:
  https://developer.apple.com/account/resources/profiles/list

9. Click the plus sign and select `Ad Hoc` in the Distribution section.
  Select the devices you want to be able to test this app
  Set the profile name to <APP_BUNDLEID>-adhoc
  The name of the profile is IMPORTANT
  Save the profile to the folder `_ios_secrets` as <APP_BUNDLEID>-adhoc.mobileprovision
  The name of the profile file is IMPORTANT

10. Click the plus sign and select `App Store` in the Distribution section.
  Set the profile name to <APP_BUNDLEID>-appstore
  The name of the profile is IMPORTANT
  Save the profile to the folder `_ios_secrets` as <APP_BUNDLEID>-appstore.mobileprovision
  The name of the profile file is IMPORTANT

11. Once you have saved the 4 files from the website into the `_ios_secrets` folder, make a secure backup of this folder.

12. Next type in the command:

  `./appsign ios-key-create`

  to create a single encrypted file named `ios_secrets.tgz.gpg` that contains all the required files.
  NOTE: the `_ios_secrets` folder will be deleted
  Add the new encrypted file to the repository

## Recreate Provisioning file
You will need to recreate the provisioning file when a new device needs to be added to the testing/devices list.

To do this, Do Step 8 (and beyond) above again. You will need to delete the old one, and use the new one. Remember that if you already have this in your CI, it will need to be updated in there as well.

# Setup automated uploads

1. Go to the Apple ID website and login with a developer account that has permission to upload the app
  https://appleid.apple.com/sign-in

  Then find the section to generate an app specific password and generate a new password

2. Fill in the variables `IOS_UPLOAD_USER` and `IOS_UPLOAD_PASSWORD` in the `.env` file


# Setup CD/CI pipeline setup

1. This will depend on the service you use.  In most cases you will need to transfer all the secret variables
  in the `.env` file into your pipeline system.  For Github actions this is under project settings:
  Security -> Secrets -> Actions , then click on the New repository secret button


# One off setup before usage

There is a one-off change you will need to make to the project file.  To do this type:

`open ios/Runner.xcodeproj/project.pbxproj`

This will open up xcode. Uncheck `Automatically manage signing` then select one of the new provisioning profiles:
<APP_BUNDLEID>-appstore
Ensure you can create an IPA archive and validate it with Apple.

Once verified commit the file `ios/Runner.xcodeproj/project.pbxproj` to the repository
IMPORTANT: You can enable `Automatically manage signing` for local development, but DO NOT commit this to the repository.
The version in the repository must always have this option unchecked and in a working state.


# Usage in CI/CD

To code sign production builds for your IOS app you need to add the key and prepare the codebase to use the key with the command:

`./appsign ios-key-add`

Next make a build:

`./run build-ipa` or `./run build-ipa adhoc`

Once the build is done remove the key and clean up with the command:

`./appsign ios-key-remove`