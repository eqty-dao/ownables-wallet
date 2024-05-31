export const formatDate = (date: Date | number): string => {
  if (!(date instanceof Date)) date = new Date(date);
  return Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};
