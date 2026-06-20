const ADJECTIVES = [
  'amber', 'azure', 'bold', 'brave', 'bright', 'calm', 'cool', 'crisp',
  'daring', 'dawn', 'dusk', 'eager', 'fast', 'fierce', 'free', 'fresh',
  'gold', 'grand', 'green', 'happy', 'keen', 'kind', 'lush', 'mighty',
  'noble', 'quick', 'quiet', 'rapid', 'sharp', 'silver', 'sleek', 'smart',
  'solar', 'stark', 'steady', 'still', 'sunny', 'swift', 'tall', 'warm',
  'wild', 'wise', 'witty', 'zesty',
];

const NOUNS = [
  'arrow', 'atlas', 'bear', 'bolt', 'brook', 'cedar', 'cloud', 'coast',
  'comet', 'coral', 'creek', 'crown', 'dawn', 'delta', 'drift', 'dune',
  'eagle', 'ember', 'falcon', 'field', 'flare', 'flame', 'flash', 'fleet',
  'forge', 'frost', 'grove', 'hawk', 'haven', 'island', 'lake', 'lark',
  'lotus', 'maple', 'mesa', 'moon', 'ocean', 'orbit', 'otter', 'peak',
  'petal', 'pine', 'prism', 'river', 'ridge', 'robin', 'rune', 'sage',
  'shore', 'spark', 'stone', 'storm', 'summit', 'tide', 'torch', 'trail',
  'vale', 'vapor', 'vine', 'vista', 'wave', 'wind', 'wolf', 'zenith',
];

export function generateRoomId() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}`;
}

export function isValidRoomId(id) {
  if (typeof id !== 'string') return false;
  const parts = id.trim().toLowerCase().split('-');
  return parts.length === 2 && parts[0].length > 1 && parts[1].length > 1;
}

export function normalizeRoomId(id) {
  return (id || '').trim().toLowerCase().replace(/\s+/g, '-');
}
