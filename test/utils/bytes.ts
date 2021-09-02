import { formatBytes32String } from '@ethersproject/strings';

export const formatBytesString = (str: string) => {
  return formatBytes32String(str).slice(0, 2 + str.length * 2);
};
