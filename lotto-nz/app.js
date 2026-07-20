import {
  loadDraws, frequency, bonusFrequency, gapSinceLastSeen, pairFrequency,
  sumStats, oddEvenSplit, highLowSplit, decadeDistribution,
  buildScoreModel, generateSet, topN, makeRng,
  powerballFrequency, powerballGapSinceLastSeen, buildPowerballScoreModel, pickWeighted,
  POWERBALL_TEN_BALL_START_DRAW,
} from './analysis.js';

const MAX_LINES = 10;
const STRATEGIES = {
  balanced: { label: 'Balanced blend', desc: 'Mixes all-time frequency, recent form, and how overdue each number is.' },
  hot: { label: 'Hot streak', desc: 'Weighted toward numbers drawn most often recently.' },
  overdue: { label: 'Overdue watch', desc: 'Weighted toward numbers with the longest gap since they last appeared.' },
  mixed: { label: 'Mixed', desc: 'Cycles through balanced / hot / overdue, one strategy per line.' },
};

const draws = loadDraws();
const recentWindow = draws.slice(-104);

const allFreq = frequency(draws);
const recentFreq = frequency(recentWindow);
const gaps = gapSinceLastSeen(draws);
const pairs = pairFrequency(draws);
const bonusFreq = bonusFrequency(draws);
const sums = sumStats(draws);
const oddEven = oddEvenSplit(draws);
const highLow = highLowSplit(draws);
const decades = decadeDistribution(draws);
const scoreModel = buildScoreModel(draws);

// Only draws since the Powerball pool became 1-10 (see analysis.js) --
// earlier draws only ever drew 1-8, so including them would make 9 and 10
// look artificially "cold" when they were simply impossible back then.
const powerballDraws = draws.filter((d) => d.powerball !== null && d.drawNumber >= POWERBALL_TEN_BALL_START_DRAW);
const pbRecentWindow = powerballDraws.slice(-104);
const pbFreq = powerballFrequency(powerballDraws);
const pbRecentFreq = powerballFrequency(pbRecentWindow);
const pbGaps = powerballGapSinceLastSeen(powerballDraws);
const pbScoreModel = buildPowerballScoreModel(powerballDraws);
const pbStart = powerballDraws[0];

const first = draws[0];
const last = draws[draws.length - 1];

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ball(n, kind = 'main') {
  return `<div class="lotto-ball lotto-ball--${kind}">${n}</div>`;
}

function renderHeaderStats() {
  document.getElementById('headerStats').innerHTML = `
    <div class="chip"><span class="chip-label">Draws analysed</span><span class="chip-value">${draws.length}</span></div>
    <div class="chip"><span class="chip-label">Range</span><span class="chip-value">${first.date.slice(0, 4)}–${last.date.slice(0, 4)}</span></div>
    <div class="chip"><span class="chip-label">Last draw</span><span class="chip-value">#${last.drawNumber}, ${fmtDate(last.date)}</span></div>
  `;
}

function renderDisclaimer() {
  return `
    <div class="card disclaimer">
      <strong>Reality check before you read any further:</strong> every NZ Lotto draw pulls
      6 balls from 40 at random, independently of every draw before it. Past results have
      no influence on future ones, so nothing here — or anywhere — can predict a winning
      line. What this page <em>does</em> do is real statistics on ${draws.length} actual past
      draws (frequency, gaps, pairs, sums) and turn that into number sets, purely as a fun way
      to explore patterns. The odds of matching all 6 remain about 1 in 3.8 million no matter
      which numbers you pick. The bonus ball isn't shown on generated lines because it isn't
      something you choose — it's drawn automatically from the leftover 34 numbers on the night.
    </div>
  `;
}

function weightMapForStrategy(strategy) {
  if (strategy === 'hot') return new Map([...recentFreq.entries()]);
  if (strategy === 'overdue') return new Map([...gaps.entries()].map(([n, g]) => [n, g ?? draws.length]));
  return scoreModel; // balanced
}

function generateLines(count, strategy, includePowerball) {
  const rng = makeRng();
  const mixOrder = ['balanced', 'hot', 'overdue'];
  const lines = [];
  for (let i = 0; i < count; i++) {
    const lineStrategy = strategy === 'mixed' ? mixOrder[i % mixOrder.length] : strategy;
    const weights = weightMapForStrategy(lineStrategy);
    const main = generateSet(weights, rng, { sumRange: [sums.mean - 35, sums.mean + 35] });
    const powerball = includePowerball ? pickWeighted(pbScoreModel, rng) : null;
    lines.push({ main, powerball, strategy: lineStrategy });
  }
  return lines;
}

function renderLines(lines) {
  return `
    <p class="line-list-hint">Numbers are already generated below — tap a line when you actually want to see it, no pressure to look at all of them.</p>
    <div class="line-list">
      ${lines.map((line, i) => `
        <div class="line-row line-hidden">
          <span class="line-index">${i + 1}</span>
          <button type="button" class="line-reveal-btn">Tap to reveal</button>
          <div class="ball-row">
            ${line.main.map((n) => ball(n, 'main')).join('')}
            ${line.powerball !== null ? `<span class="lotto-ball--plus">+</span>${ball(line.powerball, 'powerball')}` : ''}
          </div>
          <span class="line-strategy">${STRATEGIES[line.strategy].label}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function currentControls() {
  const count = Math.min(MAX_LINES, Math.max(1, parseInt(document.getElementById('lineCount').value, 10) || 1));
  const strategy = document.getElementById('lineStrategy').value;
  const includePowerball = document.getElementById('includePowerball').checked;
  return { count, strategy, includePowerball };
}

function renderPredictionSection() {
  const count = 3;
  const strategy = 'mixed';
  const includePowerball = true;
  const lines = generateLines(count, strategy, includePowerball);
  return `
    <h2 class="section-title">Generated number sets</h2>
    <div class="card">
      <div class="line-controls">
        <label class="field-inline">
          <span>Lines</span>
          <input type="number" id="lineCount" min="1" max="${MAX_LINES}" value="${count}" />
        </label>
        <label class="field-inline">
          <span>Strategy</span>
          <select id="lineStrategy">
            ${Object.entries(STRATEGIES).map(([k, v]) => `<option value="${k}" ${k === strategy ? 'selected' : ''}>${v.label}</option>`).join('')}
          </select>
        </label>
        <label class="field-inline field-inline--checkbox">
          <input type="checkbox" id="includePowerball" ${includePowerball ? 'checked' : ''} />
          <span>Include a Powerball number per line</span>
        </label>
      </div>
      <div id="predictionSets">${renderLines(lines)}</div>
      <div class="btn-row">
        <button class="btn btn-primary" id="regenerateBtn">Generate</button>
      </div>
    </div>
  `;
}

function renderFreqChart(freqMap, min, max, title, desc) {
  const maxCount = Math.max(...[...freqMap.values()]);
  const hotSet = new Set(topN(freqMap, Math.min(6, max - min + 1)).map(([n]) => n));
  const coldSet = new Set(topN(freqMap, Math.min(6, max - min + 1), false).map(([n]) => n));
  let rows = '';
  for (let n = min; n <= max; n++) {
    const count = freqMap.get(n);
    const pct = maxCount ? (count / maxCount) * 100 : 0;
    const cls = coldSet.has(n) ? 'freq-fill freq-fill--cold' : 'freq-fill';
    rows += `
      <div class="freq-row" title="Number ${n}: drawn ${count} times">
        <span class="freq-num">${n}</span>
        <span class="freq-track"><span class="${cls}" style="width:${pct.toFixed(1)}%"></span></span>
        <span class="freq-count">${count}</span>
      </div>
    `;
  }
  return `
    <div class="card">
      <div class="set-title">${title}</div>
      <div class="set-desc">${desc}</div>
      <div class="freq-chart">${rows}</div>
      <div class="legend-row">
        <span><span class="legend-swatch" style="background:var(--accent)"></span>most-drawn</span>
        <span><span class="legend-swatch" style="background:#3a4358"></span>least-drawn</span>
      </div>
    </div>
  `;
}

function renderRankCard(title, desc, entries, formatLabel, formatValue) {
  return `
    <div class="card">
      <div class="set-title">${title}</div>
      <div class="set-desc">${desc}</div>
      <ul class="rank-list">
        ${entries.map(([k, v]) => `<li><span>${formatLabel(k)}</span><span class="rank-value">${formatValue(v)}</span></li>`).join('')}
      </ul>
    </div>
  `;
}

function renderPairsCard() {
  const top = topN(pairs, 8);
  return `
    <div class="card">
      <div class="set-title">Most common pairs</div>
      <div class="set-desc">Number pairs that have appeared together most often in the same draw.</div>
      <ul class="pair-list">
        ${top.map(([k, v]) => {
          const [a, b] = k.split('-');
          return `<li><span>${a} &amp; ${b}</span><span class="pair-value">${v}× together</span></li>`;
        }).join('')}
      </ul>
    </div>
  `;
}

function renderSplitCard(title, desc, counts, order) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const entries = order.filter((k) => counts[k]).map((k) => [k, counts[k]]);
  const maxPct = Math.max(...entries.map(([, v]) => v / total));
  return `
    <div class="card">
      <div class="set-title">${title}</div>
      <div class="set-desc">${desc}</div>
      <div class="split-bars">
        ${entries.map(([k, v]) => {
          const pct = (v / total) * 100;
          const barPct = (v / total) / maxPct * 100;
          return `
            <div class="split-bar-row">
              <div class="split-bar-label"><span>${k}</span><span>${pct.toFixed(1)}%</span></div>
              <div class="split-bar-track"><div class="split-bar-fill" style="width:${barPct.toFixed(1)}%"></div></div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderSumCard() {
  return `
    <div class="card">
      <div class="set-title">Sum of the 6 main numbers</div>
      <div class="set-desc">Across all ${draws.length} draws.</div>
      <ul class="rank-list">
        <li><span>Average</span><span class="rank-value">${sums.mean.toFixed(0)}</span></li>
        <li><span>Median</span><span class="rank-value">${sums.median}</span></li>
        <li><span>Lowest</span><span class="rank-value">${sums.min}</span></li>
        <li><span>Highest</span><span class="rank-value">${sums.max}</span></li>
      </ul>
    </div>
  `;
}

function render() {
  renderHeaderStats();
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderDisclaimer()}
    <div id="predictionSection">${renderPredictionSection()}</div>

    <h2 class="section-title">What the historical data shows</h2>
    <div class="card-grid">
      ${renderRankCard(
        `Hot numbers (last ${recentWindow.length} draws)`,
        'Most frequently drawn recently.',
        topN(recentFreq, 8),
        (n) => `Number ${n}`,
        (v) => `${v}×`,
      )}
      ${renderRankCard(
        'Most overdue',
        'Longest gap since the number last appeared.',
        topN(new Map([...gaps.entries()].map(([n, g]) => [n, g ?? draws.length])), 8),
        (n) => `Number ${n}`,
        (v) => `${v} draws ago`,
      )}
      ${renderPairsCard()}
      ${renderSplitCard('Odd / even split', 'How the 6 main numbers split between odd and even, per draw.', oddEven, ['6-0', '5-1', '4-2', '3-3', '2-4', '1-5', '0-6'])}
      ${renderSplitCard('High / low split', 'Numbers 1–20 ("low") vs 21–40 ("high") per draw.', highLow, ['6-0', '5-1', '4-2', '3-3', '2-4', '1-5', '0-6'])}
      ${renderSplitCard('Spread across decades', 'How many of the 6 numbers land in each ten-number band, summed across all draws.', decades, ['1-10', '11-20', '21-30', '31-40'])}
      ${renderSumCard()}
      ${renderRankCard(
        'Most common bonus balls',
        'All-time bonus ball frequency.',
        topN(bonusFreq, 8),
        (n) => `Number ${n}`,
        (v) => `${v}×`,
      )}
    </div>

    ${renderFreqChart(allFreq, 1, 40, 'All-time frequency, every Lotto number (1–40)', `How many of the ${draws.length} draws each number has appeared in.`)}

    <h2 class="section-title">Powerball (1–10)</h2>
    <div class="card-grid">
      ${renderRankCard(
        `Hot Powerball numbers (last ${pbRecentWindow.length} draws)`,
        'Most frequently drawn recently.',
        topN(pbRecentFreq, 5),
        (n) => `Number ${n}`,
        (v) => `${v}×`,
      )}
      ${renderRankCard(
        'Most overdue Powerball numbers',
        'Longest gap since the number last appeared.',
        topN(new Map([...pbGaps.entries()].map(([n, g]) => [n, g ?? powerballDraws.length])), 5),
        (n) => `Number ${n}`,
        (v) => `${v} draws ago`,
      )}
    </div>
    ${renderFreqChart(pbFreq, 1, 10, 'All-time frequency, Powerball (1–10)', `Since the Powerball pool expanded to 1–10 (draw ${pbStart.drawNumber}, ${fmtDate(pbStart.date)} — it was 1–8 before that), across ${powerballDraws.length} draws.`)}
  `;

  document.getElementById('regenerateBtn').addEventListener('click', () => {
    const { count, strategy, includePowerball } = currentControls();
    document.getElementById('predictionSets').innerHTML = renderLines(generateLines(count, strategy, includePowerball));
  });

  // Delegated so it keeps working after regenerateBtn replaces predictionSets' contents.
  document.getElementById('predictionSets').addEventListener('click', (e) => {
    const btn = e.target.closest('.line-reveal-btn');
    if (btn) btn.closest('.line-row').classList.remove('line-hidden');
  });
}

render();
