export const META_PIXEL_ID = '2860794577441096';

export function canTrackMetaPage(url) {
  if (!['retailjewellerindiaforum.com', 'www.retailjewellerindiaforum.com'].includes(url.hostname))
    return false;
  if (/^\/(?:admin|my-account|delegate-pass)(?:\/|$)/.test(url.pathname)) return false;
  // Private invitation/order links must not be sent to the advertising service.
  return [...url.searchParams.keys()].every((key) => /^(?:utm_[a-z_]+|fbclid|gclid|pass)$/.test(key));
}

export function createMetaPageTracker(win, doc) {
  let initialized = false;
  let lastPath = null;
  return function trackPage() {
    const url = new URL(win.location.href);
    if (!canTrackMetaPage(url)) {
      lastPath = null;
      return;
    }
    if (lastPath === url.pathname) return;
    if (!initialized) {
      if (!win.fbq) {
        const fbq = function (...args) {
          if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
          else fbq.queue.push(args);
        };
        fbq.push = fbq;
        fbq.loaded = true;
        fbq.version = '2.0';
        fbq.queue = [];
        win.fbq = fbq;
        if (!win._fbq) win._fbq = fbq;
        const script = doc.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        doc.head.appendChild(script);
      }
      win.fbq.disablePushState = true;
      win.fbq('set', 'autoConfig', false, META_PIXEL_ID);
      win.fbq('init', META_PIXEL_ID);
      initialized = true;
    }
    win.fbq('track', 'PageView');
    lastPath = url.pathname;
  };
}
