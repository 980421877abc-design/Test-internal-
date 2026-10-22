/* js_fighter/mode_training.js — 訓練模式（打木樁）嵌入檔
 * 載入：ball_fighter.html，放在主邏輯之後、ui_select.js 之前
 * 不改任何現有檔案；用猴子補丁包裝 update / draw / ai / endRound / hud
 * 木樁用 Object.defineProperty 定義成不可列舉，選角介面不會看到它 */
(function () {
  'use strict';
  if (typeof CHARS === 'undefined' || typeof CFG === 'undefined') {
    console.warn('[training] 需先載入 ball_fighter_data.js 與主邏輯'); return;
  }

  /* ── 1. 木樁角色（不可列舉 → Object.keys(CHARS) 不會列出）── */
  Object.defineProperty(CHARS, 'dummy', {
    value: {
      name: '訓練木樁', work: '練習場', color: '#c08a5a', glyph: '樁',
      hp: 1e12, speed: 0,
      res: { name: '—', max: 1, regen: 0, blockDrain: 0, color: '#666' },
      aiDist: 200,
      sk: { a: { name: '木樁', type: 'melee', cost: 0, cd: 99, wind: 1, dmg: 0, range: 1, arc: .01, kb: 0 } }
    },
    enumerable: false, writable: true, configurable: true
  });

  /* ── 2. 狀態 ── */
  let TRAIN = null;

  /* ── 3. 啟動入口 ── */
  window.startTraining = function (pid) {
    const id = (pid && CHARS[pid] && pid !== 'dummy') ? pid
      : (typeof sel !== 'undefined' && CHARS[sel.p] && sel.p !== 'dummy') ? sel.p
      : 'gojo';
    if (typeof sel !== 'undefined') sel.p = id;

    G = { round: 0, training: true };
    const dx = CFG.W * .62, px = CFG.W * .3;
    G.p = mk(id, px, 0, false);
    G.e = mk('dummy', dx, 1, false);
    G.e.isDummy = true;
    G.e.trainX = dx; G.e.trainY = CFG.H / 2;
    Object.assign(G, {
      projs: [], zones: [], orbs: [], domains: [], shields: [], sched: [], throws: [], ts: null, fx: [],
      t: Infinity, ot: true, state: 'fight'
    });
    TRAIN = { total: 0, combo: 0, maxCombo: 0, lastHitT: 0, dmg3s: [], dps: 0, hits: 0 };

    cam.snap = 1;
    if (typeof playBgm === 'function') playBgm();
    if (typeof layoutBtns === 'function') layoutBtns();
    if (typeof stopDomainSound === 'function') stopDomainSound();
    if (typeof say === 'function') say('訓練模式：盡情打木樁！', 1.5);

    const bfsel = document.querySelector('#stage .bfsel');
    if (bfsel) bfsel.style.display = 'none';
    paused = false;
  };

  /* ── 4. 包裝 update：木樁固定、雙方滿血、統計 ── */
  const origUpdate = window.update;
  window.update = function (dt) {
    if (!G.training) return origUpdate(dt);
    const e = G.e, p = G.p, hpBefore = e.hp;
    origUpdate(dt);                               // 玩家輸入、技能、命中判定全部照常

    const dmg = hpBefore - e.hp;
    if (TRAIN && dmg > 0) {                       // 傷害統計
      TRAIN.total += dmg; TRAIN.hits++;
      const now = performance.now() / 1000;
      TRAIN.combo = (now - TRAIN.lastHitT < 1.5) ? TRAIN.combo + 1 : 1;
      TRAIN.lastHitT = now;
      TRAIN.maxCombo = Math.max(TRAIN.maxCombo, TRAIN.combo);
      TRAIN.dmg3s.push({ t: now, d: dmg });
    }
    if (TRAIN) {
      const now = performance.now() / 1000;
      TRAIN.dmg3s = TRAIN.dmg3s.filter(x => now - x.t < 3);
      TRAIN.dps = TRAIN.dmg3s.reduce((a, x) => a + x.d, 0) / 3;
      if (now - TRAIN.lastHitT > 1.5) TRAIN.combo = 0;
    }

    // 木樁：固定位置、滿血、不動作、面向玩家
    e.hp = e.c.hp; e.x = e.trainX; e.y = e.trainY; e.kx = e.ky = 0;
    e.stun = 0; e.blocking = false; e.act = null; e.hold = null; e.dashT = 0;
    e.face = Math.atan2(p.y - e.y, p.x - e.x);
    // 玩家：自傷技能測完回滿
    p.hp = p.c.hp;
    // 不計時、不結束
    G.t = Infinity; G.state = 'fight';
  };

  /* ── 5. 木樁 AI 停用 ── */
  const origAi = window.ai;
  window.ai = function (e, p, dt) {
    if (G.training && e.isDummy) { e.mx = e.my = 0; return; }
    return origAi(e, p, dt);
  };

  /* ── 6. 不判勝負 ── */
  const origEndRound = window.endRound;
  window.endRound = function (loser) {
    if (G.training) { G.state = 'fight'; G.p.hp = Math.max(G.p.hp, 1); G.e.hp = Math.max(G.e.hp, 1); return; }
    return origEndRound(loser);
  };

  /* ── 7. 隱藏木樁 HUD ── */
  const origHud = window.hud;
  window.hud = function (f, left) {
    if (G.training && f === G.e) return;
    return origHud(f, left);
  };

  /* ── 8. 包裝 draw：計時器顯示 00:00 + 訓練面板 ── */
  const origDraw = window.draw;
  window.draw = function () {
    if (!G.training) return origDraw();
    const oldT = G.t, oldOt = G.ot;
    G.t = 0; G.ot = false;                        // 讓計時器顯示 00:00（不顯示 Infinity）
    origDraw();
    G.t = oldT; G.ot = oldOt;
    drawPanel();
  };
  function drawPanel() {
    if (!TRAIN) return;
    const w = view.w, pw = 240, px = 12, py = 78;
    cx.save();
    cx.fillStyle = 'rgba(8,16,32,.85)'; cx.fillRect(px, py, pw, 132);
    cx.strokeStyle = '#4fd0ff'; cx.lineWidth = 2; cx.strokeRect(px, py, pw, 132);
    cx.textAlign = 'left';
    cx.fillStyle = '#e8f3ff'; cx.font = 'bold 15px system-ui';
    cx.fillText('⚔ 訓練模式', px + 12, py + 24);
    cx.fillStyle = '#ffd77a'; cx.font = 'bold 20px system-ui';
    cx.fillText('累計傷害 ' + Math.round(TRAIN.total), px + 12, py + 54);
    cx.fillStyle = '#4fd0ff'; cx.font = 'bold 16px system-ui';
    cx.fillText('連段 ' + TRAIN.combo + '　最高 ' + TRAIN.maxCombo, px + 12, py + 80);
    cx.fillStyle = '#9ef09e';
    cx.fillText('DPS ' + Math.round(TRAIN.dps), px + 12, py + 104);
    cx.fillStyle = '#aab'; cx.font = '12px system-ui';
    cx.fillText('R 重置統計', px + 12, py + 124);
    cx.restore();
  }

  /* ── 9. 鍵盤：T 進訓練、R 重置統計 ── */
  addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === 't' && !G.training) { window.startTraining(typeof sel !== 'undefined' ? sel.p : undefined); return; }
    if (k === 'r' && G.training && TRAIN) {
      TRAIN = { total: 0, combo: 0, maxCombo: 0, lastHitT: 0, dmg3s: [], dps: 0, hits: 0 };
      if (typeof say === 'function') say('統計已重置', 1);
    }
  });

  /* ── 10. 選角介面注入「訓練模式」按鈕（DOM 重建後自動補回）── */
  function injectSelectBtn() {
    const bbar = document.querySelector('#stage .bfsel .bbar');
    if (!bbar || bbar.querySelector('[data-act="train"]')) return;
    const btn = document.createElement('button');
    btn.className = 'bbtn';
    btn.dataset.act = 'train';
    btn.textContent = '訓練模式';
    const rand = bbar.querySelector('[data-act="rand"]');
    bbar.insertBefore(btn, rand || null);
    btn.addEventListener('click', () => {
      window.startTraining(typeof sel !== 'undefined' ? sel.p : undefined);
    });
  }
  new MutationObserver(injectSelectBtn).observe(document.getElementById('stage'), { childList: true, subtree: true });
  injectSelectBtn();

  /* ── 11. 手機：遊戲中右上角浮動按鈕（選角介面被蓋住時用）── */
  function injectFloatBtn() {
    if (document.getElementById('trainFloat')) return;
    const btn = document.createElement('button');
    btn.id = 'trainFloat';
    btn.textContent = '訓練';
    btn.style.cssText = 'position:absolute;right:12px;top:96px;z-index:4;padding:6px 12px;border:2px solid #4fd0ff;border-radius:10px;background:rgba(10,16,34,.92);color:#4fd0ff;font-size:14px;font-weight:700;touch-action:none;';
    btn.onclick = () => window.startTraining(typeof sel !== 'undefined' ? sel.p : undefined);
    document.getElementById('stage').appendChild(btn);
  }
  injectFloatBtn();

  console.log('[training] 訓練模式已載入：選角介面按「訓練模式」、遊戲中按 T、或點右上「訓練」按鈕');
})();
