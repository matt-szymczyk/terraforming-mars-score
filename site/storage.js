import { createScore, calculateScore } from './scoring.js';
import { detectLanguage } from './i18n.js';

export const STORAGE_KEY = 'terraforming-mars-score:v1';

export function loadScore(storage, languages = []) {
  const fallback = createScore(detectLanguage(languages));
  let raw;
  try { raw = storage.getItem(STORAGE_KEY); }
  catch { return { state: fallback, status: 'unavailable' }; }
  if (!raw) return { state: fallback, status: 'new' };
  try {
    const record = JSON.parse(raw);
    if (record.version !== 1 || !['en', 'pl'].includes(record.state?.language)) throw new Error('Unsupported record');
    calculateScore(record.state);
    const state = Object.fromEntries(Object.keys(fallback).map(key => [key, record.state[key]]));
    return { state, status: 'saved' };
  } catch { return { state: fallback, status: 'invalid' }; }
}

export function saveScore(storage, state) {
  try {
    calculateScore(state);
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state }));
    return true;
  } catch { return false; }
}
