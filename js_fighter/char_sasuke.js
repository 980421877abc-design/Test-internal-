/* js_fighter/char_sasuke.js — 宇智波佐助（火影忍者）豪華特效版
 * 包含：咒印模式切換、負荷系統、千鳥抓取、麒麟三段蓄力、專屬華麗特效。
 */
(function () {
  'use strict';
  if (typeof CHARS === 'undefined' || typeof CFG === 'undefined') return;
  if (CHARS.sasuke) return;

  /* ─── 1. 角色資料 ─── */
  CHARS.sasuke = {
    name: '宇智波佐助', work: '火影忍者', color: '#5c3c9e', glyph: '助',
    img: 'image/sasuke.png',
    hp: 8000, speed: 600,
    res: { name: '查克拉', max: 1500, regen: 40, color: '#7a5cff', blockDrain: 25 },
    aiDist: 180,

    domDef: { name: '須佐能乎', max: 1000, drain: 300, recover: 160, lock: 0 },
    bf: { chance: .4, window: 1.2, ready: 5, mult: 2.5, heal: 300, kbMul: 2 },

    sk: {
      x: { name: '咒印切換', type: 'toggle', flag: 'curse', side: 'L', cost: 0, cd: 0, wind: .1 },
      a: { name: '體術', type: 'melee', bf: 1, cost: 0, cd: .3, wind: .06, dmg: 60, range: 140, arc: 1.2, kb: 150 },
      b: { name: '豪火球/白蛇', type: 'proj', cost: 100, cd: 4, wind: .1,
           pv: (f, full, q) => {
             if (f.sasukeState && f.sasukeState.curse && f.sasukeState.snake) return { k: 'line', len: 400, w: 60 };
             return { k: 'line', len: 600, w: 40 };
           } },
      c: { name: '風魔手裡劍/千鳥', type: 'proj', cost: 150, cd: 6, wind: .1,
           pv: (f, full, q) => {
             if (f.sasukeState && f.sasukeState.curse) return { k: 'line', len: 400, w: 80 };
             return { k: 'line', len: 450, w: 40 };
           } },
      d: { name: '麒麟', type: 'melee', hold: { start: .05, full: 1.5 }, lockMove: 1, cost: 200, cd: 0, wind: .15,
           pv: (f, full, q) => ({ k: 'zone', range: 800, r: 150 }) },
      e: { name: '替身術', type: 'melee', cost: 50, cd: 15, wind: .05 }
    },
  };
  const C = CHARS.sasuke;
  for (const k of Object.keys(C.sk)) C.sk[k].key = k;

  /* ─── 2. 狀態初始化 ─── */
  function ensure(f) {
    if (!f.sasukeState) {
      f.sasukeState = {
        curse: false, load: 0, loadTimer: 0, snake: null, chidori: null,
        kirinCd: [0, 0, 0], combo: 0, bolts: [] // 儲存落雷折線
      };
    }
    return f.sasukeState;
  }
  const enemyOf = f => f === G.p ? G.e : G.p;
  const alive = f => !!f && f.hp > 0;
  const fx = o => G.fx.push(o);

  /* ─── 3. 咒印負荷 (CD 計算攔截) ─── */
  const oldCdOf = window.cdOf;
  if (typeof oldCdOf === 'function' && !oldCdOf._sasukeWrapped) {
    const w = function (f, s) {
      let cd = oldCdOf(f, s);
      if (f.c === C) {
        const st = ensure(f);
        if (st.curse) cd = cd * (1 + st.load * 0.05);
      }
      return cd;
    };
    w._sasukeWrapped = true;
    window.cdOf = w;
  }

  /* ─── 4. 技能行為綁定 ─── */
  C.sk.a.fire = function (f, o, a, s) {
    const st = ensure(f);
    const ang = a.ang !== undefined ? a.ang : Math.atan2(o.y - f.y, o.x - f.x);
    if (!st.curse) {
      G.fx.push({ k: 'arc', x: f.x, y: f.y, a: ang, w: s.arc, r: s.range, t: .15, m: .15, col: '#aaddff' });
      spark(f.x + Math.cos(ang)*60, f.y + Math.sin(ang)*60, '#fff', 5, 400, .15, 2);
      const d = Math.hypot(o.x - f.x, o.y - f.y);
      let da = Math.abs(Math.atan2(o.y - f.y, o.x - f.x) - ang);
      da = Math.min(da, Math.PI * 2 - da);
      if (d <= s.range + CFG.r && da <= s.arc / 2) hit(o, s.dmg, f.x, f.y, s.kb, 0, s, f);
    } else {
      st.combo = (st.combo + 1) % 3;
      if (st.combo === 0) {
        // 3A 手裡劍
        G.projs.push({
          x: f.x + Math.cos(ang) * (CFG.r + 12), y: f.y + Math.sin(ang) * (CFG.r + 12),
          vx: Math.cos(ang) * 900, vy: Math.sin(ang) * 900,
          s: { r: 16, dmg: 80, kb: 100, life: 1.5, col: '#333', fx: 'sasuke_shuriken', dot: 20 },
          own: f, life: 1.5, col: '#333'
        });
        spark(f.x + Math.cos(ang)*60, f.y + Math.sin(ang)*60, '#7a5cff', 8, 500, .2, 2);
      } else {
        // 1A/2A 咒印前突
        G.fx.push({ k: 'arc', x: f.x, y: f.y, a: ang, w: s.arc + 0.6, r: s.range + 40, t: .12, m: .12, col: '#7a5cff' });
        spark(f.x + Math.cos(ang)*80, f.y + Math.sin(ang)*80, '#7a5cff', 8, 600, .2, 3);
        const d = Math.hypot(o.x - f.x, o.y - f.y);
        let da = Math.abs(Math.atan2(o.y - f.y, o.x - f.x) - ang);
        da = Math.min(da, Math.PI * 2 - da);
        if (d <= s.range + 40 + CFG.r && da <= (s.arc + 0.6) / 2) hit(o, s.dmg, f.x, f.y, s.kb, 0, s, f);
      }
    }
  };

  C.sk.b.fire = function (f, o, a, s) {
    const st = ensure(f);
    const ang = a.ang !== undefined ? a.ang : Math.atan2(o.y - f.y, o.x - f.x);
    if (!st.curse) {
      // 豪火球
      G.projs.push({
        x: f.x + Math.cos(ang) * (CFG.r + 12), y: f.y + Math.sin(ang) * (CFG.r + 12),
        vx: Math.cos(ang) * 800, vy: Math.sin(ang) * 800,
        s: { r: 45, dmg: 400, kb: 250, life: 1.5, col: '#ff5a1a', fx: 'fireball', dot: 50 },
        own: f, life: 1.5, col: '#ff5a1a'
      });
      fx({ k: 'ring', x: f.x + Math.cos(ang)*50, y: f.y + Math.sin(ang)*50, r: 60, col: '#ff5a1a', t: .2, m: .2 });
      spark(f.x, f.y, '#ff5a1a', 15, 500, .3, 3);
    } else {
      if (!st.snake) {
        // 白蛇盤踞 (無敵)
        st.snake = { t: 0, max: 2, fired: false };
        f.inv = Math.max(f.inv, 2);
        pop(f, '白蛇盤踞 (無敵)', '#7a5cff');
        fx({ k: 'ring', x: f.x, y: f.y, r: CFG.r + 60, col: '#7a5cff', t: .6, m: .6 });
        fx({ k: 'ring', x: f.x, y: f.y, r: CFG.r + 30, col: '#fff', t: .4, m: .4 });
        spark(f.x, f.y, '#7a5cff', 20, 400, .5, 4);
        st.load = Math.min(10, st.load + 1);
      } else if (!st.snake.fired) {
        // 釋放白蛇
        st.snake.fired = true;
        f.inv = 0;
        const dist = 350, tx = f.x + Math.cos(ang) * dist, ty = f.y + Math.sin(ang) * dist;
        G.projs.push({
          x: f.x, y: f.y, vx: 0, vy: 0,
          s: { r: 35, dmg: 200, kb: 300, life: 0.8, col: '#fff', fx: 'white_snake', 
               snake: { sx: f.x, sy: f.y, tx, ty, t: 0, T: 0.8, ang, done: false } },
          own: f, life: 0.8, col: '#fff'
        });
        st.load = Math.min(10, st.load + 1);
      }
    }
  };

  C.sk.c.fire = function (f, o, a, s) {
    const st = ensure(f);
    const ang = a.ang !== undefined ? a.ang : Math.atan2(o.y - f.y, o.x - f.x);
    if (!st.curse) {
      // 風魔手裡劍
      G.projs.push({
        x: f.x + Math.cos(ang) * (CFG.r + 12), y: f.y + Math.sin(ang) * (CFG.r + 12),
        vx: Math.cos(ang) * 900, vy: Math.sin(ang) * 900,
        s: { r: 30, dmg: 150, kb: 150, life: 1.2, col: '#88ccff', fx: 'sasuke_windmill', split: true },
        own: f, life: 1.2, col: '#88ccff', distTravelled: 0
      });
      spark(f.x + Math.cos(ang)*60, f.y + Math.sin(ang)*60, '#88ccff', 10, 500, .3, 3);
    } else {
      // 黑色千鳥
      f.inv = Math.max(f.inv, 0.45);
      st.chidoriing = true; // 標記千鳥衝刺中
      fx({ k: 'flash', t: .15, m: .15, col: '#7a5cff', a: .3 });
      
      lunge(f, ang, {
        dist: 450, dur: .35,
        sk: s, dmg: 0, kb: 0, reach: CFG.r * 2,
        onHit: target => {
          if (!st.chidori) {
            st.chidori = { target, tick: 0 };
            pop(f, '千鳥 抓取！', '#7a5cff');
          }
        },
        done: () => {
          st.chidoriing = false;
          if (st.chidori) {
            hit(st.chidori.target, 800, f.x, f.y, 400, 1, s, f);
            shake(12);
            fx({ k: 'flash', t: .3, m: .3, col: '#7a5cff', a: .8 });
            fx({ k: 'ring', x: f.x, y: f.y, r: 150, col: '#7a5cff', t: .5, m: .5 });
            spark(f.x, f.y, '#000', 20, 800, .4, 4);
            st.chidori = null;
          }
        }
      });
      st.load = Math.min(10, st.load + 1);
    }
  };

  // 麒麟 (攔截蓄力)
  const oldHoldRelease = window.holdRelease;
  if (typeof oldHoldRelease === 'function' && !oldHoldRelease._sasukeWrapped) {
    window.holdRelease = function (f, k, aim) {
      if (f.c === C && k === 'd') {
        const st = ensure(f);
        const h = f.hold;
        if (!h || h.k !== 'd') return;
        
        let tier = 0;
        if (h.t >= 1.5) tier = 2;
        else if (h.t >= 0.5) tier = 1;
        
        if (st.kirinCd[tier] > 0) {
          if (f === G.p) say('該段麒麟冷卻中', .7);
          f.hold = null;
          return;
        }

        f.hold = null;
        if (!canCast(f, 'd')) return;

        f.en -= 200;
        f.cd.d = 0.5;
        
        const cdTimes = [6, 9, 15];
        st.kirinCd[tier] = cdTimes[tier];

        const dmg = [300, 800, 2200][tier];
        const rad = [120, 200, 350][tier];
        const hits = [1, 4, 8][tier];
        const tx = f.x + Math.cos(f.face) * 300;
        const ty = f.y + Math.sin(f.face) * 300;

        // 蓄力釋放特效
        if (tier === 2) { 
          shake(20); 
          fx({ k: 'flash', t: .5, m: .5, col: '#fff', a: 1.5 }); 
          fx({ k: 'flash', t: .5, m: .5, col: '#7a5cff', a: 1 }); 
        } else if (tier === 1) {
          shake(10);
          fx({ k: 'flash', t: .3, m: .3, col: '#7a5cff', a: .6 });
        } else {
          shake(5);
        }
        
        // 落雷折線紀錄
        st.bolts.push({ x: tx, y: ty, t: 0, max: .35, tier: tier });

        for (let i = 0; i < hits; i++) {
          later(i * 0.08, () => {
            if (G.state !== 'fight') return;
            const rx = tx + (Math.random()-.5)*rad;
            const ry = ty + (Math.random()-.5)*rad;
            blast(f, rx, ry, 90, dmg/hits, 200, '#7a5cff', 0);
            fx({ k: 'ring', x: rx, y: ry, r: 100, col: '#7a5cff', t: .25, m: .25 });
            fx({ k: 'ring', x: rx, y: ry, r: 60, col: '#fff', t: .15, m: .15 });
            spark(rx, ry, '#7a5cff', 15, 800, .3, 4);
            spark(rx, ry, '#fff', 10, 600, .2, 2);
          }, f);
        }
        pop(f, '麒麟 第 ' + (tier+1) + ' 段', '#7a5cff');
        return;
      }
      return oldHoldRelease(f, k, aim);
    };
    window.holdRelease._sasukeWrapped = true;
  }

  C.sk.e.fire = function (f, o, a, s) {
    f.inv = Math.max(f.inv, 2.0); 
    const oldX = f.x, oldY = f.y;
    f.x = CFG.r + Math.random() * (CFG.W - CFG.r * 2);
    f.y = CFG.r + Math.random() * (CFG.H - CFG.r * 2);
    f.kx = f.ky = 0;
    pop(f, '替身術！', '#7a5cff');
    // 原地木頭特效
    fx({ k: 'ring', x: oldX, y: oldY, r: 60, col: '#fff', t: .4, m: .4 });
    spark(oldX, oldY, '#fff', 25, 600, .4, 5);
    fx({ k: 'gh', x: oldX, y: oldY, t: .4, m: .4, col: '#5c3c9e' });
    // 現身特效
    fx({ k: 'ring', x: f.x, y: f.y, r: 80, col: '#7a5cff', t: .5, m: .5 });
    spark(f.x, f.y, '#7a5cff', 20, 400, .4, 3);
  };

  /* ─── 5. 全域更新 (狀態、抓取、負荷、特效) ─── */
  const oldUpdate = window.update;
  if (typeof oldUpdate === 'function' && !oldUpdate._sasukeWrapped) {
    const w = function (dt) {
      oldUpdate(dt);
      if (G.state !== 'fight') return;

      for (const f of [G.p, G.e]) {
        if (!f || f.c !== C) continue;
        const st = ensure(f);

        // 咒印氣場特效
        if (st.curse) {
          if (Math.random() < 0.3) {
            fx({ k: 'dt', x: f.x + (Math.random()-.5)*CFG.r*2, y: f.y + (Math.random()-.5)*CFG.r*2, 
                 vx: 0, vy: -50, t: .6, m: .6, col: '#7a5cff', r: 3, sh: 1 });
          }
          st.loadTimer += dt;
          if (st.loadTimer >= 3) {
            st.loadTimer -= 3;
            if (st.load < 10) { st.load++; pop(f, '咒印負荷 +1', '#ff5a1a'); }
          }
        } else {
          st.loadTimer += dt;
          if (st.loadTimer >= 2) {
            st.loadTimer -= 2;
            if (st.load > 0) st.load--;
          }
        }

        // 麒麟 CD
        for (let i = 0; i < 3; i++) {
          if (st.kirinCd[i] > 0) st.kirinCd[i] = Math.max(0, st.kirinCd[i] - dt);
        }

        // 麒麟落雷折線更新
        if (st.bolts) {
          for (let i = st.bolts.length - 1; i >= 0; i--) {
            st.bolts[i].t += dt;
            if (st.bolts[i].t >= st.bolts[i].max) st.bolts.splice(i, 1);
          }
        }

        // 千鳥抓取
        if (st.chidori && st.chidori.target && alive(st.chidori.target)) {
          const tg = st.chidori.target;
          tg.x = f.x + Math.cos(f.face) * 80;
          tg.y = f.y + Math.sin(f.face) * 80;
          tg.stun = 0.1;
          
          // 抓取特效
          if (Math.random() < 0.8) {
            spark(tg.x, tg.y, '#7a5cff', 4, 600, .2, 2);
            spark(tg.x, tg.y, '#000', 3, 400, .2, 3);
          }

          st.chidori.tick += dt;
          if (st.chidori.tick >= 0.1) {
            st.chidori.tick = 0;
            hit(tg, 50, f.x, f.y, 0, 0, null, f);
          }
        }

        // 千鳥衝刺特效
        if (st.chidoriing) {
           spark(f.x, f.y, '#7a5cff', 10, 800, .25, 3);
           spark(f.x, f.y, '#111', 6, 500, .25, 4);
        }

        // 白蛇超時
        if (st.snake && !st.snake.fired) {
          st.snake.t += dt;
          if (st.snake.t >= st.snake.max) {
            const foe = enemyOf(f);
            holdRelease(f, 'b', { x: foe.x, y: foe.y });
          }
        }

        if (!f.act && f.stun <= 0) st.combo = 0;
      }
    };
    w._sasukeWrapped = true;
    window.update = w;
  }

  /* ─── 6. 攔截命中 ─── */
  const oldHit = window.hit;
  if (typeof oldHit === 'function' && !oldHit._sasukeWrapped) {
    const w = function (t, d, fx_, fy_, kb, heavy, sk, att) {
      if (att && att.c === C && sk) {
        const st = ensure(att);
        if (st.curse && ['b', 'c', 'd'].includes(sk.key)) {
          st.load = Math.max(0, st.load - 2);
          pop(att, '負荷 -2', '#9ef09e');
        }
      }
      oldHit(t, d, fx_, fy_, kb, heavy, sk, att);
    };
    w._sasukeWrapped = true;
    window.hit = w;
  }

  /* ─── 7. 攔截繪製 (華麗特效層) ─── */
  const oldDraw = window.draw;
  if (typeof oldDraw === 'function' && !oldDraw._sasukeWrapped) {
    const w = function () {
      oldDraw();
      if (!G.p) return;

      cx.save();
      cx.scale(view.s, view.s);
      cx.translate(-cam.x, -cam.y);
      const T = performance.now() / 1000;

      for (const f of [G.p, G.e]) {
        if (f.c !== C) continue;
        const st = ensure(f);

        // 1. 畫負荷條
        if (st.curse || st.load > 0) {
          let col = '#9ef09e';
          if (st.load >= 7) col = '#ff4a5a';
          else if (st.load >= 4) col = '#ffd77a';

          const bw = 60, bh = 8;
          const bx = f.x - bw/2, by = f.y - CFG.r - 40;

          cx.fillStyle = 'rgba(0,0,0,0.6)';
          cx.fillRect(bx, by, bw, bh);
          cx.fillStyle = col;
          cx.fillRect(bx, by, bw * (st.load / 10), bh);
          cx.strokeStyle = '#fff';
          cx.lineWidth = 1.5;
          cx.strokeRect(bx, by, bw, bh);
          
          cx.fillStyle = '#fff';
          cx.font = 'bold 12px system-ui';
          cx.textAlign = 'center';
          cx.fillText('負荷 ' + st.load + '/10', f.x, by - 5);
        }

        // 2. 白蛇盤踞光環
        if (st.snake && !st.snake.fired) {
          cx.save();
          cx.globalCompositeOperation = 'lighter';
          cx.strokeStyle = '#fff';
          cx.lineWidth = 6;
          cx.beginPath();
          cx.arc(f.x, f.y, CFG.r + 20 + Math.sin(T*15)*8, 0, 7);
          cx.stroke();
          // 電流環
          cx.strokeStyle = '#7a5cff';
          cx.lineWidth = 2;
          cx.setLineDash([10, 15]);
          cx.lineDashOffset = -T * 100;
          cx.beginPath();
          cx.arc(f.x, f.y, CFG.r + 35, 0, 7);
          cx.stroke();
          cx.restore();
        }

        // 3. 畫麒麟落雷折線
        if (st.bolts) {
          cx.save();
          cx.globalCompositeOperation = 'lighter';
          for (const b of st.bolts) {
            const k = 1 - (b.t / b.max);
            const layers = b.tier === 2 ? 3 : 1;
            
            for (let l = 0; l < layers; l++) {
              cx.strokeStyle = l === 0 ? '#fff' : (l === 1 ? '#7a5cff' : '#e0f');
              cx.lineWidth = l === 0 ? 4 : 12;
              cx.globalAlpha = k * (l === 0 ? 1 : 0.6);
              cx.beginPath();
              let cx1 = b.x + (Math.random()-.5)*40, cy1 = b.y;
              cx.moveTo(cx1, cy1);
              for (let j = 0; j < 12; j++) {
                cx1 += (Math.random()-.5)*30;
                cy1 -= 60;
                cx.lineTo(cx1, cy1);
              }
              cx.stroke();
            }
          }
          cx.restore();
        }

        // 4. 千鳥衝刺包裹雷電
        if (st.chidoriing) {
          cx.save();
          cx.globalCompositeOperation = 'lighter';
          cx.strokeStyle = '#7a5cff';
          cx.lineWidth = 3;
          cx.beginPath();
          for(let i=0; i<4; i++){
             const a = T*30 + i*Math.PI/2;
             cx.moveTo(f.x, f.y);
             cx.lineTo(f.x + Math.cos(a)*60, f.y + Math.sin(a)*60);
          }
          cx.stroke();
          cx.restore();
        }
      }

      // 5. 自訂投射物繪製
      for (const q of G.projs) {
        if (!q.own || q.own.c !== C) continue;
        
        if (q.s.fx === 'sasuke_shuriken' || q.s.fx === 'sasuke_windmill') {
          cx.save();
          cx.translate(q.x, q.y);
          cx.rotate(T * 25);
          const r = q.s.fx === 'sasuke_windmill' ? 24 : 12;
          cx.shadowColor = q.s.fx === 'sasuke_windmill' ? '#88ccff' : '#333';
          cx.shadowBlur = 15;
          cx.fillStyle = q.s.fx === 'sasuke_windmill' ? '#88ccff' : '#333';
          cx.beginPath();
          for(let i=0; i<4; i++){
             cx.rotate(Math.PI/2);
             cx.moveTo(0,0); cx.lineTo(-6, -r); cx.lineTo(6, -r); cx.closePath();
          }
          cx.fill();
          cx.restore();
          
          // 拖尾
          if (Math.random() < 0.6) spark(q.x, q.y, q.s.fx === 'sasuke_windmill' ? '#88ccff' : '#333', 2, 200, .2, 2);

        } else if (q.s.fx === 'fireball') {
          cx.save();
          cx.globalCompositeOperation = 'lighter';
          // 火焰拖尾
          if (Math.random() < 0.9) {
             fx({ k: 'dt', x: q.x, y: q.y, vx: -q.vx*.1, vy: -q.vy*.1, t: .4, m: .4, col: '#ff5a1a', r: 6, dr: 3 });
          }
          const g = cx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 45);
          g.addColorStop(0, '#fff'); g.addColorStop(.3, '#ffdd55'); g.addColorStop(.7, '#ff5a1a'); g.addColorStop(1, 'rgba(255,0,0,0)');
          cx.fillStyle = g;
          cx.beginPath(); cx.arc(q.x, q.y, 45 + Math.sin(T*30)*5, 0, 7); cx.fill();
          cx.restore();
          
        } else if (q.s.fx === 'white_snake') {
          const sn = q.s.snake;
          sn.t += 0.016;
          const prog = Math.min(1, sn.t / sn.T);
          const len = Math.hypot(sn.tx - sn.sx, sn.ty - sn.sy);
          const ux = Math.cos(sn.ang), uy = Math.sin(sn.ang);
          const nx = -uy, ny = ux;
          
          const cxPos = sn.sx + (sn.tx - sn.sx) * prog + nx * Math.sin(prog * Math.PI * 4) * 72;
          const cyPos = sn.sy + (sn.ty - sn.sy) * prog + ny * Math.sin(prog * Math.PI * 4) * 72;
          q.x = cxPos; q.y = cyPos;
          
          // 畫蛇身
          cx.save();
          cx.shadowColor = '#7a5cff';
          cx.shadowBlur = 20;
          cx.strokeStyle = '#fff';
          cx.lineWidth = 12;
          cx.lineCap = 'round';
          cx.lineJoin = 'round';
          cx.beginPath();
          for(let p=0; p<=prog; p+=0.03){
            const px = sn.sx + (sn.tx - sn.sx) * p + nx * Math.sin(p * Math.PI * 4) * 72;
            const py = sn.sy + (sn.ty - sn.sy) * p + ny * Math.sin(p * Math.PI * 4) * 72;
            if(p===0) cx.moveTo(px, py); else cx.lineTo(px, py);
          }
          cx.stroke();
          cx.restore();

          // 沿途帶雷電
          if (Math.random() < 0.8) spark(cxPos, cyPos, '#7a5cff', 3, 400, .2, 2);
          
          if (prog >= 1 && !q.s.snake.done) {
            q.s.snake.done = true;
            // 留下雷電地面
            G.zones.push({
              x: sn.tx, y: sn.ty, s: { delay: 0, rad: 80, dmg: 100, tick: .3, life: 2 },
              own: q.own, t: 0, done: 0, col: '#7a5cff'
            });
            fx({ k: 'ring', x: sn.tx, y: sn.ty, r: 120, col: '#7a5cff', t: .4, m: .4 });
            spark(sn.tx, sn.ty, '#7a5cff', 20, 600, .4, 3);
            q.life = 0;
          }
        }
      }
      cx.restore();
    };
    w._sasukeWrapped = true;
    window.draw = w;
  }

  console.log('[char_sasuke] 宇智波佐助 (豪華特效版) 已載入');
})();
