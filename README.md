# Terraforming Mars Score

A mobile-friendly final-score calculator for one player in the classic multiplayer board game. Available in **English and Polish**, with device-local saving and offline access.

Live site: [matt-szymczyk.github.io/terraforming-mars-score/](https://matt-szymczyk.github.io/terraforming-mars-score/).

## Count a score

Finish the final plant conversion, then enter:

- Final terraform rating (TR), before adding end-game victory points.
- Your greenery tiles and adjacent greenery for each of your cities.
- Claimed milestones and your places in funded awards.
- Your combined card score, including negative points, resources, events, corporations, preludes and special bonuses.
- With Turmoil enabled, your party leaders and whether you hold the chairman seat.

The total and category breakdown update immediately. For two players, second-place awards score zero. Friendly ties follow the printed rules: all tied first-place players get 5 VP with no second place; all tied second-place players get 2 VP.

**New count** clears points after confirmation and keeps game settings and language.

## Expansions

Supports final scoring with Venus Next, Colonies, Turmoil, Prelude, Prelude 2, Corporate Era, official promos and Big Box cards, Milestones and Awards, and all official maps: Tharsis, Hellas, Elysium, Utopia Planitia, Terra Cimmeria, Amazonis Planitia and Vastitas Borealis.

Card effects are included through the manually entered card subtotal, not an automatic card database. The expansion help explains where to count each contribution. Solo, Automa, fan expansions, Ares Expedition and The Dice Game are outside the scope.

Rules references:

- [Base game: final scoring, page 12](https://fryxgames.se/wp-content/uploads/2023/04/TMRULESFINAL.pdf)
- [Turmoil: final scoring, page 6](https://fryxgames.se/wp-content/uploads/2023/07/TM_TURMOIL_ENG_RULESi.pdf)
- [Venus Next](https://fryxgames.se/wp-content/uploads/2023/07/TM_VENUS_ENG_RULESi.pdf)
- [Amazonis and Vastitas](https://fryxgames.se/wp-content/uploads/2024/09/TM_AV_WRAP_ENG.pdf)

## Language and local data

The first preferred browser language selects Polish when it starts with `pl`; all other languages use English. The PL/EN buttons remember your explicit choice and keep your current score.

The current valid score and language are saved in `localStorage` under `terraforming-mars-score:v1`. There is no backend, login, analytics or score upload. Clearing browser/site data removes the saved score and offline cache. A storage failure is shown in the interface; counting continues in the open tab.

The service worker reports **Ready to use offline** only after caching every required asset, including both languages. After that, the same URL can reopen without an internet connection while its browser cache is retained. An incomplete cache never reports readiness.

Updates download in the background. The **Update** button activates the new version after saving the current valid score; invalid fields must first be corrected. The worker is scoped to this project directory and does not control other GitHub Pages projects on the same origin.

## Development

Requires Node.js 24 or newer. Production uses only HTML, CSS and JavaScript modules with system fonts; there are no production dependencies.

```sh
npm ci
npm test
npx playwright install --with-deps chromium
npm run test:e2e
npm run dev
```

Open the local URL printed by the server, normally `http://127.0.0.1:4173/terraforming-mars-score/`.

```sh
npm run build
SITE_DIRECTORY=dist npm run test:e2e
SITE_DIRECTORY=dist npm run dev
```

The build copies only `site/` into `dist/`, adds `.nojekyll`, and derives a cache version from the contents of every source asset. The same content produces the same release version; any asset change creates a different version.

Structure:

- `site/scoring.js`: score model, integer validation, calculation and reset.
- `site/i18n.js`: complete English/Polish dictionaries and language selection.
- `site/storage.js`: versioned device-local persistence.
- `site/app.js`: rendering and interaction with the shared state.
- `site/offline.js` and `site/sw.js`: offline lifecycle, caching and updates.
- `scripts/`: local server and deterministic static build.
- `tests/`: scoring/storage unit tests and real Chromium browser tests.

## GitHub Pages

In the repository, select **Settings → Pages → Build and deployment → Source → GitHub Actions**.

The `Test and deploy` workflow runs unit tests, builds the site, and tests the built output in Chromium. It uploads only `dist/`. Publication runs after successful tests on pushes to `main`; pull requests run checks without deploying. The workflow can also be run manually from Actions.

Relative asset URLs support the project subdirectory. GitHub Pages supplies HTTPS. A custom domain inherited from an account site may change the final URL; the deployment environment shows the actual published address.

To roll back, revert the unwanted source commit on `main`. The workflow tests and redeploys the previous content. Existing browsers can apply the available update without losing their locally saved score.
