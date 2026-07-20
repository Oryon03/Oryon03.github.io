import { RAW_DRAWS } from './draws-data.js';

const MIN_NUM = 1;
const MAX_NUM = 40;
const POWERBALL_MIN = 1;
const POWERBALL_MAX = 10;

export function loadDraws() {
  const draws = [];
  for (let i = 0; i < RAW_DRAWS.length; i += 10) {
    const drawNumber = RAW_DRAWS[i];
    const ymd = String(RAW_DRAWS[i + 1]);
    const date = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
    const main = RAW_DRAWS.slice(i + 2, i + 8);
    const bonus = RAW_DRAWS[i + 8];
    const powerballRaw = RAW_DRAWS[i + 9];
    const powerball = powerballRaw === 0 ? null : powerballRaw; // 0 = Powerball didn't exist yet
    draws.push({ drawNumber, date, main, bonus, powerball });
  }
  return draws;
}

function emptyFreqMap(min = MIN_NUM, max = MAX_NUM) {
  const map = new Map();
  for (let n = min; n <= max; n++) map.set(n, 0);
  return map;
}

export function powerballFrequency(draws) {
  const map = emptyFreqMap(POWERBALL_MIN, POWERBALL_MAX);
  for (const d of draws) {
    if (d.powerball !== null) map.set(d.powerball, map.get(d.powerball) + 1);
  }
  return map;
}

export function powerballGapSinceLastSeen(draws) {
  const withPb = draws.filter((d) => d.powerball !== null);
  const gap = new Map();
  for (let n = POWERBALL_MIN; n <= POWERBALL_MAX; n++) gap.set(n, null);
  for (let i = withPb.length - 1; i >= 0; i--) {
    const drawsAgo = withPb.length - 1 - i;
    const n = withPb[i].powerball;
    if (gap.get(n) === null) gap.set(n, drawsAgo);
  }
  return gap;
}

// Frequency of each main-drawn number across a slice of draws.
export function frequency(draws) {
  const map = emptyFreqMap();
  for (const d of draws) {
    for (const n of d.main) map.set(n, map.get(n) + 1);
  }
  return map;
}

export function bonusFrequency(draws) {
  const map = emptyFreqMap();
  for (const d of draws) map.set(d.bonus, map.get(d.bonus) + 1);
  return map;
}

// Draws-since-last-seen for every number, measured from the most recent draw backwards.
export function gapSinceLastSeen(draws) {
  const gap = new Map();
  for (let n = MIN_NUM; n <= MAX_NUM; n++) gap.set(n, null);
  for (let i = draws.length - 1; i >= 0; i--) {
    const drawsAgo = draws.length - 1 - i;
    for (const n of draws[i].main) {
      if (gap.get(n) === null) gap.set(n, drawsAgo);
    }
  }
  return gap;
}

export function pairFrequency(draws) {
  const pairs = new Map();
  for (const d of draws) {
    const nums = [...d.main].sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
  }
  return pairs;
}

export function sumStats(draws) {
  const sums = draws.map((d) => d.main.reduce((a, b) => a + b, 0));
  const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
  const sorted = [...sums].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return { mean, median, min, max, sums };
}

export function oddEvenSplit(draws) {
  const counts = {};
  for (const d of draws) {
    const odd = d.main.filter((n) => n % 2 === 1).length;
    const even = 6 - odd;
    const key = `${odd}-${even}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function highLowSplit(draws) {
  const counts = {};
  for (const d of draws) {
    const low = d.main.filter((n) => n <= 20).length;
    const high = 6 - low;
    const key = `${low}-${high}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function decadeDistribution(draws) {
  const buckets = ['1-10', '11-20', '21-30', '31-40'];
  const totals = { '1-10': 0, '11-20': 0, '21-30': 0, '31-40': 0 };
  for (const d of draws) {
    for (const n of d.main) {
      const idx = Math.min(3, Math.floor((n - 1) / 10));
      totals[buckets[idx]] += 1;
    }
  }
  return totals;
}

export function consecutiveCount(draws) {
  const counts = {};
  for (const d of draws) {
    const sorted = [...d.main].sort((a, b) => a - b);
    let pairs = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) pairs += 1;
    }
    counts[pairs] = (counts[pairs] || 0) + 1;
  }
  return counts;
}

function normalize(map) {
  const values = [...map.values()];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const out = new Map();
  for (const [k, v] of map) out.set(k, (v - min) / range);
  return out;
}

// Blends overall frequency, recent "hot" frequency, and "overdue" gap into one score per number.
// This is a pattern-weighting heuristic, not a statistical forecast: NZ Lotto draws are
// independent random events, so no combination of past results changes future odds.
export function buildScoreModel(draws) {
  const recentWindow = draws.slice(-104); // roughly the last 2 years of draws
  const freqAll = normalize(frequency(draws));
  const freqRecent = normalize(frequency(recentWindow));
  const gaps = gapSinceLastSeen(draws);
  const gapNorm = normalize(gaps);

  const score = new Map();
  for (let n = MIN_NUM; n <= MAX_NUM; n++) {
    const s = freqAll.get(n) * 0.35 + freqRecent.get(n) * 0.35 + gapNorm.get(n) * 0.30;
    score.set(n, s);
  }
  return score;
}

function weightedSampleWithoutReplacement(weightMap, count, rng) {
  const pool = [...weightMap.entries()].map(([num, w]) => ({ num, w: Math.max(w, 0.001) }));
  const picked = [];
  for (let i = 0; i < count && pool.length; i++) {
    const total = pool.reduce((a, e) => a + e.w, 0);
    let r = rng() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      r -= pool[idx].w;
      if (r <= 0) break;
    }
    idx = Math.min(idx, pool.length - 1);
    picked.push(pool[idx].num);
    pool.splice(idx, 1);
  }
  return picked;
}

function mulberry32(seed) {
  let a = seed;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed) {
  return mulberry32(seed ?? Date.now() % 2147483647);
}

// Generates a 6-number set (+ bonus) using the given weight map, gently steering the pick
// back toward the historically typical odd/even and sum range so results still look like
// plausible NZ Lotto draws, without ever guaranteeing anything about the real outcome.
export function generateSet(weightMap, rng, opts = {}) {
  const targetSumRange = opts.sumRange || [90, 150];
  let best = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const picked = weightedSampleWithoutReplacement(weightMap, 6, rng);
    const sum = picked.reduce((a, b) => a + b, 0);
    const inRange = sum >= targetSumRange[0] && sum <= targetSumRange[1];
    if (inRange) { best = picked; break; }
    if (!best) best = picked;
  }
  return best.sort((a, b) => a - b);
}

export function pickBonus(bonusFreqMap, exclude, rng) {
  const candidates = [...bonusFreqMap.entries()].filter(([n]) => !exclude.includes(n));
  return weightedSampleWithoutReplacement(new Map(candidates), 1, rng)[0];
}

// Same all-time/recent/overdue blend as buildScoreModel, applied to the 1-10 Powerball field.
export function buildPowerballScoreModel(draws) {
  const withPb = draws.filter((d) => d.powerball !== null);
  const recentWindow = withPb.slice(-104);
  const freqAll = normalize(powerballFrequency(withPb));
  const freqRecent = normalize(powerballFrequency(recentWindow));
  const gapNorm = normalize(powerballGapSinceLastSeen(withPb));

  const score = new Map();
  for (let n = POWERBALL_MIN; n <= POWERBALL_MAX; n++) {
    const s = freqAll.get(n) * 0.35 + freqRecent.get(n) * 0.35 + gapNorm.get(n) * 0.30;
    score.set(n, s);
  }
  return score;
}

export function pickWeighted(weightMap, rng) {
  return weightedSampleWithoutReplacement(weightMap, 1, rng)[0];
}

export function topN(map, n, desc = true) {
  return [...map.entries()]
    .sort((a, b) => (desc ? b[1] - a[1] : a[1] - b[1]))
    .slice(0, n);
}
