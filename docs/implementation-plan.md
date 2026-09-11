# Terraforming Mars Score implementation plan

## Approved specification

A static, mobile-friendly calculator for one player's final score in the classic multiplayer game. Use plain HTML, CSS and JavaScript modules. Code, identifiers, comments and documentation are English; the complete interface is English and Polish. Public repository: matt-szymczyk/terraforming-mars-score. Deploy tested static assets to GitHub Pages from main.

Count final TR (including over 100), owned greenery, adjacent greenery for each owned city, claimed milestones (5 VP), three funded awards (0/2/5 VP), a manually entered signed card subtotal, and optionally Turmoil party leaders and chairman (1 VP each). In a two-player game, second place scores zero. Explain friendly award ties and no second place after a first-place tie. All official multiplayer expansions, maps and promos use the relevant scoring categories; exclude solo, fan expansions and standalone games.

Default to zero scores, 3–5 players, Turmoil off. Reset requires confirmation and retains game settings and language. Choose Polish if the preferred browser language is Polish, otherwise English; remember manual choice. Persist one current score locally. Offline readiness is reported only after all local resources, including both languages, have been cached. Worker scope and asset paths must work in the Pages project subdirectory. Updates must preserve scores.

## Implementation checklist

- [x] Score model and validation: `site/scoring.js`, independent fixtures in `tests/scoring.test.js`; verify the rulebook's 64 VP, Turmoil's 67 VP, negative cards, awards, limits and settings-preserving reset.
- [x] Local state and translations: `site/storage.js`, `site/i18n.js`, tests for round trips, unavailable/corrupt storage, language selection and complete translations.
- [x] Accessible calculator: `site/index.html`, `site/app.js`, `site/style.css`; browser tests for scoring, language, confirmation, invalid input and mobile layouts.
- [x] Offline and release: `site/offline.js`, `site/sw.js`, `scripts/build.js`; browser tests for successful and failed caching, reopening offline and updates that preserve scores.
- [x] Documentation, GitHub Actions, independent review and a complete fresh test run.
- [ ] Public deployment and verification of the live HTTPS address. Repository setup is complete; the first deployment is in progress.

## Verification

Node's test runner for domain behavior; Playwright for actual browser behavior. CI runs both before deploying. Production contains no dependencies, remote fonts, backend or personal score data. Development dependencies stay outside the published artifact.

## Execution notes

The user explicitly approved this specification and requested implementation and publication. This new repository is isolated from existing server projects; no worktree over an unrelated repository is needed. Sites design guidance applies; the explicitly requested GitHub Pages hosting takes precedence over the default Sites hosting flow. The site owner implements source files; independent agents may research or review without editing the site.
