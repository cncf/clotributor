export const getMetaTag = (name: string, isTrue?: boolean): any => {
  const value = document.querySelector(`meta[name='clo:${name}']`)
    ? document.querySelector(`meta[name='clo:${name}']`)!.getAttribute('content')
    : null;
  if (isTrue) {
    return value === 'true';
  } else {
    return value;
  }
};
