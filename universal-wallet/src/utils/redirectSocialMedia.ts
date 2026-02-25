import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {LTO_EXPLORER_URL, LTO_WALLET_URL} from '@env';
//F-2024-4584 - Insecure URL Handling in navigateToWebsite
import {sanitizeUrl} from './validateUrl';
import LTOService from '../services/LTO.service';

const EXPLORER_URL = LTO_EXPLORER_URL || 'https://explorer.lto.network';
const WALLET_URL = LTO_WALLET_URL || 'https://wallet.lto.network';

export const navigateTo = async (url: string) => {
  const sanitized = sanitizeUrl(url);
  if (sanitized) {
    await InAppBrowser.open(sanitized);
  } else {
    console.error('Invalid URL:', url);
  }
};

export const navigateToWebsite = async () => {
  const sanitized = sanitizeUrl('https://ltonetwork.com');
  if (sanitized) {
    await InAppBrowser.open(sanitized);
  }
};

export const navigateToExplorer = async () => {
  const explorerUrl = LTOService.getExplorerBaseUrl();
  if (explorerUrl) {
    await InAppBrowser.open(explorerUrl);
  }
};

export const navigateToTransaction = async (id: string) => {
  const transactionUrl = sanitizeUrl(LTOService.getExplorerTxUrl(id));
  if (transactionUrl) {
    await InAppBrowser.open(transactionUrl);
  }
};

export const navigateToWebWallet = async () => {
  if (WALLET_URL) {
    await InAppBrowser.open(WALLET_URL);
  }
};

export const navigateToTwitter = async () => {
  const sanitized = sanitizeUrl('https://twitter.com/TheLTONetwork');
  if (sanitized) {
    await InAppBrowser.open(sanitized);
  }
};

export const navigateToFacebook = async () => {
  const sanitized = sanitizeUrl('https://facebook.com/TheLTONetwork/');
  if (sanitized) {
    await InAppBrowser.open(sanitized);
  }
};

export const navigateToTelegram = async () => {
  const sanitized = sanitizeUrl('https://t.me/ltonetwork');
  if (sanitized) {
    await InAppBrowser.open(sanitized);
  }
};

export const navigateToLinkedin = async () => {
  const sanitized = sanitizeUrl('https://linkedin.com/company/ltonetwork/');
  if (sanitized) {
    await InAppBrowser.open(sanitized);
  }
};

export const navigateToGithub = async () => {
  const sanitized = sanitizeUrl('https://github.com/ltonetwork/');
  if (sanitized) {
    await InAppBrowser.open(sanitized);
  }
};
