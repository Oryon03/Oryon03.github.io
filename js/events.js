import { clamp, randInt, choice, formatMoney } from './utils.js';
import { addMoney, logEvent } from './state.js';
import { BUSINESS_TYPES, NBA_TEAMS } from './data.js';

export const ACTIONS = [
  {
    key: 'train',
    label: 'Train',
    icon: '\u{1F3C0}',
    desc: 'Focus on one skill in the gym to push your attributes higher.',
  },
  {
    key: 'study',
    label: 'Study',
    icon: '\u{1F4DA}',
    desc: 'Hit the books. Raises GPA and reputation. (College only)',
    collegeOnly: true,
  },
  {
    key: 'rest',
    label: 'Rest & Recover',
    icon: '\u{1F634}',
    desc: 'Recover energy and health, lowering injury risk next season.',
  },
  {
    key: 'relationship',
    label: 'Relationships',
    icon: '❤️',
    desc: 'Spend time on your love life and family.',
  },
  {
    key: 'brand',
    label: 'Build Your Brand',
    icon: '\u{1F4F1}',
    desc: 'Grind social media and public appearances to grow your fame.',
  },
  {
    key: 'business',
    label: 'Invest in Business',
    icon: '\u{1F4BC}',
    desc: 'Put your money to work in a new venture.',
  },
  {
    key: 'charity',
    label: 'Charity Work',
    icon: '\u{1F91D}',
    desc: 'Give back to the community. Boosts reputation and fame.',
  },
  {
    key: 'media',
    label: 'Media Interview',
    icon: '\u{1F3A4}',
    desc: 'Sit down for an interview. High risk, high reward for fame.',
  },
  {
    key: 'lifestyle',
    label: 'Lifestyle & Shopping',
    icon: '\u{1F3E0}',
    desc: 'Buy houses and cars. Boosts happiness, costs money.',
  },
  {
    key: 'party',
    label: 'Party / Nightlife',
    icon: '\u{1F389}',
    desc: 'Let loose. Fun and relationships, but scandal risk.',
  },
];

export function runAction(state, key, payload) {
  const p = state.player;
  switch (key) {
    case 'study': {
      p.gpa = clamp(p.gpa + randInt(1, 3) / 10, 0, 4.0);
      p.reputation = clamp(p.reputation + randInt(1, 4), 0, 100);
      return `You hit the books hard. GPA is now ${p.gpa.toFixed(2)}.`;
    }
    case 'rest': {
      p.energy = clamp(p.energy + randInt(15, 30), 0, 100);
      p.health = clamp(p.health + randInt(10, 20), 0, 100);
      return `You took time to recover. Energy and health are looking much better.`;
    }
    case 'relationship': {
      return handleRelationship(state);
    }
    case 'brand': {
      const gain = randInt(2, 6);
      p.fame = clamp(p.fame + gain, 0, 100);
      return `You grew your following with new content and appearances. Fame +${gain}.`;
    }
    case 'business': {
      return handleBusiness(state, payload);
    }
    case 'charity': {
      const cost = randInt(5000, 20000);
      if (p.money < cost) return `You wanted to donate but didn't have enough cash to make an impact this year.`;
      addMoney(state, -cost);
      p.reputation = clamp(p.reputation + randInt(4, 9), 0, 100);
      p.fame = clamp(p.fame + randInt(1, 3), 0, 100);
      return `You donated ${formatMoney(cost)} to a local charity. Your reputation is growing.`;
    }
    case 'media': {
      return handleMedia(state);
    }
    case 'lifestyle': {
      return handleLifestyle(state, payload);
    }
    case 'party': {
      return handleParty(state);
    }
    default:
      return '';
  }
}

function handleRelationship(state) {
  const p = state.player;
  const r = p.relationship;
  if (r.status === 'single') {
    if (Math.random() < 0.55) {
      r.status = 'dating';
      r.partnerName = choice(['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Skylar']);
      r.years = 0;
      p.happiness = clamp(p.happiness + 8, 0, 100);
      return `You started dating ${r.partnerName}. Things are looking up.`;
    }
    p.happiness = clamp(p.happiness + 2, 0, 100);
    return `You went out and met some new people, but nothing serious yet.`;
  }
  if (r.status === 'dating') {
    r.years += 1;
    if (r.years >= 1 && Math.random() < 0.3) {
      r.status = 'married';
      p.happiness = clamp(p.happiness + 15, 0, 100);
      p.fame = clamp(p.fame + 2, 0, 100);
      return `You proposed to ${r.partnerName} and got married! The wedding made local headlines.`;
    }
    if (Math.random() < 0.15) {
      const ex = r.partnerName;
      r.status = 'single';
      r.partnerName = null;
      r.years = 0;
      p.happiness = clamp(p.happiness - 10, 0, 100);
      return `You and ${ex} broke up. Rough offseason.`;
    }
    p.happiness = clamp(p.happiness + 5, 0, 100);
    return `You spent quality time with ${r.partnerName}. The relationship is getting stronger.`;
  }
  if (r.status === 'married') {
    if (Math.random() < 0.35) {
      const kidName = choice(['Jr.', 'Nova', 'Sky', 'Zaire', 'Amara', 'Legend', 'Blessing']);
      p.kids.push({ name: kidName, age: 0 });
      p.happiness = clamp(p.happiness + 12, 0, 100);
      return `You and ${r.partnerName} welcomed a new baby! Say hello to ${kidName}.`;
    }
    p.happiness = clamp(p.happiness + 6, 0, 100);
    return `You spent quality time with your family. Life at home is good.`;
  }
  return `You caught up with old friends.`;
}

function handleBusiness(state, payload) {
  const p = state.player;
  const type = BUSINESS_TYPES.find((b) => b.key === payload) || choice(BUSINESS_TYPES);
  if (p.money < type.minInvest) {
    return `You wanted to invest in a ${type.name.toLowerCase()}, but you don't have the ${formatMoney(type.minInvest)} needed yet.`;
  }
  addMoney(state, -type.minInvest);
  const success = Math.random() < type.riskLow;
  const biz = {
    name: `${p.name.split(' ')[0]}'s ${type.name}`,
    type: type.key,
    invested: type.minInvest,
    value: type.minInvest,
    income: 0,
  };
  if (success) {
    const roi = 1 + Math.random() * 1.5;
    biz.value = Math.round(type.minInvest * roi);
    biz.income = Math.round(biz.value * 0.08);
    p.businesses.push(biz);
    return `Your ${type.name.toLowerCase()} investment (${formatMoney(type.minInvest)}) took off! It's now worth ${formatMoney(biz.value)} and pays out annually.`;
  }
  const loss = Math.random() * 0.7;
  biz.value = Math.round(type.minInvest * (1 - loss));
  biz.income = Math.round(biz.value * 0.03);
  p.businesses.push(biz);
  return `Your ${type.name.toLowerCase()} investment struggled. It's now only worth ${formatMoney(biz.value)}.`;
}

function handleMedia(state) {
  const p = state.player;
  const roll = Math.random();
  if (roll < 0.6) {
    const gain = randInt(4, 10);
    p.fame = clamp(p.fame + gain, 0, 100);
    p.reputation = clamp(p.reputation + randInt(1, 4), 0, 100);
    return `Your interview went great. Clips are all over social media. Fame +${gain}.`;
  }
  if (roll < 0.85) {
    return `The interview was pretty forgettable. No real change either way.`;
  }
  const loss = randInt(5, 12);
  p.reputation = clamp(p.reputation - loss, 0, 100);
  p.fame = clamp(p.fame + randInt(2, 6), 0, 100);
  return `You said something controversial and it blew up online. Reputation -${loss}, but people are definitely talking about you.`;
}

function handleLifestyle(state, payload) {
  const p = state.player;
  if (payload === 'car') {
    const cost = randInt(40000, 250000);
    if (p.money < cost) return `You browsed dealerships but couldn't afford anything worth buying yet.`;
    addMoney(state, -cost);
    p.cars.push({ name: choice(['Sports Coupe', 'Luxury Sedan', 'Custom SUV', 'Classic Muscle Car']), value: cost });
    p.happiness = clamp(p.happiness + 8, 0, 100);
    p.reputation = clamp(p.reputation + 2, 0, 100);
    return `You bought a new car for ${formatMoney(cost)}. Looking good rolling up to practice.`;
  }
  const cost = randInt(300000, 2500000);
  if (p.money < cost) return `You toured some houses but nothing in your budget yet.`;
  addMoney(state, -cost);
  p.houses.push({ name: choice(['Downtown Condo', 'Suburban Estate', 'Lakefront House', 'Family Home']), value: cost });
  p.happiness = clamp(p.happiness + 12, 0, 100);
  return `You bought a new place for ${formatMoney(cost)}. Home sweet home.`;
}

function handleParty(state) {
  const p = state.player;
  p.happiness = clamp(p.happiness + randInt(6, 14), 0, 100);
  p.energy = clamp(p.energy - randInt(5, 15), 0, 100);
  const roll = Math.random();
  if (roll < 0.2) {
    const repLoss = randInt(8, 20);
    p.reputation = clamp(p.reputation - repLoss, 0, 100);
    p.fame = clamp(p.fame + randInt(3, 8), 0, 100);
    return `A wild night out turned into a viral scandal. Reputation -${repLoss}.`;
  }
  p.fame = clamp(p.fame + randInt(1, 4), 0, 100);
  return `You had a great night out and recharged mentally.`;
}

export const LIFE_EVENTS = [
  {
    id: 'agent_call',
    phase: 'any',
    weight: 10,
    title: 'A New Agent Reaches Out',
    text: 'A hungry young agent is pitching you on representation, promising big endorsement deals.',
    choices: [
      {
        label: 'Sign with them',
        apply: (state) => {
          state.player.fame = clamp(state.player.fame + 5, 0, 100);
          return `You signed on. They immediately land you a small local endorsement.`;
        },
      },
      {
        label: 'Pass for now',
        apply: () => `You decide to wait and see who else reaches out.`,
      },
    ],
  },
  {
    id: 'shoe_deal',
    phase: 'any',
    weight: 8,
    condition: (state) => state.player.fame >= 30,
    title: 'Shoe Company Offer',
    text: 'A shoe brand wants to sign you to an endorsement deal.',
    choices: [
      {
        label: 'Sign the deal',
        apply: (state) => {
          const annual = Math.round(20000 + state.player.fame * 1800 + Math.random() * 20000);
          state.player.endorsements.push({ name: 'Shoe Deal', tier: state.player.fame >= 70 ? 'Signature' : 'Standard', annual });
          addMoney(state, annual);
          return `You signed a shoe deal worth ${formatMoney(annual)} this year!`;
        },
      },
      {
        label: 'Hold out for more',
        apply: (state) => {
          if (Math.random() < 0.4) {
            state.player.fame = clamp(state.player.fame + 3, 0, 100);
            return `Good move — a bigger brand noticed you instead.`;
          }
          return `The offer was pulled off the table. Maybe next year.`;
        },
      },
    ],
  },
  {
    id: 'family_ask',
    phase: 'any',
    weight: 6,
    condition: (state) => state.player.money > 10000,
    title: 'Family Needs Help',
    text: 'A family member asks you for financial help.',
    choices: [
      {
        label: 'Help them out',
        apply: (state) => {
          const amt = randInt(2000, 15000);
          addMoney(state, -amt);
          state.player.happiness = clamp(state.player.happiness + 6, 0, 100);
          state.player.reputation = clamp(state.player.reputation + 3, 0, 100);
          return `You sent ${formatMoney(amt)} home. Family means everything.`;
        },
      },
      {
        label: 'Say no',
        apply: (state) => {
          state.player.happiness = clamp(state.player.happiness - 5, 0, 100);
          return `You turned them down. It's a little tense at home now.`;
        },
      },
    ],
  },
  {
    id: 'recruiting_scandal',
    phase: 'college',
    weight: 5,
    title: 'NCAA Compliance Inquiry',
    text: 'The NCAA is asking questions about a booster who paid for your dinner.',
    choices: [
      {
        label: 'Cooperate fully',
        apply: (state) => {
          state.player.reputation = clamp(state.player.reputation + 4, 0, 100);
          return `You cooperated and it blew over quickly. Your reputation actually improved.`;
        },
      },
      {
        label: 'Stay quiet',
        apply: (state) => {
          if (Math.random() < 0.5) {
            state.player.reputation = clamp(state.player.reputation - 10, 0, 100);
            return `Word got out that you weren't cooperative. Reputation -10.`;
          }
          return `It quietly went away. Dodged a bullet.`;
        },
      },
    ],
  },
  {
    id: 'nil_deal',
    phase: 'college',
    weight: 9,
    condition: (state) => state.player.fame >= 15,
    title: 'NIL Opportunity',
    text: 'A local business wants to pay you for a Name, Image & Likeness deal.',
    choices: [
      {
        label: 'Take the deal',
        apply: (state) => {
          const amt = randInt(3000, 40000) + state.player.fame * 300;
          addMoney(state, amt);
          return `You cashed in on an NIL deal worth ${formatMoney(amt)}.`;
        },
      },
      {
        label: 'Decline',
        apply: () => `You decided to focus on ball instead.`,
      },
    ],
  },
  {
    id: 'trade_rumor',
    phase: 'nba',
    weight: 7,
    title: 'Trade Rumors Swirl',
    text: 'Reports surface that your team is shopping you around the league.',
    choices: [
      {
        label: 'Request a trade publicly',
        apply: (state) => {
          state.player.fame = clamp(state.player.fame + 4, 0, 100);
          if (Math.random() < 0.5 && state.player.nbaTeam) {
            const newTeam = choice(NBA_TEAMS.filter((t) => t.abbr !== state.player.nbaTeam.abbr));
            state.player.nbaTeam = newTeam;
            logEvent(state, `Traded to the ${newTeam.name}.`);
            return `The trade went through — you're now on the ${newTeam.name}.`;
          }
          return `Nothing came of it, but the front office knows how you feel.`;
        },
      },
      {
        label: 'Stay quiet and play it out',
        apply: () => `You kept your head down and let your play do the talking.`,
      },
    ],
  },
  {
    id: 'coach_conflict',
    phase: 'any',
    weight: 6,
    title: 'Conflict with the Coaching Staff',
    text: 'You disagree with your coach about your role on the team.',
    choices: [
      {
        label: 'Talk it out respectfully',
        apply: (state) => {
          state.player.reputation = clamp(state.player.reputation + 3, 0, 100);
          return `You handled it like a pro. Respect earned in the locker room.`;
        },
      },
      {
        label: 'Air it out to the media',
        apply: (state) => {
          state.player.fame = clamp(state.player.fame + 5, 0, 100);
          state.player.reputation = clamp(state.player.reputation - 6, 0, 100);
          return `Your comments made headlines. Fame up, but some see you as a distraction.`;
        },
      },
    ],
  },
  {
    id: 'injury_scare',
    phase: 'any',
    weight: 4,
    title: 'Minor Health Scare',
    text: 'You wake up with unusual soreness and get sent for tests.',
    choices: [
      {
        label: 'Get checked out immediately',
        apply: (state) => {
          state.player.health = clamp(state.player.health + 5, 0, 100);
          return `Tests came back clean. Better safe than sorry.`;
        },
      },
      {
        label: 'Play through it',
        apply: (state) => {
          if (Math.random() < 0.3) {
            state.player.health = clamp(state.player.health - 15, 0, 100);
            return `You pushed too hard and aggravated it. Health -15.`;
          }
          return `Turned out to be nothing. You saved some time.`;
        },
      },
    ],
  },
  {
    id: 'investment_tip',
    phase: 'any',
    weight: 5,
    condition: (state) => state.player.money > 20000,
    title: 'Hot Investment Tip',
    text: 'A teammate tells you about a can\'t-miss investment opportunity.',
    choices: [
      {
        label: 'Put in $20,000',
        apply: (state) => {
          addMoney(state, -20000);
          if (Math.random() < 0.45) {
            const ret = randInt(30000, 90000);
            addMoney(state, ret);
            return `It paid off big! You turned $20,000 into ${formatMoney(ret)}.`;
          }
          return `It was a bust. You lost the $20,000.`;
        },
      },
      {
        label: 'Pass',
        apply: () => `You decided not to risk it.`,
      },
    ],
  },
  {
    id: 'documentary',
    phase: 'any',
    weight: 4,
    condition: (state) => state.player.fame >= 50,
    title: 'Documentary Offer',
    text: 'A streaming service wants to film a documentary about your journey.',
    choices: [
      {
        label: 'Let them in',
        apply: (state) => {
          const amt = randInt(50000, 300000);
          addMoney(state, amt);
          state.player.fame = clamp(state.player.fame + 10, 0, 100);
          return `The documentary was a hit. You earned ${formatMoney(amt)} and your fame jumped.`;
        },
      },
      {
        label: 'Keep your life private',
        apply: (state) => {
          state.player.happiness = clamp(state.player.happiness + 4, 0, 100);
          return `You valued your privacy. Peace of mind is worth something too.`;
        },
      },
    ],
  },
];

export function rollLifeEvents(state, count = 2) {
  const league = state.meta.league;
  const pool = LIFE_EVENTS.filter((e) => (e.phase === 'any' || e.phase === league) && (!e.condition || e.condition(state)));
  const results = [];
  const used = new Set();
  for (let i = 0; i < count && pool.length; i++) {
    if (Math.random() > 0.7) continue;
    const candidates = pool.filter((e) => !used.has(e.id));
    if (!candidates.length) break;
    const totalWeight = candidates.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * totalWeight;
    let picked = candidates[0];
    for (const c of candidates) {
      if (r < c.weight) { picked = c; break; }
      r -= c.weight;
    }
    used.add(picked.id);
    results.push(picked);
  }
  return results;
}
