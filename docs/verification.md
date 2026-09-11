# Release verification

Verified locally on 2026-09-11 using Node.js 24.21.0 and Chromium through Playwright 1.63.0.

## Results

- 15 unit tests passed: score calculation, the rulebook's 64 VP example and Turmoil's 67 VP, shared greenery, negative card scores, TR above 100, award scoring, numeric validation, reset, translation coverage and versioned persistence.
- 12 browser tests passed against the built static files under the project subdirectory: input and score updates, both languages, reload persistence, two-player awards, invalid input, reset confirmation, first-visit Polish selection, 360 px layout with 200% text, keyboard controls and dialog focus, unavailable storage, complete and failed offline downloads, reopening offline and a real service worker update preserving the score.
- Desktop and mobile visual inspection used a filled 64 VP example. No uncaught browser errors, failed HTTP responses or mobile horizontal overflow were observed.
- Independent read-only reviews of the implementation, workflow and documentation found no actionable issues.
- The build publishes nine local static assets plus an empty .nojekyll file. No development dependencies, tests or documentation enter the site artifact.

## Deployment verification

Published and verified on 2026-09-11 at [matt-szymczyk.github.io/terraforming-mars-score/](https://matt-szymczyk.github.io/terraforming-mars-score/).

- [GitHub Actions run 34590858518](https://github.com/matt-szymczyk/terraforming-mars-score/actions/runs/34590858518) successfully tested and deployed implementation commit 52fdd7216d7755ebd6656d5333db3d882baa96c7.
- The public URL returned HTTP 200 over valid HTTPS with no redirect to a different domain.
- Chromium verified a fresh Polish visit, zero defaults, the 64/67 VP examples, persistence after reload, and a 360 px layout without horizontal overflow.
- After offline readiness, the public URL reopened without network access, restored 67 VP, switched to English offline, and returned to 64 VP when Turmoil was disabled.
- The active worker scope is exactly the project URL; the published cache version is 10287b2409da84dc.
- No uncaught browser errors or failed HTTP responses were observed during the public-site check.
