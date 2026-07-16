import { ATTRS, ARCHETYPES } from './data.js';
import { clamp, randInt } from './utils.js';

const SAVE_KEY = 'cnba_sim_save_v1';

export function overall(attrs) {
  const vals = ATTRS.map((k) => attrs[k]);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function newPlayer({ name, hometown, position, archetypeKey }) {
  const archetype = ARCHETYPES.find((a) => a.key === archetypeKey) || ARCHETYPES[0];
  const attrs = {};
  const potential = {};
  ATTRS.forEach((k) => {
    attrs[k] = clamp(randInt(38, 48) + (archetype.bonus[k] || 0), 20, 70);
    potential[k] = clamp(attrs[k] + randInt(25, 45) + (archetype.potentialBonus || 0), 50, 99);
  });

  return {
    name,
    hometown,
    position,
    archetype: archetype.key,
    age: 17,
    attrs,
    potential,
    energy: 90,
    health: 100,
    happiness: 70,
    reputation: 50,
    fame: 5,
    gpa: 3.0,
    money: 500,
    relationship: { status: 'single', partnerName: null, years: 0 },
    kids: [],
    houses: [],
    cars: [],
    businesses: [],
    endorsements: [],
    injury: null,
    college: null,
    nbaTeam: null,
    contract: null,
    draftInfo: null,
    awards: [],
    careerStats: { college: [], nba: [] },
    log: [],
    retired: false,
    hallOfFameScore: 0,
  };
}

export function newGameState(playerInfo) {
  return {
    player: newPlayer(playerInfo),
    meta: {
      league: null,
      year: 0,
      calendarYear: 2026,
      stage: 'highschool',
      offseasonActionsLeft: 3,
      offseasonActionsTotal: 3,
      eventQueue: [],
      eventResult: null,
      afterEventStage: null,
      lastActionResult: null,
      lastSeasonRecap: null,
      lastFinances: null,
      lastDraft: null,
      collegeOffers: null,
      contractOffers: null,
    },
  };
}

export function logEvent(state, text) {
  state.player.log.unshift(text);
  if (state.player.log.length > 200) state.player.log.length = 200;
}

export function addMoney(state, amount) {
  state.player.money += amount;
}

export function changeAttr(state, key, delta) {
  const p = state.player;
  const cap = p.potential[key];
  p.attrs[key] = clamp(p.attrs[key] + delta, 10, Math.max(cap, p.attrs[key]));
}

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game', e);
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load save', e);
    return null;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
