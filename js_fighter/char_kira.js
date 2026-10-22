/* js_fighter/char_kira.js — 吉良吉影（JOJO的奇妙冒險）
 * 殺手皇后粉紅色系 / 小車支援 sprite / 敗者食塵回溯特效
 * 載入：ball_fighter.html，放在 ui_select.js 之前 */
(function () {
  'use strict';
  const ID = 'kira';
  const C = (typeof CHARS !== 'undefined') && CHARS[ID];
  if (!C) { console.warn('[char_kira] 找不到 CHARS.kira'); return; }

  const PINK = '#ff7eb6', LIGHT = '#ffc2dc', DEEP = '#ff4a8a', GOLD = '#ffd77a';

  function ensureKira(f) {
    if (!f.kira) f.kira = {
      bomb: null, bombCd: 0,
      air: null, airTurn: 0,
      despair: 0, snaps: [], lastSnap: 0,
    };
    return f.kira;
  }
  const origMk = window.mk;
  window.mk = function (id, x, side, isAI) {
    const f = origMk(id, x, side, isAI);
    if (id === ID) ensureKira(f);
    return f;
  };

  /* ── 普攻標記：粉色倒數環 ── */
  C.sk.a.onHit = function (t, sk) {
    const f = (t === G.e) ? G.p : (t === G.p) ? G.e : null;
    if (!f || f.c !== C || !f.kira) return;
    const now = performance.now() / 1000;
    if ((f.kira.markCd || 0) > now) return;
    f.kira.markCd = now + (C.sk.a.markCd || 5);
    const delay = C.sk.a.markDelay || 2;
    const dmg = C.sk.a.markDmg || 300;
    t._kiraMark = { t: delay, total: delay };
    // 掛上瞬間：粉色環收束
    G.fx.push({ k:'ring', x:t.x, y:t.y, t:.35, m:.35, r:CFG.r*1.6, col:PINK });
    spark(t.x, t.y, PINK, 12, 380, .35, 3);
    later(delay, () => {
      if (G.state !== 'fight' || !t || t.hp <= 0) return;
      hit(t, dmg, t.x, t.y, 120, 0, null, f);
      // 引爆：三層粉色環 + 粒子
      G.fx.push({ k:'ring', x:t.x, y:t.y, t:.5, m:.5, r:130, col:PINK });
      G.fx.push({ k:'ring', x:t.x, y:t.y, t:.35, m:.35, r:80, col:'#fff' });
      G.fx.push({ k:'ring', x:t.x, y:t.y, t:.6, m:.6, r:170, col:DEEP });
      spark(t.x, t.y, PINK, 22, 700, .45, 4);
      spark(t.x, t.y, LIGHT, 12, 500, .35, 2.5);
      shake(6);
    }, f);
    G.fx.push({ k:'txt', x:t.x, y:t.y-40, s:'KILLER QUEEN', col:PINK, t:.8, m:.8 });
  };

  /* ── 技能一：第一炸彈 ── */
  const BEHAVIORS = window.BEHAVIORS || {};
  BEHAVIORS.kiraBomb = {
    fire(f, o, a, s) {
      ensureKira(f);
      if (f.kira.bomb) {
        const b = f.kira.bomb;
        f.kira.bomb = null;
        const bx = b.type === 'enemy' ? b.target.x : b.x;
        const by = b.type === 'enemy' ? b.target.y : b.y;
        // 粉色爆炸：多重環 + 碎片 + 閃光
        blast(f, bx, by, s.bombRad, s.bombDmg, 400, PINK, 0);
        G.fx.push({ k:'ring', x:bx, y:by, t:.6, m:.6, r:s.bombRad, col:PINK });
        G.fx.push({ k:'ring', x:bx, y:by, t:.4, m:.4, r:s.bombRad*0.6, col:'#fff' });
        G.fx.push({ k:'ring', x:bx, y:by, t:.8, m:.8, r:s.bombRad*1.3, col:DEEP });
        G.fx.push({ k:'flash', t:.25, m:.25, col:PINK, a:.8 });
        for (let i = 0; i < 20; i++) {
          const ang = Math.random() * Math.PI * 2;
          const dist = s.bombRad * (0.3 + Math.random() * 0.7);
          G.fx.push({ k:'dt', x:bx + Math.cos(ang)*dist, y:by + Math.sin(ang)*dist,
            vx:Math.cos(ang)*300, vy:Math.sin(ang)*300,
            t:.5, m:.5, col:Math.random()<.5 ? PINK : LIGHT, r:3+Math.random()*4, dr:4 });
        }
        if (b.type === 'enemy' && b.target && b.target.hp > 0)
          b.target.stun = Math.max(b.target.stun, s.bombStun || 1);
        shake(14);
        playSfx(SFX.hit);
        f.kira.bombCd = s.bombCd || 6;
        return;
      }
      // 衝刺：粉色拖尾（dashFx 已用 f.c.color）
      lunge(f, a.ang, {
        dist: s.dashDist, dur: s.dashDur,
        onHit: (foe) => {
          if (foe && foe.hp > 0 && !f.kira.bomb) {
            f.kira.bomb = { type:'enemy', target:foe, t:0, life:s.bombLife || 8 };
            pop(foe, 'KILLER QUEEN!', PINK);
            G.fx.push({ k:'ring', x:foe.x, y:foe.y, t:.5, m:.5, r:100, col:PINK });
            G.fx.push({ k:'ring', x:foe.x, y:foe.y, t:.7, m:.7, r:140, col:LIGHT });
            spark(foe.x, foe.y, PINK, 18, 500, .4, 3.5);
            shake(5);
          }
        },
        done: () => {
          const atWall = f.x <= CFG.r + 1 || f.x >= CFG.W - CFG.r - 1 ||
                         f.y <= CFG.r + 1 || f.y >= CFG.H - CFG.r - 1;
          if (atWall && !f.kira.bomb) {
            f.kira.bomb = { type:'wall', x:f.x, y:f.y, t:0, life:s.bombLife || 8 };
            pop(f, '牆壁炸彈', PINK);
            G.fx.push({ k:'ring', x:f.x, y:f.y, t:.5, m:.5, r:110, col:PINK });
            spark(f.x, f.y, PINK, 14, 450, .4, 3);
          }
          if (!f.kira.bomb) f.kira.bombCd = s.bombCd || 6;
        },
      });
    },
    ai: (e, p, c, q) => c.d < 500 ? c.p : null,
  };

  /* ── 技能二：空氣彈（AI 用）── */
  BEHAVIORS.kiraAir = {
    fire(f, o, a, s) {
      ensureKira(f);
      if (f.kira.air) return;
      const ang = Math.atan2(o.y - f.y, o.x - f.x);
      f.kira.air = {
        x: f.x + Math.cos(ang) * (CFG.r + 12),
        y: f.y + Math.sin(ang) * (CFG.r + 12),
        vx: Math.cos(ang) * s.speed, vy: Math.sin(ang) * s.speed,
        t: 0, s,
      };
    },
    ai: () => null,
  };

  /* ── 技能三：枯萎穿心攻擊 ── */
  BEHAVIORS.kiraCar = {
    fire(f, o, a, s) {
      if (!G.kiraCars) G.kiraCars = [];
      const ang = a.ang;
      G.kiraCars.push({
        x: f.x + Math.cos(ang) * (CFG.r + 10),
        y: f.y + Math.sin(ang) * (CFG.r + 10),
        vx: Math.cos(ang) * s.speed, vy: Math.sin(ang) * s.speed,
        t: 0, life: s.life, s, own: f, locked: false,
      });
      G.fx.push({ k:'ring', x:f.x, y:f.y, t:.35, m:.35, r:60, col:DEEP });
    },
    ai: (e, p, c, q) => c.d < 600 ? c.p : null,
  };

  /* ── 技能四：敗者食塵（主動）── */
  BEHAVIORS.kiraBites = {
    fire(f, o, a, s) {
      ensureKira(f);
      if (f.kira.despair < (s.despairMax || 100)) { pop(f, '絕望值不足', GOLD); return; }
      f.kira.despair = 0;
      rewind(f, o, s.rewind || 10);
      hit(o, s.dmg || 2000, f.x, f.y, 600, 1, null, f);
      say('敗者食塵！', 1.5);
    },
    ai: (e, p, c, q) => (e.kira && e.kira.despair >= 100 && c.d < 600) ? c.p : null,
  };

  /* ── 回溯：只還原雙方血量 / 能量 / 位置，觸發回溯特效 ── */
  function rewind(f, o, sec) {
    const k = f.kira, snap = k && k.snaps[0];
    if (!snap) return;
    // 回溯特效：複製一份快照倒放
    G.kiraRewind = {
      t: 0, T: 1.4,
      snaps: k.snaps.slice(),
      col: PINK, light: LIGHT,
    };
    f.x = snap.x; f.y = snap.y; f.hp = snap.hp; f.en = snap.en;
    o.x = snap.ox; o.y = snap.oy; o.hp = snap.ohp; o.en = snap.oen;
    if (G.t !== Infinity) G.t += sec;
    k.snaps = [];  // 重新開始記錄
  }

  /* ── 掛載行為 ── */
  Object.assign(window.BEHAVIORS, BEHAVIORS);
  for (const k in C.sk) {
    const q = C.sk[k];
    if (!q.key) q.key = k;
    if (q.type === 'throw' && !q.hold) q.hold = { start:.05, full:99 };
    const b = q.use && window.BEHAVIORS[q.use];
    if (b) for (const n in b) if (q[n] === undefined) q[n] = b[n];
  }

  /* ── canCast：技能四絕望值檢查 ── */
  const origCanCast = window.canCast;
  window.canCast = function (f, k) {
    if (!origCanCast(f, k)) return false;
    if (f.c === C && k === 'e') {
      ensureKira(f);
      if (f.kira.despair < (C.sk.e.despairMax || 100)) {
        if (f === G.p) say('絕望值不足', .7);
        return false;
      }
    }
    return true;
  };

  /* ── hit：絕望值疊加 ── */
  const origHit = window.hit;
  window.hit = function (t, d, fx, fy, kb, heavy, sk, att) {
    const th0 = t.hp, ah0 = att ? att.hp : 0;
    origHit(t, d, fx, fy, kb, heavy, sk, att);
    const tDmg = th0 - t.hp, aDmg = att ? ah0 - att.hp : 0;
    if (att && att.c === C && att.kira && tDmg > 0)
      att.kira.despair = Math.min(100, att.kira.despair + tDmg / 50);
    if (t && t.c === C && t.kira && aDmg > 0)
      t.kira.despair = Math.min(100, t.kira.despair + aDmg / 50);
  };

  /* ── endRound：被動敗者食塵 ── */
  const origEndRound = window.endRound;
  window.endRound = function (loser) {
    if (loser && loser.c === C && loser.kira &&
        loser.kira.despair >= (C.sk.e.despairMax || 100) && !G.ts) {
      loser.kira.despair = 0;
      const o = loser === G.p ? G.e : G.p;
      rewind(loser, o, C.sk.e.rewind || 10);
      loser.hp = Math.min(loser.c.hp, loser.hp + (C.sk.e.heal || 2500));
      G.state = 'fight';
      say('敗者食塵·被動觸發！', 1.5);
      return;
    }
    return origEndRound(loser);
  };

  /* ── 空氣彈：按鈕事件 ── */
  function bindAirButton() {
    for (const el of document.querySelectorAll('#stage .b')) {
      if (el.dataset.k !== 'c' || el._kiraBound) continue;
      el._kiraBound = true;
      let startX = 0, active = false;

      el.addEventListener('pointerdown', e => {
        const f = G.p;
        if (!f || f.c !== C || !f.kira || f.kira.air) return;
        if (!canCast(f, 'c')) return;
        e.stopPropagation(); e.preventDefault();
        el.setPointerCapture(e.pointerId);
        active = true; startX = e.clientX;
        const s = C.sk.c;
        f.en -= s.cost; f.cd.c = s.cd;
        f.blocking = false; f.act = null;
        const o = f === G.p ? G.e : G.p;
        const ang = Math.atan2(o.y - f.y, o.x - f.x);
        f.kira.air = {
          x: f.x + Math.cos(ang) * (CFG.r + 12),
          y: f.y + Math.sin(ang) * (CFG.r + 12),
          vx: Math.cos(ang) * s.speed, vy: Math.sin(ang) * s.speed,
          t: 0, s, trail: [],
        };
        f.kira.airTurn = 0;
      }, true);

      el.addEventListener('pointermove', e => {
        if (!active) return;
        const f = G.p;
        if (!f || !f.kira || !f.kira.air) return;
        e.stopPropagation();
        const dx = e.clientX - startX, dead = 8, max = 40;
        f.kira.airTurn = Math.abs(dx) < dead ? 0
          : Math.max(-1, Math.min(1, (dx - Math.sign(dx) * dead) / (max - dead)));
      }, true);

      const release = e => {
        if (!active) return;
        active = false;
        e.stopPropagation();
        const f = G.p;
        if (f && f.kira && f.kira.air) explodeAir(f);
        if (f && f.kira) f.kira.airTurn = 0;
      };
      el.addEventListener('pointerup', release, true);
      el.addEventListener('pointercancel', release, true);
    }
  }
  new MutationObserver(bindAirButton).observe(document.getElementById('stage'), { childList:true, subtree:true });
  bindAirButton();

  /* ── 空氣彈引爆：粉色爆炸 + 減速 ── */
  function explodeAir(f) {
    const k = f.kira, a = k && k.air;
    if (!a) return;
    k.air = null;
    const s = a.s;
    blast(f, a.x, a.y, s.rad, s.dmg, 300, PINK, 0);
    for (const t of [G.p, G.e]) {
      if (t === f) continue;
      if (Math.hypot(t.x - a.x, t.y - a.y) < s.rad + CFG.r)
        addStatus(t, { k:'slow', dur:s.slowDur, v:s.slowV });
    }
    G.fx.push({ k:'ring', x:a.x, y:a.y, t:.55, m:.55, r:s.rad, col:PINK });
    G.fx.push({ k:'ring', x:a.x, y:a.y, t:.4, m:.4, r:s.rad*0.6, col:'#fff' });
    G.fx.push({ k:'flash', t:.2, m:.2, col:LIGHT, a:.6 });
    spark(a.x, a.y, PINK, 24, 650, .45, 3.5);
    spark(a.x, a.y, LIGHT, 12, 450, .35, 2);
    shake(10);
    playSfx(SFX.hit);
  }

  /* ── 每幀更新吉良狀態 ── */
  function updateKira(f, dt) {
    const k = f.kira, o = f === G.p ? G.e : G.p;
    const now = performance.now() / 1000;
    if (now - k.lastSnap > 0.1) {
      k.lastSnap = now;
      k.snaps.push({ x:f.x, y:f.y, hp:f.hp, en:f.en, ox:o.x, oy:o.y, ohp:o.hp, oen:o.en });
      if (k.snaps.length > 110) k.snaps.shift();
    }
    if (k.bomb) {
      k.bomb.t += dt;
      if (k.bomb.t > (C.sk.b.bombLife || 8)) { k.bomb = null; k.bombCd = C.sk.b.bombCd || 6; }
    }
    if (k.bombCd > 0) { k.bombCd = Math.max(0, k.bombCd - dt); f.cd.b = k.bombCd; }
    if (f._kiraMark) { f._kiraMark.t -= dt; if (f._kiraMark.t <= 0) delete f._kiraMark; }
    if (o._kiraMark) { o._kiraMark.t -= dt; if (o._kiraMark.t <= 0) delete o._kiraMark; }
    if (k.air) {
      const a = k.air, s = a.s;
      a.t += dt;
      if (k.airTurn) {
        const ang = Math.atan2(a.vy, a.vx) + s.turnMax * k.airTurn * dt;
        const sp = Math.hypot(a.vx, a.vy);
        a.vx = Math.cos(ang) * sp; a.vy = Math.sin(ang) * sp;
      }
      a.x += a.vx * dt; a.y += a.vy * dt;
      // 拖尾
      a.trail.push({ x:a.x, y:a.y });
      if (a.trail.length > 14) a.trail.shift();
      // 飛行粒子
      if (G.fx.length < FXCAP && Math.random() < .7) {
        G.fx.push({ k:'dt', x:a.x+(Math.random()-.5)*24, y:a.y+(Math.random()-.5)*24,
          vx:-a.vx*.08+(Math.random()-.5)*60, vy:-a.vy*.08+(Math.random()-.5)*60,
          t:.4, m:.4, col:Math.random()<.5 ? PINK : LIGHT, r:2+Math.random()*3, dr:4 });
      }
      const out = a.x < CFG.r || a.x > CFG.W - CFG.r || a.y < CFG.r || a.y > CFG.H - CFG.r;
      if (out || a.t > (s.maxHold || 4) || f.stun > 0 || stat(f, 'root', 0)) explodeAir(f);
    }
  }

  /* ── 小車更新 ── */
  function updateCars(dt) {
    if (!G.kiraCars) return;
    for (let i = G.kiraCars.length - 1; i >= 0; i--) {
      const c = G.kiraCars[i];
      if (c.own !== G.p && c.own !== G.e) { G.kiraCars.splice(i, 1); continue; }
      c.t += dt;
      const o = c.own === G.p ? G.e : G.p;
      if (!c.locked && o && o.hp > 0 && Math.hypot(o.x - c.x, o.y - c.y) < c.s.detectRad) {
        c.locked = true;
        c.lockT = 0;
        const ang = Math.atan2(o.y - c.y, o.x - c.x);
        c.vx = Math.cos(ang) * c.s.dashSpeed;
        c.vy = Math.sin(ang) * c.s.dashSpeed;
      }
      if (c.locked) c.lockT = (c.lockT || 0) + dt;
      c.x += c.vx * dt; c.y += c.vy * dt;
      // 尾跡粒子
      if (G.fx.length < FXCAP && Math.random() < .5) {
        G.fx.push({ k:'sp', x:c.x+(Math.random()-.5)*20, y:c.y+(Math.random()-.5)*20,
          vx:-c.vx*.05, vy:-c.vy*.05, t:.3, m:.3, col:c.locked ? DEEP : PINK, w:2.5, dr:4 });
      }
      const hitT = o && o.hp > 0 && Math.hypot(o.x - c.x, o.y - c.y) < c.s.r + CFG.r;
      const atWall = c.x < CFG.r || c.x > CFG.W - CFG.r || c.y < CFG.r || c.y > CFG.H - CFG.r;
      if (hitT || (c.locked && atWall)) {
        blast(c.own, c.x, c.y, c.s.rad, c.s.dmg, c.s.kb, PINK, 0);
        G.fx.push({ k:'ring', x:c.x, y:c.y, t:.5, m:.5, r:c.s.rad, col:PINK });
        G.fx.push({ k:'ring', x:c.x, y:c.y, t:.35, m:.35, r:c.s.rad*0.6, col:'#fff' });
        G.fx.push({ k:'ring', x:c.x, y:c.y, t:.65, m:.65, r:c.s.rad*1.2, col:DEEP });
        spark(c.x, c.y, PINK, 20, 600, .45, 3.5);
        shake(10);
        G.kiraCars.splice(i, 1);
        continue;
      }
      if ((!c.locked && atWall) || c.t > c.life) G.kiraCars.splice(i, 1);
    }
  }

  /* ── 包裝 stepF：空氣彈飛行期間吉良原地不動 ── */
  const origStepF = window.stepF;
  window.stepF = function (f, dt) {
    if (f.c === C && f.kira && f.kira.air) {
      f.mx = 0; f.my = 0; f.kx = 0; f.ky = 0; f.dashT = 0;
    }
    return origStepF(f, dt);
  };

  /* ── 包裝 update ── */
  const origUpdate = window.update;
  window.update = function (dt) {
    origUpdate(dt);
    if (G.state !== 'fight') return;
    for (const f of [G.p, G.e])
      if (f && f.c === C) { ensureKira(f); updateKira(f, dt); }
    updateCars(dt);
    if (G.kiraRewind) {
      G.kiraRewind.t += dt;
      if (G.kiraRewind.t >= G.kiraRewind.T) G.kiraRewind = null;
    }
  };

  /* ── 包裝 drawProj：空氣彈 / 小車 ── */
  const origDrawProj = window.drawProj;
  window.drawProj = function (q) {
    if (q._kiraAir) {
      drawAirBall(q);
      return;
    }
    if (q._kiraCar) {
      drawKiraCar(q);
      return;
    }
    return origDrawProj(q);
  };

  function drawAirBall(q) {
    const T = performance.now() / 1000;
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    // 拖尾殘影
    const tr = q.trail || [];
    for (let i = 0; i < tr.length; i++) {
      const k = i / tr.length;
      cx.globalAlpha = k * 0.5;
      cx.fillStyle = k > .7 ? LIGHT : PINK;
      cx.beginPath(); cx.arc(tr[i].x, tr[i].y, 8 + k * 10, 0, 7); cx.fill();
    }
    // 主體：粉色球 + 光暈
    cx.globalAlpha = 1;
    const g = cx.createRadialGradient(q.x, q.y, 2, q.x, q.y, 42);
    g.addColorStop(0, '#fff');
    g.addColorStop(.35, PINK);
    g.addColorStop(1, 'rgba(255,126,182,0)');
    cx.fillStyle = g;
    cx.beginPath(); cx.arc(q.x, q.y, 42, 0, 7); cx.fill();
    // 核心
    cx.fillStyle = '#fff';
    cx.beginPath(); cx.arc(q.x, q.y, 8, 0, 7); cx.fill();
    // 環繞粒子
    for (let i = 0; i < 4; i++) {
      const a = T * 6 + i * Math.PI / 2;
      const rr = 22 + Math.sin(T * 10 + i) * 6;
      cx.globalAlpha = 0.8;
      cx.fillStyle = LIGHT;
      cx.beginPath(); cx.arc(q.x + Math.cos(a) * rr, q.y + Math.sin(a) * rr, 3, 0, 7); cx.fill();
    }
    cx.restore();
  }

  function drawKiraCar(q) {
    const s = q.s, T = performance.now() / 1000;
    const ang = Math.atan2(q.vy, q.vx);
    cx.save();
    cx.translate(q.x, q.y);
    // 光暈
    cx.globalCompositeOperation = 'lighter';
    const g = cx.createRadialGradient(0, 0, 4, 0, 0, s.r * 2.2);
    g.addColorStop(0, 'rgba(255,126,182,.7)');
    g.addColorStop(1, 'rgba(255,126,182,0)');
    cx.fillStyle = g;
    cx.beginPath(); cx.arc(0, 0, s.r * 2.2, 0, 7); cx.fill();
    cx.globalCompositeOperation = 'source-over';
    // 鎖定時：脈動紅光
    if (q.locked) {
      const pulse = 0.5 + 0.5 * Math.sin(T * 20);
      cx.globalAlpha = pulse * 0.8;
      cx.strokeStyle = DEEP; cx.lineWidth = 3;
      cx.beginPath(); cx.arc(0, 0, s.r * 1.5, 0, 7); cx.stroke();
      cx.globalAlpha = 1;
    }
    // 圖片或備用造型
    const img = Assets.get(s.sprite);
    if (img) {
      cx.rotate(ang);
      const L = s.r * 2.6, H = L * img.height / img.width;
      cx.drawImage(img, -L / 2, -H / 2, L, H);
    } else {
      cx.rotate(ang);
      // 粉色小車：車身 + 車頭 + 輪子
      cx.fillStyle = PINK;
      cx.fillRect(-s.r, -s.r * .7, s.r * 2, s.r * 1.4);
      cx.strokeStyle = '#fff'; cx.lineWidth = 2;
      cx.strokeRect(-s.r, -s.r * .7, s.r * 2, s.r * 1.4);
      // 車頭（朝右）
      cx.fillStyle = DEEP;
      cx.beginPath();
      cx.moveTo(s.r, -s.r * .7); cx.lineTo(s.r * 1.4, 0); cx.lineTo(s.r, s.r * .7);
      cx.closePath(); cx.fill();
      // 眼睛
      cx.fillStyle = '#fff';
      cx.beginPath(); cx.arc(s.r * .3, -s.r * .3, 3, 0, 7); cx.fill();
      cx.beginPath(); cx.arc(s.r * .3, s.r * .3, 3, 0, 7); cx.fill();
      // 輪子
      cx.fillStyle = '#333';
      cx.beginPath(); cx.arc(-s.r * .5, -s.r * .7, 4, 0, 7); cx.fill();
      cx.beginPath(); cx.arc(-s.r * .5, s.r * .7, 4, 0, 7); cx.fill();
      cx.beginPath(); cx.arc(s.r * .5, -s.r * .7, 4, 0, 7); cx.fill();
      cx.beginPath(); cx.arc(s.r * .5, s.r * .7, 4, 0, 7); cx.fill();
    }
    cx.restore();
  }

  /* ── 包裝 draw：世界層特效 + 回溯特效 + 絕望值條 ── */
  const origDraw = window.draw;
  window.draw = function () {
    // 1. 空氣彈 / 小車塞 fake proj 讓主程式世界層畫
    const fake = [];
    for (const f of [G.p, G.e]) {
      if (!f || f.c !== C || !f.kira || !f.kira.air) continue;
      const a = f.kira.air;
      fake.push({ x:a.x, y:a.y, vx:a.vx, vy:a.vy, s:{ r:18, col:PINK }, col:PINK,
        tr:[], trail:a.trail, _kiraAir:true });
    }
    if (G.kiraCars) for (const c of G.kiraCars)
      fake.push({ x:c.x, y:c.y, vx:c.vx, vy:c.vy, s:c.s, col:c.s.col, tr:[], locked:c.locked, _kiraCar:true });

    const oldProjs = G.projs;
    if (fake.length) G.projs = oldProjs.concat(fake);
    origDraw();
    G.projs = oldProjs;

    // 2. 世界座標層：標記環、敵人身上炸彈、追蹤線
    cx.save();
    cx.scale(view.s, view.s); cx.translate(-cam.x, -cam.y);
    const T = performance.now() / 1000;

    // 標記環（粉色倒數 + 脈動）
    for (const f of [G.p, G.e]) {
      if (!f || !f._kiraMark) continue;
      const p = f._kiraMark, k = p.t / p.total;
      const pulse = 1 + 0.12 * Math.sin(T * 14);
      cx.save();
      cx.translate(f.x, f.y);
      cx.globalCompositeOperation = 'lighter';
      // 外環
      cx.globalAlpha = 0.5 + 0.5 * (1 - k);
      cx.strokeStyle = PINK;
      cx.lineWidth = 4;
      cx.beginPath();
      cx.arc(0, 0, (CFG.r + 16) * pulse, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
      cx.stroke();
      // 內環
      cx.globalAlpha = 0.7;
      cx.strokeStyle = LIGHT;
      cx.lineWidth = 2;
      cx.beginPath();
      cx.arc(0, 0, CFG.r + 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k));
      cx.stroke();
      // 上方倒數
      cx.globalAlpha = 1;
      cx.fillStyle = PINK;
      cx.font = 'bold 16px system-ui';
      cx.textAlign = 'center';
      cx.fillText(p.t.toFixed(1), 0, -CFG.r - 30);
      cx.restore();
    }

    // 敵人身上的炸彈 / 牆上炸彈
    for (const f of [G.p, G.e]) {
      if (!f || f.c !== C || !f.kira || !f.kira.bomb) continue;
      const b = f.kira.bomb;
      const bx = b.type === 'enemy' ? b.target.x : b.x;
      const by = b.type === 'enemy' ? b.target.y : b.y;
      const pulse = 1 + 0.18 * Math.sin(T * 12);
      cx.save();
      cx.translate(bx, by);
      cx.globalCompositeOperation = 'lighter';
      // 光暈
      const g = cx.createRadialGradient(0, 0, 6, 0, 0, 60 * pulse);
      g.addColorStop(0, 'rgba(255,255,255,.85)');
      g.addColorStop(0.35, 'rgba(255,126,182,.6)');
      g.addColorStop(1, 'rgba(255,126,182,0)');
      cx.fillStyle = g;
      cx.beginPath(); cx.arc(0, 0, 60 * pulse, 0, 7); cx.fill();
      cx.globalCompositeOperation = 'source-over';
      // 炸彈本體
      cx.fillStyle = PINK;
      cx.beginPath(); cx.arc(0, 0, 20 * pulse, 0, 7); cx.fill();
      cx.strokeStyle = '#fff'; cx.lineWidth = 2.5;
      cx.stroke();
      // 引線
      cx.strokeStyle = GOLD;
      cx.lineWidth = 2.5;
      cx.beginPath();
      cx.moveTo(0, -20); cx.quadraticCurveTo(10, -30, 4, -40);
      cx.stroke();
      // 火花
      const sx = 4 + Math.random() * 4, sy = -40 + Math.random() * 4;
      cx.fillStyle = '#fff';
      cx.beginPath(); cx.arc(sx, sy, 3, 0, 7); cx.fill();
      cx.fillStyle = GOLD;
      cx.beginPath(); cx.arc(sx, sy, 6, 0, 7); cx.fill();
      // 剩餘時間
      const remain = (C.sk.b.bombLife || 8) - b.t;
      cx.globalAlpha = 1;
      cx.fillStyle = '#fff';
      cx.font = 'bold 12px system-ui';
      cx.textAlign = 'center';
      cx.fillText(remain.toFixed(1), 0, -58);
      cx.restore();
    }

    // 小車追蹤線
    if (G.kiraCars) for (const c of G.kiraCars) {
      const o = c.own === G.p ? G.e : G.p;
      if (!o || o.hp <= 0) continue;
      if (!c.locked) {
        // 未被鎖定：偵測圈（淡粉）
        cx.save();
        cx.globalAlpha = 0.15;
        cx.strokeStyle = PINK;
        cx.lineWidth = 1.5;
        cx.setLineDash([8, 8]);
        cx.beginPath(); cx.arc(c.x, c.y, c.s.detectRad, 0, 7); cx.stroke();
        cx.restore();
      } else {
        // 已鎖定：粉色實線 + 箭頭
        cx.save();
        cx.globalAlpha = 0.55;
        cx.strokeStyle = DEEP;
        cx.lineWidth = 3;
        cx.setLineDash([10, 6]);
        cx.lineDashOffset = -T * 80;
        cx.beginPath();
        cx.moveTo(c.x, c.y); cx.lineTo(o.x, o.y);
        cx.stroke();
        cx.setLineDash([]);
        cx.restore();
      }
    }
    cx.restore();

    // 3. 敗者食塵回溯特效（螢幕座標）
    if (G.kiraRewind) drawRewindFx();
  };

  /* ── 敗者食塵回溯特效 ── */
  function drawRewindFx() {
    const r = G.kiraRewind, w = view.w, h = view.h;
    const k = Math.min(1, r.t / r.T);
    const T = performance.now() / 1000;

    // a. 全屏粉色疊加（脈動）
    cx.save();
    cx.globalAlpha = (1 - k) * 0.35 * (0.8 + 0.2 * Math.sin(T * 20));
    cx.fillStyle = r.col;
    cx.fillRect(0, 0, w, h);
    cx.restore();

    // b. 殘影倒放（從世界座標畫）
    const snaps = r.snaps;
    if (snaps.length > 0) {
      const totalIdx = snaps.length;
      const progress = k;
      const curIdx = Math.floor((1 - progress) * totalIdx);
      cx.save();
      cx.scale(view.s, view.s); cx.translate(-cam.x, -cam.y);
      const count = Math.min(20, totalIdx);
      for (let i = 0; i < count; i++) {
        const idx = Math.max(0, curIdx - i);
        const s = snaps[idx];
        if (!s) continue;
        const alpha = (1 - i / count) * 0.35;
        // 吉良殘影
        cx.globalAlpha = alpha;
        cx.fillStyle = r.col;
        cx.beginPath(); cx.arc(s.x, s.y, CFG.r, 0, 7); cx.fill();
        cx.strokeStyle = '#fff';
        cx.lineWidth = 2;
        cx.stroke();
        // 敵人殘影
        cx.fillStyle = r.light;
        cx.beginPath(); cx.arc(s.ox, s.oy, CFG.r, 0, 7); cx.fill();
      }
      cx.restore();
    }

    // c. 橫向時間刻度線（往後退）
    cx.save();
    cx.globalAlpha = (1 - k) * 0.35;
    for (let i = 0; i < 14; i++) {
      const y = h * (i + 0.5) / 14;
      const offset = (T * 240 + i * 37) % 80;
      for (let x = -offset; x < w; x += 80) {
        cx.fillStyle = i % 2 === 0 ? r.col : r.light;
        cx.fillRect(x, y, 44, 2);
      }
    }
    cx.restore();

    // d. 中心時鐘（指針倒轉）
    cx.save();
    cx.translate(w / 2, h / 2);
    const R = Math.min(w, h) * 0.15;
    cx.globalAlpha = Math.min(1, (1 - k) * 1.5);
    // 外圈
    cx.strokeStyle = r.col;
    cx.lineWidth = 4;
    cx.beginPath(); cx.arc(0, 0, R, 0, 7); cx.stroke();
    // 刻度
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6 - Math.PI / 2;
      const r1 = i % 3 === 0 ? R * 0.75 : R * 0.88;
      cx.strokeStyle = i % 3 === 0 ? r.col : r.light;
      cx.lineWidth = i % 3 === 0 ? 3 : 2;
      cx.beginPath();
      cx.moveTo(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95);
      cx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      cx.stroke();
    }
    // 指針：從 12 點逆時針快速轉 3 圈
    const handAng = -Math.PI / 2 - k * Math.PI * 2 * 3;
    cx.strokeStyle = r.col;
    cx.lineWidth = 5;
    cx.lineCap = 'round';
    cx.beginPath();
    cx.moveTo(0, 0);
    cx.lineTo(Math.cos(handAng) * R * 0.72, Math.sin(handAng) * R * 0.72);
    cx.stroke();
    // 中心
    cx.fillStyle = r.col;
    cx.beginPath(); cx.arc(0, 0, 8, 0, 7); cx.fill();
    cx.fillStyle = '#fff';
    cx.beginPath(); cx.arc(0, 0, 3, 0, 7); cx.fill();
    // 文字
    cx.globalAlpha = Math.min(1, (1 - k) * 2);
    cx.fillStyle = '#fff';
    cx.font = 'bold 22px system-ui';
    cx.textAlign = 'center';
    cx.fillText('BITES THE DUST', 0, R + 42);
    cx.restore();

    // e. 螢幕邊緣粉色脈衝光
    cx.save();
    const bw = 60;
    const grd = cx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.35, w/2, h/2, Math.max(w,h)*0.7);
    grd.addColorStop(0, 'rgba(255,126,182,0)');
    grd.addColorStop(1, `rgba(255,126,182,${(1-k) * 0.75 * (0.7 + 0.3*Math.sin(T*18))})`);
    cx.fillStyle = grd;
    cx.fillRect(0, 0, w, h);
    cx.restore();

    // f. 時間數字（倒數）
    cx.save();
    cx.globalAlpha = (1 - k) * 0.9;
    cx.fillStyle = r.col;
    cx.font = 'bold 48px system-ui';
    cx.textAlign = 'center';
    const sec = Math.max(0, 10 - k * 10);
    cx.fillText(sec.toFixed(1) + 's', w / 2, h * 0.15);
    cx.restore();
  }

  /* ── 絕望值條（粉色）── */
  function drawDespairBar() {
    const kf = (G.p && G.p.c === C) ? G.p : (G.e && G.e.c === C ? G.e : null);
    if (!kf || !kf.kira) return;
    const w = Math.min(view.w * .36, 360), x = 10, y = 62;
    cx.save();
    // 底
    cx.fillStyle = '#0008';
    cx.fillRect(x, y, w, 8);
    // 填充
    const val = Math.min(1, kf.kira.despair / 100);
    const g = cx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, DEEP);
    g.addColorStop(0.5, PINK);
    g.addColorStop(1, LIGHT);
    cx.fillStyle = g;
    cx.fillRect(x, y, w * val, 8);
    // 滿了脈動
    if (val >= 1) {
      const T = performance.now() / 1000;
      cx.globalAlpha = 0.5 + 0.5 * Math.sin(T * 12);
      cx.fillStyle = '#fff';
      cx.fillRect(x, y, w, 8);
      cx.globalAlpha = 1;
    }
    // 文字
    cx.fillStyle = '#fff';
    cx.font = 'bold 10px system-ui';
    cx.textAlign = 'left';
    cx.fillText('絕望 ' + Math.round(kf.kira.despair) + ' / 100', x + 4, y + 22);
    cx.restore();
  }

  // 把絕望值條掛到每次 draw 最後
  const origDraw2 = window.draw;
  window.draw = function () {
    origDraw2();
    drawDespairBar();
  };

  console.log('[char_kira] 吉良吉影已載入（粉色 Killer Queen / 小車 sprite / 敗者食塵回溯特效）');
})();