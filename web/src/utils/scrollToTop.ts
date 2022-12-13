import browserDetect from './browserDetect';

const scrollToTop = (): void => {
  const isSafari = browserDetect.isSafari();
  window.scrollTo({
    top: 0,
    // @ts-ignore: Unreachable code error
    behavior: isSafari ? 'instant' : 'auto',
  });
};

export default scrollToTop;
