/**
 * sakura.js — 櫻🌸 外部擴充模組（v3：判定與視覺對齊）
 *
 * 依賴：
 *   - character_constants.js 需提供 SAKURA_* 常數
 *   - character_roster.js 需提供 { id:'sakura', type:'sakura', ... } 條目
 *   - index.html 只需加入 <script src="sakura.js"></script>
 *
 * 本版修正：
 *   1. 判定線段 = [bR, bR + THRUST_LENGTH]，與視覺尖端對齊
 *   2. 視覺半寬 = 判定半寬（中段略寬，確保視覺碰到即判定命中）
 *   3. 動畫節奏改為「刺出→保持滿長→淡出」，判定窗口與視覺同步
 */
(function () {
  'use strict';

  const TYPE = 'sakura';

  // ══════════════════════════════════════════════════════════
  // 常數來源：character_constants.js（唯一）
  // ══════════════════════════════════════════════════════════
  const REQUIRED_CONSTANTS = [
    'SAKURA_PETAL_MAX', 'SAKURA_SENBON_TICK_INTERVAL', 'SAKURA_SENBON_BASE_DAMAGE',
    'SAKURA_SENBON_DAMAGE_PER_3_PETALS', 'SAKURA_SENBON_RADIUS_MULT', 'SAKURA_SENBON_SLOW_FACTOR',
    'SAKURA_SENBON_SLOW_DURATION', 'SAKURA_YAE_DAMAGE_REDUCE', 'SAKURA_YAE_MAX_CHARGES',
    'SAKURA_YAE_RECHARGE_TIME', 'SAKURA_YAE_RECHARGE_PER_PETAL', 'SAKURA_BASIC_DAMAGE',
    'SAKURA_BASIC_INTERVAL', 'SAKURA_BASIC_SPEED', 'SAKURA_FUBUN_RADIUS_MULT',
    'SAKURA_FUBUN_DURATION', 'SAKURA_FUBUN_CD', 'SAKURA_FUBUN_TICK_INTERVAL',
    'SAKURA_MARK_DURATION', 'SAKURA_MARK_CD', 'SAKURA_MARK_DAMAGE_AMP',
    'SAKURA_FULL_BLOOM_DURATION', 'SAKURA_FULL_BLOOM_CD', 'SAKURA_FULL_BLOOM_SPEED_MULT',
    'SAKURA_FULL_BLOOM_TICK_INTERVAL', 'SAKURA_FULL_BLOOM_DURATION_PER_PETAL',
  ];
  const missingConstants = REQUIRED_CONSTANTS.filter(name => {
    try { return (0, eval)(`typeof ${name}`) === 'undefined'; }
    catch (_) { return true; }
  });
  if (missingConstants.length) {
    console.error('[sakura.js] 找不到櫻的常數，請先把常數補丁貼進 character_constants.js：\n  ' +
      missingConstants.join('\n  '));
    return;
  }

  // ── 常數別名 ──
  const PETAL_MAX              = SAKURA_PETAL_MAX;
  const SENBON_TICK            = SAKURA_SENBON_TICK_INTERVAL;
  const SENBON_BASE_DMG        = SAKURA_SENBON_BASE_DAMAGE;
  const SENBON_PER_3           = SAKURA_SENBON_DAMAGE_PER_3_PETALS;
  const SENBON_RADIUS_MULT     = SAKURA_SENBON_RADIUS_MULT;
  const SENBON_SLOW_FACTOR     = SAKURA_SENBON_SLOW_FACTOR;
  const SENBON_SLOW_DUR        = SAKURA_SENBON_SLOW_DURATION;
  const YAE_REDUCE             = SAKURA_YAE_DAMAGE_REDUCE;
  const YAE_MAX                = SAKURA_YAE_MAX_CHARGES;
  const YAE_RECHARGE_TIME      = SAKURA_YAE_RECHARGE_TIME;
  const YAE_RECHARGE_PER_PETAL = SAKURA_YAE_RECHARGE_PER_PETAL;
  const BASIC_DMG              = SAKURA_BASIC_DAMAGE;
  const BASIC_INTERVAL         = SAKURA_BASIC_INTERVAL;
  const FUBUN_RADIUS_MULT      = SAKURA_FUBUN_RADIUS_MULT;
  const FUBUN_DURATION         = SAKURA_FUBUN_DURATION;
  const FUBUN_CD               = SAKURA_FUBUN_CD;
  const FUBUN_TICK             = SAKURA_FUBUN_TICK_INTERVAL;
  const MARK_DURATION          = SAKURA_MARK_DURATION;
  const MARK_CD                = SAKURA_MARK_CD;
  const MARK_AMP               = SAKURA_MARK_DAMAGE_AMP;
  const BLOOM_DURATION         = SAKURA_FULL_BLOOM_DURATION;
  const BLOOM_CD               = SAKURA_FULL_BLOOM_CD;
  const BLOOM_SPEED_MULT       = SAKURA_FULL_BLOOM_SPEED_MULT;
  const BLOOM_TICK             = SAKURA_FULL_BLOOM_TICK_INTERVAL;
  const BLOOM_DUR_PER_PETAL    = SAKURA_FULL_BLOOM_DURATION_PER_PETAL;

  // ── 刺擊參數（判定與視覺共用同一組座標）──
  const THRUST_LENGTH        = 110;   // 從「球邊緣」算起的攻擊距離
  const THRUST_HALF_WIDTH    = 18;    // 判定半寬；也是視覺刀鋒的最大半寬基準
  const THRUST_ANIM_DURATION = 0.26;  // 動畫時長

  // ══════════════════════════════════════════════════════════
  // 全域存取工具
  // ══════════════════════════════════════════════════════════
  function getRoot() {
    try { return (typeof state !== 'undefined' && state) ? state : null; } catch (_) { return null; }
  }
  function getCanvas() {
    try { return (typeof canvas !== 'undefined' && canvas) ? canvas : document.getElementById('arena'); } catch (_) { return null; }
  }
  function getW() {
    try { return (typeof W !== 'undefined' && W > 0) ? W : (getCanvas()?.width || 350); } catch (_) { return 350; }
  }
  function getH() {
    try { return (typeof H !== 'undefined' && H > 0) ? H : (getCanvas()?.height || 350); } catch (_) { return 350; }
  }
  function getWall() {
    try { return (typeof WALL !== 'undefined') ? WALL : 1; } catch (_) { return 1; }
  }
  function getRadius(b) {
    const r = Number(b && b.r);
    if (Number.isFinite(r) && r > 0) return r;
    try { return (typeof RADIUS !== 'undefined') ? RADIUS : 25; } catch (_) { return 25; }
  }
  function getAllTargets() {
    try {
      if (typeof getAllCombatTargets === 'function') return getAllCombatTargets();
    } catch (_) {}
    const r = getRoot();
    return (r && r.balls) || [];
  }
  function getNearestEnemyTo(x, y, excludePlayer) {
    let best = null, bestD = Infinity;
    for (const t of getAllTargets()) {
      if (!t || t.hp <= 0) continue;
      if ((t.player ?? t.ownerPlayer ?? t.owner) === excludePlayer) continue;
      if (t.ewCamouflaged) continue;
      const d = (t.x - x) * (t.x - x) + (t.y - y) * (t.y - y);
      if (d < bestD) { bestD = d; best = t; }
    }
    return best;
  }
  function isBallInDryPowder(b) {
    try { if (typeof isBallInBossDryPowderZone === 'function') return isBallInBossDryPowderZone(b); } catch (_) {}
    return false;
  }
  function applyDmg(target, dmg, options) {
    try { if (typeof dealDamage === 'function') { dealDamage(target, dmg, options || {}); return; } } catch (_) {}
    if (target && Number.isFinite(target.hp)) target.hp = Math.max(0, target.hp - dmg);
  }
  function applyStatusSafe(target, effect) {
    try { if (typeof applyStatus === 'function') { applyStatus(target, effect); return; } } catch (_) {}
    if (effect.id === 'slow') {
      target.curseSlowTimer = Math.max(target.curseSlowTimer || 0, effect.duration);
      target.curseSlowFactor = effect.strength;
    }
  }
  function playHit(type) {
    try { if (typeof playHitSound === 'function') playHitSound(type); } catch (_) {}
  }
  function pushFlash(x, y, r, color, t) {
    const root = getRoot();
    if (!root || !root.hitFlashes) return;
    root.hitFlashes.push({ x, y, r, alpha: 1, color, t });
  }

  function sakuraDamage(ownerPlayer, ownerBall, target, base) {
    let dmg = base;
    if (target && target.sakuraMarkedTimer > 0 && target.sakuraMarkedOwnerPlayer === ownerPlayer) {
      dmg *= 1 + MARK_AMP;
    }
    return dmg;
  }

  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
    const cx = x1 + dx * t, cy = y1 + dy * t;
    return Math.hypot(px - cx, py - cy);
  }

  // ══════════════════════════════════════════════════════════
  // 狀態初始化
  // ══════════════════════════════════════════════════════════
  function ensureState(b) {
    if (b._sakuraInit) return;
    b._sakuraInit = true;
    b.sakuraPetals              = 0;
    b.sakuraSenbonTickTimer     = 0;
    b.sakuraYaeCharges          = YAE_MAX;
    b.sakuraYaeRechargeTimer    = 0;
    b.sakuraYaeRecharging       = false;
    b.sakuraBasicTimer          = 0;
    b.sakuraFubunTimer          = 0;
    b.sakuraMarkTimer           = 0;
    b.sakuraFullBloomCooldown   = BLOOM_CD;
    b.sakuraFullBloomDuration   = 0;
    b.sakuraFullBloomActive     = false;
    b.sakuraFullBloomTickTimer  = 0;
    b._sakuraThrustAnim         = 0;
    b._sakuraThrustAnimMax      = 0;
    b._sakuraThrustAngle        = 0;
    b._sakuraThrustHit          = false;
    b._sakuraThrustHits         = null;
  }

  // ══════════════════════════════════════════════════════════
  // 八重櫻減傷
  // ══════════════════════════════════════════════════════════
  function installYaeShield(b) {
    if (b._yaeInstalled) return;
    b._yaeInstalled = true;

    let realHp = Number(b.hp) || 0;

    Object.defineProperty(b, 'hp', {
      configurable: true,
      enumerable: true,
      get() { return realHp; },
      set(v) {
        if (b._yaeSkipOnce) { b._yaeSkipOnce = false; realHp = Number(v) || 0; return; }
        if (b.opmExecuted) { realHp = Number(v) || 0; return; }

        const nv = Number(v);
        if (!Number.isFinite(nv) || nv >= realHp) {
          realHp = Number.isFinite(nv) ? nv : realHp;
          return;
        }

        const root = getRoot();
        if (root && root.dioWorldGlobalActive && root.dioWorldCaster !== b) {
          realHp = nv;
          return;
        }

        if ((b.sakuraYaeCharges || 0) > 0) {
          const delta = realHp - nv;
          const reduced = Math.max(0, delta - YAE_REDUCE);
          b.sakuraYaeCharges -= 1;
          if (b.sakuraYaeCharges <= 0) {
            b.sakuraYaeRecharging = true;
            const petals = Math.min(PETAL_MAX, b.sakuraPetals || 0);
            b.sakuraYaeRechargeTimer = Math.max(0, YAE_RECHARGE_TIME - petals * YAE_RECHARGE_PER_PETAL);
          }
          realHp = Math.max(0, realHp - reduced);
          if (root && root.hitFlashes && realHp > 0) {
            root.hitFlashes.push({ x: b.x, y: b.y, r: 30, alpha: 1, color: '#ffd6e6', t: 0.3 });
          }
        } else {
          realHp = nv;
        }
      }
    });

    b._yaeSkipOnce = true;
    b.hp = realHp;
  }

  // ══════════════════════════════════════════════════════════
  // 邏輯
  // ══════════════════════════════════════════════════════════
  function isFrozen(b, root) {
    if (!b) return true;
    if (root && root.dioWorldGlobalActive && root.dioWorldCaster !== b) return true;
    if (b.obitoInSpace) return true;
    if (b.pucciDiscFrozen) return true;
    if (b.cooldownFreezeTimer > 0) return true;
    if (b.arenaFrozen > 0) return true;
    if (isBallInDryPowder(b)) return true;
    try { if (typeof hasStatusEffect === 'function' && hasStatusEffect(b, 'cooldownFreeze')) return true; } catch (_) {}
    return false;
  }

  // ── 刺擊判定：與視覺完全共用座標系 ──
  //   判定線段 = [bR, bR + THRUST_LENGTH]，沿 angle 方向
  //   視覺尖端（extension = 1 時）= bR + THRUST_LENGTH，與判定終點重合
  //   判定半寬 = THRUST_HALF_WIDTH，視覺中段半寬 = THRUST_HALF_WIDTH * 1.10（略寬，確保視覺碰到即命中）
  function performThrust(b, enemy) {
    const angle = Math.atan2(enemy.y - b.y, enemy.x - b.x);
    const bR = getRadius(b);

    b._sakuraThrustAngle = angle;
    b._sakuraThrustAnim = THRUST_ANIM_DURATION;
    b._sakuraThrustAnimMax = THRUST_ANIM_DURATION;
    b._sakuraThrustHit = false;
    b._sakuraThrustHits = new Set();
    b.sakuraBasicTimer = BASIC_INTERVAL;

    // 判定線段：從球邊緣開始，與視覺對齊
    const x1 = b.x + Math.cos(angle) * bR;
    const y1 = b.y + Math.sin(angle) * bR;
    const x2 = b.x + Math.cos(angle) * (bR + THRUST_LENGTH);
    const y2 = b.y + Math.sin(angle) * (bR + THRUST_LENGTH);

    for (const foe of getAllTargets()) {
      if (!foe || foe.hp <= 0) continue;
      if ((foe.player ?? foe.ownerPlayer ?? foe.owner) === b.player) continue;
      if (b._sakuraThrustHits.has(foe)) continue;
      const dist = pointToSegmentDistance(foe.x, foe.y, x1, y1, x2, y2);
      if (dist < getRadius(foe) + THRUST_HALF_WIDTH) {
        b._sakuraThrustHits.add(foe);
        b._sakuraThrustHit = true;
        const dmg = sakuraDamage(b.player, b, foe, BASIC_DMG);
        applyDmg(foe, dmg, { attackerPlayer: b.player, attackerBall: b });
        b.sakuraPetals = Math.min(PETAL_MAX, (b.sakuraPetals || 0) + 1);
        pushFlash(foe.x, foe.y, 24, '#ffa6c9', 0.26);
        playHit('knife');
      }
    }
  }

  function tickThrustAnim(b, dt) {
    if (b._sakuraThrustAnim > 0) {
      b._sakuraThrustAnim -= dt;
      if (b._sakuraThrustAnim < 0) b._sakuraThrustAnim = 0;
    }
  }

  function updateSakuraLogic(b, dt, root) {
    if (isFrozen(b, root)) return;

    b.sakuraPetals = Math.max(0, Math.min(PETAL_MAX, b.sakuraPetals || 0));

    if (b.sakuraYaeRecharging) {
      b.sakuraYaeRechargeTimer -= dt;
      if (b.sakuraYaeRechargeTimer <= 0) {
        b.sakuraYaeRecharging = false;
        b.sakuraYaeRechargeTimer = 0;
        b.sakuraYaeCharges = YAE_MAX;
        pushFlash(b.x, b.y, 40, '#ffe0eb', 0.5);
      }
    }

    if (!b.sakuraFullBloomActive) {
      b.sakuraSenbonTickTimer -= dt;
      if (b.sakuraSenbonTickTimer <= 0) {
        b.sakuraSenbonTickTimer += SENBON_TICK;
        const radius = getRadius(b) * SENBON_RADIUS_MULT;
        const baseDmg = SENBON_BASE_DMG + Math.floor(b.sakuraPetals / 3) * SENBON_PER_3;
        for (const foe of getAllTargets()) {
          if (!foe || foe.hp <= 0) continue;
          if ((foe.player ?? foe.ownerPlayer ?? foe.owner) === b.player) continue;
          if (Math.hypot(foe.x - b.x, foe.y - b.y) <= radius + getRadius(foe)) {
            const dmg = sakuraDamage(b.player, b, foe, baseDmg);
            applyDmg(foe, dmg, { attackerPlayer: b.player, attackerBall: b, continuousDamage: true });
            applyStatusSafe(foe, {
              id: 'slow', duration: SENBON_SLOW_DUR, strength: SENBON_SLOW_FACTOR,
              source: 'sakura_senbon', stackMode: 'refreshMax'
            });
          }
        }
      }
    }

    tickThrustAnim(b, dt);

    const enemy = getNearestEnemyTo(b.x, b.y, b.player);

    if (b.sakuraBasicTimer > 0) b.sakuraBasicTimer -= dt;
    if (enemy && b.sakuraBasicTimer <= 0) {
      // 出手條件也與判定對齊：敵人在 [bR, bR + THRUST_LENGTH + enemyR] 之間才出手
      const reach = getRadius(b) + THRUST_LENGTH + getRadius(enemy);
      if (Math.hypot(enemy.x - b.x, enemy.y - b.y) <= reach) {
        performThrust(b, enemy);
      }
    }

    if (b.sakuraFubunTimer > 0) b.sakuraFubunTimer -= dt;
    if (enemy && b.sakuraFubunTimer <= 0) {
      b.sakuraFubunTimer = FUBUN_CD;
      if (!root.sakuraFubunZones) root.sakuraFubunZones = [];
      root.sakuraFubunZones.push({
        x: enemy.x, y: enemy.y,
        radius: getRadius(b) * FUBUN_RADIUS_MULT,
        life: FUBUN_DURATION, maxLife: FUBUN_DURATION,
        tickTimer: 0,
        owner: b.player, ownerBall: b
      });
      pushFlash(enemy.x, enemy.y, 40, '#ffd6e6', 0.5);
    }

    if (b.sakuraMarkTimer > 0) b.sakuraMarkTimer -= dt;
    if (enemy && b.sakuraMarkTimer <= 0) {
      b.sakuraMarkTimer = MARK_CD;
      enemy.sakuraMarkedTimer = MARK_DURATION;
      enemy.sakuraMarkedOwnerPlayer = b.player;
      b.sakuraPetals = Math.min(PETAL_MAX, b.sakuraPetals + 1);
      pushFlash(enemy.x, enemy.y, 36, '#ff8fb3', 0.4);
    }

    if (b.sakuraFullBloomActive) {
      b.sakuraFullBloomDuration -= dt;
      b.sakuraFullBloomTickTimer -= dt;
      if (b.sakuraFullBloomTickTimer <= 0) {
        b.sakuraFullBloomTickTimer += BLOOM_TICK;
        const baseDmg = SENBON_BASE_DMG + Math.floor(b.sakuraPetals / 3) * SENBON_PER_3;
        for (const foe of getAllTargets()) {
          if (!foe || foe.hp <= 0) continue;
          if ((foe.player ?? foe.ownerPlayer ?? foe.owner) === b.player) continue;
          const dmg = sakuraDamage(b.player, b, foe, baseDmg);
          applyDmg(foe, dmg, { attackerPlayer: b.player, attackerBall: b, continuousDamage: true });
          applyStatusSafe(foe, {
            id: 'slow', duration: 0.15, strength: SENBON_SLOW_FACTOR,
            source: 'sakura_full_bloom', stackMode: 'refreshMax'
          });
        }
      }
      if (b.sakuraFullBloomDuration <= 0) {
        b.sakuraFullBloomActive = false;
        b.sakuraFullBloomDuration = 0;
        b.sakuraFullBloomCooldown = BLOOM_CD;
      }
      const wall = getWall(), W = getW(), H = getH(), r = getRadius(b);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x - r < wall) b.x = wall + r;
      if (b.x + r > W - wall) b.x = W - wall - r;
      if (b.y - r < wall) b.y = wall + r;
      if (b.y + r > H - wall) b.y = H - wall - r;
    } else if (b.sakuraFullBloomCooldown > 0) {
      b.sakuraFullBloomCooldown -= dt;
    } else {
      b.sakuraFullBloomActive = true;
      b.sakuraFullBloomDuration = BLOOM_DURATION + b.sakuraPetals * BLOOM_DUR_PER_PETAL;
      b.sakuraFullBloomTickTimer = 0;
      pushFlash(b.x, b.y, 80, '#ffa6c9', 0.6);
    }
  }

  function updateFubunZones(dt, root) {
    if (!root.sakuraFubunZones) return;
    const arr = root.sakuraFubunZones;
    for (let i = arr.length - 1; i >= 0; i--) {
      const z = arr[i];
      if (root.dioWorldGlobalActive && (!root.dioWorldCaster || z.owner !== root.dioWorldCaster.player)) continue;
      z.life -= dt;
      if (z.life <= 0) { arr.splice(i, 1); continue; }
      z.tickTimer -= dt;
      if (z.tickTimer <= 0) {
        z.tickTimer += FUBUN_TICK;
        const ownerBall = (root.balls || []).find(x => x && x.player === z.owner && x.char && x.char.type === TYPE && x.hp > 0);
        const petals = ownerBall ? Math.min(PETAL_MAX, ownerBall.sakuraPetals || 0) : 0;
        const baseDmg = SENBON_BASE_DMG + Math.floor(petals / 3) * SENBON_PER_3;
        for (const foe of getAllTargets()) {
          if (!foe || foe.hp <= 0) continue;
          if ((foe.player ?? foe.ownerPlayer ?? foe.owner) === z.owner) continue;
          if (Math.hypot(foe.x - z.x, foe.y - z.y) < z.radius + getRadius(foe)) {
            const dmg = sakuraDamage(z.owner, ownerBall, foe, baseDmg);
            applyDmg(foe, dmg, { attackerPlayer: z.owner, attackerBall: ownerBall, continuousDamage: true });
            applyStatusSafe(foe, {
              id: 'slow', duration: SENBON_SLOW_DUR, strength: SENBON_SLOW_FACTOR,
              source: 'sakura_fubun', stackMode: 'refreshMax'
            });
          }
        }
      }
    }
  }

  function updateMarks(dt, root) {
    for (const b of (root.balls || [])) {
      if (!b || !(b.sakuraMarkedTimer > 0)) continue;
      b.sakuraMarkedTimer -= dt;
      if (b.sakuraMarkedTimer <= 0) {
        b.sakuraMarkedTimer = 0;
        b.sakuraMarkedOwnerPlayer = null;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // Overlay canvas
  // ══════════════════════════════════════════════════════════
  const ov = { canvas: null, ctx: null, lastRoot: null, lastTime: 0 };

  function setupOverlay() {
    if (ov.canvas && document.body.contains(ov.canvas)) return;
    const c = document.createElement('canvas');
    c.id = 'sakura-overlay';
    c.style.cssText = 'position:fixed;pointer-events:none;z-index:19;display:none;';
    document.body.appendChild(c);
    ov.canvas = c;
    ov.ctx = c.getContext('2d');
  }

  function syncOverlay(active) {
    setupOverlay();
    const arena = getCanvas();
    if (!arena || !ov.canvas) return;
    const rect = arena.getBoundingClientRect();
    const W = getW(), H = getH();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    ov.canvas.width = Math.max(1, Math.round(W * dpr));
    ov.canvas.height = Math.max(1, Math.round(H * dpr));
    ov.canvas.style.left = rect.left + 'px';
    ov.canvas.style.top = rect.top + 'px';
    ov.canvas.style.width = rect.width + 'px';
    ov.canvas.style.height = rect.height + 'px';
    ov.canvas.style.display = active ? 'block' : 'none';
  }

  // ══════════════════════════════════════════════════════════
  // 繪製：刺擊刀鋒（與判定對齊）
  // ══════════════════════════════════════════════════════════
  function drawThrust(c, b, bR) {
    if (!(b._sakuraThrustAnim > 0) || !(b._sakuraThrustAnimMax > 0)) return;
    const t = 1 - b._sakuraThrustAnim / b._sakuraThrustAnimMax; // 0 → 1

    // 三段節奏：0~25% 刺出 → 25~70% 保持滿長（判定窗口） → 70~100% 淡出
    let extension, opacity;
    if (t < 0.25) {
      const k = t / 0.25;
      extension = 1 - Math.pow(1 - k, 3);
      opacity = Math.min(1, k * 2.5);
    } else if (t < 0.70) {
      extension = 1;
      opacity = 1;
    } else {
      const k = (t - 0.70) / 0.30;
      extension = 1 - k * 0.10;
      opacity = 1 - Math.pow(k, 1.4);
    }
    if (opacity <= 0.02) return;

    // 座標系統（本地：+x = 刺出方向）：
    //   判定線段 = [bR, bR + THRUST_LENGTH]（世界座標，沿 angle 方向）
    //   視覺根部 = bR * 0.35（球內一點，看起來從球裡伸出）
    //   視覺尖端 = bR + THRUST_LENGTH * extension（extension=1 時與判定終點重合）
    //   視覺半寬：中段最寬 = THRUST_HALF_WIDTH * 1.10（略寬於判定，確保視覺碰到即命中）
    const rootX = bR * 0.35;
    const tipX = bR + THRUST_LENGTH * extension;
    const len = tipX - rootX;
    if (len <= 4) return;
    const maxHalfW = THRUST_HALF_WIDTH * 1.10;

    c.save();
    c.translate(b.x, b.y);
    c.rotate(b._sakuraThrustAngle);

    // ── 刺出階段飄散的花瓣碎片（收回階段不畫）──
    if (t < 0.5) {
      const sp = Math.max(0, 1 - t / 0.5);
      c.globalAlpha = opacity * sp * 0.85;
      c.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 6; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const along = rootX + len * (0.15 + (i / 6) * 0.72);
        const spread = maxHalfW * (1.5 + (i % 3) * 0.7) * side;
        c.save();
        c.translate(along, spread);
        c.rotate(side * 0.7);
        const pl = 6 + (i % 3) * 3;
        const pw = 1.8 + (i % 2) * 0.6;
        c.beginPath();
        c.moveTo(-pl * 0.5, 0);
        c.quadraticCurveTo(0, -pw, pl * 0.5, 0);
        c.quadraticCurveTo(0, pw * 0.4, -pl * 0.5, 0);
        c.closePath();
        c.fillStyle = i % 3 === 0 ? '#ffe0eb' : '#ffa6c9';
        c.fill();
        c.restore();
      }
    }

    // ── 刀鋒主體：花瓣梭形 ──
    c.globalAlpha = opacity;
    c.globalCompositeOperation = 'source-over';

    // 外暈（極淡，略寬於判定，讓「視覺碰到」＝「判定命中」）
    c.beginPath();
    c.moveTo(rootX, 0);
    c.bezierCurveTo(
      rootX + len * 0.25, -maxHalfW * 1.45,
      rootX + len * 0.60, -maxHalfW * 1.20,
      tipX, 0
    );
    c.bezierCurveTo(
      rootX + len * 0.60, maxHalfW * 1.20,
      rootX + len * 0.25, maxHalfW * 1.45,
      rootX, 0
    );
    c.closePath();
    c.fillStyle = 'rgba(255, 166, 201, 0.22)';
    c.fill();

    // 刀身（粉色漸層）
    const bladeGrad = c.createLinearGradient(rootX, 0, tipX, 0);
    bladeGrad.addColorStop(0, 'rgba(255, 235, 244, 0.05)');
    bladeGrad.addColorStop(0.30, 'rgba(255, 190, 215, 0.85)');
    bladeGrad.addColorStop(0.72, 'rgba(255, 143, 179, 0.75)');
    bladeGrad.addColorStop(1, 'rgba(255, 245, 250, 0.9)');
    c.beginPath();
    c.moveTo(rootX, 0);
    c.bezierCurveTo(
      rootX + len * 0.25, -maxHalfW * 1.05,
      rootX + len * 0.60, -maxHalfW * 0.85,
      tipX, 0
    );
    c.bezierCurveTo(
      rootX + len * 0.60, maxHalfW * 0.85,
      rootX + len * 0.25, maxHalfW * 1.05,
      rootX, 0
    );
    c.closePath();
    c.fillStyle = bladeGrad;
    c.fill();

    // 上緣高光
    c.beginPath();
    c.moveTo(rootX, 0);
    c.bezierCurveTo(
      rootX + len * 0.25, -maxHalfW * 1.05,
      rootX + len * 0.60, -maxHalfW * 0.85,
      tipX, 0
    );
    c.strokeStyle = 'rgba(255, 245, 250, 0.95)';
    c.lineWidth = 1.2;
    c.stroke();

    // 中央花脈（用 lighter 疊加，不影響主體顏色）
    c.globalCompositeOperation = 'lighter';
    const coreGrad = c.createLinearGradient(rootX, 0, tipX, 0);
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    coreGrad.addColorStop(0.30, 'rgba(255, 255, 255, 0.7)');
    coreGrad.addColorStop(0.85, 'rgba(255, 255, 255, 0.95)');
    coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    c.strokeStyle = coreGrad;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(rootX + len * 0.10, 0);
    c.lineTo(tipX * 0.98, 0);
    c.stroke();

    // 尖端亮點
    const tipGlow = c.createRadialGradient(tipX, 0, 0, tipX, 0, 9);
    tipGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    tipGlow.addColorStop(0.4, 'rgba(255, 220, 235, 0.5)');
    tipGlow.addColorStop(1, 'rgba(255, 166, 201, 0)');
    c.fillStyle = tipGlow;
    c.beginPath();
    c.arc(tipX, 0, 9, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = 'source-over';

    // ── 命中綻放：刀尖向外炸出花瓣（非圓形爆閃）──
    if (b._sakuraThrustHit && t > 0.28 && t < 0.82) {
      const hp = (t - 0.28) / 0.54;
      const flash = Math.sin(hp * Math.PI);
      c.globalAlpha = opacity * flash;

      c.fillStyle = '#fff5f9';
      c.beginPath();
      c.arc(tipX, 0, 3 + flash * 3, 0, Math.PI * 2);
      c.fill();

      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + hp * 0.9;
        const dist = 6 + hp * 22;
        const px = tipX + Math.cos(a) * dist;
        const py = Math.sin(a) * dist;
        c.save();
        c.translate(px, py);
        c.rotate(a);
        const pl = 7 - hp * 3;
        const pw = 1.8;
        c.beginPath();
        c.moveTo(-pl, 0);
        c.quadraticCurveTo(0, -pw, pl, 0);
        c.quadraticCurveTo(0, pw * 0.4, -pl, 0);
        c.closePath();
        c.fillStyle = i % 2 ? '#ffe0eb' : '#ffa6c9';
        c.fill();
        c.restore();
      }
    }

    c.restore();
  }

  // ══════════════════════════════════════════════════════════
  // 繪製：全部特效
  // ══════════════════════════════════════════════════════════
  function drawAll(elapsed, active) {
    const c = ov.ctx;
    if (!c) return;
    const root = getRoot();
    if (!root) return;
    const W = getW(), H = getH();
    const dpr = ov.canvas.width / Math.max(1, W);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    if (!active) return;

    const balls = root.balls || [];

    // 樱吹雪全場濾鏡
    for (const b of balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== TYPE) continue;
      if (!b.sakuraFullBloomActive) continue;
      c.save();
      const bloomPulse = 0.10 + 0.05 * Math.sin(elapsed * 3);
      const grad = c.createRadialGradient(b.x, b.y, 20, b.x, b.y, Math.max(W, H) * 0.85);
      grad.addColorStop(0, `rgba(255,166,201,${bloomPulse + 0.06})`);
      grad.addColorStop(0.6, `rgba(255,166,201,${bloomPulse})`);
      grad.addColorStop(1, 'rgba(255,166,201,0)');
      c.fillStyle = grad;
      c.fillRect(0, 0, W, H);
      for (let i = 0; i < 24; i++) {
        const t = (elapsed * 0.45 + i * 0.137) % 1;
        const px = ((i * 137) % W) + Math.sin(elapsed * 2 + i) * 20;
        const py = t * H;
        c.globalAlpha = 0.55 * (1 - t);
        c.fillStyle = i % 2 ? '#ffd6e6' : '#ffa6c9';
        c.beginPath();
        c.ellipse(px, py, 4, 2.2, elapsed + i, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    // 千本櫻範圍虛線圈
    for (const b of balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== TYPE) continue;
      if (b.sakuraFullBloomActive) continue;
      c.save();
      const radius = getRadius(b) * SENBON_RADIUS_MULT;
      const pulse = 0.35 + 0.2 * Math.sin(elapsed * 4);
      c.beginPath();
      c.arc(b.x, b.y, radius, 0, Math.PI * 2);
      c.fillStyle = `rgba(255,166,201,${0.05 + pulse * 0.04})`;
      c.fill();
      c.strokeStyle = `rgba(255,166,201,${0.45 + pulse * 0.25})`;
      c.lineWidth = 1.5;
      c.setLineDash([6, 5]);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }

    // 落櫻繽紛領域
    if (root.sakuraFubunZones) {
      for (const z of root.sakuraFubunZones) {
        c.save();
        const fade = Math.min(1, z.life / 0.6);
        const pulse = 0.5 + 0.3 * Math.sin(elapsed * 6);
        c.beginPath();
        c.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
        c.fillStyle = `rgba(255,166,201,${0.13 * fade + 0.05 * pulse})`;
        c.fill();
        c.strokeStyle = `rgba(255,214,230,${0.55 * fade})`;
        c.lineWidth = 2;
        c.setLineDash([8, 6]);
        c.stroke();
        c.setLineDash([]);
        for (let i = 0; i < 8; i++) {
          const t = (elapsed * 0.6 + i * 0.23) % 1;
          const px = z.x + Math.cos(i * 1.7) * z.radius * 0.6;
          const py = z.y - z.radius * 0.6 + t * z.radius * 1.2;
          c.globalAlpha = fade * (1 - t);
          c.fillStyle = '#ffd6e6';
          c.beginPath();
          c.ellipse(px, py, 3.5, 2, elapsed + i, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
    }

    // 每顆櫻
    for (const b of balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== TYPE) continue;
      const petals = Math.min(PETAL_MAX, b.sakuraPetals || 0);
      const bR = getRadius(b);

      drawThrust(c, b, bR);

      if (petals > 0) {
        c.save();
        const spin = elapsed * 1.4;
        const orbitR = bR + 14 + petals * 0.7;
        for (let i = 0; i < petals; i++) {
          const angle = spin + (i / petals) * Math.PI * 2;
          const rWob = orbitR + Math.sin(spin * 1.8 + i) * 3;
          const px = b.x + Math.cos(angle) * rWob;
          const py = b.y + Math.sin(angle) * rWob;
          c.save();
          c.translate(px, py);
          c.rotate(angle + Math.PI / 2);
          c.globalAlpha = 0.9;
          c.fillStyle = i % 3 === 0 ? '#ffe0eb' : '#ffa6c9';
          c.shadowColor = '#ff8fb3';
          c.shadowBlur = 6;
          c.beginPath();
          c.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }
        c.restore();

        c.save();
        c.font = 'bold 10px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'bottom';
        c.fillStyle = '#ffe0eb';
        c.shadowColor = '#000'; c.shadowBlur = 3;
        c.fillText(`🌸${petals}/${PETAL_MAX}`, b.x, b.y - bR - 8);
        c.restore();
      }

      if ((b.sakuraYaeCharges || 0) < YAE_MAX) {
        c.save();
        c.font = 'bold 9px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'top';
        c.fillStyle = b.sakuraYaeRecharging ? '#8b5a9c' : '#ff8fb3';
        c.shadowColor = '#000'; c.shadowBlur = 2;
        const label = b.sakuraYaeRecharging
          ? `八重櫻 重充 ${Math.ceil(b.sakuraYaeRechargeTimer)}s`
          : `八重櫻 ${b.sakuraYaeCharges}/${YAE_MAX}`;
        c.fillText(label, b.x, b.y + bR + 8);
        c.restore();
      }
    }

    // 櫻印標記
    for (const b of balls) {
      if (!b || b.hp <= 0 || !(b.sakuraMarkedTimer > 0)) continue;
      c.save();
      const pulse = 0.6 + 0.4 * Math.sin(elapsed * 8);
      c.translate(b.x, b.y);
      c.rotate(elapsed * 0.8);
      c.fillStyle = `rgba(255,143,179,${0.75 * pulse})`;
      c.shadowColor = '#ff8fb3'; c.shadowBlur = 10;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        c.beginPath();
        c.ellipse(Math.cos(a) * 12, Math.sin(a) * 12, 7, 4, a, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#ffe0eb';
      c.beginPath(); c.arc(0, 0, 3, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  }

  // ══════════════════════════════════════════════════════════
  // 主迴圈
  // ══════════════════════════════════════════════════════════
  function cleanupRoot(root) {
    if (!root) return;
    delete root.sakuraFubunZones;
  }

  function isBattleActive() {
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen) return false;
    if (window.getComputedStyle(gameScreen).display === 'none') return false;
    const overlay = document.getElementById('overlay');
    if (overlay && overlay.classList.contains('show')) return false;
    return true;
  }

  function frame(t) {
    const root = getRoot();

    if (root !== ov.lastRoot) {
      cleanupRoot(ov.lastRoot);
      ov.lastRoot = root;
    }

    if (!root || !Array.isArray(root.balls)) {
      syncOverlay(false);
      requestAnimationFrame(frame);
      return;
    }

    if (!isBattleActive()) {
      syncOverlay(false);
      ov.lastTime = t;
      requestAnimationFrame(frame);
      return;
    }

    const dt = Math.min(0.05, Math.max(0, (t - (ov.lastTime || t)) / 1000));
    ov.lastTime = t;

    const elapsed = root.elapsed || (t / 1000);

    const sakuras = root.balls.filter(b => b && b.hp > 0 && b.char && b.char.type === TYPE);
    for (const b of sakuras) {
      ensureState(b);
      installYaeShield(b);
      updateSakuraLogic(b, dt, root);
    }

    updateFubunZones(dt, root);
    updateMarks(dt, root);

    const deadPlayers = new Set();
    for (const b of root.balls) {
      if (b && b.char && b.char.type === TYPE && b.hp <= 0) deadPlayers.add(b.player);
    }
    if (deadPlayers.size && root.sakuraFubunZones) {
      root.sakuraFubunZones = root.sakuraFubunZones.filter(z => !deadPlayers.has(z.owner));
    }

    const active = sakuras.length > 0
      || (root.sakuraFubunZones && root.sakuraFubunZones.length > 0)
      || root.balls.some(b => b && b.sakuraMarkedTimer > 0);

    syncOverlay(active);
    drawAll(elapsed, active);

    requestAnimationFrame(frame);
  }

  function start() {
    setupOverlay();
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
