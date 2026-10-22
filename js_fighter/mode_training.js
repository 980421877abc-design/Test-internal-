/* js_fighter/mode_training.js — 訓練模式（打木樁）嵌入檔
 * 載入：ball_fighter.html，放在主邏輯之後、ui_select.js 之前
 * 唯一開啟入口：角色詳情頁右上角「訓練模式」按鈕（用詳情頁上的角色）
 * 不改任何現有檔案；用猴子補丁包裝 update / draw / ai / endRound / hud
 * 木樁用 Object.defineProperty 定義成不可列舉，選角介面不會看到它
 */
(function () {
  'use strict';
  if (typeof CHARS === 'undefined' || typeof CFG === 'undefined') {
    console.warn('[training] 需先載入 ball_fighter_data.js 與主邏輯'); return;
  }

  /* ── 1. 木樁角色（不可列舉 → 選角介面不會列出）── */
  if (!CHARS.dummy) {
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
  }

  let TRAIN = null;

  /* ── 2. 從詳情頁判斷「現在該用誰」── */
  function detailCharId() {
    const dn = document.querySelector('#stage .bfsel .det .dcard .dn');
    if (!dn) return null;
    const det = dn.closest('.det');
    if (det && det.style.display === 'none') return null;
    const name = dn.textContent.trim();
    for (const k in CHARS) if (CHARS[k].name === name && k !== 'dummy') return k;
    return null;
  }

  /* ── 3. 啟動入口 ── */
  window.startTraining = function (pid) {
    let id = (pid && CHARS[pid] && pid !== 'dummy') ? pid : null;
    if (!id) id = detailCharId();
    if (!id && typeof G !== 'undefined' && G.p && CHARS[G.p.id] && G.p.id !== 'dummy') id = G.p.id;
    if (!id) id = (typeof sel !== 'undefined' && CHARS[sel.p] && sel.p !== 'dummy') ? sel.p : 'gojo';
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

  /* ── 4. 包裝 update：木樁固定 / 滿血 / 統計 ── */
  const origUpdate = window.update;
  window.update = function (dt) {
    if (!G.training) return origUpdate(dt);
    const e = G.e, p = G.p, hpBefore = e.hp;
    origUpdate(dt);

    const dmg = hpBefore - e.hp;
    if (TRAIN && dmg > 0) {
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

    e.hp = e.c.hp; e.x = e.trainX; e.y = e.trainY; e.kx = e.ky = 0;
    e.stun = 0; e.blocking = false; e.act = null; e.hold = null; e.dashT = 0;
    e.face = Math.atan2(p.y - e.y, p.x - e.x);
    p.hp = p.c.hp;
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
    G.t = 0; G.ot = false;
    origDraw();
    G.t = oldT; G.ot = oldOt;
    drawPanel();
  };
  function drawPanel() {
    if (!TRAIN) return;
    const pw = 240, px = 12, py = 78;
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

  /* ── 9. 鍵盤：R 重置統計（不再是 T 開訓練）── */
  addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === 'r' && G.training && TRAIN) {
      TRAIN = { total: 0, combo: 0, maxCombo: 0, lastHitT: 0, dmg3s: [], dps: 0, hits: 0 };
      if (typeof say === 'function') say('統計已重置', 1);
    }
  });

  /* ── 10. 角色詳情頁右上角注入「訓練模式」按鈕（唯一入口）── */
  function injectDetailBtn() {
    const det = document.querySelector('#stage .bfsel .det');
    if (!det) return;
    if (det.style.display === 'none') { const b = det.querySelector('#trainDetail'); if (b) b.remove(); return; }
    const id = detailCharId();
    if (!id) return;
    let btn = det.querySelector('#trainDetail');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'trainDetail';
      btn.textContent = '訓練模式';
      btn.style.cssText = 'position:absolute;right:124px;top:26px;height:68px;padding:0 24px;border:2px solid #4fd0ff;border-radius:14px;background:#0d2447;color:#4fd0ff;font-size:24px;font-weight:900;cursor:pointer;z-index:5;';
      det.appendChild(btn);
    }
    btn.onclick = () => window.startTraining(id);
  }

  /* ── 11. 詳情頁開 / 關 / 切角色時自動補按鈕 ── */
  const stage = document.getElementById('stage');
  new MutationObserver(injectDetailBtn).observe(stage, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['style']
  });
  injectDetailBtn();

  console.log('[training] 訓練模式已載入：角色詳情頁右上「訓練模式」');
})();
