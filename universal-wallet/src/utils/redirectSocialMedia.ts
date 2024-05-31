import {InAppBrowser} from 'react-native-inappbrowser-reborn';

const EXPLORER_URL = process.env.LTO_EXPLORER_URL || 'https://explorer.testnet.lto.network';
const WALLET_URL = process.env.LTO_WALLET_URL || 'https://wallet.testnet.lto.network';

export const nagivateTo = async (url: string) => {
  await InAppBrowser.open(url);
};

export const navigateToWebsite = async () => {
  await InAppBrowser.open('https://ltonetwork.com');
};

export const navigateToExplorer = async () => {
  await InAppBrowser.open(EXPLORER_URL);
};

export const navigateToTransaction = async (id: string) => {
  await InAppBrowser.open(`${EXPLORER_URL}/transactions/${id}`);
};

export const navigateToWebWallet = async () => {
  await InAppBrowser.open(WALLET_URL);
};

export const navigateToTwitter = async () => {
  await InAppBrowser.open('https://twitter.com/TheLTONetwork');
};

export const navigateToFacebook = async () => {
  await InAppBrowser.open('https://facebook.com/TheLTONetwork/');
};

export const navigateToTelegram = async () => {
  await InAppBrowser.open('https://t.me/ltonetwork');
};

export const navigateToLinkedin = async () => {
  await InAppBrowser.open('https://linkedin.com/company/ltonetwork/');
};

export const navigateToGithub = async () => {
  await InAppBrowser.open('https://github.com/ltonetwork/');
};
