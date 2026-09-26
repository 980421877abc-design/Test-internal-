/**
 * yelan.js — 夜蘭🎲 外部擴充模組（v10）
 *
 * 設計原則（對齊 sakura.js / boshi.js）：
 *   - 完全不 hook window.dealDamage
 *   - 水箭只在夜蘭自己造成傷害時觸發
 *   - 骰子給隊友增傷：寫入球上的 yelanDiceTimer + yelanAllyBuffPct，主引擎自動讀取
 *   - frame() 有 try/catch，例外不斷 rAF 鏈
 *   - 完全不用 state.hitFlashes
 *
 * 主引擎需要加一行（dealDamage 加成讀取區塊）：
 *   const atkBallForYelan = state.balls.find(x => x.player === options.attackerPlayer && x.yelanDiceTimer > 0);
 *   if (atkBallForYelan && !trueDamage) dmg *= (1 + (atkBallForYelan.yelanAllyBuffPct || 0));
 *
 * 依賴：
 *   - character_constants.js 需提供 YELAN_* 常數
 *     （含 YELAN_DICE_ARROW_SLOW_FACTOR / YELAN_DICE_ARROW_SLOW_DUR）
 *   - character_roster.js 需提供 { id:'yelan', type:'yelan', ... }
 *   - index.html 球球碰撞 skip 需加入 yelanDashing 條件
 */
(function () {
  'use strict';

  const TYPE = 'yelan';
  const COLOR_YELAN    = '#4cc9f0';
  const COLOR_YELAN_LT = '#a8e6ff';

  const FX_CAP   = 220;
  const PROJ_CAP = 100;
  const SPEEDLINE_COUNT = 14;

  // ══════════════════════════════════════════════════════════
  // 常數檢查
  // ══════════════════════════════════════════════════════════
  const REQUIRED = [
    'YELAN_BASIC_DAMAGE', 'YELAN_BASIC_CD', 'YELAN_BASIC_CHARGE',
    'YELAN_BASIC_CHARGE_SLOW', 'YELAN_BASIC_SPEED', 'YELAN_BASIC_RADIUS', 'YELAN_BASIC_LIFE',
    'YELAN_BREAK_EVERY_N', 'YELAN_BREAK_DAMAGE', 'YELAN_BREAK_SPEED',
    'YELAN_BREAK_RADIUS', 'YELAN_BREAK_SOAK_DURATION', 'YELAN_BREAK_RADIUS_BOLT', 'YELAN_BREAK_LIFE',
    'YELAN_SOAK_VULN',
    'YELAN_MASTER_BASE_DMG', 'YELAN_MASTER_GROWTH', 'YELAN_MASTER_GROWTH_TICK', 'YELAN_MASTER_MAX',
    'YELAN_DASH_CD', 'YELAN_DASH_DURATION', 'YELAN_DASH_SPEED_MULT', 'YELAN_DASH_MARK_DAMAGE',
    'YELAN_DICE_CD', 'YELAN_DICE_DURATION', 'YELAN_DICE_DAMAGE', 'YELAN_DICE_RADIUS',
    'YELAN_DICE_ARROW_COUNT', 'YELAN_DICE_ARROW_DAMAGE', 'YELAN_DICE_ARROW_SPEED',
    'YELAN_DICE_ARROW_SPREAD', 'YELAN_DICE_ARROW_RADIUS', 'YELAN_DICE_ARROW_LIFE',
    'YELAN_DICE_TRIGGER_CD', 'YELAN_DICE_ARROW_SLOW_FACTOR', 'YELAN_DICE_ARROW_SLOW_DUR',
  ];
  const missing = REQUIRED.filter(n => {
    try { return (0, eval)(`typeof ${n}`) === 'undefined'; }
    catch (_) { return true; }
  });
  if (missing.length) {
    console.error('[yelan.js] 缺少常數：\n  ' + missing.join('\n  '));
    return;
  }

  // 浸水輸出降低比例（沿用 YELAN_SOAK_VULN，語意為「敵人輸出降低 40%」）
  const SOAK_WEAKEN = YELAN_SOAK_VULN;
  const DICE_SLOW_FACTOR = YELAN_DICE_ARROW_SLOW_FACTOR;
  const DICE_SLOW_DUR    = YELAN_DICE_ARROW_SLOW_DUR;

  // ══════════════════════════════════════════════════════════
  // 環境存取（全部 try/catch）
  // ══════════════════════════════════════════════════════════
  const $S = () => { try { return (typeof state !== 'undefined' && state) ? state : null; } catch (_) { return null; } };
  const $C = () => { try { return (typeof canvas !== 'undefined' && canvas) ? canvas : document.getElementById('arena'); } catch (_) { return null; } };
  const $W = () => { try { return (typeof W !== 'undefined' && W > 0) ? W : ($C()?.width || 350); } catch (_) { return 350; } };
  const $H = () => { try { return (typeof H !== 'undefined' && H > 0) ? H : ($C()?.height || 350); } catch (_) { return 350; } };
  const $Wall = () => { try { return (typeof WALL !== 'undefined') ? WALL : 1; } catch (_) { return 1; } };
  const $Base = () => { try { return (typeof BASE_SPEED === 'number' && BASE_SPEED > 0) ? BASE_SPEED : 140; } catch (_) { return 140; } };
  const $R = b => { const r = Number(b && b.r); if (Number.isFinite(r) && r > 0) return r; try { return (typeof RADIUS !== 'undefined') ? RADIUS : 25; } catch (_) { return 25; } };
  const targets = () => { try { return typeof getAllCombatTargets === 'function' ? getAllCombatTargets() : ($S()?.balls || []); } catch (_) { return $S()?.balls || []; } };
  const nearest = (x, y, ep) => {
    let best = null, bd = Infinity;
    for (const t of targets()) {
      if (!t || t.hp <= 0) continue;
      if ((t.player ?? t.ownerPlayer ?? t.owner) === ep) continue;
      if (t.ewCamouflaged) continue;
      const d = (t.x - x) ** 2 + (t.y - y) ** 2;
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  };
  const deal = (t, d, o) => {
    try { if (typeof dealDamage === 'function') dealDamage(t, d, o || {}); else if (t && Number.isFinite(t.hp)) t.hp = Math.max(0, t.hp - d); }
    catch (_) { if (t && Number.isFinite(t.hp)) t.hp = Math.max(0, t.hp - d); }
  };
  const applySlow = (t, dur, str) => {
    try { if (typeof applyStatus === 'function') { applyStatus(t, { id: 'slow', duration: dur, strength: str, source: 'yelan', stackMode: 'refreshMax' }); return; } } catch (_) {}
    t.curseSlowTimer = Math.max(t.curseSlowTimer || 0, dur);
    t.curseSlowFactor = str;
  };
  // 浸水：設定敵人的輸出降低（用主引擎既有的 weakenTimer / weakenMult）
  const applySoak = (t, dur) => {
    if (!t) return;
    t.weakenTimer = Math.max(t.weakenTimer || 0, dur);
    t.weakenMult = Math.min(t.weakenMult == null ? 1 : t.weakenMult, 1 - SOAK_WEAKEN);
  };
  const snd = t => { try { if (typeof playHitSound === 'function') playHitSound(t); } catch (_) {} };
  const isTeamMode = () => {
    try { return !!(typeof bossMode !== 'undefined' && bossMode) || !!(typeof sandboxMode !== 'undefined' && sandboxMode); } catch (_) { return false; }
  };

  // ══════════════════════════════════════════════════════════
  // 球上狀態
  // ══════════════════════════════════════════════════════════
  function ensure(b) {
    if (b._yelanInit) return;
    b._yelanInit = true;
    b.yelanBasicTimer  = 0;
    b.yelanBasicCounter = 0;
    b.yelanForceBreak  = false;
    b.yelanCharging    = false;
    b.yelanChargeTimer = 0;
    b.yelanSlowTick    = 0;
    b.yelanDashCd      = YELAN_DASH_CD;
    b.yelanDashing     = false;
    b.yelanDashTimer   = 0;
    b.yelanDashTrailTimer = 0;
    b.yelanDashHitSet  = new Set();
    b.yelanDiceCd      = YELAN_DICE_CD;
    b.yelanDiceTimer   = 0;
    b.yelanDiceStartAt = 0;
    b.yelanDiceArrowCd = 0;
    b.yelanAllyBuffPct = 0;
  }

  const frozen = (b, s) => {
    if (!b) return true;
    if (s?.dioWorldGlobalActive && s.dioWorldCaster !== b) return true;
    if (b.obitoInSpace) return true;
    if (b.pucciDiscFrozen) return true;
    if (b.cooldownFreezeTimer > 0) return true;
    if (b.arenaFrozen > 0) return true;
    try { return typeof hasStatusEffect === 'function' && hasStatusEffect(b, 'cooldownFreeze'); } catch (_) { return false; }
  };

  // ══════════════════════════════════════════════════════════
  // Root 上陣列
  // ══════════════════════════════════════════════════════════
  function ensureArrays(s) {
    if (!Array.isArray(s.yelanFx)) s.yelanFx = [];
    if (!Array.isArray(s.yelanProjectiles)) s.yelanProjectiles = [];
  }
  function pushFx(s, fx) {
    if (!s) return;
    if (!Array.isArray(s.yelanFx)) s.yelanFx = [];
    if (s.yelanFx.length >= FX_CAP) s.yelanFx.splice(0, s.yelanFx.length - FX_CAP + 1);
    s.yelanFx.push(fx);
  }
  function pushProj(s, p) {
    if (!s) return;
    if (!Array.isArray(s.yelanProjectiles)) s.yelanProjectiles = [];
    if (s.yelanProjectiles.length >= PROJ_CAP) return;
    s.yelanProjectiles.push(p);
  }

  // ══════════════════════════════════════════════════════════
  // 投射物發射
  // ══════════════════════════════════════════════════════════
  function fireBasic(s, b, e) {
    const ang = Math.atan2(e.y - b.y, e.x - b.x) + (Math.random() - 0.5) * 0.12;
    const r = $R(b);
    pushProj(s, {
      kind: 'basic',
      x: b.x + Math.cos(ang) * (r + 4), y: b.y + Math.sin(ang) * (r + 4),
      vx: Math.cos(ang) * YELAN_BASIC_SPEED, vy: Math.sin(ang) * YELAN_BASIC_SPEED,
      r: YELAN_BASIC_RADIUS, life: YELAN_BASIC_LIFE, maxLife: YELAN_BASIC_LIFE,
      age: 0, owner: b.player, ownerBall: b, damage: YELAN_BASIC_DAMAGE, angle: ang,
    });
    snd('knife');
  }

  function fireBreak(s, b, e) {
    const ang = Math.atan2(e.y - b.y, e.x - b.x) + (Math.random() - 0.5) * 0.08;
    const r = $R(b);
    pushProj(s, {
      kind: 'break',
      x: b.x + Math.cos(ang) * (r + 4), y: b.y + Math.sin(ang) * (r + 4),
      vx: Math.cos(ang) * YELAN_BREAK_SPEED, vy: Math.sin(ang) * YELAN_BREAK_SPEED,
      r: YELAN_BREAK_RADIUS_BOLT, life: YELAN_BREAK_LIFE, maxLife: YELAN_BREAK_LIFE,
      age: 0, owner: b.player, ownerBall: b, damage: YELAN_BREAK_DAMAGE, angle: ang,
      _yelanExploded: false,
    });
    snd('knife');
  }

  function fireDiceArrows(s, owner, target) {
    if (!s || !owner || !target || target.hp <= 0) return;
    const count = YELAN_DICE_ARROW_COUNT;
    const r = $R(owner);
    const baseAng = Math.atan2(target.y - owner.y, target.x - owner.x);
    const halfSpread = YELAN_DICE_ARROW_SPREAD / 2;
    for (let i = 0; i < count; i++) {
      const offset = count > 1 ? (i - (count - 1) / 2) * (halfSpread * 2 / (count - 1)) : 0;
      const ang = baseAng + offset;
      pushProj(s, {
        kind: 'dice',
        x: owner.x + Math.cos(ang) * (r + 6),
        y: owner.y + Math.sin(ang) * (r + 6),
        vx: Math.cos(ang) * YELAN_DICE_ARROW_SPEED, vy: Math.sin(ang) * YELAN_DICE_ARROW_SPEED,
        r: YELAN_DICE_ARROW_RADIUS, life: YELAN_DICE_ARROW_LIFE, maxLife: YELAN_DICE_ARROW_LIFE,
        age: 0, owner: owner.player, ownerBall: owner, damage: YELAN_DICE_ARROW_DAMAGE, angle: ang,
        slowFactor: DICE_SLOW_FACTOR, slowDur: DICE_SLOW_DUR,
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // 水箭觸發（只在夜蘭自己造成傷害時呼叫）
  // ══════════════════════════════════════════════════════════
  function triggerDiceArrows(s, b, target) {
    if (!s || !b || !target) return;
    if (b.char?.type !== TYPE) return;
    if (!(b.yelanDiceTimer > 0)) return;
    if ((b.yelanDiceArrowCd || 0) > 0) return;
    if (target.hp <= 0 || target === b) return;
    b.yelanDiceArrowCd = YELAN_DICE_TRIGGER_CD;
    fireDiceArrows(s, b, target);
  }

  // ══════════════════════════════════════════════════════════
  // 破局矢命中：範圍傷害 + 浸水
  // ══════════════════════════════════════════════════════════
  function explodeBreak(s, p) {
    if (p._yelanExploded) return;
    p._yelanExploded = true;
    const radius = YELAN_BREAK_RADIUS;
    let firstHit = null;
    for (const t of targets()) {
      if (!t || t.hp <= 0) continue;
      if ((t.player ?? t.ownerPlayer ?? t.owner) === p.owner) continue;
      if (Math.hypot(t.x - p.x, t.y - p.y) <= radius + $R(t)) {
        deal(t, YELAN_BREAK_DAMAGE, { attackerPlayer: p.owner, attackerBall: p.ownerBall });
        applySoak(t, YELAN_BREAK_SOAK_DURATION);
        if (!firstHit) firstHit = t;
      }
    }
    // 破局矢也算夜蘭自己的傷害，觸發水箭
    if (firstHit && p.ownerBall) triggerDiceArrows(s, p.ownerBall, firstHit);
    pushFx(s, { kind: 'breakExplosion', x: p.x, y: p.y, radius, life: 0.5, maxLife: 0.5, seed: Math.random() * 1000 });
    snd('opm');
  }

  function updateProjectiles(s, dt) {
    const arr = s.yelanProjectiles;
    if (!Array.isArray(arr) || !arr.length) return;
    const W = $W(), H = $H(), wall = $Wall();
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      if (!p || !Number.isFinite(p.life)) { arr.splice(i, 1); continue; }
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      let dead = false;

      // 撞牆
      if (p.x - p.r < wall || p.x + p.r > W - wall || p.y - p.r < wall || p.y + p.r > H - wall) {
        if (p.kind === 'break') explodeBreak(s, p);
        dead = true;
      }

      // 命中敵人
      if (!dead && p.age >= 0.05) {
        for (const t of targets()) {
          if (!t || t.hp <= 0) continue;
          if ((t.player ?? t.ownerPlayer ?? t.owner) === p.owner) continue;
          if (Math.hypot(t.x - p.x, t.y - p.y) <= $R(t) + p.r) {
            if (p.kind === 'break') {
              explodeBreak(s, p);
            } else {
              deal(t, p.damage, { attackerPlayer: p.owner, attackerBall: p.ownerBall });
              if (p.slowFactor && p.slowDur) applySlow(t, p.slowDur, p.slowFactor);
              // 普通箭命中：觸發水箭（水箭自己命中不再觸發，避免遞迴）
              if (p.kind === 'basic') triggerDiceArrows(s, p.ownerBall, t);
            }
            dead = true;
            break;
          }
        }
      }

      if (p.life <= 0) dead = true;
      if (dead) arr.splice(i, 1);
    }
  }

  // ══════════════════════════════════════════════════════════
  // 普攻：蓄力箭 / 破局矢交替
  // ══════════════════════════════════════════════════════════
  function updateBasic(b, dt, s) {
    if (b.yelanCharging) {
      b.yelanChargeTimer -= dt;
      b.yelanSlowTick -= dt;
      if (b.yelanSlowTick <= 0) {
        b.yelanSlowTick = 0.1;
        applySlow(b, 0.15, YELAN_BASIC_CHARGE_SLOW);
      }
      if (b.yelanChargeTimer <= 0) {
        b.yelanCharging = false;
        const e = nearest(b.x, b.y, b.player);
        if (e) {
          const forceBreak = b.yelanForceBreak;
          const byCounter = b.yelanBasicCounter >= YELAN_BREAK_EVERY_N;
          if (forceBreak || byCounter) {
            b.yelanForceBreak = false;
            b.yelanBasicCounter = 0;
            fireBreak(s, b, e);
          } else {
            b.yelanBasicCounter++;
            fireBasic(s, b, e);
          }
        }
        b.yelanBasicTimer = YELAN_BASIC_CD;
      }
      return;
    }

    b.yelanBasicTimer -= dt;
    if (b.yelanBasicTimer > 0) return;

    const e = nearest(b.x, b.y, b.player);
    if (!e) { b.yelanBasicTimer = 0.2; return; }

    b.yelanCharging = true;
    b.yelanChargeTimer = YELAN_BASIC_CHARGE;
    b.yelanSlowTick = 0;
  }

  // ══════════════════════════════════════════════════════════
  // 籠絡縱命索
  // ══════════════════════════════════════════════════════════
  function updateDash(b, dt, s) {
    if (b.yelanDashing) {
      b.yelanDashTimer -= dt;
      if (!b.yelanDashHitSet) b.yelanDashHitSet = new Set();

      let next = null, bd = Infinity;
      for (const t of targets()) {
        if (!t || t.hp <= 0) continue;
        if ((t.player ?? t.ownerPlayer ?? t.owner) === b.player) continue;
        if (b.yelanDashHitSet.has(t)) continue;
        const d = (t.x - b.x) ** 2 + (t.y - b.y) ** 2;
        if (d < bd) { bd = d; next = t; }
      }
      if (!next) {
        b.yelanDashTimer = 0;
      } else {
        const ang = Math.atan2(next.y - b.y, next.x - b.x);
        const spd = $Base() * YELAN_DASH_SPEED_MULT;
        b.vx = Math.cos(ang) * spd;
        b.vy = Math.sin(ang) * spd;
      }

      b.yelanDashTrailTimer -= dt;
      if (b.yelanDashTrailTimer <= 0) {
        b.yelanDashTrailTimer = 0.06;
        pushFx(s, { kind: 'dashTrail', x: b.x, y: b.y, life: 0.35, maxLife: 0.35 });
      }

      for (const t of targets()) {
        if (!t || t.hp <= 0) continue;
        if ((t.player ?? t.ownerPlayer ?? t.owner) === b.player) continue;
        if (b.yelanDashHitSet.has(t)) continue;
        if (Math.hypot(t.x - b.x, t.y - b.y) <= $R(b) + $R(t) + 4) {
          b.yelanDashHitSet.add(t);
          t.yelanMarkedBy = b.player;
          pushFx(s, { kind: 'markFlash', x: t.x, y: t.y, r: 30, life: 0.3, maxLife: 0.3 });
        }
      }

      if (b.yelanDashTimer <= 0) {
        b.yelanDashing = false;
        let firstBurst = null;
        for (const t of targets()) {
          if (!t || t.hp <= 0) continue;
          if (t.yelanMarkedBy !== b.player) continue;
          deal(t, YELAN_DASH_MARK_DAMAGE, { attackerPlayer: b.player, attackerBall: b });
          t.yelanMarkedBy = null;
          pushFx(s, { kind: 'markBurst', x: t.x, y: t.y, r: 40, life: 0.4, maxLife: 0.4 });
          if (!firstBurst) firstBurst = t;
        }
        if (firstBurst) triggerDiceArrows(s, b, firstBurst);
        b.yelanDashHitSet.clear();
        b.yelanForceBreak = true;
      }
      return;
    }

    b.yelanDashCd -= dt;
    if (b.yelanDashCd > 0) return;
    const e = nearest(b.x, b.y, b.player);
    if (!e) { b.yelanDashCd = 0.2; return; }

    b.yelanDashing = true;
    b.yelanDashTimer = YELAN_DASH_DURATION;
    b.yelanDashTrailTimer = 0;
    b.yelanDashCd = YELAN_DASH_CD;
    b.yelanDashHitSet = new Set();

    const aim = Math.atan2(e.y - b.y, e.x - b.x);
    pushFx(s, { kind: 'dashBurst', x: b.x, y: b.y, angle: aim, count: SPEEDLINE_COUNT, life: 0.35, maxLife: 0.35, seed: Math.random() * 1000 });
  }

  // ══════════════════════════════════════════════════════════
  // 淵圖玲瓏骰
  // ══════════════════════════════════════════════════════════
  function updateDice(b, dt, s) {
    b.yelanDiceCd -= dt;
    if (b.yelanDiceCd > 0) return;
    const e = nearest(b.x, b.y, b.player);
    if (!e) { b.yelanDiceCd = 0.2; return; }

    b.yelanDiceCd = YELAN_DICE_CD;

    // 範圍傷害
    let firstHit = null;
    for (const t of targets()) {
      if (!t || t.hp <= 0) continue;
      if ((t.player ?? t.ownerPlayer ?? t.owner) === b.player) continue;
      if (Math.hypot(t.x - b.x, t.y - b.y) <= YELAN_DICE_RADIUS + $R(t)) {
        deal(t, YELAN_DICE_DAMAGE, { attackerPlayer: b.player, attackerBall: b });
        if (!firstHit) firstHit = t;
      }
    }
    pushFx(s, { kind: 'diceBurst', x: b.x, y: b.y, r: YELAN_DICE_RADIUS, life: 0.5, maxLife: 0.5, seed: Math.random() * 1000 });

    // 給自己與隊友上骰子 + 增傷
    const now = Number.isFinite(s.elapsed) ? s.elapsed : 0;
    const teamMode = isTeamMode();
    for (const ally of (s.balls || [])) {
      if (!ally || ally.hp <= 0) continue;
      if (ally.player !== b.player) continue;
      if (!teamMode && ally !== b) continue;
      ally.yelanDiceTimer = Math.max(ally.yelanDiceTimer || 0, YELAN_DICE_DURATION);
      ally.yelanDiceStartAt = now;
      if (ally.yelanAllyBuffPct == null) ally.yelanAllyBuffPct = 0;
      if (ally.yelanDiceArrowCd == null) ally.yelanDiceArrowCd = 0;
    }

    // 骰子傷害也算夜蘭自己的傷害，觸發水箭
    if (firstHit) triggerDiceArrows(s, b, firstHit);
  }

  function tickDiceBuff(b, dt) {
    if ((b.yelanDiceTimer || 0) > 0) b.yelanDiceTimer = Math.max(0, b.yelanDiceTimer - dt);
    if ((b.yelanDiceArrowCd || 0) > 0) b.yelanDiceArrowCd = Math.max(0, b.yelanDiceArrowCd - dt);
  }

  // 每幀更新持有骰子者的增傷百分比（妙轉隨心）
  function updateAllyBuff(s, dt) {
    const now = Number.isFinite(s.elapsed) ? s.elapsed : 0;
    for (const b of (s.balls || [])) {
      if (!b || b.hp <= 0) continue;
      if (!(b.yelanDiceTimer > 0)) {
        b.yelanAllyBuffPct = 0;
        continue;
      }
      const el = Math.max(0, now - (b.yelanDiceStartAt || 0));
      const ticks = Math.floor(el / YELAN_MASTER_GROWTH_TICK);
      const pct = Math.min(YELAN_MASTER_MAX, YELAN_MASTER_BASE_DMG + ticks * YELAN_MASTER_GROWTH);
      b.yelanAllyBuffPct = pct;
    }
  }

  // ══════════════════════════════════════════════════════════
  // Overlay
  // ══════════════════════════════════════════════════════════
  const ov = { c: null, ctx: null, lastRoot: null, lastT: 0 };

  function setup() {
    if (ov.c && document.body.contains(ov.c)) return;
    const c = document.createElement('canvas');
    c.id = 'yelan-overlay';
    c.style.cssText = 'position:fixed;pointer-events:none;z-index:19;display:none;';
    document.body.appendChild(c);
    ov.c = c; ov.ctx = c.getContext('2d');
  }

  function sync(active) {
    setup();
    const ar = $C(); if (!ar || !ov.c) return;
    if (!active) { ov.c.style.display = 'none'; return; }
    const r = ar.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = $W(), H = $H();
    ov.c.width = Math.max(1, Math.round(W * dpr));
    ov.c.height = Math.max(1, Math.round(H * dpr));
    ov.c.style.left = r.left + 'px'; ov.c.style.top = r.top + 'px';
    ov.c.style.width = r.width + 'px'; ov.c.style.height = r.height + 'px';
    ov.c.style.display = 'block';
  }

  function drawDice(c, x, y, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#f2fbff'; c.strokeStyle = COLOR_YELAN; c.lineWidth = 1;
    c.beginPath(); c.rect(-4, -4, 8, 8); c.fill(); c.stroke();
    c.fillStyle = '#1a3a4a';
    for (const [dx, dy] of [[-1.5, -1.5], [0, 0], [1.5, 1.5]]) {
      c.beginPath(); c.arc(dx, dy, 1, 0, 6.2832); c.fill();
    }
    c.restore();
  }
  function drawArrow(c, p) {
    const isBreak = p.kind === 'break', isDice = p.kind === 'dice';
    const tail = isBreak ? 26 : isDice ? 18 : 22;
    const hl = isBreak ? 12 : isDice ? 8 : 10;
    const hh = isBreak ? 3.5 : isDice ? 2.4 : 2.8;
    c.save(); c.translate(p.x, p.y); c.rotate(p.angle);
    const tg = c.createLinearGradient(-tail, 0, 0, 0);
    tg.addColorStop(0, 'rgba(168,230,255,0)');
    tg.addColorStop(1, isBreak ? 'rgba(200,242,255,0.85)' : 'rgba(168,230,255,0.55)');
    c.strokeStyle = tg; c.lineWidth = isBreak ? 2.8 : isDice ? 1.6 : 2;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(-tail, 0); c.lineTo(0, 0); c.stroke();
    c.fillStyle = isBreak ? '#f0faff' : isDice ? '#cfefff' : '#e0f7ff';
    c.beginPath(); c.moveTo(hl, 0); c.lineTo(-2, -hh); c.lineTo(-2, hh); c.closePath(); c.fill();
    if (isBreak) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(3, 0, 1.6, 0, 6.2832); c.fill(); }
    c.restore();
  }

  function drawAll(t, active) {
    const c = ov.ctx; if (!c) return;
    const s = $S(); if (!s) return;
    const W = $W(), H = $H();
    const dpr = ov.c.width / Math.max(1, W);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    if (!active) return;

    const balls = s.balls || [];

    // ── FX ──
    if (s.yelanFx) for (const fx of s.yelanFx) {
      const fade = Math.max(0, Math.min(1, fx.life / fx.maxLife));
      const prog = 1 - fade;

      if (fx.kind === 'markFlash') {
        c.save(); c.globalAlpha = fade * 0.65; c.fillStyle = COLOR_YELAN;
        c.beginPath(); c.arc(fx.x, fx.y, fx.r * (0.9 + prog * 0.25), 0, 6.2832); c.fill();
        c.restore();
      } else if (fx.kind === 'markBurst') {
        c.save(); c.translate(fx.x, fx.y); c.globalAlpha = fade;
        c.strokeStyle = COLOR_YELAN; c.lineWidth = 3;
        c.beginPath(); c.arc(0, 0, fx.r * (0.7 + prog * 0.6), 0, 6.2832); c.stroke();
        c.globalAlpha = fade * 0.5; c.lineWidth = 1.5;
        c.beginPath(); c.arc(0, 0, fx.r * (0.4 + prog * 0.4), 0, 6.2832); c.stroke();
        c.restore();
      } else if (fx.kind === 'breakExplosion') {
        c.save(); c.translate(fx.x, fx.y); c.globalAlpha = fade;
        c.strokeStyle = COLOR_YELAN; c.lineWidth = 3;
        c.beginPath(); c.arc(0, 0, fx.radius * (0.6 + prog * 0.4), 0, 6.2832); c.stroke();
        c.globalAlpha = fade * 0.5; c.lineWidth = 1.5;
        c.beginPath(); c.arc(0, 0, fx.radius * (0.4 + prog * 0.25), 0, 6.2832); c.stroke();
        c.restore();
      } else if (fx.kind === 'diceBurst') {
        c.save(); c.translate(fx.x, fx.y); c.globalAlpha = fade * 0.6;
        c.strokeStyle = COLOR_YELAN; c.lineWidth = 2;
        c.beginPath(); c.arc(0, 0, fx.r * (0.5 + prog * 0.5), 0, 6.2832); c.stroke();
        c.restore();
      } else if (fx.kind === 'dashTrail') {
        c.save(); c.globalAlpha = fade * 0.55; c.fillStyle = COLOR_YELAN_LT;
        c.beginPath(); c.ellipse(fx.x, fx.y, 10 + prog * 6, 7 + prog * 4, 0, 0, 6.2832); c.fill();
        c.restore();
      } else if (fx.kind === 'dashBurst') {
        c.save(); c.translate(fx.x, fx.y); c.globalAlpha = fade * 0.9;
        c.strokeStyle = COLOR_YELAN_LT; c.lineCap = 'round';
        const r0 = 20 + prog * 40, r1 = r0 + 22 * (1 - prog);
        for (let k = 0; k < fx.count; k++) {
          const a = (k / fx.count) * 6.2832 + fx.seed;
          c.lineWidth = 1.6 + (k % 3) * 0.6;
          c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke();
        }
        c.globalAlpha = fade; c.lineWidth = 3;
        c.beginPath(); c.moveTo(Math.cos(fx.angle) * 14, Math.sin(fx.angle) * 14);
        c.lineTo(Math.cos(fx.angle) * (60 + (1 - prog) * 60), Math.sin(fx.angle) * (60 + (1 - prog) * 60));
        c.stroke();
        c.restore();
      }
    }

    // ── 玄擲玲瓏骰（環繞持有者） ──
    for (const b of balls) {
      if (!b || b.hp <= 0 || !(b.yelanDiceTimer > 0)) continue;
      const bR = $R(b);
      const oa = t * 1.6, oR = bR + 26;
      drawDice(c, b.x + Math.cos(oa) * oR, b.y + Math.sin(oa) * oR, oa * 1.3);
    }

    // ── 投射物 ──
    if (s.yelanProjectiles) for (const p of s.yelanProjectiles) drawArrow(c, p);

    // ── 蓄力光暈（凍結中不畫） ──
    for (const b of balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== TYPE) continue;
      if (!b.yelanCharging) continue;
      if (frozen(b, s)) continue;
      const prog = 1 - Math.max(0, b.yelanChargeTimer) / YELAN_BASIC_CHARGE;
      if (!Number.isFinite(prog)) continue;
      const bR = $R(b);
      c.save(); c.globalAlpha = 0.4 + prog * 0.4; c.strokeStyle = COLOR_YELAN; c.lineWidth = 2;
      c.beginPath(); c.arc(b.x, b.y, bR + 10 + prog * 8, 0, 6.2832); c.stroke();
      c.restore();
    }

    // ── 被標記敵人 ──
    for (const b of balls) {
      if (!b || b.hp <= 0 || !b.yelanMarkedBy) continue;
      const bR = $R(b);
      c.save(); c.globalAlpha = 0.85; c.strokeStyle = COLOR_YELAN; c.lineWidth = 2.5;
      c.setLineDash([6, 5]); c.lineDashOffset = -t * 30;
      c.beginPath(); c.arc(b.x, b.y, bR + 10, 0, 6.2832); c.stroke();
      c.setLineDash([]); c.restore();
    }
  }

  // ══════════════════════════════════════════════════════════
  // 主迴圈
  // ══════════════════════════════════════════════════════════
  function cleanRoot(s) {
    if (!s) return;
    delete s.yelanFx;
    delete s.yelanProjectiles;
  }

  function active() {
    const g = document.getElementById('game-screen');
    if (!g || window.getComputedStyle(g).display === 'none') return false;
    const ovl = document.getElementById('overlay');
    if (ovl && ovl.classList.contains('show')) return false;
    return true;
  }

  function frame(t) {
    try { frameInner(t); }
    catch (err) {
      console.error('[yelan.js 例外，略過此幀]', err);
      try { sync(false); } catch (_) {}
      requestAnimationFrame(frame);
    }
  }

  function frameInner(t) {
    const s = $S();
    if (s !== ov.lastRoot) { cleanRoot(ov.lastRoot); ov.lastRoot = s; }
    if (!s || !Array.isArray(s.balls)) {
      sync(false);
      ov.lastT = t;
      requestAnimationFrame(frame);
      return;
    }

    // 對局結束保險
    const aliveTeams = (() => {
      const set = new Set();
      for (const b of s.balls) if (b && b.hp > 0) set.add(b.player);
      return set.size;
    })();
    if (s.matchEnded || !active() || aliveTeams <= 1) {
      cleanRoot(s);
      for (const b of s.balls) {
        if (!b || b.char?.type !== TYPE) continue;
        b.yelanCharging = false;
        b.yelanChargeTimer = 0;
        b.yelanDashing = false;
        b.yelanDashTimer = 0;
        if (b.yelanDashHitSet) b.yelanDashHitSet.clear();
      }
      sync(false);
      ov.lastT = t;
      requestAnimationFrame(frame);
      return;
    }

    ensureArrays(s);

    const dt = Math.min(0.05, Math.max(0, (t - (ov.lastT || t)) / 1000));
    ov.lastT = t;
    if (!Number.isFinite(dt) || dt < 0) { requestAnimationFrame(frame); return; }
    const et = Number.isFinite(s.elapsed) ? s.elapsed : t / 1000;

    // FX 壽命
    for (let i = s.yelanFx.length - 1; i >= 0; i--) {
      const fx = s.yelanFx[i];
      if (!fx || !Number.isFinite(fx.life) || !Number.isFinite(fx.maxLife)) { s.yelanFx.splice(i, 1); continue; }
      fx.life -= dt;
      if (fx.life <= 0) s.yelanFx.splice(i, 1);
    }
    if (s.yelanFx.length > FX_CAP) s.yelanFx.splice(0, s.yelanFx.length - FX_CAP);

    // 更新持有骰子者的增傷比例
    updateAllyBuff(s, dt);

    // 球上邏輯
    const bodies = s.balls.filter(b => b && b.hp > 0 && b.char && b.char.type === TYPE);
    for (const b of bodies) {
      ensure(b);
      if (frozen(b, s)) {
        if (b.yelanCharging) { b.yelanCharging = false; b.yelanChargeTimer = 0; b.yelanSlowTick = 0; }
        continue;
      }
      updateBasic(b, dt, s);
      updateDash(b, dt, s);
      updateDice(b, dt, s);
    }
    for (const b of s.balls) {
      if (!b || b.hp <= 0) continue;
      if ((b.yelanDiceTimer || 0) > 0 || (b.yelanDiceArrowCd || 0) > 0) tickDiceBuff(b, dt);
    }
    updateProjectiles(s, dt);

    // 死亡清理
    const dead = new Set();
    for (const b of s.balls) if (b?.char?.type === TYPE && b.hp <= 0) dead.add(b.player);
    if (dead.size) {
      s.yelanProjectiles = s.yelanProjectiles.filter(p => !dead.has(p.owner));
      for (const b of s.balls) {
        if (b?.char?.type === TYPE && b.hp <= 0) {
          b.yelanDashing = false;
          b.yelanCharging = false;
          b.yelanChargeTimer = 0;
          if (b.yelanDashHitSet) b.yelanDashHitSet.clear();
        }
      }
    }

    const on = bodies.length > 0
      || s.yelanFx.length > 0
      || s.yelanProjectiles.length > 0
      || s.balls.some(b => b && b.yelanDiceTimer > 0)
      || s.balls.some(b => b && b.yelanMarkedBy);

    sync(on);
    drawAll(et, on);
    requestAnimationFrame(frame);
  }

  function start() {
    setup();
    requestAnimationFrame(frame);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', start, { once: true })
    : start();
  console.log('[yelan.js] v10 已載入（無 hook、水箭只自己觸發、骰子隊友增傷）');
})();
