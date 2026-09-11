import { calculateScore, parseInteger, resetScore } from './scoring.js';
import { translate } from './i18n.js';
import { loadScore, saveScore } from './storage.js';
import { setupOffline } from './offline.js';

let storage;
try { storage = window.localStorage; } catch { storage = null; }
const loaded = loadScore(storage, navigator.languages);
let state = loaded.state;
let saveStatus = loaded.status;
let offlineStatus = 'loading';
let applyUpdate = () => {};
const drafts = new Map();
const root = document.getElementById('app');
const categories = ['tr', 'greenery', 'cities', 'milestones', 'awards', 'cards', 'turmoil'];
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const t = (key, variables) => translate(state.language, key, variables);
const copy = (key, variables) => escape(t(key, variables));
const bounds = path => ({ min: path === 'cards' ? -Number.MAX_SAFE_INTEGER : 0, max: path === 'milestones' ? 3 : path === 'leaders' || path.startsWith('city-') ? 6 : Number.MAX_SAFE_INTEGER });
const getValue = path => path.startsWith('city-') ? state.cities[Number(path.slice(5))] : state[path];
const setValue = (path, value) => { if (path.startsWith('city-')) state.cities[Number(path.slice(5))] = value; else state[path] = value; };

function counter(path, label) {
  const { min, max } = bounds(path);
  const value = drafts.get(path)?.raw ?? getValue(path);
  return `<div class="counter-block"><div class="counter">
    <button type="button" data-step="-1" data-target="${path}" aria-label="${escape(t('decrease', { label }))}">−</button>
    <input id="${path}" data-number="${path}" type="text" inputmode="numeric" autocomplete="off" spellcheck="false"
      aria-label="${escape(label)}" aria-describedby="${path}-error" value="${escape(value)}" aria-invalid="false">
    <button type="button" data-step="1" data-target="${path}" aria-label="${escape(t('increase', { label }))}">+</button>
    </div><p id="${path}-error" class="field-error" hidden></p></div>`;
}

function section(key, number, help, content, extra = '') {
  return `<section class="score-section ${key}" aria-labelledby="heading-${key}">
    <div class="section-heading"><span class="section-number" aria-hidden="true">${number}</span>
      <h2 id="heading-${key}">${copy(key)}</h2><span class="section-score" data-category="${key}">0</span><span class="point-unit">${copy('vp')}</span></div>
    <p class="help">${copy(help)}</p>${content}${extra}</section>`;
}

function render() {
  const openDetails = Array.from(root.querySelectorAll('details[open]')).map(node => node.id);
  document.documentElement.lang = state.language;
  document.title = t('title');
  root.innerHTML = `
    <a class="skip-link" href="#calculator">${copy('skip')}</a>
    <div class="page-shell">
      <header class="topbar">
        <div class="wordmark"><img src="./favicon.svg" alt="" width="32" height="32"><span>MARS <b>SCORE</b></span></div>
        <nav class="language-switch" aria-label="${copy('language')}">
          <button type="button" data-language="en" lang="en" aria-label="English" aria-pressed="${state.language === 'en'}">EN</button>
          <button type="button" data-language="pl" lang="pl" aria-label="Polski" aria-pressed="${state.language === 'pl'}">PL</button>
        </nav>
      </header>
      <div class="page-heading"><div><p class="eyebrow">${copy('subtitle')}</p><h1>${copy('heading')}</h1></div>
        <button type="button" class="text-button reset-button" data-action="reset"><span aria-hidden="true">↺</span> ${copy('reset')}</button></div>
      <main id="calculator" class="workspace">
        <div class="form-column">
          <section class="game-settings" aria-label="${copy('settings')}">
            <label class="players-label" for="player-count">${copy('players')}<select id="player-count" aria-label="${copy('players')}"><option value="3" ${state.playerCount === 3 ? 'selected' : ''}>${copy('morePlayers')}</option><option value="2" ${state.playerCount === 2 ? 'selected' : ''}>${copy('twoPlayers')}</option></select></label>
            <label class="switch-label"><input id="turmoil-enabled" type="checkbox" ${state.turmoil ? 'checked' : ''}><span class="switch" aria-hidden="true"></span><span>${copy('turmoilToggle')}</span></label>
          </section>
          <div class="scoring-sheet">
            ${section('tr', '01', 'trHelp', counter('tr', t('trLabel')))}
            ${section('greenery', '02', 'greeneryHelp', counter('greenery', t('greeneryLabel')))}
            ${section('cities', '03', 'citiesHelp', `
              <div class="city-list">${state.cities.length ? state.cities.map((value, index) => `<div class="city-row">
                <span class="city-name">${copy('cityNumber', { number: index + 1 })}</span>
                ${counter('city-' + index, t('cityInput', { number: index + 1 }))}
                <button type="button" class="remove-city" data-remove-city="${index}" aria-label="${copy('removeCity', { number: index + 1 })}">×</button>
              </div>`).join('') : `<p class="empty-note">${copy('noCities')}</p>`}</div>
              <button type="button" class="add-city" data-action="add-city"><span aria-hidden="true">+</span> ${copy('addCity')}</button>`)}
            ${section('milestones', '04', 'milestonesHelp', counter('milestones', t('milestonesLabel')))}
            ${section('awards', '05', 'awardsHelp', `<div class="award-list">${state.awards.map((points, index) => `
              <fieldset class="award-row"><legend>${copy('awardNumber', { number: index + 1 })}</legend><div class="award-options">
                ${[[0, 'noAward'], [5, 'first'], [2, 'second']].map(([value, name]) => `<label class="choice ${value === 2 && state.playerCount === 2 ? 'disabled' : ''}">
                  <input type="radio" name="award-${index}" data-award="${index}" value="${value}" ${points === value ? 'checked' : ''} ${value === 2 && state.playerCount === 2 ? 'disabled' : ''}
                    aria-label="${copy('awardChoice', { number: index + 1, place: t(name), points: value })}">
                  <span>${copy(name)}<small>${value} ${copy('vp')}</small></span></label>`).join('')}
              </div></fieldset>`).join('')}</div>
              ${state.playerCount === 2 ? `<p class="info-note">${copy('twoPlayerNote')}</p>` : ''}
              <details id="ties-help" class="inline-help"><summary>${copy('awardTies')}</summary><p>${copy('awardTiesHelp')}</p></details>`)}
            ${section('cards', '06', 'cardsHelp', counter('cards', t('cardsLabel')), `<p class="small-help">${copy('cardsReminder')}</p>`)}
            ${state.turmoil ? section('turmoil', '07', 'turmoilHelp', `<div class="leaders-row"><span>${copy('leadersLabel')}</span>${counter('leaders', t('leadersLabel'))}</div>
              <label class="chairman-label"><input id="chairman" aria-label="${copy('chairmanLabel')}" type="checkbox" ${state.chairman ? 'checked' : ''}>${copy('chairmanLabel')}<span>+1 ${copy('vp')}</span></label>`) : ''}
          </div>
          <details id="expansion-help" class="expansion-help"><summary>${copy('expansions')}<span aria-hidden="true">+</span></summary>
            <div class="expansion-content"><p>${copy('expansionsIntro')}</p>
              ${['Venus', 'Colonies', 'Prelude', 'Maps', 'Promo'].map(name => `<h3>${copy('expansion' + name)}</h3><p>${copy('expansion' + name + 'Help')}</p>`).join('')}
            </div></details>
        </div>
        <aside class="summary-column" aria-labelledby="result-heading">
          <div class="summary-card">
            <p class="eyebrow" id="result-heading">${copy('result')}</p>
            <div class="total-display"><output id="total" aria-label="${copy('result')}" aria-live="polite" aria-atomic="true">0</output><span>${copy('vp')}</span></div>
            <p id="total-error" class="total-error" role="status" hidden></p>
            <div class="breakdown-heading">${copy('breakdown')}</div>
            <dl class="breakdown">${categories.filter(key => key !== 'turmoil' || state.turmoil).map(key => `
              <div class="breakdown-row ${key}"><dt><span class="category-mark" aria-hidden="true"></span>${copy(key)}</dt><dd data-category="${key}">0</dd></div>`).join('')}</dl>
            <p class="save-status" id="save-status" role="status"></p>
          </div>
          <div class="offline-panel"><p id="offline-status" role="status"></p><button id="update-button" type="button" class="text-button" data-action="update" hidden>${copy('update')}</button><p id="update-help" class="small-help" hidden>${copy('updateHelp')}</p></div>
        </aside>
      </main>
      <footer><p>${copy('footer')}</p><div><a href="https://fryxgames.se/wp-content/uploads/2023/04/TMRULESFINAL.pdf" target="_blank" rel="noopener noreferrer">${copy('rules')} ↗</a><a href="https://github.com/matt-szymczyk/terraforming-mars-score" target="_blank" rel="noopener noreferrer">${copy('source')} ↗</a></div></footer>
    </div>
    <div class="mobile-total"><div><span>${copy('result')}</span><strong id="mobile-total">0</strong><span>${copy('vp')}</span></div><a href="#result-heading">${copy('summaryLink')} ↑</a></div>
    <dialog id="reset-dialog" aria-labelledby="reset-title" aria-describedby="reset-description">
      <h2 id="reset-title">${copy('resetTitle')}</h2><p id="reset-description">${copy('resetDescription')}</p>
      <div class="dialog-actions"><button type="button" class="secondary-button" data-action="cancel-reset" autofocus>${copy('cancel')}</button><button type="button" class="primary-button" data-action="confirm-reset">${copy('resetConfirm')}</button></div>
    </dialog>
    <p class="sr-only" id="announcement" role="status"></p>`;
  for (const id of openDetails) { const node = document.getElementById(id); if (node) node.open = true; }
  for (const [path] of drafts) validateField(root.querySelector('[data-number="' + path + '"]'));
  updateOutputs();
  updateStatus();
}

function updateStatus() {
  const saveKey = { saved: 'saved', new: 'saveNew', invalid: 'saveInvalid', unavailable: 'saveUnavailable' }[saveStatus];
  document.getElementById('save-status').textContent = t(saveKey);
  const key = offlineStatus === 'ready' ? (navigator.onLine ? 'offlineReady' : 'offlineActive') : { loading: 'offlineLoading', unavailable: 'offlineUnavailable', updating: 'offlineUpdating' }[offlineStatus];
  document.getElementById('offline-status').textContent = t(key);
  document.getElementById('update-button').hidden = offlineStatus !== 'updating';
  document.getElementById('update-help').hidden = offlineStatus !== 'updating';
}

function persist() {
  saveStatus = saveScore(storage, state) ? 'saved' : 'unavailable';
  updateStatus();
}

function updateOutputs() {
  let score;
  let error = drafts.size ? t('fixInputs') : '';
  try { score = calculateScore(state); } catch { error = t('invalidTotal'); }
  for (const node of root.querySelectorAll('[data-category]')) node.textContent = score?.[node.dataset.category] ?? '—';
  const total = error ? '—' : String(score.total);
  document.getElementById('total').textContent = total;
  document.getElementById('mobile-total').textContent = total;
  const errorNode = document.getElementById('total-error');
  errorNode.hidden = !error;
  errorNode.textContent = error;
}

function validateField(input) {
  if (!input) return false;
  const path = input.dataset.number;
  const limits = bounds(path);
  const value = parseInteger(input.value, limits);
  const error = document.getElementById(path + '-error');
  input.setAttribute('aria-invalid', String(value === null));
  error.hidden = value !== null;
  if (value === null) {
    drafts.set(path, { raw: input.value });
    error.textContent = limits.min < 0 ? t('invalidSigned') : limits.max < Number.MAX_SAFE_INTEGER ? t('invalidRange', { max: limits.max }) : t('invalidInteger');
    return false;
  }
  drafts.delete(path);
  setValue(path, value);
  return true;
}

root.addEventListener('input', event => {
  if (!event.target.matches('[data-number]')) return;
  const valid = validateField(event.target);
  updateOutputs();
  if (valid) persist();
});

root.addEventListener('change', event => {
  const target = event.target;
  if (target.id === 'player-count') {
    state.playerCount = Number(target.value);
    if (state.playerCount === 2) state.awards = state.awards.map(value => value === 2 ? 0 : value);
  } else if (target.id === 'turmoil-enabled') {
    state.turmoil = target.checked;
    if (!state.turmoil) drafts.delete('leaders');
  } else if (target.id === 'chairman') state.chairman = target.checked;
  else if (target.matches('[data-award]')) {
    state.awards[Number(target.dataset.award)] = Number(target.value);
    updateOutputs();
    persist();
    return;
  } else return;
  const focusId = target.id;
  render();
  persist();
  document.getElementById(focusId)?.focus({ preventScroll: true });
});

root.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.language) {
    state.language = button.dataset.language;
    render();
    persist();
    root.querySelector('[data-language="' + state.language + '"]').focus({ preventScroll: true });
    return;
  }
  if (button.dataset.step) {
    const path = button.dataset.target;
    const input = document.getElementById(path);
    const { min, max } = bounds(path);
    const current = parseInteger(input.value, bounds(path));
    if (current === null) { validateField(input); input.focus(); return; }
    input.value = Math.min(max, Math.max(min, current + Number(button.dataset.step)));
    validateField(input);
    updateOutputs();
    persist();
    return;
  }
  if (button.dataset.removeCity !== undefined) {
    const index = Number(button.dataset.removeCity);
    state.cities.splice(index, 1);
    const cityDrafts = [...drafts].filter(([key]) => key.startsWith('city-'));
    for (const [key] of cityDrafts) drafts.delete(key);
    for (const [key, draft] of cityDrafts) {
      const oldIndex = Number(key.slice(5));
      if (oldIndex !== index) drafts.set('city-' + (oldIndex > index ? oldIndex - 1 : oldIndex), draft);
    }
    render(); persist();
    root.querySelector('[data-action="add-city"]').focus({ preventScroll: true });
    return;
  }
  switch (button.dataset.action) {
    case 'add-city':
      state.cities.push(0);
      render(); persist();
      document.getElementById('city-' + (state.cities.length - 1)).focus({ preventScroll: true });
      break;
    case 'reset': document.getElementById('reset-dialog').showModal(); break;
    case 'cancel-reset': document.getElementById('reset-dialog').close(); break;
    case 'confirm-reset':
      state = resetScore(state);
      drafts.clear();
      render(); persist();
      document.getElementById('announcement').textContent = t('resetDone');
      root.querySelector('[data-action="reset"]').focus({ preventScroll: true });
      break;
    case 'update':
      if (drafts.size || !saveScore(storage, state)) {
        saveStatus = 'unavailable';
        updateStatus();
        return;
      }
      applyUpdate();
      break;
  }
});

render();
applyUpdate = setupOffline(status => { offlineStatus = status; updateStatus(); });
window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);

const context = document.modelContext;
if (context?.registerTool) {
  try {
    Promise.resolve(context.registerTool({
      name: 'read_final_score',
      description: 'Read the current Terraforming Mars score breakdown. Reports invalid pending fields without changing the score.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute(input) {
        if (!input || typeof input !== 'object' || Object.keys(input).length) throw new Error('No arguments expected');
        if (drafts.size) return { valid: false };
        return { valid: true, score: calculateScore(state) };
      },
    })).catch(() => {});
  } catch {}
}
