import { ATTRS, ATTR_LABELS, POSITIONS, POSITION_LABELS, ARCHETYPES, HOMETOWNS, BUSINESS_TYPES } from './data.js';
import { overall } from './state.js';
import { formatMoney, ordinal, escapeHtml } from './utils.js';
import { ACTIONS, LIFE_EVENTS } from './events.js';

function attrBar(key, value, potential) {
  const pct = Math.round((value / 99) * 100);
  const potPct = Math.round((potential / 99) * 100);
  return `
    <div class="attr-row">
      <div class="attr-label">${ATTR_LABELS[key]}</div>
      <div class="attr-track">
        <div class="attr-potential" style="width:${potPct}%"></div>
        <div class="attr-fill" style="width:${pct}%"></div>
      </div>
      <div class="attr-value">${value}</div>
    </div>`;
}

function statChip(label, value) {
  return `<div class="chip"><span class="chip-label">${label}</span><span class="chip-value">${value}</span></div>`;
}

export function renderHeader(state) {
  if (!state) return '';
  const p = state.player;
  const ov = overall(p.attrs);
  const teamLine = state.meta.league === 'college'
    ? (p.college ? `${p.college.name} (${p.college.conf})` : 'High School')
    : (p.nbaTeam ? p.nbaTeam.name : '—');
  return `
    <div class="topbar">
      <div class="topbar-main">
        <div class="topbar-name">${escapeHtml(p.name)} <span class="pos-badge">${p.position}</span></div>
        <div class="topbar-sub">${teamLine} &middot; Age ${p.age} &middot; OVR ${ov}</div>
      </div>
      <div class="topbar-stats">
        ${statChip('\u{1F4B0}', formatMoney(p.money))}
        ${statChip('\u{1F31F}', Math.round(p.fame))}
        ${statChip('\u{2764}\u{FE0F}', Math.round(p.health))}
        ${statChip('⚡', Math.round(p.energy))}
      </div>
      <div class="topbar-actions">
        <button class="btn btn-ghost" data-action="toggleBio">Bio</button>
      </div>
    </div>`;
}

export function viewCreate() {
  const archetypeCards = ARCHETYPES.map((a) => `
    <label class="pick-card">
      <input type="radio" name="archetype" value="${a.key}" ${a.key === 'sharpshooter' ? 'checked' : ''}/>
      <div class="pick-card-title">${a.name}</div>
      <div class="pick-card-desc">${a.desc}</div>
    </label>`).join('');

  const posOptions = POSITIONS.map((p) => `<option value="${p}">${p} - ${POSITION_LABELS[p]}</option>`).join('');
  const townOptions = HOMETOWNS.map((h) => `<option value="${escapeHtml(h)}">${escapeHtml(h)}</option>`).join('');

  return `
    <div class="screen create-screen">
      <h1 class="title">Hardwood Legacy</h1>
      <p class="subtitle">Build your baller. Take them from high school, through college, to the NBA — and everything in between.</p>
      <div class="card">
        <label class="field">
          <span>Player Name</span>
          <input type="text" id="createName" maxlength="24" placeholder="e.g. Marcus Johnson" />
        </label>
        <label class="field">
          <span>Hometown</span>
          <select id="createHometown">${townOptions}</select>
        </label>
        <label class="field">
          <span>Position</span>
          <select id="createPosition">${posOptions}</select>
        </label>
        <div class="field">
          <span>Archetype</span>
          <div class="pick-grid">${archetypeCards}</div>
        </div>
        <button class="btn btn-primary btn-lg" data-action="createPlayer">Start Your Journey</button>
      </div>
    </div>`;
}

export function viewHighSchool(state) {
  return `
    <div class="screen">
      <div class="card center-card">
        <h2>Welcome to High School, ${escapeHtml(state.player.name)}</h2>
        <p>You're a rising baller in ${escapeHtml(state.player.hometown)}. Every rep in the gym, every AAU tournament, every highlight reel is building toward one goal: the NBA.</p>
        <button class="btn btn-primary btn-lg" data-action="playHighSchool">Play High School Career</button>
      </div>
    </div>`;
}

export function viewCollegeChoice(state) {
  const stars = '⭐'.repeat(state.player.recruitStars || 1);
  const offers = (state.meta.collegeOffers || []).map((c, i) => `
    <div class="card offer-card">
      <div class="offer-name">${c.name}</div>
      <div class="offer-conf">${c.conf}</div>
      <div class="offer-prestige">Prestige: ${'\u{1F3C6}'.repeat(c.prestige)}</div>
      <button class="btn btn-primary" data-action="chooseCollege" data-arg="${i}">Commit</button>
    </div>`).join('');

  return `
    <div class="screen">
      <h2>Recruiting Offers</h2>
      <p class="subtitle">You're rated a ${stars} recruit. Here's who's interested.</p>
      <div class="card-grid">${offers}</div>
    </div>`;
}

export function viewOffseason(state, uiFlags) {
  const p = state.player;
  const league = state.meta.league;
  const actions = ACTIONS.filter((a) => !a.collegeOnly || league === 'college');
  const actionsLeft = state.meta.offseasonActionsLeft;

  if (uiFlags.trainMenuOpen) {
    const attrButtons = ATTRS.map((k) => `
      <button class="attr-train-btn" data-action="trainAttr" data-arg="${k}">
        <span>${ATTR_LABELS[k]}</span>
        <span class="attr-train-val">${p.attrs[k]} / ${p.potential[k]}</span>
      </button>`).join('');
    return `
      <div class="screen">
        ${offseasonHeaderHtml(state)}
        <div class="card">
          <h3>Which skill do you want to train?</h3>
          <div class="attr-train-grid">${attrButtons}</div>
          <button class="btn btn-ghost" data-action="closeTrainMenu">Cancel</button>
        </div>
      </div>`;
  }

  if (uiFlags.businessMenuOpen) {
    const bizButtons = BUSINESS_TYPES.map((b) => `
      <button class="attr-train-btn" data-action="doBusiness" data-arg="${b.key}">
        <span>${b.name}</span>
        <span class="attr-train-val">Min ${formatMoney(b.minInvest)}</span>
      </button>`).join('');
    return `
      <div class="screen">
        ${offseasonHeaderHtml(state)}
        <div class="card">
          <h3>Choose an investment</h3>
          <div class="attr-train-grid">${bizButtons}</div>
          <button class="btn btn-ghost" data-action="closeBusinessMenu">Cancel</button>
        </div>
      </div>`;
  }

  if (uiFlags.lifestyleMenuOpen) {
    return `
      <div class="screen">
        ${offseasonHeaderHtml(state)}
        <div class="card">
          <h3>Shopping</h3>
          <div class="attr-train-grid">
            <button class="attr-train-btn" data-action="doLifestyle" data-arg="car"><span>Buy a Car</span></button>
            <button class="attr-train-btn" data-action="doLifestyle" data-arg="house"><span>Buy a House</span></button>
          </div>
          <button class="btn btn-ghost" data-action="closeLifestyleMenu">Cancel</button>
        </div>
      </div>`;
  }

  const actionCards = actions.map((a) => `
    <button class="card action-card" data-action="doAction" data-arg="${a.key}" ${actionsLeft <= 0 ? 'disabled' : ''}>
      <div class="action-icon">${a.icon}</div>
      <div class="action-label">${a.label}</div>
      <div class="action-desc">${a.desc}</div>
    </button>`).join('');

  const lastResult = state.meta.lastActionResult
    ? `<div class="toast">${escapeHtml(state.meta.lastActionResult)}</div>`
    : '';

  return `
    <div class="screen">
      ${offseasonHeaderHtml(state)}
      ${lastResult}
      <div class="card-grid">${actionCards}</div>
      <button class="btn btn-primary btn-lg" data-action="proceedToSeason">
        ${actionsLeft > 0 ? 'Skip Remaining Prep & Start Season' : 'Start the Season'}
      </button>
    </div>`;
}

function offseasonHeaderHtml(state) {
  const p = state.player;
  const league = state.meta.league;
  const label = league === 'college' ? `College Offseason — Year ${state.meta.year}` : `NBA Offseason — Year ${state.meta.year}`;
  return `
    <h2>${label}</h2>
    <p class="subtitle">Offseason focus remaining: <strong>${state.meta.offseasonActionsLeft}</strong> / ${state.meta.offseasonActionsTotal}</p>
    <div class="attr-panel card">
      ${ATTRS.map((k) => attrBar(k, p.attrs[k], p.potential[k])).join('')}
    </div>`;
}

export function viewSeason(state) {
  const league = state.meta.league;
  const teamName = league === 'college' ? state.player.college?.name : state.player.nbaTeam?.name;
  return `
    <div class="screen">
      <div class="card center-card">
        <h2>${league === 'college' ? 'College' : 'NBA'} Season — Year ${state.meta.year}</h2>
        <p>Suit up for ${escapeHtml(teamName || 'your team')}. Time to see what a full season of work has earned you.</p>
        <button class="btn btn-primary btn-lg" data-action="simulateSeason">Simulate Season</button>
      </div>
    </div>`;
}

export function viewSeasonRecap(state) {
  const recap = state.meta.lastSeasonRecap;
  if (!recap) return '';
  const { stats, injury, agingNote, awards } = recap;
  return `
    <div class="screen">
      <h2>Season Recap</h2>
      <div class="card">
        <div class="recap-record">${stats.team || 'Your Team'}: ${stats.wins}-${stats.losses}</div>
        <div class="recap-playoff">${stats.playoffResult}</div>
        <div class="stat-grid">
          ${statChip('PPG', stats.ppg)}
          ${statChip('RPG', stats.rpg)}
          ${statChip('APG', stats.apg)}
          ${statChip('SPG', stats.spg)}
          ${statChip('BPG', stats.bpg)}
          ${statChip('FG%', stats.fgPct)}
        </div>
      </div>
      ${awards.length ? `<div class="card"><h3>Awards</h3><ul>${awards.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul></div>` : ''}
      ${injury ? `<div class="card warning-card"><h3>Injury Report</h3><p>You suffered a ${injury.name.toLowerCase()}, expected out ~${injury.weeksOut} weeks. Health took a hit.</p></div>` : ''}
      ${agingNote ? `<div class="card warning-card"><p>Father Time is undefeated — your ${ATTR_LABELS[agingNote.key]} dipped by ${Math.abs(agingNote.amount)}.</p></div>` : ''}
      <button class="btn btn-primary btn-lg" data-action="continueFromRecap">Continue</button>
    </div>`;
}

export function viewPostseason(state) {
  const p = state.player;
  const league = state.meta.league;
  const finances = state.meta.lastFinances || [];
  const financeHtml = finances.length ? `<div class="card"><h3>Finances</h3><ul>${finances.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul></div>` : '';

  if (state.meta.contractOffers) {
    const offers = state.meta.contractOffers;
    const cards = offers.map((o, i) => `
      <div class="card offer-card">
        <div class="offer-name">${o.label}</div>
        <div class="offer-conf">${o.years} yrs &middot; ${formatMoney(o.salaryPerYear)}/yr</div>
        <div class="offer-prestige">${o.guaranteed ? 'Guaranteed' : 'Non-guaranteed'}</div>
        <button class="btn btn-primary" data-action="signContract" data-arg="${i}">Sign</button>
      </div>`).join('');
    return `
      <div class="screen">
        <h2>Contract Negotiations</h2>
        <p class="subtitle">Your deal is up. Pick your next contract.</p>
        <div class="card-grid">${cards}</div>
      </div>`;
  }

  if (league === 'college') {
    const canReturn = state.meta.year < 4;
    return `
      <div class="screen">
        <h2>End of Season Decision</h2>
        ${financeHtml}
        <div class="card center-card">
          <p>GPA: ${p.gpa.toFixed(2)} &middot; Reputation: ${Math.round(p.reputation)} &middot; Fame: ${Math.round(p.fame)}</p>
          <div class="btn-row">
            <button class="btn btn-primary btn-lg" data-action="declareForDraft">${canReturn ? 'Declare for the NBA Draft' : 'Enter the NBA Draft'}</button>
            ${canReturn ? `<button class="btn btn-secondary btn-lg" data-action="returnToCollege">Return to College</button>` : ''}
          </div>
        </div>
      </div>`;
  }

  const canRetire = p.age >= 32;
  return `
    <div class="screen">
      <h2>End of Season</h2>
      ${financeHtml}
      <div class="card center-card">
        <p>Contract: ${p.contract ? `${p.contract.years} yrs remaining, ${formatMoney(p.contract.salaryPerYear)}/yr` : 'None'}</p>
        <div class="btn-row">
          <button class="btn btn-primary btn-lg" data-action="continueNBA">Continue Career</button>
          ${canRetire ? `<button class="btn btn-secondary btn-lg" data-action="retirePlayer">Retire</button>` : ''}
        </div>
      </div>
    </div>`;
}

export function viewDraftCombine(state) {
  return `
    <div class="screen">
      <div class="card center-card">
        <h2>NBA Draft Combine</h2>
        <p>Scouts and GMs are watching your every move. Show out and boost your stock.</p>
        <button class="btn btn-primary btn-lg" data-action="runCombine">Compete at the Combine</button>
      </div>
    </div>`;
}

export function viewDraftResult(state) {
  const d = state.meta.lastDraft;
  if (!d) return '';
  const body = d.drafted
    ? `<h2>Drafted!</h2><p>Pick #${d.pick} (Round ${d.round}) — <strong>${d.team.name}</strong></p>`
    : `<h2>Undrafted</h2><p>You went undrafted, but the ${d.team.name} are signing you as a free agent.</p>`;
  return `
    <div class="screen">
      <div class="card center-card">
        ${body}
        <p>Contract: ${state.player.contract.years} yrs &middot; ${formatMoney(state.player.contract.salaryPerYear)}/yr</p>
        <button class="btn btn-primary btn-lg" data-action="continueAfterDraft">Begin Your NBA Career</button>
      </div>
    </div>`;
}

export function viewRetired(state) {
  const p = state.player;
  const collegeSeasons = p.careerStats.college;
  const nbaSeasons = p.careerStats.nba;
  const champs = p.awards.filter((a) => a.includes('Champion')).length;
  return `
    <div class="screen">
      <h2>Retirement</h2>
      <div class="card center-card">
        <h3>${escapeHtml(p.name)}'s Legacy</h3>
        <p>Hall of Fame Score: <strong>${p.hallOfFameScore}</strong>${p.hallOfFameScore >= 250 ? ' — Hall of Famer! \u{1F3C6}' : ''}</p>
        <div class="stat-grid">
          ${statChip('College Seasons', collegeSeasons.length)}
          ${statChip('NBA Seasons', nbaSeasons.length)}
          ${statChip('Championships', champs)}
          ${statChip('Net Worth', formatMoney(p.money))}
        </div>
      </div>
      <div class="card">
        <h3>Awards</h3>
        <ul>${p.awards.length ? p.awards.map((a) => `<li>${escapeHtml(a)}</li>`).join('') : '<li>None</li>'}</ul>
      </div>
      <button class="btn btn-primary btn-lg" data-action="newGame">Start a New Legacy</button>
    </div>`;
}

export function viewEventModal(event, resultText) {
  if (!resultText) {
    const choices = event.choices.map((c, i) => `<button class="btn btn-secondary" data-action="resolveEvent" data-arg="${i}">${escapeHtml(c.label)}</button>`).join('');
    return `
      <div class="modal-overlay">
        <div class="modal">
          <h3>${escapeHtml(event.title)}</h3>
          <p>${escapeHtml(event.text)}</p>
          <div class="btn-col">${choices}</div>
        </div>
      </div>`;
  }
  return `
    <div class="modal-overlay">
      <div class="modal">
        <h3>${escapeHtml(event.title)}</h3>
        <p>${escapeHtml(resultText)}</p>
        <button class="btn btn-primary" data-action="dismissEventResult">OK</button>
      </div>
    </div>`;
}

export function viewBio(state) {
  const p = state.player;
  const seasonsRows = (list, label) => list.map((s) => `
    <tr>
      <td>${s.calendarYear}</td>
      <td>${escapeHtml(s.team || '')}</td>
      <td>${s.ppg}</td><td>${s.rpg}</td><td>${s.apg}</td><td>${s.spg}</td><td>${s.bpg}</td><td>${s.fgPct}%</td>
      <td>${s.wins}-${s.losses}</td>
      <td>${escapeHtml(s.playoffResult || '')}</td>
    </tr>`).join('');

  const table = (list, label) => list.length ? `
    <h3>${label}</h3>
    <div class="table-wrap">
    <table class="stats-table">
      <thead><tr><th>Year</th><th>Team</th><th>PPG</th><th>RPG</th><th>APG</th><th>SPG</th><th>BPG</th><th>FG%</th><th>W-L</th><th>Result</th></tr></thead>
      <tbody>${seasonsRows(list, label)}</tbody>
    </table>
    </div>` : '';

  const houses = p.houses.map((h) => `<li>${escapeHtml(h.name)} — ${formatMoney(h.value)}</li>`).join('') || '<li>None</li>';
  const cars = p.cars.map((c) => `<li>${escapeHtml(c.name)} — ${formatMoney(c.value)}</li>`).join('') || '<li>None</li>';
  const businesses = p.businesses.map((b) => `<li>${escapeHtml(b.name)} — worth ${formatMoney(b.value)}, ${formatMoney(b.income)}/yr</li>`).join('') || '<li>None</li>';
  const endorsements = p.endorsements.map((e) => `<li>${escapeHtml(e.name)} (${e.tier}) — ${formatMoney(e.annual)}/yr</li>`).join('') || '<li>None</li>';
  const kids = p.kids.map((k) => `<li>${escapeHtml(k.name)}</li>`).join('') || '<li>None</li>';

  return `
    <div class="screen">
      <h2>${escapeHtml(p.name)}</h2>
      <p class="subtitle">${escapeHtml(p.hometown)} &middot; ${POSITION_LABELS[p.position]} &middot; Age ${p.age}</p>
      <div class="card attr-panel">${ATTRS.map((k) => attrBar(k, p.attrs[k], p.potential[k])).join('')}</div>
      <div class="card">
        <h3>Life</h3>
        <p>Relationship: ${p.relationship.status}${p.relationship.partnerName ? ` (${escapeHtml(p.relationship.partnerName)})` : ''}</p>
        <p>Kids: </p><ul>${kids}</ul>
        <p>Reputation: ${Math.round(p.reputation)} &middot; Happiness: ${Math.round(p.happiness)} &middot; GPA: ${p.gpa.toFixed(2)}</p>
      </div>
      <div class="card">
        <h3>Assets</h3>
        <p>Houses</p><ul>${houses}</ul>
        <p>Cars</p><ul>${cars}</ul>
        <p>Businesses</p><ul>${businesses}</ul>
        <p>Endorsements</p><ul>${endorsements}</ul>
      </div>
      <div class="card">
        <h3>Awards</h3>
        <ul>${p.awards.length ? p.awards.map((a) => `<li>${escapeHtml(a)}</li>`).join('') : '<li>None yet</li>'}</ul>
      </div>
      <div class="card">
        ${table(p.careerStats.college, 'College Career')}
        ${table(p.careerStats.nba, 'NBA Career')}
      </div>
      <button class="btn btn-secondary btn-lg" data-action="toggleBio">Back</button>
    </div>`;
}
