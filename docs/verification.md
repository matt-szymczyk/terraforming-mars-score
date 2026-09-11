# Release verification

Verified locally on 2026-09-11 using Node.js 24.21.0 and Chromium through Playwright 1.63.0.

## Results

- 15 unit tests passed: score calculation, the rulebook's 64 VP example and Turmoil's 67 VP, shared greenery, negative card scores, TR above 100, award scoring, numeric validation, reset, translation coverage and versioned persistence.
- 12 browser tests passed against the built static files under the project subdirectory: input and score updates, both languages, reload persistence, two-player awards, invalid input, reset confirmation, first-visit Polish selection, 360 px layout with 200% text, keyboard controls and dialog focus, unavailable storage, complete and failed offline downloads, reopening offline and a real service worker update preserving the score.
- Desktop and mobile visual inspection used a filled 64 VP example. No uncaught browser errors, failed HTTP responses or mobile horizontal overflow were observed.
- Independent read-only reviews of the implementation, workflow and documentation found no actionable issues.
- The build publishes nine local static assets plus an empty .nojekyll file. No development dependencies, tests or documentation enter the site artifact.

## Deployment status

The owner initialized the public repository and enabled GitHub Actions as the Pages source on 2026-09-11. The prepared implementation is ready for its first workflow run. Public HTTPS, asset loading, offline readiness and the actual deployment URL still need live verification after that run.
