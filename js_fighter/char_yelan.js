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
    res: { name: '元素力', max: 1000, regen: 50, color: '#6fd3ff', blockDrain: 40 },
    aiDist: 380,
    yelan: {
      burstMax: 70,
      fortuneInterval: 3, fortuneMax: 3, fortuneExpire: 10,
      linglongDmg: 100, linglongDur: 12,
      mote: {
        pickupR:100, attractR: 500, accel: 2000, damping: 1.5, value: 5, expire: 25,
      },
      skill1Filter: {
        blue: 0.10, vignette: 0.45, fade: 10,
      },
      trail: {
        sample: 0.02,      // 每幾秒記錄一點
        maxT: 0.35,        // 每點壽命
        strands: 3,        // 絲線條數
        amp: 10,           // 正弦振幅（px）
      },
    },
    sk: {
      a: { name: '潛形隱曜弓', type: 'proj',
           hold: { start: .04, full: .42 }, aimMove: 1,
           cost: 0, cd: .18, wind: .025,
           dmg: 80, speed: 820, r: 14, life: 2.5, kb: 100,
           full: { dmg: 200, speed: 900, r: 20, kb: 200 },
           fortuneArrow: { dmg: 350, speed: 1400, r: 22, aoeDmg: 250, heal: 300 },
           pv: (f, full, q) => ({ k: 'line', len: Math.min((full ? q.full.speed : q.speed) * 1.8, 1300), w: (full ? q.full.r : q.r) * 2.2 }) },

      b: { name: '縈絡縱命索', type: 'melee',
           hold: { start: .05, full: 99 }, aimMove: 1, noCharge: 1,
           cost: 200, cd: 8, wind: .05,
           touchDmg: 150, explodeDmg: 250, motesPerMark: 3,
           hasteV: 1.3, maxHold: 3,
           pv: (f) => ({ k: 'circle', r: CFG.r * 2.2 }) },

      c: { name: '玲瓏骰擊', type: 'proj', hold: { start: .01, full: .06 },
           cost: 100, cd: 6, wind: .1,
           diceSpeed: 800, diceBounces: 4, r: 28, dmg: 70, kb: 100,
           hitGap: .4,
           homingDmg: 120, homingSpeed: 900, homingTurn: 10,
           pv: (f, full, q) => ({ k: 'line', len: Math.min(q.diceSpeed * 1.9, 1500), w: q.r * 2.5 }) },

      d: { name: '水幕封路', type: 'proj', hold: { start: .01, full: .06 },
           cost: 150, cd: 10, wind: .1,
           arrows: 6, arrowSpeed: 900, spread: .8, dmg: 60, kb: 100, r: 16, life: 1.6,
           waterLife: 2, waterR: 100, waterSlowV: .5,
           pv: (f, full, q) => ({ k: 'fan', range: Math.min(q.arrowSpeed * q.life, 1400), arc: q.spread + 0.12 }) },

      e: { name: '淵圖玲瓏骰', type: 'melee', ult: 1,
           cost: 0, cd: 20, wind: .3,
           dmg: 400, rad: 300, dur: 12,
           fortuneOnCast: 6 },
    },
  };
  const C = CHARS.yelan;

  for (const k of Object.keys(C.sk)) C.sk[k].key = k;

  /* ─── 2. 狀態初始化 ─── */
  function ensure(f) {
    if (!f.yelan) f.yelan = {
      burst: 0, burstMax: C.yelan.burstMax,
      fortune: 0, fortuneTimer: 0, fortuneExpireT: 0,
      exLinglong: null,
      skill1HitTargets: [],
    };
    if (!f.yelanTrail) f.yelanTrail = [];
    if (f.yelanTrailTimer === undefined) f.yelanTrailTimer = 0;
    if (f.yelanFilterA === undefined) f.yelanFilterA = 0;
    return f.yelan;
  }
  const enemyOf = f => f === G.p ? G.e : G.p;
  const alive = f => !!f && f.hp > 0;
  const fx = o => G.fx.push(o);
  function initGameArrays() {
    if (!G.yelanMotes) G.yelanMotes = [];
    if (!G.yelanDice) G.yelanDice = [];
    if (!G.yelanWaters) G.yelanWaters = [];
    if (!G.yelanBursts) G.yelanBursts = [];
  }

  /* ─── 3. 元素微粒 ─── */
  function spawnMote(x, y, vx, vy) {
    if (!G.yelanMotes) G.yelanMotes = [];
    G.yelanMotes.push({ x, y, vx: vx || 0, vy: vy || 0, t: 0, r: 6, col: '#6fd3ff' });
  }
  function updateMotes(dt) {
    const M = C.yelan.mote;
    const xs = [G.p, G.e].filter(f => f && f.c === C);
    if (!xs.length) { G.yelanMotes.length = 0; return; }
    for (let i = G.yelanMotes.length - 1; i >= 0; i--) {
      const m = G.yelanMotes[i];
      m.t += dt;
      if (m.t > M.expire) { G.yelanMotes.splice(i, 1); continue; }
      let best = null, bestD = 1e9;
      for (const f of xs) {
        const d = Math.hypot(m.x - f.x, m.y - f.y);
        if (d < bestD) { bestD = d; best = f; }
      }
      if (!best) continue;
      if (bestD < M.pickupR) {
        const k = ensure(best);
        k.burst = Math.min(k.burstMax, k.burst + M.value);
        fx({ k: 'ring', x: m.x, y: m.y, r: 30, col: m.col, t: .3, m: .3 });
        G.yelanMotes.splice(i, 1);
        continue;
      }
      if (bestD < M.attractR) {
        const a = Math.atan2(best.y - m.y, best.x - m.x);
        m.vx += Math.cos(a) * M.accel * dt;
        m.vy += Math.sin(a) * M.accel * dt;
      }
      m.vx *= Math.exp(-M.damping * dt); m.vy *= Math.exp(-M.damping * dt);
      m.x += m.vx * dt; m.y += m.vy * dt;
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
    tgt.yelanMarks.push({ owner, t: 6, pulse: 0 });
    fx({ k: 'ring', x: tgt.x, y: tgt.y, r: 64, col: '#5dd4ff', t: .4, m: .4 });
  }
  function explodeAllMarks(owner, s) {
    initGameArrays();
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
    if (!k.exLinglong) {
      for (let i = G.yelanDice.length - 1; i >= 0; i--) if (G.yelanDice[i].orbit && G.yelanDice[i].own === f) G.yelanDice.splice(i, 1);
      return;
    }
    k.exLinglong.t += dt;
    if (k.exLinglong.t >= k.exLinglong.life) k.exLinglong = null;
    if (k.exLinglong) {
      const die = G.yelanDice.find(d => d.orbit && d.own === f);
      if (die) {
        const a = performance.now() / 1000 * 2.4;
        die.x = f.x + Math.cos(a) * (CFG.r + 34);
        die.y = f.y + Math.sin(a) * (CFG.r + 34);
        die.ang = a + Math.PI / 2;
      }
    }
  }
  function updateMarks(dt) {
    for (const tgt of [G.p, G.e]) {
      if (!tgt || !tgt.yelanMarks) continue;
      for (const m of tgt.yelanMarks) { m.t -= dt; m.pulse = (m.pulse || 0) + dt; }
      tgt.yelanMarks = tgt.yelanMarks.filter(m => m.t > 0 && alive(m.owner));
    }
  }
  function linglongPct(f) {
    const k = ensure(f);
    if (!k.exLinglong) return 0;
    return Math.min(50, 1 + k.exLinglong.t * 3.5);
  }
  /* 協同攻擊：改成 1 根追蹤水箭；總傷害 = linglongDmg * 3（原本 3 根各 1 份，現在 1 根 3 份） */
  function linglongTrigger(f, tgt) {
    initGameArrays();
    const k = ensure(f);
    if (!k.exLinglong || !alive(tgt)) return;
    const a = Math.atan2(tgt.y - f.y, tgt.x - f.x);
    const die = G.yelanDice.find(d => d.orbit && d.own === f);
    const sx = die ? die.x : f.x + Math.cos(a) * (CFG.r + 34);
    const sy = die ? die.y : f.y + Math.sin(a) * (CFG.r + 34);
    G.projs.push({
      x: sx + Math.cos(a) * 12, y: sy + Math.sin(a) * 12,
      vx: Math.cos(a) * 1300, vy: Math.sin(a) * 1300,
      s: { r: 14, dmg: C.yelan.linglongDmg * 3, kb: 60, life: 1.8, col: '#4fd0ff',
           fx: 'yelan_synergy', key: 'yelan_synergy', turn: 13 },
      own: f, life: 1.8, homing: true, col: '#4fd0ff', synergy: true,
    });
  }

  /* ─── 7. 技能 fire ─── */
  function arrowFire(f, o, a, s) {
    const k = ensure(f);
    const isFull = !!(a && (a.stage === 'full' || a.full === true)) || !!(s && s.full && s.dmg === s.full.dmg);
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
           key: 'a', turn: 4.5, yelanArrow: true, yelanFortuneArrow },
      own: f, life: 2.5, col, homing: true,
    });
  }

  function skill1Fire(f, o, a, s) {
    explodeAllMarks(f, s);
    ensure(f).skill1HitTargets = [];
  }

  function skill2Fire(f, o, a, s) {
    initGameArrays();
    const k = ensure(f);
    const ang = (a && a.ang != null) ? a.ang : Math.atan2(o.y - f.y, o.x - f.x);
    G.yelanDice.push({
      x: f.x + Math.cos(ang) * (CFG.r + 12),
      y: f.y + Math.sin(ang) * (CFG.r + 12),
      vx: Math.cos(ang) * s.diceSpeed, vy: Math.sin(ang) * s.diceSpeed,
      t: 0, bounces: s.diceBounces, s, own: f, ang, trail: [], hitTargets: {},
    });
    if (k.exLinglong) {
      for (let i = 0; i < 2; i++) {
        const off = (i - 0.5) * 0.35, hAng = ang + off;
        G.projs.push({
          x: f.x + Math.cos(hAng) * (CFG.r + 12),
          y: f.y + Math.sin(hAng) * (CFG.r + 12),
          vx: Math.cos(hAng) * s.homingSpeed, vy: Math.sin(hAng) * s.homingSpeed,
          s: { r: 16, dmg: s.homingDmg, kb: 80, life: 2, col: '#6fd3ff',
               fx: 'yelan_homing', key: 'c', turn: s.homingTurn || 10 },
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
             fx: 'yelan_arrow', key: 'd',
             yelanWaterSlow: s.waterSlowV, yelanWaterLife: s.waterLife },
        own: f, life: s.life, col: '#6fd3ff',
      });
    }
  }

  function burstFire(f, o, a, s) {
    initGameArrays();
    const k = ensure(f);
    if (k.burst < k.burstMax) return;
    k.burst = 0;
    k.exLinglong = { t: 0, life: s.dur };
    G.yelanDice = G.yelanDice.filter(d => !(d.orbit && d.own === f));
    G.yelanDice.push({
      x: f.x + CFG.r + 34, y: f.y, vx: 0, vy: 0, t: 0, life: s.dur,
      orbit: true, own: f, ang: 0, trail: [], bounces: 0, hitTargets: {},
      s: { r: 16, dmg: 0, kb: 0, col: '#4fd0ff' },
    });
    k.fortune = Math.min(C.yelan.fortuneMax, s.fortuneOnCast || 6);
    k.fortuneExpireT = C.yelan.fortuneExpire;
    for (const tg of [G.p, G.e]) {
      if (tg === f || !alive(tg)) continue;
      if (Math.hypot(tg.x - f.x, tg.y - f.y) < s.rad + CFG.r)
        hit(tg, s.dmg, f.x, f.y, 400, 1, s, f);
    }
    // 爆發範圍持續特效
    G.yelanBursts.push({ x: f.x, y: f.y, r: s.rad, t: 0, life: 0.9, own: f });
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
      if (d.orbit) {
        if (d.t >= d.life || !alive(d.own) || !ensure(d.own).exLinglong) G.yelanDice.splice(i, 1);
        continue;
      }
      d.trail.push({ x: d.x, y: d.y });
      if (d.trail.length > 20) d.trail.shift();
      d.x += d.vx * dt; d.y += d.vy * dt;

      if (!d.hitTargets) d.hitTargets = {};
      const gap = d.s.hitGap || 999;
      let removed = false;
      for (const tg of [G.p, G.e]) {
        if (!alive(tg) || tg === d.own) continue;
        const who = tg === G.p ? 'p' : 'e';
        if (d.t - (d.hitTargets[who] || -999) < gap) continue;
        if (Math.hypot(tg.x - d.x, tg.y - d.y) < d.s.r + CFG.r) {
          d.hitTargets[who] = d.t;
          hit(tg, d.s.dmg, d.x, d.y, d.s.kb, 0, d.s, d.own);
          const R = d.s.r + CFG.r;
          fx({ k: 'ring', x: d.x, y: d.y, r: R, col: d.synergy ? '#ffd77a' : '#6fd3ff', t: .45, m: .45 });
          fx({ k: 'ring', x: d.x, y: d.y, r: R * 0.55, col: '#bfeaff', t: .32, m: .32 });
          fx({ k: 'wripple', x: d.x, y: d.y + CFG.r * 0.4, r: R * 0.7, col: d.synergy ? '#ffd77a' : '#7fd0ff', t: .55, m: .55 });
          for (let j = 0; j < 2; j++) {
            const a = Math.random() * Math.PI * 2;
            spawnMote(tg.x, tg.y, Math.cos(a) * 150, Math.sin(a) * 150);
          }
          spark(d.x, d.y, d.synergy ? '#ffd77a' : '#6fd3ff', 12, 500, .32, 3);
          if (d.oneHit) { G.yelanDice.splice(i, 1); removed = true; break; }
        }
      }
      if (removed) continue;
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
      if (!d.orbit) {
        cx.save();
        cx.globalAlpha = .22;
        cx.strokeStyle = '#6fd3ff';
        cx.lineWidth = 1.5;
        cx.setLineDash([6, 8]);
        cx.lineDashOffset = -d.t * 60;
        cx.beginPath(); cx.arc(d.x, d.y, d.s.r + CFG.r, 0, 7); cx.stroke();
        cx.setLineDash([]);
        cx.restore();
      }
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
        const mark = f.yelanMarks[0], pulse = Math.sin((mark.pulse || T) * 10);
        cx.save(); cx.scale(view.s, view.s); cx.translate(-cam.x, -cam.y);
        cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = .65 + .25 * pulse;
        cx.strokeStyle = '#5dd4ff'; cx.lineWidth = 3;
        cx.setLineDash([9, 7]); cx.lineDashOffset = -T * 100;
        cx.beginPath(); cx.arc(f.x, f.y, CFG.r + 14 + 4 * pulse, 0, 7); cx.stroke();
        cx.setLineDash([]); cx.globalAlpha = .8;
        cx.fillStyle = '#bfeaff'; cx.font = 'bold 12px system-ui'; cx.textAlign = 'center';
        cx.fillText('絡命標記 '+Math.ceil(Math.max(0, mark.t))+'s', f.x, f.y - CFG.r - 22);
        cx.restore();
      }
    }
  }

  /* ─── 10.2 技能一絲線軌跡 ─── */
  function drawYelanTrail() {
    for (const f of [G.p, G.e]) {
      if (!f || f.c !== C) continue;
      const tr = f.yelanTrail;
      if (!tr || tr.length < 2) continue;
      const TR = C.yelan.trail;
      const maxT = TR.maxT;
      cx.save(); cx.scale(view.s, view.s); cx.translate(-cam.x, -cam.y);
      cx.globalCompositeOperation = 'lighter'; cx.lineCap = 'round'; cx.lineJoin = 'round';
      const T = performance.now() / 1000;

      // 先算出每點的三條絲線偏移座標
      const offsets = [];
      for (let i = 0; i < tr.length; i++) {
        const p = tr[i];
        const age = Math.max(0, Math.min(1, p.t / maxT));
        let nx = 0, ny = 0;
        if (i > 0) {
          const prev = tr[i - 1];
          const dx = p.x - prev.x, dy = p.y - prev.y;
          const l = Math.hypot(dx, dy) || 1;
          nx = -dy / l; ny = dx / l;
        }
        const amp = TR.amp * age;
        const row = [];
        for (let s = 0; s < TR.strands; s++) {
          const phase = s * (Math.PI * 2 / TR.strands);
          const wob = Math.sin(T * 10 + i * 0.7 + phase) * amp;
          row.push({ x: p.x + nx * wob, y: p.y + ny * wob });
        }
        offsets.push(row);
      }

      // 逐段畫（每段獨立 alpha，形成漸層）
      for (let s = 0; s < TR.strands; s++) {
        const isCore = s === 1;
        for (let i = 1; i < offsets.length; i++) {
          const a = Math.max(0, tr[i].t / maxT);
          if (a < 0.03) continue;
          const p = offsets[i - 1][s], q = offsets[i][s];
          cx.globalAlpha = a * (isCore ? 0.9 : 0.65);
          cx.strokeStyle = isCore ? '#e8fbff' : '#6fd3ff';
          cx.lineWidth = (isCore ? 1.6 : 2.6) * a + 0.4;
          cx.beginPath();
          cx.moveTo(p.x, p.y);
          cx.lineTo(q.x, q.y);
          cx.stroke();
        }
      }

      // 末端小白亮點
      const last = tr[tr.length - 1];
      if (last && last.t / maxT > 0.1) {
        cx.globalAlpha = last.t / maxT;
        cx.fillStyle = '#fff';
        cx.beginPath(); cx.arc(last.x, last.y, 3, 0, 7); cx.fill();
      }

      cx.restore();
    }
  }

  /* ─── 10.3 技能一藍色濾鏡 ─── */
  function drawYelanFilter() {
    const p = G.p;
    if (!p || p.c !== C) return;
    const a = p.yelanFilterA || 0;
    if (a < 0.01) return;
    const F = C.yelan.skill1Filter;
    const T = performance.now() / 1000;
    cx.save();
    cx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    cx.globalCompositeOperation = 'source-over';
    cx.globalAlpha = a * (F.blue + 0.025 * Math.sin(T * 6));
    cx.fillStyle = '#6fd3ff';
    cx.fillRect(0, 0, view.w, view.h);
    cx.globalAlpha = a * F.vignette;
    const g = cx.createRadialGradient(
      view.w / 2, view.h / 2, Math.min(view.w, view.h) * 0.28,
      view.w / 2, view.h / 2, Math.max(view.w, view.h) * 0.75
    );
    g.addColorStop(0, 'rgba(111,211,255,0)');
    g.addColorStop(1, 'rgba(111,211,255,0.55)');
    cx.fillStyle = g;
    cx.fillRect(0, 0, view.w, view.h);
    cx.restore();
  }

  /* ─── 10.4 爆發傷害範圍特效 ─── */
  function drawYelanBursts(dt) {
    if (!G.yelanBursts || !G.yelanBursts.length) return;
    const T = performance.now() / 1000;
    cx.save(); cx.scale(view.s, view.s); cx.translate(-cam.x, -cam.y);
    cx.globalCompositeOperation = 'lighter';
    for (const b of G.yelanBursts) {
      const k = Math.max(0, 1 - b.t / b.life);
      if (k <= 0) continue;
      const pulse = 1 + 0.06 * Math.sin(T * 8);
      const R = b.r * pulse;
      // 大範圍漸層填充
      const g = cx.createRadialGradient(b.x, b.y, R * 0.25, b.x, b.y, R);
      g.addColorStop(0, 'rgba(111,211,255,0)');
      g.addColorStop(0.55, 'rgba(111,211,255,' + (0.28 * k) + ')');
      g.addColorStop(0.92, 'rgba(191,234,255,' + (0.55 * k) + ')');
      g.addColorStop(1, 'rgba(111,211,255,0)');
      cx.fillStyle = g;
      cx.beginPath(); cx.arc(b.x, b.y, R, 0, 7); cx.fill();
      // 外環
      cx.globalAlpha = k * 0.95;
      cx.strokeStyle = '#bfeaff';
      cx.lineWidth = 5 * k + 1;
      cx.beginPath(); cx.arc(b.x, b.y, R * (1 - k * 0.08), 0, 7); cx.stroke();
      // 內環
      cx.globalAlpha = k * 0.65;
      cx.strokeStyle = '#6fd3ff';
      cx.lineWidth = 2.5;
      cx.beginPath(); cx.arc(b.x, b.y, R * (0.4 + (1 - k) * 0.55), 0, 7); cx.stroke();
      // 刻度點綴
      cx.globalAlpha = k * 0.5;
      cx.fillStyle = '#e8fbff';
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6 + T * 0.6;
        const px = b.x + Math.cos(a) * R * 0.9;
        const py = b.y + Math.sin(a) * R * 0.9;
        cx.beginPath(); cx.arc(px, py, 2.5 * k, 0, 7); cx.fill();
      }
    }
    cx.restore();
  }

  /* ─── 10.5 破局矢 AOE 範圍預覽 ─── */
  function drawFortuneAoe() {
    const f = G.p;
    if (!f || f.c !== C || !f.hold || f.hold.k !== 'a') return;
    const kk = ensure(f);
    if (kk.fortune <= 0 || kk.fortuneExpireT <= 0) return;
    const fastFull = C.sk.a.hold.full * 0.2;
    if (f.hold.t < fastFull) return;
    const foe = f === G.p ? G.e : G.p;
    let tx, ty;
    if (foe && foe.hp > 0) { tx = foe.x; ty = foe.y; }
    else { const a = f.hold.aim || { x: f.x + Math.cos(f.face) * 400, y: f.y + Math.sin(f.face) * 400 }; tx = a.x; ty = a.y; }
    const T = performance.now() / 1000;
    const pulse = 1 + 0.05 * Math.sin(T * 6);
    const r = 200 * pulse;
    cx.save();
    cx.scale(view.s, view.s);
    cx.translate(-cam.x, -cam.y);
    cx.globalCompositeOperation = 'lighter';
    cx.globalAlpha = 0.18 + 0.08 * Math.sin(T * 4);
    cx.fillStyle = '#ffd77a';
    cx.beginPath(); cx.arc(tx, ty, r, 0, 7); cx.fill();
    cx.globalAlpha = 0.85;
    cx.strokeStyle = '#ffd77a';
    cx.lineWidth = 3;
    cx.setLineDash([16, 10]);
    cx.lineDashOffset = -T * 60;
    cx.beginPath(); cx.arc(tx, ty, r, 0, 7); cx.stroke();
    cx.setLineDash([]);
    cx.fillStyle = '#fff';
    cx.font = 'bold 14px system-ui';
    cx.textAlign = 'center';
    cx.fillText('破局矢：AOE 150 傷害', tx, ty - r - 14);
    cx.restore();
  }

  /* ─── 10.6 自訂箭矢外觀（取代主程式光球） ─── */
  function drawYelanArrows(list) {
    if (!list || !list.length) return;
    cx.save(); cx.scale(view.s, view.s); cx.translate(-cam.x, -cam.y);
    for (const q of list) {
      const ang = Math.atan2(q.vy, q.vx);
      const isFortune = q.s.yelanFortuneArrow;
      const isHoming = q.s.fx === 'yelan_homing';
      const isSynergy = q.s.key === 'yelan_synergy';
      const col = q.col || '#6fd3ff';
      const len = isFortune ? 64 : isSynergy ? 52 : isHoming ? 46 : 54;
      const wid = Math.max(6, q.s.r * 0.55);
      const tailLen = len * 1.9;

      cx.save();
      cx.translate(q.x, q.y);
      cx.rotate(ang);
      cx.globalCompositeOperation = 'lighter';
      cx.lineCap = 'round';
      cx.lineJoin = 'round';

      // 1. 光暈（底層，弱）
      cx.globalAlpha = 0.35;
      const gl = cx.createRadialGradient(0, 0, 0, 0, 0, len * 0.55);
      gl.addColorStop(0, col);
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = gl;
      cx.beginPath(); cx.arc(0, 0, len * 0.55, 0, 7); cx.fill();

      // 2. 拖尾（線段漸層）
      const tg = cx.createLinearGradient(-tailLen, 0, -len * 0.3, 0);
      tg.addColorStop(0, 'rgba(0,0,0,0)');
      tg.addColorStop(1, col);
      cx.globalAlpha = 0.65;
      cx.strokeStyle = tg;
      cx.lineWidth = wid * 0.85;
      cx.beginPath();
      cx.moveTo(-tailLen, 0);
      cx.lineTo(-len * 0.3, 0);
      cx.stroke();

      // 3. 尾羽（V 形）
      cx.globalAlpha = 1;
      cx.fillStyle = col;
      cx.beginPath();
      cx.moveTo(-len * 0.7, 0);
      cx.lineTo(-len, -wid * 0.95);
      cx.lineTo(-len * 0.86, 0);
      cx.lineTo(-len, wid * 0.95);
      cx.closePath();
      cx.fill();

      // 4. 箭杆（細矩形）
      cx.fillStyle = col;
      cx.fillRect(-len * 0.7, -wid * 0.16, len * 0.42, wid * 0.32);

      // 5. 箭頭（白色三角）
      cx.fillStyle = '#fff';
      cx.beginPath();
      cx.moveTo(0, 0);
      cx.lineTo(-len * 0.3, -wid);
      cx.lineTo(-len * 0.3, wid);
      cx.closePath();
      cx.fill();

      // 6. 箭頭彩邊
      cx.strokeStyle = col;
      cx.lineWidth = 1.5;
      cx.beginPath();
      cx.moveTo(0, 0);
      cx.lineTo(-len * 0.3, -wid);
      cx.lineTo(-len * 0.3, wid);
      cx.closePath();
      cx.stroke();

      cx.restore();
    }
    cx.restore();
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

  /* ─── 14. 包裝 canCast ─── */
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

  /* ─── 15. 包裝 chargeLock ─── */
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

  /* ─── 16. 包裝 hit ─── */
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
        spawnMote(t.x, t.y, 0, 0);
        spark(t.x, t.y, '#ffd77a', 20, 600, .45, 3);
      }

      if (sk && sk.yelanWaterSlow && att && att.c === C && dealt > 0) {
        addStatus(t, { k: 'slow', dur: sk.yelanWaterLife || 4, v: sk.yelanWaterSlow });
        fx({ k: 'ring', x: t.x, y: t.y, r: CFG.r + 18, col: '#4fd0ff', t: .45, m: .45 });
        spawnMote(t.x, t.y, 0, 0);
      }

      if (att && att.c === C) {
        const k = ensure(att);
        if (k.exLinglong && sk && (sk.key === 'a' || sk.key === 'b')) {
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
      initGameArrays();
      oldUpdate(dt);
      initGameArrays();
      if (G.state !== 'fight') return;

      // 破局快速蓄力
      if (G.p && G.p.c === C && G.p.hold && G.p.hold.k === 'a') {
        const kk = ensure(G.p);
        if (kk.fortune > 0 && kk.fortuneExpireT > 0) {
          const fastFull = C.sk.a.hold.full * 0.2;
          if (G.p.hold.t >= fastFull && G.p.hold.t < C.sk.a.hold.full) {
            G.p.hold.t = C.sk.a.hold.full;
            if (!G.p.hold._fortuneReady) {
              G.p.hold._fortuneReady = true;
              if (typeof pop === 'function') pop(G.p, '破局矢 就緒', '#ffd77a');
              if (typeof playSfx === 'function' && typeof SFX !== 'undefined' && SFX.dash) playSfx(SFX.dash);
            }
          }
        }
      }

      for (const f of [G.p, G.e]) {
        if (!f || f.c !== C) continue;
        ensure(f);
        fortuneTick(f, dt);
        linglongTick(f, dt);

        // 濾鏡平滑
        const wantF = (f.hold && f.hold.k === 'b') ? 1 : 0;
        f.yelanFilterA += (wantF - f.yelanFilterA) * Math.min(1, dt * C.yelan.skill1Filter.fade);

        // 軌跡衰減 + 計時器驅動取樣
        if (f.yelanTrail && f.yelanTrail.length) {
          for (const p of f.yelanTrail) p.t -= dt;
          f.yelanTrail = f.yelanTrail.filter(p => p.t > 0);
        }
        f.yelanTrailTimer -= dt;
        if ((f.hold && f.hold.k === 'b' || f.yelanTrail.length) && f.yelanTrailTimer <= 0) {
          f.yelanTrail.push({ x: f.x, y: f.y, t: C.yelan.trail.maxT });
          if (f.yelanTrail.length > 40) f.yelanTrail.shift();
          f.yelanTrailTimer = C.yelan.trail.sample;
        }

        if (f.hold && f.hold.k === 'b') {
          if (!f.hold.dashDone) {
            const mx = f.mx || 0, my = f.my || 0;
            let ha;
            if (Math.hypot(mx, my) > 0.15) ha = Math.atan2(my, mx);
            else {
              const ax = (f.hold.aim ? f.hold.aim.x : f.x + 1) - f.x;
              const ay = (f.hold.aim ? f.hold.aim.y : f.y + 1) - f.y;
              ha = Math.atan2(ay, ax);
            }
            const dashDist = 92;
            f.x = clamp(f.x + Math.cos(ha) * dashDist, CFG.r, CFG.W - CFG.r);
            f.y = clamp(f.y + Math.sin(ha) * dashDist, CFG.r, CFG.H - CFG.r);
            f.face = ha;
            f.hold.dashDone = true;
            f.dx = Math.cos(ha); f.dy = Math.sin(ha);
            fx({ k: 'gh', x: f.x - Math.cos(ha) * 40, y: f.y - Math.sin(ha) * 40, t: .3, m: .3, col: f.c.color });
            fx({ k: 'ring', x: f.x, y: f.y, r: CFG.r * 1.8, col: '#5dd4ff', t: .25, m: .25 });
            spark(f.x, f.y, '#bfeaff', 12, 420, .25, 2.5);
          }
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
            holdRelease(f, 'b', { x: foe.x, y: foe.y });
          }
        } else {
          ensure(f).skill1HitTargets = [];
        }
      }

      // 爆發範圍淡出
      for (let i = G.yelanBursts.length - 1; i >= 0; i--) {
        G.yelanBursts[i].t += dt;
        if (G.yelanBursts[i].t >= G.yelanBursts[i].life) G.yelanBursts.splice(i, 1);
      }

      updateMarks(dt);
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
      // G 尚未初始化（選角前）→ 直接讓主程式畫（它自己有 if(!G.p)return）
      // 某些訓練模式／切換回合會先建立 G.p，再稍後才建立 G.projs；這裡不能直接讀 length。
      if (typeof G === 'undefined' || !G || !G.p || !Array.isArray(G.projs)) { oldDraw(); return; }
      // 先抽出夜蘭的投射物，讓主程式不畫（主程式會畫成光球）
      const yelanProjs = [];
      for (let i = G.projs.length - 1; i >= 0; i--) {
        
        const q = G.projs[i];
        if (q.own && q.own.c === C) {
          yelanProjs.push(q);
          G.projs.splice(i, 1);
        }
      }

      oldDraw();   // 主程式繪製（不含夜蘭箭矢）

      // 放回
      for (const q of yelanProjs) G.projs.push(q);

      initGameArrays();
      drawMotes();
      drawYelanTrail();
      drawDice();
      drawWaters();
      drawYelan();
      drawYelanBursts();
      drawFortuneAoe();
      drawYelanArrows(yelanProjs);   // 自繪箭矢
      updateBurstButton();
      drawYelanFilter();
    };
    w._yelanWrapped = true;
    window.draw = w;
  }

  console.log('[char_yelan] 夜蘭已載入');
})();
