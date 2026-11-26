import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createMetaPageTracker } from '../metaPixel.js';

const trackPage = createMetaPageTracker(window, document);

export default function MetaPixel() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    trackPage();
  }, [pathname, search]);
  return null;
}
