import test from 'node:test';
import assert from 'node:assert/strict';
import { createScore } from '../site/scoring.js';
import { messages, detectLanguage, translate } from '../site/i18n.js';
import { STORAGE_KEY, loadScore, saveScore } from '../site/storage.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('chooses Polish only when it is the preferred browser language', () => {
  assert.equal(detectLanguage(['pl-PL', 'en']), 'pl');
  assert.equal(detectLanguage(['en-GB', 'pl']), 'en');
  assert.equal(detectLanguage(['de']), 'en');
  assert.equal(detectLanguage([]), 'en');
});
test('both languages provide all copy and interpolate numbered city labels', () => {
  assert.deepEqual(Object.keys(messages.pl).sort(), Object.keys(messages.en).sort());
  assert.equal(translate('en', 'cityNumber', { number: 2 }), 'City 2');
  assert.equal(translate('pl', 'cityNumber', { number: 2 }), 'Miasto 2');
  for (const language of ['en', 'pl']) {
    for (const value of Object.values(messages[language])) assert.ok(typeof value === 'string' && value.trim());
  }
});
test('round trips the current score and remembers language ahead of browser preferences', () => {
  const storage = memoryStorage();
  const state = { ...createScore('en'), tr: 112, cards: -3, cities: [1, 5], turmoil: true, leaders: 2 };
  assert.equal(saveScore(storage, state), true);
  assert.deepEqual(loadScore(storage, ['pl']).state, state);
  assert.equal(loadScore(storage, ['pl']).status, 'saved');
});
test('an empty device starts with the browser language', () => {
  const result = loadScore(memoryStorage(), ['pl-PL']);
  assert.equal(result.state.language, 'pl');
  assert.equal(result.status, 'new');
});
test('recovers from corrupt, unsupported or invalid saved records', () => {
  for (const value of ['{broken', JSON.stringify({ version: 2, state: createScore() }), JSON.stringify({ version: 1, state: { ...createScore(), awards: [99] } }), JSON.stringify({ version: 1, state: { ...createScore(), language: 'xx' } })]) {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, value);
    const result = loadScore(storage, ['pl']);
    assert.equal(result.status, 'invalid');
    assert.equal(result.state.tr, 0);
    assert.equal(result.state.language, 'pl');
  }
});
test('storage failures leave a usable calculator and report failed writes', () => {
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.equal(loadScore(storage, ['en']).status, 'unavailable');
  assert.equal(saveScore(storage, createScore()), false);
});
