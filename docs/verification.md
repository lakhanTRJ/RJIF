# Verification results

Run on 1 October 2026.

| Check | Result |
| --- | --- |
| `npm run build` | Passed: Vite 6.4.3, 58 modules, production assets emitted |
| `npm run lint` | Passed for client and server with no warnings |
| `npm test` | Passed: 2/2 metadata/HTML-safety tests |
| `npm audit --omit=dev` | Passed: 0 known vulnerabilities |
| MySQL migrations and persistence | Passed against local XAMPP database `rjif_local`; migrations 001–003 and seed import completed |
| Live content API | Passed: India 19 featured/136 total speakers, South 17 featured/60 total speakers, five agenda items per forum, and migrated galleries |
| Admin authentication guard | Passed: unauthenticated `/admin/speakers` redirects to `/admin/login`; account login awaits owner-created private credentials |
| Reference routes without MySQL | Passed: bundled reference pages render without making the public page API request |
| Mobile route sweep at 390 × 844 | Passed on the original 8 routes plus Partner, Felicitation, Policy, South variants, and Checkout; no horizontal document overflow |
| Broken assets | Approved speaker assets are imported; any failed image still falls back to neutral initials instead of stock media |
| Desktop visual comparison | Completed for home, exhibition, awards, South Conference, South Exhibition, Partner, Felicitation, and Policy against supplied captures |
| Mobile visual comparison | Completed structurally against supplied captures at 390px; exact pixel parity is not claimed |
| Payment/email | Correctly not exercised; no verified production/sandbox configuration supplied |

The reference stylesheet switches to the observed mobile layout at 760px. Local checks verified looping muted YouTube hero/video embeds, animated counters, forum logo switching, current speaker portraits, agenda, 4/3 pass layouts, gallery routing, and the shared footer. Remaining differences include exact text wrapping, some crop positions, carousel motion, and the unverified commerce flow.
