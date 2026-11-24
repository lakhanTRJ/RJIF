# Live SEO review — 24 November 2026

Scope: public HTTP responses, sitemap URLs, metadata, indexing directives, and browser spot checks. No Search Console, ranking, traffic or Core Web Vitals data was available. HTTP timings below are one request from this workstation, not a performance score.

## Findings

- robots.txt and sitemap.xml return 200; public crawling is allowed and admin responses are noindex.
- 22/22 sitemap URLs return 200.
- 18/22 URLs use the same generic description. Write distinct page descriptions in SEO & publishing.
- 22/22 pages have no og:image; configure page/article share images and Twitter cards.
- 22/22 pages have no JSON-LD. Consider accurate Organization, Event and Article data; do not invent event information or availability.
- Homepage raw HTML contains an old speaker list and the text "Portrait assets are pending an approved WordPress media export." Search engines that use the prerendered HTML can see outdated content. Generate crawler content from current forum settings, speakers and published articles.
- Sitemap includes cart, checkout and my-account utility pages. Review whether these should be noindex and excluded from the sitemap.
- Live favicon.ico returned 404 before this release. This local change adds the supplied PNG and serves both favicon endpoints.
- Canonical values were inspected for all sitemap routes; see table.
- Actual Google indexing and query performance still require the site's Google Search Console property. Browser rendering alone does not establish search ranking.

## URL checks

| Path | HTTP | H1s in initial HTML | Canonical matches | Description |
|---|---:|---:|---|---|
| / | 200 | 1 | Yes | Present |
| /blog/ | 200 | 1 | Yes | Present |
| /business-excellence-awards/ | 200 | 1 | Yes | Present |
| /cart/ | 200 | 1 | Yes | Present |
| /checkout/ | 200 | 1 | Yes | Present |
| /conference-south/ | 200 | 1 | Yes | Present |
| /exhibition-south/ | 200 | 1 | Yes | Present |
| /exhibition/ | 200 | 1 | Yes | Present |
| /felicitation/ | 200 | 1 | Yes | Present |
| /my-account/ | 200 | 1 | Yes | Present |
| /partner/ | 200 | 1 | Yes | Present |
| /previous-edition-highlights-south/ | 200 | 1 | Yes | Present |
| /previous-edition-highlights/ | 200 | 1 | Yes | Present |
| /privacy-policy/ | 200 | 1 | Yes | Present |
| /south-forum-speakers/ | 200 | 1 | Yes | Present |
| /speakers/ | 200 | 1 | Yes | Present |
| /blog/a-new-name-for-a-bigger-idea-md---ceo-awards-become-the-retail-jeweller-business-excellence-awards/ | 200 | 1 | Yes | Present |
| /blog/goodness-deserves-its-moment-of-recognition-too/ | 200 | 1 | Yes | Present |
| /blog/smart-is-the-new-sparkle/ | 200 | 1 | Yes | Present |
| /blog/the-attention-game-how-jewellery-brands-are-finding-new-ways-to-get-noticed/ | 200 | 1 | Yes | Present |
| /blog/the-smile-behind-the-counter-needs-looking-after-too/ | 200 | 1 | Yes | Present |
| /blog/what-the-retail-jeweller-india-forum-gives-back-to-retailers/ | 200 | 1 | Yes | Present |

## Validation limits

Desktop and narrow browser checks cover representative pages and admin workflows. No claim is made about Safari, every browser version, live checkout completion, email delivery, or Google indexing. No live payment, email or WhatsApp message was initiated.

## Browser spot checks

- Chromium desktop homepage: 2027 speaker cards appear after client data loads; no broken loaded images or logged JavaScript errors observed in this check.
- Homepage, South conference, Awards and Blog fit a 390px viewport without horizontal page overflow.
- Homepage has no H1 after React renders, despite an H1 in the initial HTML; align the visible and crawler headings.
- The fixed Delegate Pass button overlaps part of the location text on the narrow homepage viewport. Review its mobile placement.
- Awards shows the closed-registration notice, and Blog renders the article listing.
- Local admin: registration details retains View passes and Email passes; pass, testimonial and gallery editing saves and closes the popup. Cancel discards pass edits. Gallery upload opens in a popup.
- Provided favicon is served as image/png by both local favicon endpoints.
