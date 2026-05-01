export const stripEmptyKeys = <T extends object>(obj: T): T => {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    if (val !== undefined) {
      return { ...acc, [key]: val };
    }

    return acc;
  }, {} as T);
};
