export const ATTRS = ['sht', 'plm', 'reb', 'def', 'ath', 'iq'];

export const ATTR_LABELS = {
  sht: 'Shooting',
  plm: 'Playmaking',
  reb: 'Rebounding',
  def: 'Defense',
  ath: 'Athleticism',
  iq: 'BBall IQ',
};

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

export const POSITION_LABELS = {
  PG: 'Point Guard',
  SG: 'Shooting Guard',
  SF: 'Small Forward',
  PF: 'Power Forward',
  C: 'Center',
};

export const ARCHETYPES = [
  {
    key: 'sharpshooter',
    name: 'Sharpshooter',
    desc: 'Deadly from deep. Bonus to Shooting.',
    bonus: { sht: 8, iq: 2 },
  },
  {
    key: 'slasher',
    name: 'Slasher',
    desc: 'Explosive athlete who attacks the rim. Bonus to Athleticism.',
    bonus: { ath: 8, sht: 2 },
  },
  {
    key: 'playmaker',
    name: 'Floor General',
    desc: 'Elite vision and ball-handling. Bonus to Playmaking.',
    bonus: { plm: 8, iq: 2 },
  },
  {
    key: 'anchor',
    name: 'Defensive Anchor',
    desc: 'Lockdown defender who protects the paint. Bonus to Defense.',
    bonus: { def: 8, reb: 2 },
  },
  {
    key: 'glass',
    name: 'Glass Cleaner',
    desc: 'Dominates the boards on both ends. Bonus to Rebounding.',
    bonus: { reb: 8, ath: 2 },
  },
  {
    key: 'grinder',
    name: 'Gym Rat',
    desc: 'No elite tool yet, but sky-high potential across the board.',
    bonus: { iq: 4 },
    potentialBonus: 6,
  },
];

export const FIRST_NAMES = [
  'Marcus', 'Jalen', 'Devon', 'Trey', 'Isaiah', 'Xavier', 'Malik', 'Cameron',
  'Elijah', 'Jordan', 'Tyrese', 'Amir', 'Darius', 'Anthony', 'Kobe', 'Jaylen',
  'Terrence', 'Dominique', 'Andre', 'Julian', 'Zion', 'Caleb', 'Josiah', 'Miles',
  'DeShawn', 'Bryson', 'Kendrick', 'Nasir', 'Omari', 'Rashad',
];

export const LAST_NAMES = [
  'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor',
  'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson',
  'Robinson', 'Clark', 'Lewis', 'Walker', 'Young', 'King', 'Wright', 'Hill',
  'Green', 'Baker', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner',
];

export const HOMETOWNS = [
  'Chicago, IL', 'Brooklyn, NY', 'Compton, CA', 'Houston, TX', 'Atlanta, GA',
  'Detroit, MI', 'Philadelphia, PA', 'New Orleans, LA', 'Memphis, TN',
  'Baltimore, MD', 'Cleveland, OH', 'Oakland, CA', 'Miami, FL', 'St. Louis, MO',
  'Newark, NJ', 'Charlotte, NC', 'Milwaukee, WI', 'Columbus, OH', 'Dallas, TX',
  'Indianapolis, IN',
];

export const COLLEGES = [
  { name: 'Duke', conf: 'ACC', prestige: 5 },
  { name: 'Kentucky', conf: 'SEC', prestige: 5 },
  { name: 'Kansas', conf: 'Big 12', prestige: 5 },
  { name: 'North Carolina', conf: 'ACC', prestige: 5 },
  { name: 'UCLA', conf: 'Pac-12', prestige: 4 },
  { name: 'Michigan State', conf: 'Big Ten', prestige: 4 },
  { name: 'Villanova', conf: 'Big East', prestige: 4 },
  { name: 'Gonzaga', conf: 'WCC', prestige: 4 },
  { name: 'Arizona', conf: 'Pac-12', prestige: 4 },
  { name: 'Louisville', conf: 'ACC', prestige: 3 },
  { name: 'Indiana', conf: 'Big Ten', prestige: 3 },
  { name: 'Syracuse', conf: 'ACC', prestige: 3 },
  { name: 'Memphis', conf: 'AAC', prestige: 3 },
  { name: 'Xavier', conf: 'Big East', prestige: 3 },
  { name: 'Iowa State', conf: 'Big 12', prestige: 2 },
  { name: 'Saint Louis', conf: 'A-10', prestige: 2 },
  { name: 'Wyoming', conf: 'Mountain West', prestige: 1 },
  { name: 'Toledo', conf: 'MAC', prestige: 1 },
  { name: 'Vermont', conf: 'America East', prestige: 1 },
  { name: 'Norfolk State', conf: 'MEAC', prestige: 1 },
];

export const NBA_TEAMS = [
  { name: 'Los Angeles Lakers', abbr: 'LAL', market: 5 },
  { name: 'Golden State Warriors', abbr: 'GSW', market: 5 },
  { name: 'New York Knicks', abbr: 'NYK', market: 5 },
  { name: 'Brooklyn Nets', abbr: 'BKN', market: 5 },
  { name: 'Chicago Bulls', abbr: 'CHI', market: 4 },
  { name: 'Miami Heat', abbr: 'MIA', market: 4 },
  { name: 'Boston Celtics', abbr: 'BOS', market: 4 },
  { name: 'Dallas Mavericks', abbr: 'DAL', market: 4 },
  { name: 'Houston Rockets', abbr: 'HOU', market: 4 },
  { name: 'Philadelphia 76ers', abbr: 'PHI', market: 3 },
  { name: 'Phoenix Suns', abbr: 'PHX', market: 3 },
  { name: 'Toronto Raptors', abbr: 'TOR', market: 3 },
  { name: 'Denver Nuggets', abbr: 'DEN', market: 3 },
  { name: 'Atlanta Hawks', abbr: 'ATL', market: 3 },
  { name: 'Portland Trail Blazers', abbr: 'POR', market: 3 },
  { name: 'Sacramento Kings', abbr: 'SAC', market: 2 },
  { name: 'San Antonio Spurs', abbr: 'SAS', market: 2 },
  { name: 'Orlando Magic', abbr: 'ORL', market: 2 },
  { name: 'Minnesota Timberwolves', abbr: 'MIN', market: 2 },
  { name: 'New Orleans Pelicans', abbr: 'NOP', market: 2 },
  { name: 'Utah Jazz', abbr: 'UTA', market: 2 },
  { name: 'Cleveland Cavaliers', abbr: 'CLE', market: 2 },
  { name: 'Indiana Pacers', abbr: 'IND', market: 2 },
  { name: 'Charlotte Hornets', abbr: 'CHA', market: 2 },
  { name: 'Washington Wizards', abbr: 'WAS', market: 2 },
  { name: 'Milwaukee Bucks', abbr: 'MIL', market: 2 },
  { name: 'Detroit Pistons', abbr: 'DET', market: 1 },
  { name: 'Oklahoma City Thunder', abbr: 'OKC', market: 1 },
  { name: 'Memphis Grizzlies', abbr: 'MEM', market: 1 },
  { name: 'Los Angeles Clippers', abbr: 'LAC', market: 4 },
];

export const BUSINESS_TYPES = [
  { key: 'restaurant', name: 'Restaurant', minInvest: 50000, riskLow: 0.55 },
  { key: 'realestate', name: 'Real Estate', minInvest: 100000, riskLow: 0.7 },
  { key: 'startup', name: 'Tech Startup', minInvest: 25000, riskLow: 0.35 },
  { key: 'clothing', name: 'Clothing Line', minInvest: 40000, riskLow: 0.45 },
  { key: 'gym', name: 'Training Academy', minInvest: 60000, riskLow: 0.6 },
];
