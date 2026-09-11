export function createScore(language = 'en') {
  return { language, playerCount: 3, turmoil: false, tr: 0, greenery: 0, cities: [], milestones: 0, awards: [0, 0, 0], cards: 0, leaders: 0, chairman: false };
}

export function parseInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const text = String(value).trim();
  if (text !== '' && !/^-?\d+$/.test(text)) return null;
  const number = text === '' ? 0 : Number(text);
  return Number.isSafeInteger(number) && number >= min && number <= max ? number : null;
}

function integer(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new RangeError('Invalid score value');
  return value;
}

export function calculateScore(state) {
  if (![2, 3].includes(state.playerCount) || typeof state.turmoil !== 'boolean' || typeof state.chairman !== 'boolean') throw new RangeError('Invalid game settings');
  if (!Array.isArray(state.cities) || !Array.isArray(state.awards) || state.awards.length !== 3) throw new RangeError('Invalid scoring list');
  integer(state.leaders, 0, 6);
  const scores = {
    tr: integer(state.tr),
    greenery: integer(state.greenery),
    cities: state.cities.reduce((total, count) => total + integer(count, 0, 6), 0),
    milestones: integer(state.milestones, 0, 3) * 5,
    awards: state.awards.reduce((total, points) => {
      if (![0, 2, 5].includes(points)) throw new RangeError('Invalid award place');
      return total + (state.playerCount === 2 && points === 2 ? 0 : points);
    }, 0),
    cards: integer(state.cards, -Number.MAX_SAFE_INTEGER),
    turmoil: state.turmoil ? state.leaders + Number(state.chairman) : 0,
  };
  const total = Object.values(scores).reduce((sum, points) => sum + points, 0);
  integer(total, -Number.MAX_SAFE_INTEGER);
  return { ...scores, total };
}

export function resetScore(state) {
  return { ...createScore(state.language), playerCount: state.playerCount, turmoil: state.turmoil };
}
