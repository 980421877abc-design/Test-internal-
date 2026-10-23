/* js_fighter/char_yelan.js — 夜蘭（原神）
 * 機制：元素力（原生 f.en）、元素爆發條（自訂）、元素微粒、破局、玄擲玲瓏、絡命標記
 * 載入順序：ball_fighter.html 主程式之後、ui_select.js 之前
 */
(function () {
  'use strict';
  if (typeof CHARS === 'undefined' || typeof CFG === 'undefined') return;
  if (CHARS.yelan) return;

  /* ─── 1. 角色資料 ─── */
  CHARS.yelan = {
    name: '夜蘭', work: '原神', color: '#6fd3ff', glyph: '蘭',
    img: 'image/yelan.png',
    hp: 8000, speed: 540,
    res: { name: '元素力', max: 2000, regen: 50, color: '#6fd3ff', blockDrain: 25 },
    aiDist: 380,
    yelan: {
      burstMax: 70,
      fortuneInterval: 3, fortuneMax: 3, fortuneExpire: 10,
      linglongDmg: 100, linglongDur: 12,
    },
    sk: {
      a: { name: '潛形隱曜弓', type: 'proj',
           hold: { start: .2, full: 1.2 }, aimMove: 1,
           cost: 0, cd: .4, wind: .08,
           dmg: 80, speed: 600, r: 14, life: 2.5, kb: 100,
           full: { dmg: 220, speed: 900, r: 20, kb: 200 },
           fortuneArrow: { dmg: 220, speed: 1400, r: 22, aoeDmg: 150, heal: 300 } },

      b: { name: '縈絡縱命索', type: 'melee',
           hold: { start: .05, full: 99 }, aimMove: 1, noCharge: 1,
           cost: 200, cd: 8, wind: .05,
           touchDmg: 150, explodeDmg: 250, motesPerMark: 3,
           hasteV: 1.3, maxHold: 3 },

      c: { name: '玲瓏骰擊', type: 'proj',
           cost: 150, cd: 6, wind: .1,
           diceSpeed: 800, diceBounces: 4, r: 28, dmg: 90, kb: 100,
           homingDmg: 120, homingSpeed: 900 },

      d: { name: '水幕封路', type: 'proj',
           cost: 250, cd: 10, wind: .1,
           arrows: 5, arrowSpeed: 900, spread: .7, dmg: 80, kb: 100, r: 16, life: 1.6,
           waterLife: 4, waterR: 100, waterSlowV: .6 },

      e: { name: '淵圖玲瓏骰', type: 'melee', ult: 1,
           cost: 0, cd: 20, wind: .3,
           dmg: 400, rad: 300, dur: 12,
           fortuneOnCast: 6 },
    },
  };
  const C = CHARS.yelan;

  /* ─── 2. 狀態初始化 ─── */
  function ensure(f) {
    if (!f.yelan) f.yelan = {
      burst: 0, burstMax: C.yelan.burstMax,
      fortune: 0, fortuneTimer: 0, fortuneExpireT: 0,
      exLinglong: null,
      skill1HitTargets: [],
    };
    return f.yelan;
  }
  const enemyOf = f => f === G.p ? G.e : G.p;
  const alive = f => !!f && f.hp > 0;
  const fx = o => G.fx.push(o);
  function initGameArrays() {
    if (!G.yelanMotes) G.yelanMotes = [];
    if (!G.yelanDice) G.yelanDice = [];
    if (!G.yelanWaters) G.yelanWaters = [];
  }

  /* ─── 3. 元素微粒 ─── */
  function spawnMote(x, y, vx, vy) {
    G.yelanMotes.push({ x, y, vx: vx || 0, vy: vy || 0, t: 0, r: 6, col: '#6fd3ff' });
  }
  function updateMotes(dt) {
    const xs = [G.p, G.e].filter(f => f && f.c === C);
    if (!xs.length) { G.yelanMotes.length = 0; return; }
    for (let i = G.yelanMotes.length - 1; i >= 0; i--) {
      const m = G.yelanMotes[i];
      m.t += dt;
      let best = null, bestD = 1e9;
      for (const f of xs) {
        const d = Math.hypot(m.x - f.x, m.y - f.y);
        if (d < bestD) { bestD = d; best = f; }
      }
      if (!best) continue;
      if (bestD < 40) {
        const k = ensure(best);
        k.burst = Math.min(k.burstMax, k.burst + 5);
        fx({ k: 'ring', x: m.x, y: m.y, r: 30, col: m.col, t: .3, m: .3 });
        G.yelanMotes.splice(i, 1);
        continue;
      }
      if (bestD < 600) {
        const a = Math.atan2(best.y - m.y, best.x - m.x);
        m.vx += Math.cos(a) * 1400 * dt;
        m.vy += Math.sin(a) * 1400 * dt;
      }
      m.vx *= Math.exp(-1.2 * dt); m.vy *= Math.exp(-1.2 * dt);
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.t > 60) G.yelanMotes.splice(i, 1);
    }
  }
  function drawMotes() {
    if (!G.yelanMotes || !G.yelanMotes.length) return;
    cx.save(); cx.scale(view.s, view.s); cx.translate(-cam.x, -cam.y);
    cx.globalCompositeOperation = 'lighter';
    const T = performance.now() / 1000;
    for (const m of G.yelanMotes) {
      const g = cx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3);
      g.addColorStop(0, '#fff'); g.addColorStop(.4, m.col); g.addColorStop(1, 'rgba(111,211,255,0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(m.x, m.y, m.r * 3, 0, 7); cx.fill();
      const a = T * 4 + m.t * 2;
      cx.strokeStyle = '#bfeaff'; cx.lineWidth = 2;
      cx.beginPath(); cx.arc(m.x, m.y, m.r * 1.4, a, a + 2.4); cx.stroke();
    }
    cx.restore();
  }

  /* ─── 4. 絡命標記 ─── */
  function applyMark(tgt, owner) {
    if (!tgt || !owner) return;
    if (!tgt.yelanMarks) tgt.yelanMarks = [];
    if (tgt.yelanMarks.find(m => m.owner === owner)) return;
    tgt.yelanMarks.push({ owner, t: 6 });
    fx({ k: 'ring', x: tgt.x, y: tgt.y, r: 64, col: '#5dd4ff', t: .4, m: .4 });
  }
  function explodeAllMarks(owner, s) {
    for (const tgt of [G.p, G.e]) {
      if (!tgt || tgt === owner || !tgt.yelanMarks) continue;
      if (!alive(tgt)) continue;
      const marks = tgt.yelanMarks.filter(m => m.owner === owner);
      if (!marks.length) continue;
      for (let i = 0; i < marks.length; i++) {
        hit(tgt, s.explodeDmg, tgt.x, tgt.y, 200, 0, s, owner);
        for (let j = 0; j < (s.motesPerMark || 3); j++) {
          const a = Math.random() * Math.PI * 2;
          spawnMote(tgt.x, tgt.y, Math.cos(a) * 150, Math.sin(a) * 150);
        }
      }
      tgt.yelanMarks = tgt.yelanMarks.filter(m => m.owner !== owner);
      fx({ k: 'ring', x: tgt.x, y: tgt.y, r: 200, col: '#5dd4ff', t: .5, m: .5 });
    }
  }

  /* ─── 5. 破局 ─── */
  function fortuneTick(f, dt) {
    const k = ensure(f);
    k.fortuneTimer += dt;
    if (k.fortuneTimer >= C.yelan.fortuneInterval) {
      k.fortuneTimer = 0;
      if (k.fortune < C.yelan.fortuneMax) {
        k.fortune++;
        k.fortuneExpireT = C.yelan.fortuneExpire;
      }
    }
    if (k.fortune > 0) {
      k.fortuneExpireT -= dt;
      if (k.fortuneExpireT <= 0) { k.fortune = 0; k.fortuneExpireT = 0; }
    }
  }

  /* ─── 6. 玄擲玲瓏 ─── */
  function linglongTick(f, dt) {
    const k = ensure(f);
    if (!k.exLinglong) return;
    k.exLinglong.t += dt;
    if (k.exLinglong.t >= k.exLinglong.life) k.exLinglong = null;
  }
  function linglongPct(f) {
    const k = ensure(f);
    if (!k.exLinglong) return 0;
    return Math.min(50, 1 + k.exLinglong.t * 3.5);
  }
  function linglongTrigger(f, tgt) {
    const k = ensure(f);
    if (!k.exLinglong || !alive(tgt)) return;
    const dmg = C.yelan.linglongDmg;
    for (let i = 0; i < 3; i++) {
      const tx = tgt.x, ty = tgt.y;
      later(0.05 * i, () => {
        if (!alive(tgt) || !ensure(f).exLinglong) return;
        hit(tgt, dmg, tx, ty, 30, 0, null, f);
        fx({ k: 'ring', x: tx, y: ty, r: 40, col: '#6fd3ff', t: .3, m: .3 });
        spark(tx, ty, '#6fd3ff', 8, 300, .25, 2);
      }, f);
    }
  }

  /* ─── 7. 技能 fire ─── */
  function arrowFire(f, o, a, s) {
    const k = ensure(f);
    const isFull = a && a.stage === 'full';
    const hasFortune = isFull && k.fortune > 0 && k.fortuneExpireT > 0;
    let dmg, speed, r, col, fxStyle, yelanFortuneArrow = false;
    if (hasFortune) {
      k.fortune--;
      const fa = s.fortuneArrow;
      dmg = fa.dmg; speed = fa.speed; r = fa.r; col = '#ffd77a';
      fxStyle = 'yelan_fortune'; yelanFortuneArrow = true;
    } else if (isFull) {
      dmg = s.full.dmg; speed = s.full.speed; r = s.full.r; col = '#6fd3ff';
      fxStyle = 'yelan_arrow';
    } else {
      dmg = s.dmg; speed = s.speed; r = s.r; col = '#6fd3ff';
      fxStyle = 'yelan_arrow';
    }
    const ang = (a && a.ang != null) ? a.ang : Math.atan2(o.y - f.y, o.x - f.x);
    G.projs.push({
      x: f.x + Math.cos(ang) * (CFG.r + 12),
      y: f.y + Math.sin(ang) * (CFG.r + 12),
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      s: { r, dmg, kb: isFull ? 200 : 100, life: 2.5, col, fx: fxStyle,
           yelanArrow: true, yelanFortuneArrow },
      own: f, life: 2.5, col, homing: false,
    });
  }

  function skill1Fire(f, o, a, s) {
    explodeAllMarks(f, s);
    ensure(f).skill1HitTargets = [];
  }

  function skill2Fire(f, o, a, s) {
    const k = ensure(f);
    const ang = (a && a.ang != null) ? a.ang : Math.atan2(o.y - f.y, o.x - f.x);
    G.yelanDice.push({
      x: f.x + Math.cos(ang) * (CFG.r + 12),
      y: f.y + Math.sin(ang) * (CFG.r + 12),
      vx: Math.cos(ang) * s.diceSpeed, vy: Math.sin(ang) * s.diceSpeed,
      t: 0, bounces: s.diceBounces, s, own: f, ang, trail: [], lastHit: 0,
    });
    if (k.exLinglong) {
      for (let i = 0; i < 2; i++) {
        const off = (i - 0.5) * 0.35, hAng = ang + off;
        G.projs.push({
          x: f.x + Math.cos(hAng) * (CFG.r + 12),
          y: f.y + Math.sin(hAng) * (CFG.r + 12),
          vx: Math.cos(hAng) * s.homingSpeed, vy: Math.sin(hAng) * s.homingSpeed,
          s: { r: 16, dmg: s.homingDmg, kb: 80, life: 2, col: '#6fd3ff',
               fx: 'yelan_homing' },
          own: f, life: 2, homing: true, col: '#6fd3ff',
        });
      }
    }
  }

  function skill3Fire(f, o, a, s) {
    const ang = (a && a.ang != null) ? a.ang : Math.atan2(o.y - f.y, o.x - f.x);
    const n = s.arrows, spread = s.spread;
    for (let i = 0; i < n; i++) {
      const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread;
      const aa = ang + off;
      G.projs.push({
        x: f.x + Math.cos(aa) * (CFG.r + 12),
        y: f.y + Math.sin(aa) * (CFG.r + 12),
        vx: Math.cos(aa) * s.arrowSpeed, vy: Math.sin(aa) * s.arrowSpeed,
        s: { r: s.r, dmg: s.dmg, kb: s.kb, life: s.life, col: '#6fd3ff',
             fx: 'yelan_arrow',
             yelanWater: true, yelanWaterLife: s.waterLife, yelanWaterR: s.waterR },
        own: f, life: s.life, col: '#6fd3ff',
      });
    }
  }

  function burstFire(f, o, a, s) {
    const k = ensure(f);
    if (k.burst < k.burstMax) return;
    k.burst = 0;
    for (const tg of [G.p, G.e]) {
      if (tg === f || !alive(tg)) continue;
      if (Math.hypot(tg.x - f.x, tg.y - f.y) < s.rad + CFG.r)
        hit(tg, s.dmg, f.x, f.y, 400, 1, s, f);
    }
    k.exLinglong = { t: 0, life: s.dur };
    k.fortune = s.fortuneOnCast || 6;
    k.fortuneExpireT = C.yelan.fortuneExpire;
    fx({ k: 'ring', x: f.x, y: f.y, r: s.rad, col: '#6fd3ff', t: .6, m: .6 });
    fx({ k: 'ring', x: f.x, y: f.y, r: s.rad * 1.4, col: '#bfeaff', t: .8, m: .8 });
    fx({ k: 'flash', t: .3, m: .3, col: '#6fd3ff', a: .5 });
    if (typeof shake === 'function') shake(8);
  }

  /* ─── 8. 水骰更新 & 繪製 ─── */
  function updateDice(dt) {
    for (let i = G.yelanDice.length - 1; i >= 0; i--) {
      const d = G.yelanDice[i];
      d.t += dt;
      d.trail.push({ x: d.x, y: d.y });
      if (d.trail.length > 20) d.trail.shift();
      d.x += d.vx * dt; d.y += d.vy * dt;

      for (const tg of [G.p, G.e]) {
        if (!alive(tg) || tg === d.own) continue;
        if (d.t - d.lastHit < .1) continue;
        if (Math.hypot(tg.x - d.x, tg.y - d.y) < d.s.r + CFG.r) {
          d.lastHit = d.t;
          hit(tg, d.s.dmg, d.x, d.y, d.s.kb, 0, d.s, d.own);
          for (let j = 0; j < 2; j++) {
            const a = Math.random() * Math.PI * 2;
            spawnMote(tg.x, tg.y, Math.cos(a) * 150, Math.sin(a) * 150);
          }
          spark(d.x, d.y, '#6fd3ff', 10, 400, .3, 3);
        }
      }
      const wl = d.x < CFG.r, wr = d.x > CFG.W - CFG.r;
      const wt = d.y < CFG.r, wb = d.y > CFG.H - CFG.r;
      if (wl || wr || wt || wb) {
        d.bounces--;
        if (d.bounces < 0) { G.yelanDice.splice(i, 1); continue; }
        if (wl) d.vx = Math.abs(d.vx);
        if (wr) d.vx = -Math.abs(d.vx);
        if (wt) d.vy = Math.abs(d.vy);
        if (wb) d.vy = -Math.abs(d.vy);
      }
      if (d.t > 4) G.yelanDice.splice(i, 1);
    }
  }
  function drawDice() {
    if (!G.yelanDice || !G.yelanDice.length) return;
    cx.save(); cx.scale(view.s, view.s); cx.translate(-cam.x, -cam.y);
    for (const d of G.yelanDice) {
      for (let i = 0; i < d.trail.length; i++) {
        const p = d.trail[i], v = i / d.trail.length;
        cx.globalAlpha = v * .5;
        cx.fillStyle = '#6fd3ff';
        cx.beginPath(); cx.arc(p.x, p.y, 3 + v * 6, 0, 7); cx.fill();
      }
      cx.globalAlpha = 1;
      cx.save();
      cx.translate(d.x, d.y);
      cx.rotate(d.t * 8);
      cx.fillStyle = '#6fd3ff';
      cx.fillRect(-12, -12, 24, 24);
      cx.strokeStyle = '#bfeaff'; cx.lineWidth = 2;
      cx.strokeRect(-12, -12, 24, 24);
      cx.fillStyle = '#fff'; cx.font = 'bold 16px system-ui';
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText('◆', 0, 0);
      cx.restore();
    }
    cx.restore();
  }

  /* ─── 9. 水幕 ─── */
  function updateWaters(dt) {
    for (let i = G.yelanWaters.length - 1; i >= 0; i--) {
      const w = G.yelanWaters[i];
      w.t += dt;
      if (w.t >= w.life) G.yelanWaters.splice(i, 1);
    }
  }
  function drawWaters() {
    if (!G.yelanWaters || !G.yelanWaters.length) return;
    cx.save(); cx.scale(view.s, view.s); cx.translate(-cam.x, -cam.y);
    const T = performance.now() / 1000;
    for (const w of G.yelanWaters) {
      const k = Math.min(1, w.t / .3) * Math.min(1, (w.life - w.t) / .5);
      cx.globalAlpha = .35 * k;
      const g = cx.createRadialGradient(w.x, w.y, w.r * .2, w.x, w.y, w.r);
      g.addColorStop(0, 'rgba(111,211,255,0.08)');
      g.addColorStop(.7, 'rgba(111,211,255,0.3)');
      g.addColorStop(1, 'rgba(111,211,255,0.05)');
      cx.fillStyle = g;
      cx.beginPath(); cx.arc(w.x, w.y, w.r, 0, 7); cx.fill();
      cx.strokeStyle = '#bfeaff'; cx.lineWidth = 2;
      for (let j = 0; j < 3; j++) {
        const ph = (T * .8 + j / 3) % 1;
        cx.globalAlpha = .4 * k * (1 - ph);
        cx.beginPath(); cx.arc(w.x, w.y, w.r * ph, 0, 7); cx.stroke();
      }
    }
    cx.restore();
  }

  /* ─── 10. 繪製：破局、玄擲、絡命標記 ─── */
  function drawYelan() {
    for (const f of [G.p, G.e]) {
      if (!f || f.c !== C) continue;
      const k = ensure(f);
      cx.save(); cx.scale(view.s, view.s); cx.translate(-cam.x, -cam.y);
      const T = performance.now() / 1000;

      if (k.fortune > 0) {
        for (let i = 0; i < k.fortune; i++) {
          const a = -Math.PI / 2 + (i - (k.fortune - 1) / 2) * .4;
          const px = f.x + Math.cos(a) * (CFG.r + 30);
          const py = f.y + Math.sin(a) * (CFG.r + 30);
          cx.fillStyle = '#ffd77a';
          cx.globalAlpha = .6 + .4 * Math.abs(Math.sin(T * 4 + i));
          cx.beginPath(); cx.arc(px, py, 6, 0, 7); cx.fill();
        }
      }
      if (k.exLinglong) {
        cx.globalAlpha = .4 + .15 * Math.sin(T * 4);
        cx.strokeStyle = '#6fd3ff'; cx.lineWidth = 3;
        cx.setLineDash([10, 6]); cx.lineDashOffset = -T * 30;
        cx.beginPath(); cx.arc(f.x, f.y, CFG.r + 40, 0, 7); cx.stroke();
        cx.setLineDash([]);
        cx.fillStyle = '#fff'; cx.font = 'bold 14px system-ui';
        cx.textAlign = 'center';
        cx.fillText('+' + linglongPct(f).toFixed(1) + '%', f.x, f.y - CFG.r - 50);
      }
      cx.restore();

      if (f.yelanMarks && f.yelanMarks.length) {
        cx.save(); cx.scale(view.s, view.s); cx.translate(-cam.x, -cam.y);
        cx.globalAlpha = .7; cx.strokeStyle = '#6fd3ff'; cx.lineWidth = 3;
        cx.beginPath(); cx.arc(f.x, f.y, CFG.r + 14 + 3 * Math.sin(T * 8), 0, 7); cx.stroke();
        cx.restore();
      }
    }
  }

  /* ─── 11. 技能按鈕爆發條 UI ─── */
  function updateBurstButton() {
    if (typeof skBtns === 'undefined' || !skBtns) return;
    if (!G.p || G.p.c !== C) return;
    const k = ensure(G.p);
    const pct = Math.min(1, k.burst / k.burstMax);
    for (const b of skBtns) {
      if (b.el && b.el.dataset.k === 'e') {
        b.el.style.backgroundImage =
          'linear-gradient(to top, rgba(111,211,255,0.72) ' + (pct * 100) + '%, rgba(255,255,255,0) ' + (pct * 100) + '%)';
        break;
      }
    }
  }

  /* ─── 12. 掛上 fire / ai ─── */
  C.sk.a.fire = arrowFire;
  C.sk.a.ai = (e, p, c, q) => c.d < 500 ? c.p : null;
  C.sk.b.fire = skill1Fire;
  C.sk.b.ai = (e, p, c, q) => c.d < 300 ? c.p : null;
  C.sk.c.fire = skill2Fire;
  C.sk.c.ai = (e, p, c, q) => c.d < 700 ? c.p : null;
  C.sk.d.fire = skill3Fire;
  C.sk.d.ai = (e, p, c, q) => c.d < 600 ? c.p : null;
  C.sk.e.fire = burstFire;
  C.sk.e.ai = (e, p, c, q) => {
    const k = ensure(e);
    return k.burst >= k.burstMax && c.d < 400 ? c.p : null;
  };

  /* ─── 13. 包裝 mk ─── */
  const oldMk = window.mk;
  if (typeof oldMk === 'function' && !oldMk._yelanWrapped) {
    const w = function (id, x, side, isAI) {
      const f = oldMk(id, x, side, isAI);
      if (id === 'yelan') ensure(f);
      return f;
    };
    w._yelanWrapped = true;
    window.mk = w;
  }

  /* ─── 14. 包裝 canCast：技能 4 需要爆發條滿 ─── */
  const oldCanCast = window.canCast;
  if (typeof oldCanCast === 'function' && !oldCanCast._yelanWrapped) {
    const w = function (f, k) {
      if (!oldCanCast(f, k)) return false;
      if (f && f.c === C && k === 'e') {
        const kk = ensure(f);
        if (kk.burst < kk.burstMax) {
          if (f === G.p && typeof say === 'function') say('元素爆發條不足', .7);
          return false;
        }
      }
      return true;
    };
    w._yelanWrapped = true;
    window.canCast = w;
  }

  /* ─── 15. 包裝 chargeLock：蓄力時減速 40% ─── */
  const oldChargeLock = window.chargeLock;
  if (typeof oldChargeLock === 'function' && !oldChargeLock._yelanWrapped) {
    const w = function (f) {
      if (f && f.c === C && f.hold && f.hold.k === 'a' && f.hold.t >= C.sk.a.hold.start)
        return 0.6;
      return oldChargeLock(f);
    };
    w._yelanWrapped = true;
    window.chargeLock = w;
  }

  /* ─── 16. 包裝 hit：破局矢 AOE + 玄擲玲瓏協同攻擊 ─── */
  const oldHit = window.hit;
  if (typeof oldHit === 'function' && !oldHit._yelanWrapped) {
    const w = function (t, d, fx_, fy_, kb, heavy, sk, att) {
      if (att && att.c === C) {
        const k = ensure(att);
        if (k.exLinglong) {
          const pct = linglongPct(att);
          d *= (1 + pct / 100);
        }
      }
      const before = t.hp;
      oldHit(t, d, fx_, fy_, kb, heavy, sk, att);
      const dealt = Math.max(0, before - t.hp);
      if (sk && sk.yelanFortuneArrow && att && att.c === C && dealt > 0) {
        for (const tg of [G.p, G.e]) {
          if (tg === att || !alive(tg)) continue;
          if (Math.hypot(tg.x - t.x, tg.y - t.y) < 200 + CFG.r)
            oldHit(tg, 150, t.x, t.y, 100, 0, null, att);
        }
        att.hp = Math.min(att.c.hp, att.hp + 300);
        fx({ k: 'ring', x: t.x, y: t.y, r: 200, col: '#ffd77a', t: .5, m: .5 });
        spark(t.x, t.y, '#ffd77a', 20, 600, .45, 3);
      }
      if (sk && sk.yelanWater && att && att.c === C && dealt > 0) {
        G.yelanWaters.push({
          x: t.x, y: t.y, r: sk.yelanWaterR || 100,
          t: 0, life: sk.yelanWaterLife || 4, own: att,
        });
        spawnMote(t.x, t.y, 0, 0);
      }
      if (att && att.c === C) {
        const k = ensure(att);
        if (k.exLinglong && (sk === C.sk.a || sk === C.sk.b)) {
          linglongTrigger(att, t);
        }
      }
    };
    w._yelanWrapped = true;
    window.hit = w;
  }

  /* ─── 17. 包裝 update ─── */
  const oldUpdate = window.update;
  if (typeof oldUpdate === 'function' && !oldUpdate._yelanWrapped) {
    const w = function (dt) {
      oldUpdate(dt);
      initGameArrays();
      if (G.state !== 'fight') return;
      for (const f of [G.p, G.e]) {
        if (!f || f.c !== C) continue;
        ensure(f);
        fortuneTick(f, dt);
        linglongTick(f, dt);

        if (f.hold && f.hold.k === 'b') {
          const eh = f.sts.find(s => s.k === 'haste');
          if (eh) { eh.t = .15; eh.v = C.sk.b.hasteV; }
          else f.sts.push({ k: 'haste', t: .15, v: C.sk.b.hasteV });

          const foe = enemyOf(f);
          if (alive(foe) && Math.hypot(foe.x - f.x, foe.y - f.y) < CFG.r * 2 + 20) {
            const h = ensure(f).skill1HitTargets;
            if (!h.includes(foe)) {
              h.push(foe);
              hit(foe, C.sk.b.touchDmg, f.x, f.y, 100, 0, null, f);
              applyMark(foe, f);
            }
          }
          if (f.hold.t >= C.sk.b.maxHold) {
            if (canCast(f, 'b')) holdRelease(f, 'b', { x: foe.x, y: foe.y });
            else f.hold = null;
          }
        } else {
          ensure(f).skill1HitTargets = [];
        }

        for (const w of G.yelanWaters) {
          if (w.own === f) continue;
          if (Math.hypot(f.x - w.x, f.y - w.y) < w.r + CFG.r) {
            const es = f.sts.find(s => s.k === 'slow');
            if (es) { es.t = .15; es.v = C.sk.d.waterSlowV; }
            else f.sts.push({ k: 'slow', t: .15, v: C.sk.d.waterSlowV });
          }
        }
      }
      updateMotes(dt);
      updateDice(dt);
      updateWaters(dt);
    };
    w._yelanWrapped = true;
    window.update = w;
  }

  /* ─── 18. 包裝 draw ─── */
  const oldDraw = window.draw;
  if (typeof oldDraw === 'function' && !oldDraw._yelanWrapped) {
    const w = function () {
      oldDraw();
      initGameArrays();
      drawMotes();
      drawDice();
      drawWaters();
      drawYelan();
      updateBurstButton();
    };
    w._yelanWrapped = true;
    window.draw = w;
  }

  console.log('[char_yelan] 夜蘭已載入');
})();
