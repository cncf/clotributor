import { isUndefined } from 'lodash';

const removeLastDot = (str: string): string => {
  if (isUndefined(str)) return '';
  const trimmedStr = str.trim();
  if (trimmedStr.endsWith('.')) {
    return trimmedStr.slice(0, -1);
  } else {
    return str;
  }
};

export default removeLastDot;
