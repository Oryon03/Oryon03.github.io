import { ARCHETYPES, POSITIONS, HOMETOWNS, NBA_TEAMS } from './data.js';
import {
  newGameState, saveGame, loadGame, clearSave, overall, logEvent, addMoney,
} from './state.js';
import {
  trainAttribute, applyAgingDecline, simulateSeason, rollInjury, evaluateAwards,
  pickCollegeOffers, runDraft, contractOffer, renegotiateContract,
} from './simulate.js';
import { ACTIONS, runAction, LIFE_EVENTS, rollLifeEvents } from './events.js';
import * as UI from './ui.js';
import { randInt, choice, formatMoney } from './utils.js';

let state = loadGame();
const uiFlags = { trainMenuOpen: false, businessMenuOpen: false, lifestyleMenuOpen: false, showBio: false };

const app = document.getElementById('app');
const header = document.getElementById('header');

function render() {
  header.innerHTML = UI.renderHeader(state);

  if (!state) {
    app.innerHTML = UI.viewCreate();
    return;
  }

  if (uiFlags.showBio) {
    app.innerHTML = UI.viewBio(state);
    return;
  }

  if (state.meta.eventQueue && state.meta.eventQueue.length) {
    const evId = state.meta.eventQueue[0];
    const event = LIFE_EVENTS.find((e) => e.id === evId);
    app.innerHTML = UI.viewEventModal(event, state.meta.eventResult);
    return;
  }

  switch (state.meta.stage) {
    case 'highschool':
      app.innerHTML = UI.viewHighSchool(state);
      break;
    case 'collegeChoice':
      app.innerHTML = UI.viewCollegeChoice(state);
      break;
    case 'offseason':
      app.innerHTML = UI.viewOffseason(state, uiFlags);
      break;
    case 'season':
      app.innerHTML = UI.viewSeason(state);
      break;
    case 'seasonRecap':
      app.innerHTML = UI.viewSeasonRecap(state);
      break;
    case 'postseason':
      app.innerHTML = UI.viewPostseason(state);
      break;
    case 'draftCombine':
      app.innerHTML = UI.viewDraftCombine(state);
      break;
    case 'draftResult':
      app.innerHTML = UI.viewDraftResult(state);
      break;
    case 'retired':
      app.innerHTML = UI.viewRetired(state);
      break;
    default:
      app.innerHTML = '<p>Something went wrong. Please start a new game.</p>';
  }
}

function persist() {
  saveGame(state);
}

function queueLifeEvents(afterStage, count = 2) {
  const events = rollLifeEvents(state, count);
  state.meta.eventQueue = events.map((e) => e.id);
  state.meta.eventResult = null;
  state.meta.afterEventStage = afterStage;
}

function applyAnnualFinances() {
  const p = state.player;
  const lines = [];
  let bizIncome = 0;
  p.businesses.forEach((b) => { bizIncome += b.income; });
  if (bizIncome > 0) {
    addMoney(state, bizIncome);
    lines.push(`Business income: ${formatMoney(bizIncome)}`);
  }
  let endIncome = 0;
  p.endorsements.forEach((e) => { endIncome += e.annual; });
  if (endIncome > 0) {
    addMoney(state, endIncome);
    lines.push(`Endorsement income: ${formatMoney(endIncome)}`);
  }
  if (state.meta.league === 'nba' && p.contract) {
    addMoney(state, p.contract.salaryPerYear);
    lines.push(`Salary: ${formatMoney(p.contract.salaryPerYear)}`);
    p.contract.years -= 1;
  }
  return lines;
}

function computeLegacy() {
  const p = state.player;
  let score = 0;
  p.careerStats.nba.forEach((s) => {
    score += s.ppg + s.rpg * 0.8 + s.apg * 1.0 + s.spg * 2 + s.bpg * 2;
  });
  score += p.awards.length * 15;
  score += p.awards.filter((a) => a.includes('Champion')).length * 40;
  score += p.careerStats.nba.length * 5;
  return Math.round(score);
}

const Controller = {
  createPlayer() {
    const name = document.getElementById('createName').value.trim() || 'Player One';
    const hometown = document.getElementById('createHometown').value || choice(HOMETOWNS);
    const position = document.getElementById('createPosition').value || choice(POSITIONS);
    const archetypeEl = document.querySelector('input[name="archetype"]:checked');
    const archetypeKey = archetypeEl ? archetypeEl.value : 'sharpshooter';
    state = newGameState({ name, hometown, position, archetypeKey });
    logEvent(state, `${name} began their journey in ${hometown}.`);
    persist();
    render();
  },

  playHighSchool() {
    const p = state.player;
    ['sht', 'plm', 'reb', 'def', 'ath', 'iq'].forEach((k) => {
      if (Math.random() < 0.5) trainAttribute(state, k, 1);
    });
    p.age = 18;
    const offers = pickCollegeOffers(state);
    state.meta.collegeOffers = offers;
    state.meta.stage = 'collegeChoice';
    persist();
    render();
  },

  chooseCollege(argIndex) {
    const idx = Number(argIndex);
    const college = state.meta.collegeOffers[idx];
    state.player.college = college;
    logEvent(state, `Committed to ${college.name}.`);
    state.meta.league = 'college';
    state.meta.year = 1;
    state.meta.calendarYear += 1;
    state.meta.offseasonActionsTotal = 3;
    state.meta.offseasonActionsLeft = 3;
    state.meta.stage = 'offseason';
    persist();
    render();
  },

  doAction(key) {
    if (state.meta.offseasonActionsLeft <= 0) return;
    if (key === 'train') { uiFlags.trainMenuOpen = true; render(); return; }
    if (key === 'business') { uiFlags.businessMenuOpen = true; render(); return; }
    if (key === 'lifestyle') { uiFlags.lifestyleMenuOpen = true; render(); return; }
    const result = runAction(state, key);
    state.meta.offseasonActionsLeft -= 1;
    state.meta.lastActionResult = result;
    persist();
    render();
  },

  trainAttr(key) {
    const gain = trainAttribute(state, key, 1);
    state.meta.offseasonActionsLeft -= 1;
    uiFlags.trainMenuOpen = false;
    state.meta.lastActionResult = gain > 0
      ? `Training paid off — your ${key.toUpperCase()} improved by ${gain}.`
      : `You trained hard, but you're already near your ceiling in that skill.`;
    persist();
    render();
  },

  closeTrainMenu() {
    uiFlags.trainMenuOpen = false;
    render();
  },

  doBusiness(typeKey) {
    const result = runAction(state, 'business', typeKey);
    state.meta.offseasonActionsLeft -= 1;
    uiFlags.businessMenuOpen = false;
    state.meta.lastActionResult = result;
    persist();
    render();
  },

  closeBusinessMenu() {
    uiFlags.businessMenuOpen = false;
    render();
  },

  doLifestyle(kind) {
    const result = runAction(state, 'lifestyle', kind);
    state.meta.offseasonActionsLeft -= 1;
    uiFlags.lifestyleMenuOpen = false;
    state.meta.lastActionResult = result;
    persist();
    render();
  },

  closeLifestyleMenu() {
    uiFlags.lifestyleMenuOpen = false;
    render();
  },

  proceedToSeason() {
    state.meta.lastActionResult = null;
    queueLifeEvents('season', 2);
    persist();
    render();
  },

  resolveEvent(argIndex) {
    const idx = Number(argIndex);
    const evId = state.meta.eventQueue[0];
    const event = LIFE_EVENTS.find((e) => e.id === evId);
    const resultText = event.choices[idx].apply(state);
    state.meta.eventResult = resultText;
    persist();
    render();
  },

  dismissEventResult() {
    state.meta.eventQueue.shift();
    state.meta.eventResult = null;
    if (!state.meta.eventQueue.length) {
      const next = state.meta.afterEventStage;
      state.meta.afterEventStage = null;
      state.meta.stage = next;
    }
    persist();
    render();
  },

  simulateSeason() {
    const stats = simulateSeason(state);
    let injury = null;
    if (!state.player.injury) {
      injury = rollInjury(state);
    }
    let agingNote = null;
    if (state.meta.league === 'nba') {
      agingNote = applyAgingDecline(state);
    }
    const awards = evaluateAwards(state, stats);
    state.meta.lastSeasonRecap = { stats, injury, agingNote, awards };
    state.meta.stage = 'seasonRecap';
    persist();
    render();
  },

  continueFromRecap() {
    const lines = applyAnnualFinances();
    state.meta.lastFinances = lines;
    state.meta.contractOffers = null;
    state.meta.stage = 'postseason';
    persist();
    render();
  },

  declareForDraft() {
    state.meta.stage = 'draftCombine';
    state.player.combineBoost = 0;
    persist();
    render();
  },

  returnToCollege() {
    state.meta.year += 1;
    state.meta.calendarYear += 1;
    state.player.age += 1;
    state.meta.offseasonActionsLeft = state.meta.offseasonActionsTotal;
    state.meta.lastActionResult = null;
    state.meta.stage = 'offseason';
    persist();
    render();
  },

  runCombine() {
    const boost = randInt(-3, 8);
    state.player.combineBoost = boost;
    const draft = runDraft(state);
    state.meta.lastDraft = draft;
    const offer = contractOffer(state, draft.drafted, draft);
    state.player.contract = offer;
    state.player.draftInfo = draft;
    if (draft.drafted) {
      state.player.nbaTeam = draft.team;
      logEvent(state, `Drafted #${draft.pick} by the ${draft.team.name}.`);
    } else {
      const team = choice(NBA_TEAMS);
      state.player.nbaTeam = team;
      logEvent(state, `Signed as an undrafted free agent with the ${team.name}.`);
    }
    state.meta.league = 'nba';
    state.meta.year = 1;
    state.meta.stage = 'draftResult';
    persist();
    render();
  },

  continueAfterDraft() {
    state.meta.offseasonActionsTotal = 4;
    state.meta.offseasonActionsLeft = 4;
    state.meta.lastActionResult = null;
    state.meta.stage = 'offseason';
    persist();
    render();
  },

  continueNBA() {
    if (state.player.contract && state.player.contract.years <= 0) {
      const offerA = renegotiateContract(state, { loyalty: true });
      offerA.label = `Re-sign with the ${state.player.nbaTeam.name}`;
      const newTeam = choice(NBA_TEAMS.filter((t) => t.abbr !== state.player.nbaTeam.abbr));
      const offerB = renegotiateContract(state, { freeAgent: true });
      offerB.label = `Sign with the ${newTeam.name}`;
      offerB.__team = newTeam;
      state.meta.contractOffers = [offerA, offerB];
      persist();
      render();
      return;
    }
    advanceNBAYear();
  },

  signContract(argIndex) {
    const idx = Number(argIndex);
    const offer = state.meta.contractOffers[idx];
    state.player.contract = { years: offer.years, salaryPerYear: offer.salaryPerYear, guaranteed: offer.guaranteed };
    if (offer.__team) {
      state.player.nbaTeam = offer.__team;
      logEvent(state, `Signed with the ${offer.__team.name}.`);
    }
    state.meta.contractOffers = null;
    advanceNBAYear();
  },

  retirePlayer() {
    state.player.retired = true;
    state.player.hallOfFameScore = computeLegacy();
    state.meta.stage = 'retired';
    persist();
    render();
  },

  newGame() {
    clearSave();
    state = null;
    uiFlags.showBio = false;
    render();
  },

  toggleBio() {
    if (!state) return;
    uiFlags.showBio = !uiFlags.showBio;
    render();
  },
};

function advanceNBAYear() {
  state.meta.year += 1;
  state.meta.calendarYear += 1;
  state.player.age += 1;
  state.meta.offseasonActionsLeft = state.meta.offseasonActionsTotal;
  state.meta.lastActionResult = null;
  state.meta.stage = 'offseason';
  persist();
  render();
}

app.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const arg = btn.dataset.arg;
  if (typeof Controller[action] === 'function') {
    Controller[action](arg);
  }
});

header.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (typeof Controller[action] === 'function') {
    Controller[action]();
  }
});

render();
