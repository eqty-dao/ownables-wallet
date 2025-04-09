export const compareVersions = (version1: string, version2: string): number => {
  const v1 = version1.split('.').map(Number);
  const v2 = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
};

export const isVersionGreaterOrEqual = (currentVersion: string, minVersion: string): boolean => {
  return compareVersions(currentVersion, minVersion) >= 0;
}; 