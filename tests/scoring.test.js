import test from 'node:test';
import assert from 'node:assert/strict';
import { createScore, calculateScore, parseInteger, resetScore } from '../site/scoring.js';

const rulebook = () => ({ ...createScore(), tr: 38, greenery: 3, cities: [5], milestones: 1, awards: [5, 0, 0], cards: 8 });

test('starts at zero with multiplayer settings', () => {
  const state = createScore();
  assert.equal(calculateScore(state).total, 0);
  assert.equal(state.playerCount, 3);
  assert.equal(state.turmoil, false);
});
test('reproduces the 64 VP rulebook example', () => {
  assert.deepEqual(calculateScore(rulebook()), { tr: 38, greenery: 3, cities: 5, milestones: 5, awards: 5, cards: 8, turmoil: 0, total: 64 });
});
test('adds leaders and chairman only when Turmoil is enabled', () => {
  const state = { ...rulebook(), turmoil: true, leaders: 2, chairman: true };
  assert.equal(calculateScore(state).total, 67);
  state.turmoil = false;
  assert.equal(calculateScore(state).total, 64);
});
test('counts shared greenery separately for each city', () => {
  assert.equal(calculateScore({ ...createScore(), greenery: 1, cities: [1, 1, 1] }).total, 4);
});
test('supports TR above 100 and subtracts negative card points', () => {
  assert.equal(calculateScore({ ...createScore(), tr: 123, cards: -7 }).total, 116);
});
test('awards use selected places including friendly ties; second place gives zero with two players', () => {
  const state = { ...createScore(), awards: [5, 2, 2] };
  assert.equal(calculateScore(state).awards, 9);
  assert.equal(calculateScore({ ...state, playerCount: 2 }).awards, 5);
});
test('rejects malformed and impossible scores instead of corrupting totals', () => {
  for (const change of [{ tr: -1 }, { tr: NaN }, { tr: 1.5 }, { milestones: 4 }, { leaders: 7 }, { cities: [7] }, { awards: [3, 0, 0] }, { cards: Infinity }]) {
    assert.throws(() => calculateScore({ ...createScore(), ...change }), RangeError);
  }
  assert.throws(() => calculateScore({ ...createScore(), tr: Number.MAX_SAFE_INTEGER, cards: 1 }), RangeError);
});
test('validates complete integers without truncating decimals or interpreting exponent notation', () => {
  for (const [value, options, expected] of [['', {}, 0], ['123', {}, 123], ['-4', { min: -Infinity }, -4], ['2.5', {}, null], ['1e3', {}, null], ['-1', {}, null], ['3abc', {}, null], ['7', { max: 6 }, null], ['9007199254740992', {}, null]]) {
    assert.equal(parseInteger(value, options), expected, value);
  }
});
test('reset keeps game settings and language, clears every scoring category', () => {
  const state = { ...rulebook(), language: 'pl', playerCount: 2, turmoil: true, leaders: 3, chairman: true };
  const fresh = resetScore(state);
  assert.equal(fresh.language, 'pl');
  assert.equal(fresh.playerCount, 2);
  assert.equal(fresh.turmoil, true);
  assert.equal(fresh.chairman, false);
  assert.equal(calculateScore(fresh).total, 0);
  assert.deepEqual(fresh.cities, []);
});
