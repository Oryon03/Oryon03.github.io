import { clamp, randInt, randFloat, choice, shuffle } from './utils.js';
import { overall, changeAttr } from './state.js';
import { COLLEGES, NBA_TEAMS, ATTRS } from './data.js';

export function trainAttribute(state, key, intensity = 1) {
  const p = state.player;
  const cur = p.attrs[key];
  const pot = p.potential[key];
  const room = Math.max(pot - cur, 0);
  if (room <= 0) {
    return 0;
  }
  const ageFactor = p.age <= 22 ? 1 : p.age <= 27 ? 0.75 : p.age <= 31 ? 0.5 : 0.25;
  const raw = (2 + Math.random() * 3.5) * intensity * ageFactor;
  const gain = Math.max(1, Math.round(Math.min(raw, room)));
  changeAttr(state, key, gain);
  return gain;
}

export function applyAgingDecline(state) {
  const p = state.player;
  if (p.age < 30) return null;
  const declineChance = clamp((p.age - 29) * 0.12, 0, 0.9);
  if (Math.random() > declineChance) return null;
  const hit = choice(['ath', 'reb', 'def']);
  const amount = -randInt(1, 3);
  changeAttr(state, hit, amount);
  return { key: hit, amount };
}

function positionMultipliers(position) {
  const table = {
    PG: { reb: 0.65, ast: 1.5, blk: 0.4, stl: 1.2 },
    SG: { reb: 0.75, ast: 1.05, blk: 0.5, stl: 1.1 },
    SF: { reb: 0.95, ast: 0.9, blk: 0.7, stl: 1.0 },
    PF: { reb: 1.25, ast: 0.7, blk: 1.15, stl: 0.85 },
    C: { reb: 1.5, ast: 0.55, blk: 1.5, stl: 0.7 },
  };
  return table[position] || table.SF;
}

export function teamQuality(state) {
  const { league } = state.meta;
  if (league === 'college') {
    const c = state.player.college;
    return c ? c.prestige * 16 + randFloat(-8, 8) : 40 + randFloat(-10, 10);
  }
  const t = state.player.nbaTeam;
  return t ? t.market * 12 + randFloat(-15, 15) + 20 : 40 + randFloat(-15, 15);
}

export function simulateSeason(state) {
  const p = state.player;
  const league = state.meta.league;
  const ov = overall(p.attrs);
  const mult = positionMultipliers(p.position);
  const games = league === 'college' ? randInt(29, 34) : randInt(70, 82);

  const usage = clamp(0.35 + ov / 160 + (state.meta.year - 1) * 0.03, 0.35, 0.95);
  const healthFactor = clamp(p.health / 100, 0.5, 1);
  const energyFactor = clamp(p.energy / 100, 0.6, 1);
  const form = healthFactor * energyFactor;

  const scoreSkill = p.attrs.sht * 0.5 + p.attrs.plm * 0.2 + p.attrs.ath * 0.2 + p.attrs.iq * 0.1;
  let ppg = (2 + (scoreSkill / 99) * (league === 'college' ? 26 : 30)) * usage * form;
  ppg *= randFloat(0.9, 1.1);

  const rebSkill = p.attrs.reb * 0.6 + p.attrs.ath * 0.3 + p.attrs.iq * 0.1;
  let rpg = (0.8 + (rebSkill / 99) * 11) * mult.reb * form;
  rpg *= randFloat(0.9, 1.1);

  const astSkill = p.attrs.plm * 0.7 + p.attrs.iq * 0.3;
  let apg = (0.4 + (astSkill / 99) * 9) * mult.ast * form;
  apg *= randFloat(0.85, 1.15);

  const stlSkill = p.attrs.def * 0.6 + p.attrs.ath * 0.4;
  let spg = (0.2 + (stlSkill / 99) * 2.4) * mult.stl * form;

  const blkSkill = p.attrs.def * 0.5 + p.attrs.ath * 0.3 + p.attrs.reb * 0.2;
  let bpg = (0.1 + (blkSkill / 99) * 2.8) * mult.blk * form;

  const fgSkill = p.attrs.sht * 0.6 + p.attrs.iq * 0.4;
  let fgPct = 0.38 + (fgSkill / 99) * 0.2;
  if (['C', 'PF'].includes(p.position)) fgPct += 0.03;
  fgPct = clamp(fgPct + randFloat(-0.03, 0.03), 0.32, 0.65);

  const teamQ = teamQuality(state);
  const playerBoost = (ov - 50) / 3.2;
  let winPct = clamp(0.5 + (teamQ - 50) / 130 + playerBoost / 100 + randFloat(-0.08, 0.08), 0.08, 0.92);
  const wins = Math.round(games * winPct);
  const losses = games - wins;

  let playoffResult = null;
  if (league === 'college') {
    if (winPct > 0.5 && Math.random() < clamp(winPct, 0, 0.95)) {
      const rounds = ['Round of 64', 'Round of 32', 'Sweet 16', 'Elite Eight', 'Final Four', 'National Champion'];
      let idx = 0;
      while (idx < rounds.length - 1 && Math.random() < clamp(0.35 + playerBoost / 60, 0.15, 0.75)) {
        idx++;
      }
      playoffResult = rounds[idx];
    } else {
      playoffResult = 'Missed Tournament';
    }
  } else {
    if (winPct > 0.42 && Math.random() < clamp(winPct + 0.15, 0, 0.95)) {
      const rounds = ['First Round Exit', 'Second Round Exit', 'Conference Finals Exit', 'NBA Finals Loss', 'NBA Champion'];
      let idx = 0;
      while (idx < rounds.length - 1 && Math.random() < clamp(0.3 + playerBoost / 70, 0.1, 0.7)) {
        idx++;
      }
      playoffResult = rounds[idx];
    } else {
      playoffResult = 'Missed Playoffs';
    }
  }

  const stats = {
    year: state.meta.year,
    calendarYear: state.meta.calendarYear,
    league,
    team: league === 'college' ? p.college?.name : p.nbaTeam?.name,
    games,
    wins,
    losses,
    ppg: round1(ppg),
    rpg: round1(rpg),
    apg: round1(apg),
    spg: round1(spg),
    bpg: round1(bpg),
    fgPct: round1(fgPct * 100),
    overall: ov,
    playoffResult,
  };

  state.player.careerStats[league].push(stats);
  return stats;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

export function rollInjury(state) {
  const p = state.player;
  const durability = 100 - (p.age > 28 ? (p.age - 28) * 4 : 0);
  const baseChance = clamp(0.1 - p.attrs.ath / 1400 + (100 - durability) / 400, 0.03, 0.35);
  if (Math.random() > baseChance) return null;
  const severities = [
    { name: 'Sprained Ankle', weeksOut: randInt(1, 3), sev: 1 },
    { name: 'Jammed Finger', weeksOut: randInt(1, 2), sev: 1 },
    { name: 'Knee Soreness', weeksOut: randInt(2, 5), sev: 2 },
    { name: 'Hamstring Strain', weeksOut: randInt(2, 6), sev: 2 },
    { name: 'Torn ACL', weeksOut: randInt(30, 45), sev: 4 },
    { name: 'Stress Fracture', weeksOut: randInt(8, 16), sev: 3 },
  ];
  const weights = [30, 25, 18, 15, 3, 9];
  let r = Math.random() * 100;
  let idx = 0;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) { idx = i; break; }
    r -= weights[i];
  }
  const injury = severities[idx];
  p.health = clamp(p.health - injury.sev * 12, 20, 100);
  return injury;
}

export function evaluateAwards(state, stats) {
  const p = state.player;
  const awards = [];
  const ov = stats.overall;
  const label = state.meta.league === 'college' ? 'College' : 'NBA';
  const yearTag = `${stats.calendarYear}`;

  if (ov >= 88 && stats.ppg >= 24 && Math.random() < 0.55) {
    awards.push(`${label} MVP (${yearTag})`);
  } else if (ov >= 78 && stats.ppg >= 18 && Math.random() < 0.4) {
    awards.push(`All-${label === 'College' ? 'American' : 'NBA Team'} (${yearTag})`);
  } else if (ov >= 68 && Math.random() < 0.25) {
    awards.push(`All-${state.meta.league === 'college' ? 'Conference' : 'Star'} (${yearTag})`);
  }

  if (p.attrs.def >= 82 && (stats.spg + stats.bpg) >= 2.6 && Math.random() < 0.4) {
    awards.push(`${label} Defensive Player of the Year (${yearTag})`);
  }

  if (state.meta.year === 1 && ov >= 65 && Math.random() < 0.35) {
    awards.push(`${label} Rookie of the Year (${yearTag})`);
  }

  if (stats.playoffResult === 'National Champion' || stats.playoffResult === 'NBA Champion') {
    awards.push(`${stats.playoffResult} (${yearTag})`);
  }

  awards.forEach((a) => p.awards.push(a));
  return awards;
}

export function pickCollegeOffers(state) {
  const p = state.player;
  const ov = overall(p.attrs);
  const stars = clamp(Math.round((ov - 40) / 12), 1, 5);
  p.recruitStars = stars;
  const eligible = COLLEGES.filter((c) => {
    if (stars >= 5) return c.prestige >= 3;
    if (stars >= 4) return c.prestige >= 2;
    if (stars >= 3) return c.prestige >= 1 && c.prestige <= 4;
    return c.prestige <= 3;
  });
  const pool = shuffle(eligible.length >= 4 ? eligible : COLLEGES);
  return pool.slice(0, 4);
}

export function generateDraftClass(state, size = 59) {
  const npcs = [];
  for (let i = 0; i < size; i++) {
    npcs.push(40 + Math.random() * 55);
  }
  return npcs;
}

export function runDraft(state) {
  const p = state.player;
  const ov = overall(p.attrs);
  const combineBoost = p.combineBoost || 0;
  const stock = clamp(ov + combineBoost + randFloat(-6, 6), 0, 99);
  const rivals = generateDraftClass(state);
  let rank = 1;
  rivals.forEach((r) => {
    if (r > stock) rank++;
  });

  const teams = shuffle(NBA_TEAMS);
  const draftPool = [];
  for (let round = 0; round < 2; round++) {
    teams.forEach((t) => draftPool.push(t));
  }

  if (rank > 60) {
    return { drafted: false, pick: null, round: null, team: null, rank };
  }

  const pickIndex = rank - 1;
  const team = draftPool[pickIndex] || choice(NBA_TEAMS);
  const round = rank <= 30 ? 1 : 2;
  return { drafted: true, pick: rank, round, team, rank };
}

export function contractOffer(state, drafted, pickInfo) {
  const p = state.player;
  const ov = overall(p.attrs);
  let base;
  if (drafted && pickInfo?.round === 1) {
    base = 1_200_000 + (30 - pickInfo.pick) * 250_000;
  } else if (drafted && pickInfo?.round === 2) {
    base = 500_000 + randInt(0, 300_000);
  } else {
    base = 200_000 + randInt(0, 150_000);
  }
  base *= clamp(ov / 70, 0.6, 1.3);
  const years = drafted && pickInfo?.round === 1 ? 4 : randInt(1, 2);
  return {
    years,
    salaryPerYear: Math.round(base),
    guaranteed: drafted && pickInfo?.round === 1,
  };
}

export function renegotiateContract(state) {
  const p = state.player;
  const ov = overall(p.attrs);
  const fameFactor = clamp(p.fame / 100, 0, 1);
  const base = 900_000 * Math.pow(ov / 50, 3.1) * (1 + fameFactor * 0.6);
  const years = randInt(2, 5);
  return {
    years,
    salaryPerYear: Math.round(clamp(base, 300_000, 55_000_000)),
    guaranteed: ov >= 70,
  };
}

export { positionMultipliers };
