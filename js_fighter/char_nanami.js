/* js_fighter/char_nanami.js — 七海建人（咒術迴戰）
 * 包含：十劃咒法（10刻度弱點）、加班時間、兩段式技能三。
 * 載入順序：ball_fighter.html 主程式之後、ui_select.js 之前。
 */
(function () {
  'use strict';
  if (typeof CHARS === 'undefined' || typeof CFG === 'undefined') return;
  if (CHARS.nanami) return;

  /* ─── 1. 角色資料 ─── */
  CHARS.nanami = {
    name: '七海建人', work: '咒術迴戰', color: '#d4b843', glyph: '海',
    img: 'image/nanami.png',
    hp: 7000, speed: 540,
    res: { name: '咒力', max: 1500, regen: 30, color: '#b09eff', blockDrain: 25 },
    aiDist: 220,

    domDef: { name: '簡易領域', max: 1000, drain: 300, recover: 160, lock: 0 },
    bf: { chance: .5, window: 1.5, ready: 5, mult: 2.5, heal: 300, kbMul: 2 },

    sk: {
      a: { name: '鈍刀', type: 'melee', bf: 1, cost: 0, cd: .35, wind: .08, dmg: 80, range: 140, arc: 1.2, kb: 180 },
      b: { name: '十劃咒法', type: 'toggle', cost: 50, cd: 4, wind: .1 },
      c: { name: '精準斬擊', type: 'melee', cost: 100, cd: 6, wind: .1, dmg: 150, range: 180, arc: 1.6, kb: 250, lungeDist: 280, lungeDur: .15,
           pv: (f, full, q) => ({ k: 'fan', range: q.lungeDist + q.range, arc: 1.1 }) },
      d: { name: '瓦落瓦落', type: 'zone', cost: 0, cd: 0, wind: .15, dmg: 250, rad: 160, range: 700, kb: 200,
           pv: (f, full, q) => {
             if (f.nanamiState && f.nanamiState.rock) return { k: 'line', len: 500, w: 60 };
             return { k: 'zone', r: q.rad, range: q.range };
           } },
    },
  };
  const C = CHARS.nanami;
  for (const k of Object.keys(C.sk)) C.sk[k].key = k;

  /* ─── 2. 狀態與輔助 ─── */
  function ensure(f) {
    if (!f.nanamiState) {
      f.nanamiState = { overtimeT: 0, overtimeStack: 0, weakTimer: 0, rock: null };
    }
    return f.nanamiState;
  }
  const enemyOf = f => f === G.p ? G.e : G.p;
  const alive = f => !!f && f.hp > 0;
  const fx = o => G.fx.push(o);
  
  /* ─── 3. 弱點計算核心 ─── */
  // 取得弱點線段與金圈的位置
  function getWeakData(target) {
    if (!target.nanamiWeak) return null;
    const w = target.nanamiWeak;
    // 線段角度（垂直於角色與施法者的連線，或者固定角度）
    const ang = w.angle; 
    const len = 90; // 線段總長
    const sx = target.x - Math.cos(ang) * (len / 2);
    const sy = target.y - Math.sin(ang) * (len / 2);
    
    // 10 個點，間距為 len / 9
    const step = len / 9;
    // 第 3 個點 (索引 2) 或第 8 個點 (索引 7)
    const idx = w.pointIdx; 
    
    const wx = sx + Math.cos(ang) * (step * idx);
    const wy = sy + Math.sin(ang) * (step * idx);
    
    return { sx, sy, ang, len, step, idx, wx, wy };
  }

  /* ─── 4. 技能施放與施加弱點 ─── */
  function applyWeakness(attacker, target, isActive) {
    const st = ensure(attacker);
    if (isActive) st.weakTimer = 0;
    
    // 隨機決定線段角度（這裡設為固定朝向或根據連線垂直，這裡用完全隨機的直線）
    const angle = Math.random() * Math.PI * 2;
    // 隨機決定弱點在第3個點(2)還是第8個點(7)
    const pointIdx = Math.random() < 0.5 ? 2 : 7;
    
    target.nanamiWeak = { angle, pointIdx, owner: attacker };
    pop(target, '七三弱點', '#d4b843');
    fx({ k: 'ring', x: target.x, y: target.y, r: CFG.r + 20, col: '#d4b843', t: .3, m: .3 });
  }

  C.sk.b.fire = function (f, o, a, s) {
    const foe = enemyOf(f);
    if (alive(foe)) applyWeakness(f, foe, true);
  };

  C.sk.c.fire = function (f, o, a, s) {
    const ang = Math.atan2(o.y - f.y, o.x - f.x);
    lunge(f, ang, {
      dist: s.lungeDist, dur: s.lungeDur,
      sk: s, dmg: s.dmg, kb: s.kb, reach: s.range,
      onHit: () => {
        G.fx.push({ k: 'arc', x: f.x, y: f.y, a: ang, w: s.arc, r: s.range, t: .2, m: .2, col: '#d4b843' });
        playSlashSfx(1.2);
      }
    });
  };

  C.sk.d.fire = function (f, o, a, s) {
    const st = ensure(f);
    if (st.rock) {
      const rock = st.rock;
      st.rock = null;
      const baseAng = Math.atan2(a.ay - rock.y, a.ax - rock.x);
      const pebbleS = { r: 20, dmg: 100, kb: 150, life: 1.2, col: '#9ea8b8', fx: 'nanami_rock', noWeak: true };
      
      for (let i = -2; i <= 2; i++) {
        const ang = baseAng + i * 0.18;
        G.projs.push({
          x: rock.x, y: rock.y, vx: Math.cos(ang) * 1000, vy: Math.sin(ang) * 1000,
          s: pebbleS, own: f, life: pebbleS.life, col: pebbleS.col
        });
      }
      fx({ k: 'ring', x: rock.x, y: rock.y, r: s.rad, col: '#9ea8b8', t: .4, m: .4 });
      shake(6);
    } else {
      f.en -= 150;
      const cdBase = 8;
      const cdReduce = (st.overtimeStack || 0) * 0.5;
      f.cd.d = Math.max(0, cdBase - cdReduce);
      
      const d = Math.min(Math.hypot(a.ax - f.x, a.ay - f.y), s.range);
      const tx = clamp(f.x + Math.cos(a.ang) * d, CFG.r, CFG.W - CFG.r);
      const ty = clamp(f.y + Math.sin(a.ang) * d, CFG.r, CFG.H - CFG.r);
      
      st.rock = { x: tx, y: ty, t: 0 };
      fx({ k: 'ring', x: tx, y: ty, r: s.rad, col: '#d4b843', t: .3, m: .3 });
      
      later(0.3, () => {
        if (!st.rock) return;
        if (G.state !== 'fight') return;
        blast(f, tx, ty, s.rad, s.dmg, s.kb, '#d4b843', 0);
        shake(12);
        fx({ k: 'flash', t: .2, m: .2, col: '#fff' });
        later(10, () => { if (st.rock && st.rock.x === tx) st.rock = null; }, f);
      }, f);
    }
  };

  /* ─── 5. 弱點命中判定 (`hit` 包裝) ─── */
  const oldHit = window.hit;
  if (typeof oldHit === 'function' && !oldHit._nanamiWrapped) {
    const w = function (t, d, fx_, fy_, kb, heavy, sk, att) {
      if (att && att.c === C) {
        const st = ensure(att);
        // 加班加成
        if (st.overtimeStack > 0) d *= (1 + 0.1 * st.overtimeStack);
        
        // 弱點判定
        if (t.nanamiWeak && sk && !sk.noWeak) {
          const wd = getWeakData(t);
          if (wd) {
            // 計算攻擊來源點 (fx_, fy_) 距離金圈 (wd.wx, wd.wy) 多近
            const dist = Math.hypot(fx_ - wd.wx, fy_ - wd.wy);
            // 若攻擊起點靠近金圈 (容錯 60 像素)，算命中弱點
            if (dist < 60) {
              d *= 3;
              pop(t, 'WEAK! x3', '#ffd77a');
              fx({ k: 'ring', x: wd.wx, y: wd.wy, r: 80, col: '#ffd77a', t: .5, m: .5 });
              spark(wd.wx, wd.wy, '#ffd77a', 20, 600, .4, 4);
              shake(8);
              
              if (sk.key === 'c' && att.cd) {
                att.cd.c = Math.max(0, att.cd.c / 2);
                pop(att, 'CD 減半', '#d4b843');
              }
              delete t.nanamiWeak;
            }
          }
        }
      }
      oldHit(t, d, fx_, fy_, kb, heavy, sk, att);
    };
    w._nanamiWrapped = true;
    window.hit = w;
  }

  /* ─── 6. 狀態更新 (`update` 包裝) ─── */
  const oldCdOf = window.cdOf;
  if (typeof oldCdOf === 'function' && !oldCdOf._nanamiWrapped) {
    const w = function (f, s) {
      let cd = oldCdOf(f, s);
      if (f.c === C) {
        const st = ensure(f);
        if (st.overtimeStack > 0) cd = Math.max(0, cd - st.overtimeStack * 0.5);
      }
      return cd;
    };
    w._nanamiWrapped = true;
    window.cdOf = w;
  }

  const oldUpdate = window.update;
  if (typeof oldUpdate === 'function' && !oldUpdate._nanamiWrapped) {
    const w = function (dt) {
      oldUpdate(dt);
      if (G.state !== 'fight') return;

      for (const f of [G.p, G.e]) {
        if (!f || f.c !== C) continue;
        const st = ensure(f);

        // 加班被動
        st.overtimeT += dt;
        if (st.overtimeT >= 10) {
          st.overtimeT -= 10;
          if (st.overtimeStack < 4) {
            st.overtimeStack++;
            pop(f, '加班時間 ' + st.overtimeStack + ' 層', '#d4b843');
            fx({ k: 'ring', x: f.x, y: f.y, r: CFG.r + 20, col: '#d4b843', t: .5, m: .5 });
          }
        }

        // 移速加成
        if (st.overtimeStack > 0) {
          const hasteV = (C.speed + 20 * st.overtimeStack) / C.speed;
          const eh = f.sts.find(s => s.k === 'haste' && s._nanami);
          if (eh) { eh.t = .1; eh.v = hasteV; }
          else f.sts.push({ k: 'haste', t: .1, v: hasteV, _nanami: 1 });
        }

        // 6秒自動弱點
        const foe = enemyOf(f);
        if (alive(foe)) {
          st.weakTimer += dt;
          if (st.weakTimer >= 6 && (!foe.nanamiWeak || foe.nanamiWeak.owner !== f)) {
            st.weakTimer = 0;
            applyWeakness(f, foe, false);
          }
        } else {
          st.weakTimer = 0;
        }
      }
    };
    w._nanamiWrapped = true;
    window.update = w;
  }

  /* ─── 7. canCast 包裝 ─── */
  const oldCanCast = window.canCast;
  if (typeof oldCanCast === 'function' && !oldCanCast._nanamiWrapped) {
    const w = function (f, k) {
      if (!oldCanCast(f, k)) return false;
      if (f && f.c === C && k === 'd') {
        const st = ensure(f);
        if (!st.rock && f.en < 150) {
          if (f === G.p) say('咒力不足！', .7);
          return false;
        }
      }
      return true;
    };
    w._nanamiWrapped = true;
    window.canCast = w;
  }

  /* ─── 8. 繪製 (`draw` 包裝) ─── */
  const oldDraw = window.draw;
  if (typeof oldDraw === 'function' && !oldDraw._nanamiWrapped) {
    const w = function () {
      oldDraw();
      if (!G.p) return;
      
      cx.save();
      cx.scale(view.s, view.s);
      cx.translate(-cam.x, -cam.y);
      const T = performance.now() / 1000;

      for (const f of [G.p, G.e]) {
        if (!f) continue;

        // 繪製 10 刻度弱點線
        if (f.nanamiWeak) {
          const wd = getWeakData(f);
          if (wd) {
            cx.save();
            cx.translate(wd.sx, wd.sy);
            cx.rotate(wd.ang);
            
            // 畫底線
            cx.strokeStyle = 'rgba(212, 184, 67, 0.4)';
            cx.lineWidth = 2;
            cx.beginPath();
            cx.moveTo(0, 0);
            cx.lineTo(wd.len, 0);
            cx.stroke();

            // 畫 10 個點
            for (let i = 0; i < 10; i++) {
              const px = wd.step * i;
              const isTarget = i === wd.idx;
              
              if (isTarget) {
                // 高亮圈圈 (第3個或第8個點)
                cx.beginPath();
                cx.arc(px, 0, 7 + 2 * Math.sin(T * 10), 0, 7);
                cx.fillStyle = '#d4b843';
                cx.fill();
                cx.strokeStyle = '#fff';
                cx.lineWidth = 2;
                cx.stroke();
                // 光暈
                cx.beginPath();
                cx.arc(px, 0, 14, 0, 7);
                cx.fillStyle = 'rgba(212, 184, 67, 0.3)';
                cx.fill();
              } else {
                // 普通小點
                cx.beginPath();
                cx.arc(px, 0, 2, 0, 7);
                cx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                cx.fill();
              }
            }
            cx.restore();
          }
        }

        // 繪製巨石
        if (f.c === C) {
          const st = ensure(f);
          if (st.rock) {
            const r = st.rock;
            cx.fillStyle = '#4a505c';
            cx.strokeStyle = '#d4b843';
            cx.lineWidth = 3;
            cx.beginPath();
            cx.moveTo(r.x - 30, r.y + 40);
            cx.lineTo(r.x - 45, r.y - 10);
            cx.lineTo(r.x - 10, r.y - 60);
            cx.lineTo(r.x + 35, r.y - 45);
            cx.lineTo(r.x + 45, r.y + 15);
            cx.lineTo(r.x + 15, r.y + 50);
            cx.closePath();
            cx.fill();
            cx.stroke();
            cx.fillStyle = 'rgba(212, 184, 67, 0.3)';
            cx.fill();
            cx.fillStyle = '#fff';
            cx.font = 'bold 12px system-ui';
            cx.textAlign = 'center';
            cx.fillText('可崩解', r.x, r.y - 70);
          }
        }
      }
      cx.restore();
    };
    w._nanamiWrapped = true;
    window.draw = w;
  }

  console.log('[char_nanami] 七海建人已載入 (七三弱點刻度版)');
})();
