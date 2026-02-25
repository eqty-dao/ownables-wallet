export const ONBOARDING = {
  HEADER_LEFT: 'More info',
  HEADER_RIGHT: 'Next',
  FIRST_SCREEN: {
    TITLE: 'First screen title',
    SUBTITLE: 'LTO Network is a hybrid blockchain for securing, verifying and exchanging business critical information',
  },
  SECOND_SCREEN: {
    TITLE: 'Second screen title',
    SUBTITLE:
      'Use the LTO Universal wallet to store your coins and complete transactions quickly and easy from your mobile phone',
  },
  BUTTON: 'Start',
};

export const SIGNUP = {
  TITLE: 'Sign Up',
  SUBTITLE: 'Create an account or import one with your recovery phrase',
  BUTTON_CREATE: 'Create new account',
  BUTTON_IMPORT: 'Import account with your recovery phrase',
};

export const SIGNIN = {
  TITLE: 'Sign in',
  SUBTITLE: 'Sign in with your account name and password',
  INPUT_NICKNAME: {
    LABEL: 'Nickname',
  },
  INPUT_PASSWORD: {
    LABEL: 'Wallet password',
    PLACEHOLDER: 'Type your password',
  },
  BUTTON_SIGNIN: 'Sign in',
  BUTTON_BIOMETRICS: 'Use biometrics',
};

export const IMPORT_WITHSEEDS = {
  IMPORT_TITLE: 'Import Account',
  INPUT_SEEDPHRASE: {
    LABEL: 'Your recovery phrase',
    PLACEHOLDER: 'Type your recovery phrase separated by a space',
  },
  BUTTON_IMPORT: 'Import account',
};

export const REGISTER = {
  CREATE_TITLE: 'Create Account',
  CREATE_SUBTITLE: 'Create an account or import one with your recovery phrase',
  IMPORT_TITLE: 'Import Account',
  INPUT_ADDRESS: 'Wallet address',
  INPUT_NICKNAME: {
    LABEL: 'Nickname',
    PLACEHOLDER: 'Enter your nickname',
  },
  INPUT_PASSWORD: {
    LABEL: 'Password',
    PLACEHOLDER: 'Set your password',
  },
  INPUT_PASSWORD_REPEAT: {
    LABEL: 'Confirm Password',
    PLACEHOLDER: 'Confirm your password',
  },

  CHECKBOX: 'Accept terms and conditions',
  BUTTON_CREATE: 'Create new account',
  BUTTON_IMPORT: 'Import account',
  MODAL_TITLE: 'TERMS AND CONDITIONS',
  BUTTON_MODAL: 'I agree',
  BIOMETRICS_CONFIRMATION:
    'Would you like to enable biometric authentication for this app?\n\nThis feature allows you to use the available biometric technology such as Face ID, Fingerprint, or Iris to access your account securely and conveniently, without having to enter your password each time. By enabling biometric authentication, you agree to our Privacy Policy and Terms of Service.\n\n Would you like to proceed?',
  DIALOG_TITLE: 'Biometric authentication',
  DIALOG_CANCEL_BUTTON: 'No, continue',
  DIALOG_CONTINUE_BUTTON: 'Enable biometric auth',
};

export const TERMS_AND_CONDITIONS_CONTENT = [
  {
    text: "These terms and conditions outline the rules and regulations for the use of Company Name's Website, located at Website.com.",
  },
  {
    text: 'By accessing this website we assume you accept these terms and conditions. Do not continue to use Website Name if you do not agree to take all of the terms and conditions stated on this page.',
  },
  {text: 'Cookies', heading: true},
  {
    text: "We employ the use of cookies. By accessing Website Name, you agreed to use cookies in agreement with the Company Name's Privacy Policy.",
  },
  {text: 'License', heading: true},
  {
    text: 'Unless otherwise stated, Company Name and/or its licensors own the intellectual property rights for all material on Website Name. All intellectual property rights are reserved. You may access this from Website Name for your own personal use subjected to restrictions set in these terms and conditions.',
  },
  {
    text: 'You must not reproduce, duplicate or copy material from Website Name (including without limitation any of its design templates, source code, images, photographs, icons, trademarks and other proprietary material) that is marked as confidential and/or proprietary. You must not reproduce, duplicate or copy in any form any of the content of Website Name.',
  },
];

export const TAB_NAVIGATOR = {
  WALLET: 'Wallet',
  CREDENTIALS: 'Credentials',
  OWNABLES: 'Ownables',
};

export const WALLET = {
  REGULAR: 'Balance',
  PRICE: 'Price',
  LEASING: 'Leasing',
  AVAILABLE: 'Available',
  EFFECTIVE: 'Effective',
  UNBONDING: 'Unbonding',
  LTO: 'ETH',
  EQUIVALENT: 'Equivalent to',
  DOLLAR_SYMBOL: '$',
  ACTIVE_LEASES: 'Active Leases',
  RECENT_ACTIVITY: 'Recent Activity',
  MORE: 'More',
  TRANSACTIONS: 'Transactions',
  TRANSFER: 'Transfer',
  LEASE: 'Lease',
};

export const CREDENTIALS = {
  MAINTITLE: 'Credentials',
  TITLE: 'This feature will soon be available',
  SUBTITLE: 'Follow us on our social networks to stay up to date with the latest news about the application',
};

export const OWNABLES = {
  MAINTITLE: 'Ownables',
  TITLE: 'This feature will soon be available',
  SUBTITLE: 'Follow us on our social networks to stay up to date with the latest news about the application',
};

export const QR_READER = {
  TITLE: 'QR Scanner',
  SUBTITLE: "Scan the QR code from LTO's web application to log in to your account or confirm your transactions",
  DENIED: 'Permission for the camera are needed!',
};

export const MODAL_SCREEN = {
  CARD_TITLE: 'Your wallet',
};

export const PROFILE = {
  TITLE: 'My Account',
  NICKNAME: 'Account Name',
  WALLET: 'Wallet Address',
  PUBLIC_KEY: 'Public Key',
  PRIVATE_KEY: 'Private Key',
  PHRASE: 'Backup Recovery Phrase',
  DISCOVER_PRIVATEKEY: 'Show private key',
  DISCOVER_PHRASE: 'Show backup phrase',
  DELETE_ACCOUNT: 'Remove Account',
  DELETE_ACCOUNT_LABEL: 'Delete Account',
  DELETE_ACCOUNT_MESSAGE:
    "You're about to delete your account. This action is irreversible and may result in a loss of funds.",
  DELETE_ACCOUNT_MESSAGE_2: 'Make sure you have a backup of your recovery phrase before proceeding.',
};

export const LOCKED_SCREEN = {
  TITLE: 'ACCOUNT LOCKED!',
  SUBTITLE: 'Enter your wallet password to continue',
  INPUT_PASSWORD: {
    LABEL: 'Wallet password',
    PLACEHOLDER: 'Type your password',
  },
  BUTTON: 'Unlock',
};
