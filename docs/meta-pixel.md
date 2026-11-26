# Meta Pixel

Pixel ID: `2860794577441096`.

The public React app initializes the standard Meta Pixel queue and sends one PageView per pathname navigation. Automatic history tracking is disabled to avoid duplicate events. Hash navigation does not create another PageView. Automatic configuration is disabled; no customer fields or purchase events are added.

Tracking runs only on `retailjewellerindiaforum.com` and its `www` hostname. Local/staging hosts, admin/account/pass pages, and links with private query parameters are excluded. Public marketing parameters and the checkout pass selector are allowed. Production public HTML includes the supplied noscript fallback.

## Production Apache requirement

The production response currently overrides the application's Content Security Policy in `/etc/apache2/sites-available/retailjewellerindiaforum.com.conf`. At deployment, add these sources to that site's existing policy:

- `script-src`: `https://connect.facebook.net`
- `connect-src`: `https://connect.facebook.net https://www.facebook.com`
- `img-src`: `https://www.facebook.com`

Keep the existing sources and all other directives. Back up the Forum virtual-host file, run `apache2ctl configtest`, then reload Apache. Do not change the global Gemgold policy. The application policy already includes these additions, but both layers must allow them.

## Verification

Regression tests use a fake browser queue and do not send events to Meta. After deployment and the Apache policy update, use Meta Events Manager's Test Events to verify the PageView for this Pixel ID on a public page. Verify navigation to Blog produces one new PageView and an anchor click does not. Browser ad blockers can prevent Pixel delivery.
