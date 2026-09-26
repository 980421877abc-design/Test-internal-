/* 模擬手札獨立模組。此檔以 classic script 載入，保留既有全域函式名稱，供主引擎與 inline callback 使用。 */

// ══════════════ 模擬手札（3選1重複闖關） ══════════════
var handbookMode = false;
let handbookStage = 1;
let handbookRerolls = 3;
let handbookSessionId = 0;
let handbookEnemyId = null;
let handbookPreviousEnemyId = null;
let handbookChoiceIds = [];
let handbookChoices = [];
let handbookSelectedId = null;
let handbookBuild = [];
let handbookBest = parseInt(localStorage.getItem('handbookBest') || '0');
const HANDBOOK_START_REROLLS = 3;
const HANDBOOK_MAX_BLESSINGS = 3;
const HANDBOOK_BLESSINGS = [
  { id: 'onslaught', icon: '⚔️', name: '破軍印', rarity: '稀有', color: '#ffb86b', desc: '造成傷害 +18%。' },
  { id: 'ironwall', icon: '🛡️', name: '鐵壁符', rarity: '稀有', color: '#9feaff', desc: '受到傷害 -15%。' },
  { id: 'dragonvein', icon: '🐉', name: '龍脈', rarity: '精良', color: '#b48cff', desc: '最大生命 +22%。' },
  { id: 'frenzy', icon: '🔥', name: '暴烈', rarity: '精良', color: '#ff7b6b', desc: '12% 機率造成 1.8 倍暴擊。' },
  { id: 'bloodpact', icon: '🩸', name: '血契', rarity: '精良', color: '#ff6f91', desc: '造成傷害的 8% 回復生命。' },
  { id: 'laststand', icon: '🜂', name: '逆命', rarity: '史詩', color: '#ffd166', desc: '生命低於 35% 時，造成傷害 +28%。' },
  { id: 'skyward', icon: '✦', name: '天幕', rarity: '史詩', color: '#d9f7ff', desc: '每關開始獲得最大生命 12% 護盾。' },
  { id: 'fortune', icon: '☯', name: '天命', rarity: '傳說', color: '#f2d28b', desc: '獲得 1 次額外重置對手機會。' },
];
const HANDBOOK_ENEMY_AFFIXES = [
  { id: 'seasoned', icon: '✦', name: '老練', rarity: 'I', color: '#d4b777', minStage: 1, desc: '最大生命 +8%，造成傷害 +6%。', hpMul: 1.08, damageMul: 1.06 },
  { id: 'bloodlust', icon: '🩸', name: '嗜戰', rarity: 'II', color: '#ff7b6b', minStage: 2, desc: '造成傷害 +10%；生命低於 50% 時再 +18%。', damageMul: 1.10, lowHpMul: 1.18 },
  { id: 'bulwark', icon: '🛡️', name: '磐石', rarity: 'II', color: '#9feaff', minStage: 3, desc: '最大生命 +8%，受到傷害 -10%。', hpMul: 1.08, takenMul: 0.90 },
  { id: 'vampiric', icon: '☠️', name: '噬命', rarity: 'III', color: '#d78cff', minStage: 4, desc: '造成傷害的 7% 轉為自身回復。', lifesteal: 0.07 },
  { id: 'thorns', icon: '⚡', name: '反甲', rarity: 'III', color: '#ffd166', minStage: 5, desc: '受到直接攻擊時，反射該次傷害的 6%。', thorns: 0.06 },
  { id: 'apex', icon: '👑', name: '霸主', rarity: 'IV', color: '#f2d28b', minStage: 7, desc: '最大生命 +18%，造成傷害 +12%，受到傷害 -10%。', hpMul: 1.18, damageMul: 1.12, takenMul: 0.90 },
];
// 每關固定使用一個有限 loadout，不再把歷層所有詞條無限串接；最高只顯示 3 個敵方詞條。
const HANDBOOK_ENEMY_LOADOUTS = [
  { minStage: 1, affixIds: ['seasoned'] },
  { minStage: 2, affixIds: ['bloodlust'] },
  { minStage: 3, affixIds: ['bloodlust', 'bulwark'] },
  { minStage: 4, affixIds: ['vampiric', 'bulwark'] },
  { minStage: 5, affixIds: ['thorns', 'bulwark'] },
  { minStage: 6, affixIds: ['bloodlust', 'vampiric', 'thorns'] },
  { minStage: 7, affixIds: ['apex', 'vampiric', 'thorns'] },
  { minStage: 10, affixIds: ['apex', 'bloodlust', 'bulwark'] },
];
function handbookEnemyAffixSet(stage = handbookStage) {
  const loadout = HANDBOOK_ENEMY_LOADOUTS.filter(item => stage >= item.minStage).pop() || HANDBOOK_ENEMY_LOADOUTS[0];
  return loadout.affixIds.map(id => HANDBOOK_ENEMY_AFFIXES.find(affix => affix.id === id)).filter(Boolean);
}
function handbookApplyEnemyAffixes(ball, stage = handbookStage) {
  if (!ball) return;
  const affixes = handbookEnemyAffixSet(stage);
  ball.handbookEnemyAffixes = affixes.map(a => a.id);
  ball.handbookEnemyDamageMultiplier = affixes.reduce((m, a) => m * (a.damageMul || 1), 1);
  ball.handbookEnemyDamageTakenMultiplier = affixes.reduce((m, a) => m * (a.takenMul || 1), 1);
  ball.handbookEnemyMaxHpMultiplier = affixes.reduce((m, a) => m * (a.hpMul || 1), 1);
  ball.handbookEnemyLowHpMultiplier = affixes.reduce((m, a) => m * (a.lowHpMul || 1), 1);
  ball.handbookEnemyLifesteal = affixes.reduce((m, a) => m + (a.lifesteal || 0), 0);
  ball.handbookEnemyThorns = affixes.reduce((m, a) => m + (a.thorns || 0), 0);
  const baseMaxHp = getBallMaxHp(ball);
  const maxHp = baseMaxHp * ball.handbookEnemyMaxHpMultiplier;
  if (Number.isFinite(maxHp) && maxHp > 0) {
    ball.customMaxHp = maxHp;
    ball.hp = maxHp;
  }
}

function handbookRosterPool() {
  return getCharacterRoster().filter(ch => ch && typeof ch.id === 'string' && ch.id &&
    ch.id !== 'custom_assembled' && ch.id !== DUMMY_CHARACTER.id && ch.type !== 'dummy' && ch.type !== 'boss');
}

function handbookShuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function handbookPickEnemy() {
  const pool = handbookRosterPool().filter(ch => ch.id !== handbookPreviousEnemyId);
  const choices = pool.length ? pool : handbookRosterPool();
  return choices[Math.floor(Math.random() * choices.length)] || null;
}

function handbookPickChoices(enemyId) {
  const heroes = handbookShuffle(handbookRosterPool().filter(ch => ch.id !== enemyId)).slice(0, 3);
  const owned = new Set(handbookBuild || []);
  const unowned = HANDBOOK_BLESSINGS.filter(blessing => !owned.has(blessing.id));
  const blessingPool = unowned.length >= 3 ? unowned : HANDBOOK_BLESSINGS;
  const blessings = handbookShuffle(blessingPool).slice(0, 3);
  return heroes.map((hero, i) => ({ heroId: hero.id, blessingId: blessings[i % blessings.length].id }));
}

function handbookRender() {
  const stageEl = document.getElementById('hb-stage');
  const rerollEl = document.getElementById('hb-rerolls');
  const buildEl = document.getElementById('hb-build');
  const enemyEl = document.getElementById('hb-enemy-card');
  const choicesEl = document.getElementById('hb-hero-choices');
  const rerollBtn = document.getElementById('hb-reroll-btn');
  const startBtn = document.getElementById('hb-start-btn');
  const enemy = handbookRosterPool().find(ch => ch.id === handbookEnemyId);
  if (!stageEl || !rerollEl || !enemyEl || !choicesEl || !enemy) return;
  const enemyUI = getCharacterForUI(enemy);
  const blessingById = id => HANDBOOK_BLESSINGS.find(b => b.id === id);
  const enemyAffixes = handbookEnemyAffixSet(handbookStage);
  const enemyAffixMarkup = enemyAffixes.length
    ? `<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(242,210,139,.25);text-align:left"><div style="font-size:.58rem;color:#f2d28b;letter-spacing:.14em;margin-bottom:5px">ENEMY AFFIXES · 敵方強力詞綴</div>${enemyAffixes.map(a => `<div style="display:flex;gap:5px;align-items:flex-start;margin:4px 0;color:${a.color}"><span style="font-size:.9rem;line-height:1">${a.icon}</span><span style="font-size:.58rem;line-height:1.35"><b>${a.name} [${a.rarity}]</b><br><span style="color:#c7bfd4">${a.desc}</span></span></div>`).join('')}</div>`
    : '<div style="margin-top:8px;font-size:.58rem;color:#8e8aa0">尚未解鎖敵方詞綴</div>';
  stageEl.textContent = `第 ${handbookStage} 關 · 威脅階級 ${Math.min(4, Math.ceil(handbookStage / 2))}`;
  rerollEl.textContent = `重置對手機會：${handbookRerolls} 次`;
  buildEl.textContent = handbookBuild.length
    ? `目前祝福（${handbookBuild.length}/${HANDBOOK_MAX_BLESSINGS}）：${handbookBuild.map(id => { const b = blessingById(id); return b ? `${b.icon} ${b.name}` : ''; }).filter(Boolean).join('　')}${handbookBuild.length >= HANDBOOK_MAX_BLESSINGS ? '　· 已達上限，新的祝福會替換最早一項' : ''}`
    : `目前祝福（0/${HANDBOOK_MAX_BLESSINGS}）：尚未建立構築`;
  enemyEl.innerHTML = `<div style="font-size:2.8rem;line-height:1.1">${charIconHTML(enemyUI, '2.8rem')}</div><div style="font-size:1.18rem;font-weight:900;color:#f2d28b;margin-top:4px">${enemyUI.name}</div><div style="font-size:.62rem;color:#aaa;margin-top:3px">${(enemyUI.stats || []).join('　')}</div><div style="font-size:.65rem;line-height:1.45;color:#aaa;margin-top:7px">${enemyUI.desc || '未知對手，查看戰鬥行動後再決定策略。'}</div>${enemyAffixMarkup}`;
  choicesEl.innerHTML = '';
  handbookChoices.forEach(choice => {
    const ch = handbookRosterPool().find(item => item.id === choice.heroId);
    const blessing = blessingById(choice.blessingId);
    if (!ch || !blessing) return;
    const ui = getCharacterForUI(ch);
    const selected = handbookSelectedId === choice.heroId;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `hb-choice-card${selected ? ' hb-choice-selected' : ''}`;
    card.setAttribute('aria-pressed', selected ? 'true' : 'false');
    card.style.cssText = `min-width:0;padding:9px 6px;border-radius:13px;cursor:pointer;color:#eee;background:${selected ? 'linear-gradient(145deg,rgba(143,214,255,.24),rgba(117,78,180,.24))' : 'rgba(255,255,255,.045)'};border:1.5px solid ${selected ? blessing.color : 'rgba(255,255,255,.14)'};box-shadow:${selected ? `0 0 18px ${blessing.color}55` : 'none'};font-family:sans-serif;transition:all .12s;`;
    card.innerHTML = `<div style="font-size:1.65rem;height:34px;display:flex;align-items:center;justify-content:center">${charIconHTML(ui, '1.65rem')}</div><div style="font-size:.72rem;font-weight:800;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ui.name}</div><div style="margin:7px 2px 3px;padding:4px 3px;border-radius:7px;background:${blessing.color}20;color:${blessing.color};font-size:.58rem;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${blessing.icon} ${blessing.name} · ${blessing.rarity}</div><div style="font-size:.53rem;color:${selected ? '#f2f2f2' : '#aaa'};line-height:1.35;min-height:27px">${blessing.desc}</div>`;
    card.onclick = () => handbookSelectHero(choice.heroId);
    choicesEl.appendChild(card);
  });
  rerollBtn.disabled = handbookRerolls <= 0;
  rerollBtn.style.opacity = handbookRerolls > 0 ? '1' : '.38';
  startBtn.disabled = !handbookSelectedId;
  startBtn.style.opacity = handbookSelectedId ? '1' : '.42';
}

function showHandbookStage(statusText) {
  const stageScreen = document.getElementById('handbook-screen');
  const resultScreen = document.getElementById('handbook-result-screen');
  if (!stageScreen) return;
  if (resultScreen) resultScreen.style.display = 'none';
  document.getElementById('select-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('assemble-pick-screen').style.display = 'none';
  document.getElementById('assemble-stage-screen').style.display = 'none';
  document.getElementById('assemble-result-screen').style.display = 'none';
  stageScreen.style.display = 'flex';
  handbookPreviousEnemyId = handbookEnemyId;
  const enemy = handbookPickEnemy();
  handbookEnemyId = enemy ? enemy.id : null;
  handbookChoices = handbookPickChoices(handbookEnemyId);
  handbookChoiceIds = handbookChoices.map(choice => choice.heroId);
  handbookSelectedId = null;
  handbookRender();
  const upgrade = typeof statusText === 'string' && statusText.indexOf('通關') >= 0;
  stageScreen.classList.remove('hb-page-turn', 'hb-upgrade');
  void stageScreen.offsetWidth;
  stageScreen.classList.add('hb-page-turn');
  if (upgrade) stageScreen.classList.add('hb-upgrade');
  const animationSid = handbookSessionId;
  setTimeout(() => {
    if (handbookSessionId === animationSid) stageScreen.classList.remove('hb-page-turn', 'hb-upgrade');
  }, upgrade ? 1500 : 1100);
  if (statusText) {
    const stageEl = document.getElementById('hb-stage');
    if (stageEl) stageEl.textContent = `${statusText} · 第 ${handbookStage} 關`;
  }
}

function startHandbookMode() {
  handbookMode = true;
  handbookSessionId++;
  assembleMode = false;
  sandboxMode = false;
  dummyPracticeMode = false;
  wheelState = null;
  p1Choice = null; p2Choice = null; p3Choice = null; p4Choice = null;
  playerModeCount = 2;
  handbookStage = 1;
  handbookRerolls = HANDBOOK_START_REROLLS;
  handbookEnemyId = null;
  handbookPreviousEnemyId = null;
  handbookChoices = [];
  handbookChoiceIds = [];
  handbookBuild = [];
  showHandbookStage();
}

function handbookSelectHero(id) {
  if (!handbookMode || !handbookChoices.some(choice => choice.heroId === id)) return;
  handbookSelectedId = id;
  handbookRender();
}

function handbookReroll() {
  if (!handbookMode || handbookRerolls <= 0) return;
  handbookRerolls--;
  showHandbookStage('已重置對手');
}

function handbookApplyBlessing(ball, blessingIds) {
  if (!ball) return;
  const boundedIds = [...new Set(blessingIds || [])].slice(-HANDBOOK_MAX_BLESSINGS);
  const blessings = boundedIds.map(id => HANDBOOK_BLESSINGS.find(b => b.id === id)).filter(Boolean);
  ball.handbookBlessings = blessings.map(b => b.id);
  ball.handbookDamageMultiplier = blessings.reduce((m, b) => m * (b.id === 'onslaught' ? 1.18 : 1), 1);
  ball.handbookDamageTakenMultiplier = blessings.reduce((m, b) => m * (b.id === 'ironwall' ? 0.85 : 1), 1);
  ball.handbookMaxHpMultiplier = blessings.reduce((m, b) => m * (b.id === 'dragonvein' ? 1.22 : 1), 1);
  ball.handbookCritChance = blessings.reduce((m, b) => m + (b.id === 'frenzy' ? 0.12 : 0), 0);
  ball.handbookCritMultiplier = blessings.some(b => b.id === 'frenzy') ? 1.8 : 1;
  ball.handbookLifesteal = blessings.reduce((m, b) => m + (b.id === 'bloodpact' ? 0.08 : 0), 0);
  ball.handbookLastStandMultiplier = blessings.reduce((m, b) => m * (b.id === 'laststand' ? 1.28 : 1), 1);
  ball.handbookShield = blessings.reduce((m, b) => m + (b.id === 'skyward' ? getBallMaxHp(ball) * 0.12 : 0), 0);
}

function handbookLaunch() {
  if (!handbookMode || !handbookSelectedId || !handbookEnemyId) return;
  const selectedChoice = handbookChoices.find(choice => choice.heroId === handbookSelectedId);
  if (!selectedChoice) return;
  const previousBuild = handbookBuild.slice();
  const nextBuild = handbookBuild.filter(id => id !== selectedChoice.blessingId);
  nextBuild.push(selectedChoice.blessingId);
  handbookBuild = nextBuild.slice(-HANDBOOK_MAX_BLESSINGS);
  if (selectedChoice.blessingId === 'fortune' && !previousBuild.includes('fortune')) handbookRerolls++;
  p1Choice = handbookSelectedId;
  p2Choice = handbookEnemyId;
  p3Choice = null; p4Choice = null;
  playerModeCount = 2;
  document.getElementById('handbook-screen').style.display = 'none';
  const started = startGame();
  if (!started) {
    handbookBuild = previousBuild;
    showHandbookStage('重新選擇');
    return;
  }
  const playerBalls = state && Array.isArray(state.balls)
    ? state.balls.filter(b => b && b.player === 1 && !b.ameliaIsClone)
    : [];
  const enemyBalls = state && Array.isArray(state.balls)
    ? state.balls.filter(b => b && b.player === 2 && !b.ameliaIsClone)
    : [];
  // 雙生／四球是同一個選角欄位展開的正式球體；每顆都必須承接手札欄位，不能只改第一顆。
  playerBalls.forEach(ball => {
    handbookApplyBlessing(ball, handbookBuild);
    const baseMaxHp = getBallMaxHp(ball);
    const maxHp = baseMaxHp * (ball.handbookMaxHpMultiplier || 1);
    if (Number.isFinite(maxHp) && maxHp > 0) {
      ball.customMaxHp = maxHp;
      ball.hp = maxHp;
      ball.handbookShield = handbookBuild.reduce((sum, id) => sum + (id === 'skyward' ? maxHp * 0.12 : 0), 0);
    }
  });
  enemyBalls.forEach(ball => handbookApplyEnemyAffixes(ball, handbookStage));
  // 舊 HUD 只需要一個代表球；戰鬥欄位已在上方完整套用到全隊。
  const playerBall = playerBalls[0] || null;
  const enemyBall = enemyBalls[0] || null;
  // 四天之龍共享同一份生命；護盾也用同一個資源，避免四顆球各自領取一層天幕。
  playerBalls.filter(ball => ball.char && ball.char.type === 'dragon4' && ball.quadSiblings).forEach(ball => {
    ball.quadSiblings.forEach(sibling => {
      sibling.handbookShield = ball.handbookShield;
      sibling.customMaxHp = ball.customMaxHp;
      sibling.hp = ball.hp;
    });
  });
  updateHUD();
  const hudName = document.getElementById('p1-hud-name');
  if (hudName && playerBall) {
    const buildText = handbookBuild.map(id => HANDBOOK_BLESSINGS.find(b => b.id === id)).filter(Boolean).map(b => `${b.icon}${b.name}`).join('　');
    hudName.innerHTML = `${charIconHTML(playerBall.char, '1em')} ${playerBall.char.displayName || playerBall.char.name} <span title="${buildText}" style="font-size:.65em;color:#f2d28b;letter-spacing:0">[${buildText || '無祝福'}]</span>`;
  }
  const enemyHudName = document.getElementById('p2-hud-name');
  if (enemyHudName && enemyBall) {
    const affixText = handbookEnemyAffixSet(handbookStage).map(a => `${a.icon}${a.name}`).join('　');
    enemyHudName.innerHTML = `${enemyBall.char.displayName || enemyBall.char.name} <span title="${affixText}" style="font-size:.65em;color:#ffb86b;letter-spacing:0">[${affixText || '無詞綴'}]</span> ${charIconHTML(enemyBall.char, '1em')}`;
  }
}

function handleHandbookResult(p1Won) {
  if (!handbookMode) return;
  if (p1Won) {
    handbookStage++;
    if (handbookStage > handbookBest) {
      handbookBest = handbookStage - 1;
      localStorage.setItem('handbookBest', String(handbookBest));
    }
    showHandbookStage('通關！下一個對手');
    return;
  }
  const reached = Math.max(0, handbookStage - 1);
  if (reached > handbookBest) {
    handbookBest = reached;
    localStorage.setItem('handbookBest', String(handbookBest));
  }
  if (gameLoop) { cancelAnimationFrame(gameLoop); gameLoop = null; }
  document.getElementById('handbook-screen').style.display = 'none';
  document.getElementById('handbook-result-screen').style.display = 'flex';
  document.getElementById('hb-result-stage').textContent = `闖到第 ${handbookStage} 關前止步`;
  document.getElementById('hb-best').textContent = `最高紀錄：第 ${handbookBest} 關`;
}

function handbookResetRun() {
  handbookMode = true;
  handbookSessionId++;
  handbookStage = 1;
  handbookRerolls = HANDBOOK_START_REROLLS;
  handbookEnemyId = null;
  handbookPreviousEnemyId = null;
  handbookChoices = [];
  handbookChoiceIds = [];
  handbookBuild = [];
  showHandbookStage('新的手札');
}

function backToSelectFromHandbook() {
  handbookMode = false;
  handbookSessionId++;
  if (gameLoop) { cancelAnimationFrame(gameLoop); gameLoop = null; }
  assembleMode = false;
  sandboxMode = false;
  bossMode = false;
  dummyPracticeMode = false;
  wheelState = null;
  p1Choice = null; p2Choice = null; p3Choice = null; p4Choice = null;
  document.getElementById('handbook-screen').style.display = 'none';
  document.getElementById('handbook-result-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('mode-modal').style.display = 'none';
  document.getElementById('select-screen').style.display = 'flex';
  updateStartBtnState();
}

