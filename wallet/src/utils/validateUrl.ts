export const sanitizeUrl = (url: string): string | null => {
  const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-z]{2,6})([\/\w .-]*)*\/?$/;

  return urlPattern.test(url) ? url : null;
};
