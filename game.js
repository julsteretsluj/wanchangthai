/**
 * Wan Chang Thai — Protect the Elephant
 * Keep Love, Hunger & Health high; handle poachers, tourists, and impoverished civilians.
 */

const state = {
  lang: localStorage.getItem('wanchangthai_lang') || 'en',
  elephantName: 'Wan Chang Thai',
  love: 80,
  hunger: 70,
  health: 90,
  money: 110,
  food: 6,
  level: 1,
  threatsDefeatedThisLevel: 0,
  totalThreatsDefeated: 0,
  threatActive: false,
  threatType: null,
  threatTimer: null,
  threatWarningTimer: null,
  decayInterval: null,
  flyingBananaTimer: null,
  gameOver: false,
  levelComplete: false,
  paused: false,
  meritPoints: parseInt(localStorage.getItem('wanchangthai_merit'), 10) || 0,
};

const CONFIG = {
  decayRate: 1.0,
  decayIntervalMs: 1100,
  threatIntervalMin: 3500,
  threatIntervalMax: 7500,
  threatWarningMs: 4500,
  levelBonusLove: 8,
  levelBonusHunger: 8,
  levelBonusHealth: 8,
  levelBonusMoney: 8,
  levelBonusFood: 1,
  feedHunger: 28,
  feedLove: 6,
  careHealth: 22,
  careLove: 6,
  loveAmount: 20,
  loveHealth: 6,
  minScale: 0,
  maxScale: 100,
  startMoney: 35,
  startFood: 3,
  foodGainInterval: 22000,
  moneyGainInterval: 9000,
  moneyGain: 5,
  foodGain: 1,
  meritPerThreatResolved: 12,
  meritPerCareAction: 2,
  bananaCost: 12,
  bananaCost3: 32,
  bananaCost5: 50,
  feedSugarCaneHunger: 42,
  feedSugarCaneLove: 10,
  flyingBananaIntervalMin: 2500,
  flyingBananaIntervalMax: 5000,
  flyingBananaLifetime: 4500,
};

const RANKS = [
  { minPoints: 0, key: 'rank_local_worker' },
  { minPoints: 50, key: 'rank_local_conservationist' },
  { minPoints: 120, key: 'rank_regional_advocate' },
  { minPoints: 200, key: 'rank_elephant_guardian' },
  { minPoints: 300, key: 'rank_senior_conservationist' },
  { minPoints: 450, key: 'rank_master_guardian' },
];

function getRankForMerit(merit) {
  let current = RANKS[0];
  for (let i = 0; i < RANKS.length; i++) {
    if (merit >= RANKS[i].minPoints) current = RANKS[i];
  }
  return current;
}

function getNextRank(currentRank) {
  const idx = RANKS.findIndex((r) => r.key === currentRank.key);
  return idx >= 0 && idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

const THREATS = {
  poacher: {
    icon: '⚠️',
    approachKey: 'poacher_approach',
    strikeKey: 'poacher_strike',
    damage: { love: 22, hunger: 14, health: 32 },
    actions: [
      { id: 'pay', labelKey: 'poacher_pay_label', costMoney: 40, costFood: 0, resolveKey: 'poacher_pay_resolve' },
      { id: 'food', labelKey: 'poacher_food_label', costMoney: 0, costFood: 2, resolveKey: 'poacher_food_resolve' },
    ],
  },
  tourist: {
    icon: '📷',
    approachKey: 'tourist_approach',
    strikeKey: 'tourist_strike',
    damage: { love: 28, hunger: 0, health: 14 },
    actions: [
      { id: 'ask', labelKey: 'tourist_ask_label', costMoney: 0, costFood: 0, resolveKey: 'tourist_ask_resolve' },
      { id: 'tour', labelKey: 'tourist_tour_label', costMoney: 25, costFood: 0, resolveKey: 'tourist_tour_resolve' },
    ],
  },
  civilian: {
    icon: '🫂',
    approachKey: 'civilian_approach',
    strikeKey: 'civilian_strike',
    damage: { love: 8, hunger: 10, health: 8 },
    actions: [
      { id: 'give_food', labelKey: 'civilian_food_label', costMoney: 0, costFood: 1, resolveKey: 'civilian_food_resolve' },
      { id: 'give_money', labelKey: 'civilian_money_label', costMoney: 10, costFood: 0, resolveKey: 'civilian_money_resolve' },
    ],
  },
};

const THREAT_IDS = Object.keys(THREATS);

function getThreatsRequiredForLevel(level) {
  return Math.min(2 + level, 10);
}

const LEVEL_PLACES = {
  1: { key: 'place_chiang_mai', x: 8, y: 20 },
  2: { key: 'place_lampang', x: 18, y: 35 },
  3: { key: 'place_kanchanaburi', x: 12, y: 55 },
  4: { key: 'place_ayutthaya', x: 28, y: 45 },
  5: { key: 'place_khao_yai', x: 42, y: 28 },
  6: { key: 'place_bangkok', x: 38, y: 62 },
  7: { key: 'place_hua_hin', x: 28, y: 82 },
  8: { key: 'place_surin', x: 55, y: 45 },
  9: { key: 'place_phuket', x: 22, y: 92 },
  10: { key: 'place_chiang_rai', x: 12, y: 8 },
};

const MAX_LEVEL = 10;

function getPlaceForLevel(level) {
  return LEVEL_PLACES[Math.min(level, MAX_LEVEL)] || LEVEL_PLACES[MAX_LEVEL];
}

function showPlaceIntro(level) {
  const place = getPlaceForLevel(level);
  const introKey = place.key + '_intro';
  const intro = t(introKey);
  if (intro !== introKey) showMessage(intro, 'neutral', 0);
}

window.__wanchangthai_lang = state.lang;

const el = {
  langSwitcher: document.getElementById('langSwitcher'),
  nameModal: document.getElementById('nameModal'),
  nameForm: document.getElementById('nameForm'),
  elephantNameInput: document.getElementById('elephantNameInput'),
  elephantNameDisplay: document.getElementById('elephantNameDisplay'),
  gameMain: document.getElementById('gameMain'),
  scene: document.getElementById('scene'),
  flyingBananas: document.getElementById('flyingBananas'),
  threatFigures: document.getElementById('threatFigures'),
  threat1: document.getElementById('threat1'),
  threat2: document.getElementById('threat2'),
  loveBar: document.getElementById('loveBar'),
  loveVal: document.getElementById('loveVal'),
  hungerBar: document.getElementById('hungerBar'),
  hungerVal: document.getElementById('hungerVal'),
  healthBar: document.getElementById('healthBar'),
  healthVal: document.getElementById('healthVal'),
  moneyVal: document.getElementById('moneyVal'),
  foodVal: document.getElementById('foodVal'),
  threatPanel: document.getElementById('threatPanel'),
  threatAlertText: document.getElementById('threatAlertText'),
  threatActions: document.getElementById('threatActions'),
  actionButtons: document.getElementById('actionButtons'),
  btnFeed: document.getElementById('btnFeed'),
  btnFeedSugarCane: document.getElementById('btnFeedSugarCane'),
  btnBuyBananas: document.getElementById('btnBuyBananas'),
  btnBuyBananas3: document.getElementById('btnBuyBananas3'),
  btnBuyBananas5: document.getElementById('btnBuyBananas5'),
  btnCare: document.getElementById('btnCare'),
  btnLove: document.getElementById('btnLove'),
  btnSave: document.getElementById('btnSave'),
  btnSavePause: document.getElementById('btnSavePause'),
  btnPause: document.getElementById('btnPause'),
  btnResume: document.getElementById('btnResume'),
  btnRestart: document.getElementById('btnRestart'),
  btnRestartOverlay: document.getElementById('btnRestartOverlay'),
  btnNewPlayer: document.getElementById('btnNewPlayer'),
  btnNewPlayerOverlay: document.getElementById('btnNewPlayerOverlay'),
  messageArea: document.getElementById('messageArea'),
  elephant: document.getElementById('elephant'),
  bubble: document.getElementById('bubble'),
  levelDisplay: document.getElementById('levelDisplay'),
  levelNum: document.getElementById('levelNum'),
  levelPlace: document.getElementById('levelPlace'),
  levelProgress: document.getElementById('levelProgress'),
  journeyMap: document.getElementById('journeyMap'),
  mapThailand: document.getElementById('mapThailand'),
  levelCompleteModal: document.getElementById('levelCompleteModal'),
  levelCompleteText: document.getElementById('levelCompleteText'),
  levelCompleteSaveNote: document.getElementById('levelCompleteSaveNote'),
  btnNextLevel: document.getElementById('btnNextLevel'),
  meritDisplay: document.getElementById('meritDisplay'),
  meritVal: document.getElementById('meritVal'),
  rankDisplay: document.getElementById('rankDisplay'),
  pauseOverlay: document.getElementById('pauseOverlay'),
  leaderboardBtn: document.getElementById('leaderboardBtn'),
  leaderboardModal: document.getElementById('leaderboardModal'),
  leaderboardList: document.getElementById('leaderboardList'),
  leaderboardLoading: document.getElementById('leaderboardLoading'),
  leaderboardDisabled: document.getElementById('leaderboardDisabled'),
  leaderboardClose: document.getElementById('leaderboardClose'),
};

function clamp(val, min = CONFIG.minScale, max = CONFIG.maxScale) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function updateUI() {
  el.loveBar.style.width = state.love + '%';
  el.loveVal.textContent = state.love;
  el.hungerBar.style.width = state.hunger + '%';
  el.hungerVal.textContent = state.hunger;
  el.healthBar.style.width = state.health + '%';
  el.healthVal.textContent = state.health;
  el.moneyVal.textContent = state.money;
  el.foodVal.textContent = state.food;

  const required = getThreatsRequiredForLevel(state.level);
  if (el.levelNum) el.levelNum.textContent = state.level;
  const place = getPlaceForLevel(state.level);
  if (el.levelPlace) el.levelPlace.textContent = t(place.key);
  if (el.levelProgress) el.levelProgress.textContent = t('threatsProgress', { current: state.threatsDefeatedThisLevel, required });
  renderJourneyMap();

  const rank = getRankForMerit(state.meritPoints);
  if (el.meritVal) el.meritVal.textContent = state.meritPoints;
  if (el.rankDisplay) el.rankDisplay.textContent = t(rank.key);

  el.btnFeed.disabled = state.food < 1 || state.gameOver || state.levelComplete || state.paused;
  if (el.btnFeedSugarCane) el.btnFeedSugarCane.disabled = state.food < 2 || state.gameOver || state.levelComplete || state.paused;
  if (el.btnBuyBananas) {
    el.btnBuyBananas.disabled = state.money < CONFIG.bananaCost || state.gameOver || state.levelComplete || state.paused;
    el.btnBuyBananas.title = t('buyBananasTitle', { cost: CONFIG.bananaCost });
  }
  if (el.btnBuyBananas3) {
    el.btnBuyBananas3.disabled = state.money < CONFIG.bananaCost3 || state.gameOver || state.levelComplete || state.paused;
    el.btnBuyBananas3.title = t('buyBananas3Title', { cost: CONFIG.bananaCost3 });
  }
  if (el.btnBuyBananas5) {
    el.btnBuyBananas5.disabled = state.money < CONFIG.bananaCost5 || state.gameOver || state.levelComplete || state.paused;
    el.btnBuyBananas5.title = t('buyBananas5Title', { cost: CONFIG.bananaCost5 });
  }
  if (el.btnPause) {
    el.btnPause.textContent = state.paused ? t('resumeBtn') : t('pauseBtn');
    el.btnPause.disabled = state.gameOver;
  }
  const hasLeaderboard = typeof window.wanchangthaiLeaderboard !== 'undefined' && window.wanchangthaiLeaderboard.saveScore;
  if (el.btnSave) el.btnSave.disabled = state.gameOver || state.levelComplete || !hasLeaderboard;
  if (el.btnSavePause) el.btnSavePause.disabled = !hasLeaderboard;
  updateThreatButtons();
}

function renderJourneyMap() {
  if (!el.mapThailand) return;
  el.mapThailand.innerHTML = '';
  const currentLevel = state.level;
  for (let level = 1; level <= MAX_LEVEL; level++) {
    const place = getPlaceForLevel(level);
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'map-marker' + (level === currentLevel ? ' current' : '') + (level < currentLevel ? ' visited' : '');
    marker.style.left = place.x + '%';
    marker.style.top = place.y + '%';
    marker.textContent = level;
    marker.title = t(place.key);
    marker.setAttribute('aria-label', t('mapMarkerLabel', { level, place: t(place.key) }));
    el.mapThailand.appendChild(marker);
  }
}

function applyTranslations() {
  window.__wanchangthai_lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    if (key) node.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    const key = node.getAttribute('data-i18n-placeholder');
    if (key) node.placeholder = t(key);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((node) => {
    const key = node.getAttribute('data-i18n-title');
    if (key) {
      let val = t(key);
      if (key === 'buyBananasTitle') val = t(key, { cost: CONFIG.bananaCost });
      else if (key === 'buyBananas3Title') val = t(key, { cost: CONFIG.bananaCost3 });
      else if (key === 'buyBananas5Title') val = t(key, { cost: CONFIG.bananaCost5 });
      else if (key === 'sugarCaneTitle') val = t(key);
      node.title = val;
      if (node.tagName === 'BUTTON') node.setAttribute('aria-label', val);
    }
  });
  if (document.title !== undefined) document.title = t('pageTitle');
  const required = getThreatsRequiredForLevel(state.level);
  const place = getPlaceForLevel(state.level);
  if (el.levelPlace) el.levelPlace.textContent = t(place.key);
  if (el.levelProgress) el.levelProgress.textContent = t('threatsProgress', { current: state.threatsDefeatedThisLevel, required });
  renderJourneyMap();
  if (el.langSwitcher) {
    el.langSwitcher.querySelectorAll('.lang-btn').forEach((btn) => {
      const lang = btn.getAttribute('data-lang');
      btn.classList.toggle('active', lang === state.lang);
      btn.setAttribute('aria-pressed', lang === state.lang ? 'true' : 'false');
    });
  }
  if (state.threatActive && state.threatType && el.threatAlertText) {
    const threat = THREATS[state.threatType];
    if (threat) el.threatAlertText.textContent = t(threat.approachKey);
  }
  const rank = getRankForMerit(state.meritPoints);
  if (el.rankDisplay) el.rankDisplay.textContent = t(rank.key);
  if (el.btnPause) el.btnPause.textContent = state.paused ? t('resumeBtn') : t('pauseBtn');
  const pauseTitle = document.querySelector('.pause-title');
  if (pauseTitle) pauseTitle.textContent = t('pauseTitle');
  if (el.btnResume) el.btnResume.textContent = t('resumeBtn');
  if (el.btnRestart) el.btnRestart.textContent = t('restartBtn');
  if (el.btnRestartOverlay) el.btnRestartOverlay.textContent = t('restartBtn');
  if (el.btnNewPlayer) el.btnNewPlayer.textContent = t('newPlayerBtn');
  if (el.btnNewPlayerOverlay) el.btnNewPlayerOverlay.textContent = t('newPlayerBtn');
}

function updateThreatButtons() {
  if (!el.threatActions) return;
  const btns = el.threatActions.querySelectorAll('button[data-action-id]');
  const threat = state.threatType ? THREATS[state.threatType] : null;
  if (!threat) return;
  btns.forEach((btn) => {
    const actionId = btn.dataset.actionId;
    const action = threat.actions.find((a) => a.id === actionId);
    if (action) {
      btn.disabled = state.gameOver || state.paused || state.money < action.costMoney || state.food < action.costFood;
    }
  });
}

function showMessage(text, type = 'neutral', durationMs = 3200) {
  const msg = document.createElement('div');
  msg.className = `message message-${type}`;
  msg.setAttribute('role', type === 'bad' ? 'alert' : 'status');
  const icon = type === 'good' ? '✓' : type === 'bad' ? '⚠' : '•';
  const iconSpan = document.createElement('span');
  iconSpan.className = 'message-icon';
  iconSpan.textContent = icon;
  iconSpan.setAttribute('aria-hidden', 'true');
  msg.appendChild(iconSpan);
  const textSpan = document.createElement('span');
  textSpan.className = 'message-text';
  textSpan.textContent = text;
  msg.appendChild(textSpan);
  el.messageArea.appendChild(msg);
  if (durationMs > 0) setTimeout(() => msg.remove(), durationMs);
}

function showBubble(emoji) {
  el.bubble.textContent = emoji;
  el.bubble.classList.add('show');
  setTimeout(() => el.bubble.classList.remove('show'), 1200);
}

function spawnFlyingBanana() {
  if (!el.flyingBananas || state.gameOver || state.paused || state.levelComplete) return;
  const banana = document.createElement('button');
  banana.type = 'button';
  banana.className = 'flying-banana';
  banana.textContent = '🍌';
  banana.title = t('flyingBananaTitle');
  banana.setAttribute('aria-label', t('flyingBananaTitle'));
  const x = 15 + Math.random() * 70;
  const y = 15 + Math.random() * 70;
  banana.style.left = x + '%';
  banana.style.top = y + '%';
  banana.style.animationDelay = Math.random() * 0.5 + 's';
  banana.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (banana.classList.contains('collected')) return;
    banana.classList.add('collected');
    state.food++;
    showMessage(t('msg_flyingBanana'), 'good');
    updateUI();
    setTimeout(() => banana.remove(), 320);
  });
  el.flyingBananas.appendChild(banana);
  setTimeout(() => {
    if (banana.parentNode && !banana.classList.contains('collected')) {
      banana.classList.add('collected');
      setTimeout(() => banana.remove(), 320);
    }
  }, CONFIG.flyingBananaLifetime);
}

function scheduleFlyingBanana() {
  if (state.gameOver || state.levelComplete || state.paused) return;
  const delay = CONFIG.flyingBananaIntervalMin + Math.random() * (CONFIG.flyingBananaIntervalMax - CONFIG.flyingBananaIntervalMin);
  state.flyingBananaTimer = setTimeout(() => {
    spawnFlyingBanana();
    scheduleFlyingBanana();
  }, delay);
}

function decay() {
  if (state.gameOver || state.paused) return;
  state.love = clamp(state.love - CONFIG.decayRate);
  state.hunger = clamp(state.hunger - CONFIG.decayRate * 1.2);
  state.health = clamp(state.health - CONFIG.decayRate * 0.8);
  updateUI();
  checkGameOver();
}

function threatsApproach(threatType) {
  state.threatType = threatType;
  el.scene.classList.remove('threats-leaving');
  el.scene.classList.remove('threat-type-poacher', 'threat-type-tourist', 'threat-type-civilian');
  el.scene.classList.add('threats-approaching', 'threat-type-' + threatType);
}

function threatsLeave() {
  el.scene.classList.remove('threats-approaching');
  el.scene.classList.add('threats-leaving');
  setTimeout(() => {
    el.scene.classList.remove('threats-leaving', 'threat-type-poacher', 'threat-type-tourist', 'threat-type-civilian');
    state.threatType = null;
  }, 900);
}

function showThreatPanel() {
  const threat = THREATS[state.threatType];
  if (!threat || !el.threatPanel || !el.threatAlertText || !el.threatActions) return;
  el.threatAlertText.textContent = t(threat.approachKey);
  const iconEl = el.threatPanel.querySelector('.threat-icon');
  if (iconEl) iconEl.textContent = threat.icon;
  el.threatPanel.classList.remove('hidden');
  el.threatActions.innerHTML = '';
  threat.actions.forEach((action) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-threat';
    btn.dataset.actionId = action.id;
    btn.textContent = t(action.labelKey);
    const titleParts = [];
    if (action.costMoney) titleParts.push(t('costMoney', { n: action.costMoney }));
    if (action.costFood) titleParts.push(t('costFood', { n: action.costFood }));
    btn.title = titleParts.join(' ');
    btn.addEventListener('click', () => resolveThreat(action));
    el.threatActions.appendChild(btn);
  });
  updateThreatButtons();
}

function completeLevel() {
  state.levelComplete = true;
  if (state.threatTimer) clearTimeout(state.threatTimer);
  if (state.threatWarningTimer) clearTimeout(state.threatWarningTimer);
  if (state.flyingBananaTimer) clearTimeout(state.flyingBananaTimer);
  state.flyingBananaTimer = null;
  if (el.flyingBananas) el.flyingBananas.innerHTML = '';
  saveToLeaderboard(true);
  if (el.levelCompleteModal) el.levelCompleteModal.classList.remove('hidden');
  if (el.levelCompleteText) {
    const nextPlace = getPlaceForLevel(state.level + 1);
    el.levelCompleteText.textContent = t('levelCompleteText', {
      count: state.threatsDefeatedThisLevel,
      name: state.elephantName,
      level: state.level + 1,
      place: t(nextPlace.key),
    });
  }
  if (el.levelCompleteSaveNote) {
    const hasLeaderboard = typeof window.wanchangthaiLeaderboard !== 'undefined' && window.wanchangthaiLeaderboard.saveScore;
    el.levelCompleteSaveNote.classList.toggle('hidden', !hasLeaderboard);
    if (hasLeaderboard) el.levelCompleteSaveNote.textContent = t('levelCompleteSaveNote');
  }
  updateUI();
}

function startNextLevel() {
  if (!el.levelCompleteModal) return;
  el.levelCompleteModal.classList.add('hidden');
  state.level++;
  state.threatsDefeatedThisLevel = 0;
  state.levelComplete = false;
  state.love = clamp(state.love + CONFIG.levelBonusLove);
  state.hunger = clamp(state.hunger + CONFIG.levelBonusHunger);
  state.health = clamp(state.health + CONFIG.levelBonusHealth);
  state.money += CONFIG.levelBonusMoney;
  state.food += CONFIG.levelBonusFood;
  updateUI();
  showPlaceIntro(state.level);
  showMessage(t('msg_levelNext', { level: state.level, count: getThreatsRequiredForLevel(state.level) }), 'good');
  scheduleThreat();
  scheduleFlyingBanana();
}

function scheduleThreat() {
  if (state.gameOver || state.levelComplete || state.paused) return;
  const delay =
    CONFIG.threatIntervalMin +
    Math.random() * (CONFIG.threatIntervalMax - CONFIG.threatIntervalMin);
  state.threatTimer = setTimeout(() => {
    if (state.gameOver || state.paused) return;
    const threatType = THREAT_IDS[Math.floor(Math.random() * THREAT_IDS.length)];
    state.threatActive = true;
    threatsApproach(threatType);
    showThreatPanel();
    const t = THREATS[threatType];
    showMessage(t(THREATS[threatType].approachKey), 'bad');
    state.threatWarningTimer = setTimeout(threatStrikes, CONFIG.threatWarningMs);
  }, delay);
}

function threatStrikes() {
  if (!state.threatActive || !state.threatType || state.gameOver || state.levelComplete || state.paused) return;
  const threat = THREATS[state.threatType];
  state.threatActive = false;
  clearTimeout(state.threatWarningTimer);
  el.threatPanel.classList.add('hidden');
  threatsLeave();
  const dmg = 2;
  state.love = clamp(state.love - threat.damage.love * dmg);
  state.hunger = clamp(state.hunger - threat.damage.hunger * dmg);
  state.health = clamp(state.health - threat.damage.health * dmg);
  el.elephant.classList.add('hurt');
  setTimeout(() => el.elephant.classList.remove('hurt'), 500);
  const msg = t(threat.strikeKey, { name: state.elephantName });
  showMessage(msg, 'bad');
  updateUI();
  checkGameOver();
  scheduleThreat();
}

function resolveThreat(action) {
  if (!state.threatActive || !state.threatType || state.gameOver || state.levelComplete || state.paused) return;
  if (state.money < action.costMoney || state.food < action.costFood) return;
  state.money -= action.costMoney;
  state.food -= action.costFood;
  state.threatActive = false;
  clearTimeout(state.threatWarningTimer);
  el.threatPanel.classList.add('hidden');
  threatsLeave();
  state.threatsDefeatedThisLevel++;
  state.totalThreatsDefeated++;
  const prevRank = getRankForMerit(state.meritPoints);
  state.meritPoints += CONFIG.meritPerThreatResolved;
  try { localStorage.setItem('wanchangthai_merit', String(state.meritPoints)); } catch (e) {}
  const newRank = getRankForMerit(state.meritPoints);
  const msg = t(action.resolveKey, { name: state.elephantName });
  showMessage(msg, action.costMoney === 0 && action.costFood === 0 ? 'good' : 'neutral');
  if (newRank.key !== prevRank.key) {
    showMessage(t('meritRankUp', { rank: t(newRank.key) }), 'good');
  }
  updateUI();

  const required = getThreatsRequiredForLevel(state.level);
  if (state.threatsDefeatedThisLevel >= required) {
    completeLevel();
  } else {
    scheduleThreat();
  }
}

function buyBananas(amount) {
  const cost = amount === 3 ? CONFIG.bananaCost3 : amount === 5 ? CONFIG.bananaCost5 : CONFIG.bananaCost;
  const qty = amount || 1;
  if (state.money < cost || state.gameOver || state.levelComplete || state.paused) return;
  state.money -= cost;
  state.food += qty;
  showMessage(t('msg_buyBananas', { count: qty, cost }), 'neutral');
  updateUI();
}

function feedSugarCane() {
  if (state.food < 2 || state.gameOver || state.levelComplete || state.paused) return;
  state.food -= 2;
  state.hunger = clamp(state.hunger + CONFIG.feedSugarCaneHunger);
  state.love = clamp(state.love + CONFIG.feedSugarCaneLove);
  state.meritPoints += CONFIG.meritPerCareAction;
  try { localStorage.setItem('wanchangthai_merit', String(state.meritPoints)); } catch (e) {}
  showBubble('🍃');
  el.elephant.classList.add('happy');
  setTimeout(() => el.elephant.classList.remove('happy'), 600);
  showMessage(t('msg_feedSugarCane', { name: state.elephantName }), 'good');
  updateUI();
}

function feed() {
  if (state.food < 1 || state.gameOver || state.levelComplete || state.paused) return;
  state.food--;
  state.hunger = clamp(state.hunger + CONFIG.feedHunger);
  state.love = clamp(state.love + CONFIG.feedLove);
  state.meritPoints += CONFIG.meritPerCareAction;
  try { localStorage.setItem('wanchangthai_merit', String(state.meritPoints)); } catch (e) {}
  showBubble('🍌');
  el.elephant.classList.add('happy');
  setTimeout(() => el.elephant.classList.remove('happy'), 600);
  showMessage(t('msg_feed', { name: state.elephantName }), 'good');
  updateUI();
}

function care() {
  if (state.gameOver || state.levelComplete || state.paused) return;
  state.health = clamp(state.health + CONFIG.careHealth);
  state.love = clamp(state.love + CONFIG.careLove);
  state.meritPoints += CONFIG.meritPerCareAction;
  try { localStorage.setItem('wanchangthai_merit', String(state.meritPoints)); } catch (e) {}
  showBubble('🩹');
  el.elephant.classList.add('happy');
  setTimeout(() => el.elephant.classList.remove('happy'), 600);
  showMessage(t('msg_care'), 'good');
  updateUI();
}

function love() {
  if (state.gameOver || state.levelComplete || state.paused) return;
  state.love = clamp(state.love + CONFIG.loveAmount);
  state.health = clamp(state.health + CONFIG.loveHealth);
  state.meritPoints += CONFIG.meritPerCareAction;
  try { localStorage.setItem('wanchangthai_merit', String(state.meritPoints)); } catch (e) {}
  showBubble('❤️');
  el.elephant.classList.add('happy');
  setTimeout(() => el.elephant.classList.remove('happy'), 600);
  showMessage(t('msg_love'), 'good');
  updateUI();
}

async function saveToLeaderboard(silent = false) {
  if (typeof window.wanchangthaiLeaderboard === 'undefined' || !window.wanchangthaiLeaderboard.saveScore) {
    if (!silent) showMessage(t('msg_saveUnavailable'), 'neutral');
    return false;
  }
  const ok = await window.wanchangthaiLeaderboard.saveScore({
    playerName: state.elephantName,
    elephantName: state.elephantName,
    merit: state.meritPoints,
    level: state.level,
    threatsDefeated: state.totalThreatsDefeated,
  });
  if (ok) {
    if (el.leaderboardModal && !el.leaderboardModal.classList.contains('hidden')) {
      await refreshLeaderboardList();
    } else if (!silent) {
      openLeaderboard();
    }
  }
  if (!silent) {
    if (ok) showMessage(t('msg_saved'), 'good');
    else showMessage(t('msg_saveFailed'), 'bad');
  }
  return ok;
}

async function manualSave() {
  if (state.gameOver || state.levelComplete) return;
  await saveToLeaderboard(false);
}

async function refreshLeaderboardList() {
  if (!el.leaderboardList || typeof window.wanchangthaiLeaderboard === 'undefined' || !window.wanchangthaiLeaderboard.getLeaderboard) return;
  const result = await window.wanchangthaiLeaderboard.getLeaderboard();
  if (result && result._error) {
    el.leaderboardList.innerHTML = '<p class="leaderboard-empty leaderboard-error">' + t('leaderboardLoadError') + '</p>';
  } else if (!result || result.length === 0) {
    el.leaderboardList.innerHTML = '<p class="leaderboard-empty">' + t('leaderboardEmpty') + '</p>';
  } else {
    const scores = result;
    el.leaderboardList.innerHTML = scores
      .map(
        (s) =>
          `<div class="leaderboard-row">
            <span class="leaderboard-rank">#${s.rank}</span>
            <span class="leaderboard-name">${escapeHtml(s.elephantName)}</span>
            <span class="leaderboard-merit">${s.merit} ${t('meritLabel')}</span>
            <span class="leaderboard-level">Lv.${s.level}</span>
          </div>`
      )
      .join('');
  }
}

async function openLeaderboard() {
  if (!el.leaderboardModal) return;
  el.leaderboardModal.classList.remove('hidden');
  if (el.leaderboardDisabled) el.leaderboardDisabled.classList.add('hidden');
  if (el.leaderboardList) el.leaderboardList.innerHTML = '<p class="leaderboard-loading">' + t('leaderboardLoading') + '</p>';

  if (typeof window.wanchangthaiLeaderboard === 'undefined' || !window.wanchangthaiLeaderboard.getLeaderboard) {
    if (el.leaderboardList) el.leaderboardList.innerHTML = '';
    if (el.leaderboardDisabled) el.leaderboardDisabled.classList.remove('hidden');
    return;
  }

  try {
    await refreshLeaderboardList();
  } catch (err) {
    console.error('Leaderboard refresh failed:', err);
    if (el.leaderboardList) el.leaderboardList.innerHTML = '<p class="leaderboard-empty leaderboard-error">' + t('leaderboardLoadError') + '</p>';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function closeLeaderboard() {
  if (el.leaderboardModal) el.leaderboardModal.classList.add('hidden');
}

function checkGameOver() {
  if (state.love < 70 || state.hunger < 70 || state.health < 70) {
    state.gameOver = true;
    if (state.threatTimer) clearTimeout(state.threatTimer);
    if (state.threatWarningTimer) clearTimeout(state.threatWarningTimer);
    if (state.flyingBananaTimer) clearTimeout(state.flyingBananaTimer);
    state.flyingBananaTimer = null;
    if (el.flyingBananas) el.flyingBananas.innerHTML = '';
    if (el.threatPanel) el.threatPanel.classList.add('hidden');
    saveToLeaderboard(true);
    showMessage(t('gameOverMessage'), 'bad');
  }
}

function startGame() {
  const input = document.getElementById('elephantNameInput');
  const name = (input && input.value ? input.value.trim() : '') || 'Wan Chang Thai';
  state.elephantName = name;
  try {
    localStorage.setItem('wanchangthai_elephant_name', name);
  } catch (e) {}
  if (el.elephantNameDisplay) el.elephantNameDisplay.textContent = name;
  if (el.nameModal) el.nameModal.classList.add('hidden');
  if (el.gameMain) el.gameMain.classList.remove('hidden');
  updateUI();
  state.decayInterval = setInterval(decay, CONFIG.decayIntervalMs);
  state.moneyInterval = setInterval(() => {
    if (state.gameOver || state.paused) return;
    state.money += CONFIG.moneyGain;
    updateUI();
  }, CONFIG.moneyGainInterval);
  state.foodInterval = setInterval(() => {
    if (state.gameOver || state.paused) return;
    state.food += CONFIG.foodGain;
    updateUI();
  }, CONFIG.foodGainInterval);
  scheduleThreat();
  scheduleFlyingBanana();
  showPlaceIntro(1);
  showMessage(t('msg_levelStart', { count: getThreatsRequiredForLevel(1), name: state.elephantName }), 'neutral');
}

function pauseGame() {
  if (state.gameOver || state.levelComplete || !el.gameMain || el.gameMain.classList.contains('hidden')) return;
  state.paused = true;
  if (state.decayInterval) clearInterval(state.decayInterval);
  state.decayInterval = null;
  if (state.moneyInterval) clearInterval(state.moneyInterval);
  state.moneyInterval = null;
  if (state.foodInterval) clearInterval(state.foodInterval);
  state.foodInterval = null;
  if (state.threatTimer) clearTimeout(state.threatTimer);
  state.threatTimer = null;
  if (state.threatWarningTimer) clearTimeout(state.threatWarningTimer);
  state.threatWarningTimer = null;
  if (state.flyingBananaTimer) clearTimeout(state.flyingBananaTimer);
  state.flyingBananaTimer = null;
  if (el.pauseOverlay) el.pauseOverlay.classList.remove('hidden');
  updateUI();
}

function resumeGame() {
  if (!state.paused) return;
  state.paused = false;
  if (el.pauseOverlay) el.pauseOverlay.classList.add('hidden');
  state.decayInterval = setInterval(decay, CONFIG.decayIntervalMs);
  state.moneyInterval = setInterval(() => {
    if (state.gameOver || state.paused) return;
    state.money += CONFIG.moneyGain;
    updateUI();
  }, CONFIG.moneyGainInterval);
  state.foodInterval = setInterval(() => {
    if (state.gameOver || state.paused) return;
    state.food += CONFIG.foodGain;
    updateUI();
  }, CONFIG.foodGainInterval);
  if (state.threatActive && state.threatType) {
    state.threatWarningTimer = setTimeout(threatStrikes, CONFIG.threatWarningMs);
  } else {
    scheduleThreat();
  }
  updateUI();
}

function togglePause() {
  if (state.paused) resumeGame();
  else pauseGame();
}

function restartGame() {
  if (!el.gameMain || el.gameMain.classList.contains('hidden')) return;
  if (state.decayInterval) clearInterval(state.decayInterval);
  state.decayInterval = null;
  if (state.moneyInterval) clearInterval(state.moneyInterval);
  state.moneyInterval = null;
  if (state.foodInterval) clearInterval(state.foodInterval);
  state.foodInterval = null;
  if (state.threatTimer) clearTimeout(state.threatTimer);
  state.threatTimer = null;
  if (state.threatWarningTimer) clearTimeout(state.threatWarningTimer);
  state.threatWarningTimer = null;
  if (state.flyingBananaTimer) clearTimeout(state.flyingBananaTimer);
  state.flyingBananaTimer = null;
  if (el.flyingBananas) el.flyingBananas.innerHTML = '';
  state.love = 80;
  state.hunger = 70;
  state.health = 90;
  state.money = CONFIG.startMoney;
  state.food = CONFIG.startFood;
  state.level = 1;
  state.threatsDefeatedThisLevel = 0;
  state.totalThreatsDefeated = 0;
  state.threatActive = false;
  state.threatType = null;
  state.gameOver = false;
  state.levelComplete = false;
  state.paused = false;
  if (el.threatPanel) el.threatPanel.classList.add('hidden');
  if (el.levelCompleteModal) el.levelCompleteModal.classList.add('hidden');
  if (el.pauseOverlay) el.pauseOverlay.classList.add('hidden');
  threatsLeave();
  updateUI();
  state.decayInterval = setInterval(decay, CONFIG.decayIntervalMs);
  state.moneyInterval = setInterval(() => {
    if (state.gameOver || state.paused) return;
    state.money += CONFIG.moneyGain;
    updateUI();
  }, CONFIG.moneyGainInterval);
  state.foodInterval = setInterval(() => {
    if (state.gameOver || state.paused) return;
    state.food += CONFIG.foodGain;
    updateUI();
  }, CONFIG.foodGainInterval);
  scheduleThreat();
  scheduleFlyingBanana();
  showMessage(t('msg_restarted'), 'good');
}

function newPlayerGame() {
  if (state.decayInterval) clearInterval(state.decayInterval);
  state.decayInterval = null;
  if (state.moneyInterval) clearInterval(state.moneyInterval);
  state.moneyInterval = null;
  if (state.foodInterval) clearInterval(state.foodInterval);
  state.foodInterval = null;
  if (state.threatTimer) clearTimeout(state.threatTimer);
  state.threatTimer = null;
  if (state.threatWarningTimer) clearTimeout(state.threatWarningTimer);
  state.threatWarningTimer = null;
  if (state.flyingBananaTimer) clearTimeout(state.flyingBananaTimer);
  state.flyingBananaTimer = null;
  if (el.flyingBananas) el.flyingBananas.innerHTML = '';
  try {
    localStorage.removeItem('wanchangthai_elephant_name');
    localStorage.removeItem('wanchangthai_merit');
  } catch (e) {}
  state.elephantName = 'Wan Chang Thai';
  state.meritPoints = 0;
  state.love = 80;
  state.hunger = 70;
  state.health = 90;
  state.money = CONFIG.startMoney;
  state.food = CONFIG.startFood;
  state.level = 1;
  state.threatsDefeatedThisLevel = 0;
  state.totalThreatsDefeated = 0;
  state.threatActive = false;
  state.threatType = null;
  state.gameOver = false;
  state.levelComplete = false;
  state.paused = false;
  if (el.elephantNameInput) el.elephantNameInput.value = 'Wan Chang Thai';
  if (el.elephantNameDisplay) el.elephantNameDisplay.textContent = 'Wan Chang Thai';
  if (el.threatPanel) el.threatPanel.classList.add('hidden');
  if (el.levelCompleteModal) el.levelCompleteModal.classList.add('hidden');
  if (el.pauseOverlay) el.pauseOverlay.classList.add('hidden');
  if (el.gameMain) el.gameMain.classList.add('hidden');
  if (el.nameModal) el.nameModal.classList.remove('hidden');
  threatsLeave();
  updateUI();
}

function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'th') return;
  state.lang = lang;
  window.__wanchangthai_lang = lang;
  localStorage.setItem('wanchangthai_lang', lang);
  document.documentElement.lang = lang === 'th' ? 'th' : 'en';
  applyTranslations();
  updateUI();
}

function init() {
  document.documentElement.lang = state.lang === 'th' ? 'th' : 'en';
  applyTranslations();
  try {
    const savedName = localStorage.getItem('wanchangthai_elephant_name');
    if (savedName && el.elephantNameInput) {
      el.elephantNameInput.value = savedName;
      state.elephantName = savedName;
    }
  } catch (e) {}
  if (el.langSwitcher) {
    el.langSwitcher.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => setLanguage(btn.getAttribute('data-lang')));
    });
  }
  if (el.nameForm) {
    el.nameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      startGame();
    });
  }
  el.btnFeed.addEventListener('click', feed);
  el.btnCare.addEventListener('click', care);
  if (el.actionButtons) {
    el.actionButtons.addEventListener('click', (e) => {
      const btn = e.target?.closest?.('[data-buy-bananas]');
      if (btn) buyBananas(parseInt(btn.getAttribute('data-buy-bananas'), 10) || 1);
      if (e.target?.closest?.('#btnFeedSugarCane')) feedSugarCane();
    });
  }
  if (el.btnFeedSugarCane) el.btnFeedSugarCane.addEventListener('click', feedSugarCane);
  el.btnLove.addEventListener('click', love);
  if (el.btnNextLevel) el.btnNextLevel.addEventListener('click', startNextLevel);
  if (el.btnPause) el.btnPause.addEventListener('click', togglePause);
  if (el.btnSave) el.btnSave.addEventListener('click', manualSave);
  if (el.btnSavePause) el.btnSavePause.addEventListener('click', manualSave);
  if (el.btnResume) el.btnResume.addEventListener('click', resumeGame);
  if (el.btnRestart) el.btnRestart.addEventListener('click', restartGame);
  if (el.btnRestartOverlay) el.btnRestartOverlay.addEventListener('click', restartGame);
  if (el.btnNewPlayer) el.btnNewPlayer.addEventListener('click', newPlayerGame);
  if (el.btnNewPlayerOverlay) el.btnNewPlayerOverlay.addEventListener('click', newPlayerGame);
  if (el.leaderboardBtn) el.leaderboardBtn.addEventListener('click', openLeaderboard);
  if (el.leaderboardClose) el.leaderboardClose.addEventListener('click', closeLeaderboard);
  if (el.leaderboardModal) {
    el.leaderboardModal.addEventListener('click', (e) => {
      if (e.target === el.leaderboardModal) closeLeaderboard();
    });
  }
  updateUI();
}

init();
