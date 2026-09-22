/**
 * sakura.js — 櫻🌸 外部擴充模組（完整改良版）
 *
 * 依賴：
 *   - character_constants.js 需提供 SAKURA_* 常數
 *   - character_roster.js 需提供 { id:'sakura', type:'sakura', ... } 條目
 *   - index.html 只需加入 <script src="sakura.js"></script>
 *
 * 本版改良：
 *   1. 普攻改為近戰刺擊（線段判定，非飛行投射物）
 *   2. 加入 isBattleActive 守門，退出／結算時完全停止邏輯與音效
 *   3. 常數單一來源（character_constants.js），缺少時明確報錯停用
 */
(function () {
  'use strict';

  const TYPE = 'sakura';

  // ══════════════════════════════════════════════════════════
  // 常數來源：character_constants.js（唯一）
  // ══════════════════════════════════════════════════════════
  const REQUIRED_CONSTANTS = [
    'SAKURA_PETAL_MAX',
    'SAKURA_SENBON_TICK_INTERVAL',
    'SAKURA_SENBON_BASE_DAMAGE',
    'SAKURA_SENBON_DAMAGE_PER_3_PETALS',
    'SAKURA_SENBON_RADIUS_MULT',
    'SAKURA_SENBON_SLOW_FACTOR',
    'SAKURA_SENBON_SLOW_DURATION',
    'SAKURA_YAE_DAMAGE_REDUCE',
    'SAKURA_YAE_MAX_CHARGES',
    'SAKURA_YAE_RECHARGE_TIME',
    'SAKURA_YAE_RECHARGE_PER_PETAL',
    'SAKURA_BASIC_DAMAGE',
    'SAKURA_BASIC_INTERVAL',
    'SAKURA_BASIC_SPEED',
    'SAKURA_FUBUN_RADIUS_MULT',
    'SAKURA_FUBUN_DURATION',
    'SAKURA_FUBUN_CD',
    'SAKURA_FUBUN_TICK_INTERVAL',
    'SAKURA_MARK_DURATION',
    'SAKURA_MARK_CD',
    'SAKURA_MARK_DAMAGE_AMP',
    'SAKURA_FULL_BLOOM_DURATION',
    'SAKURA_FULL_BLOOM_CD',
    'SAKURA_FULL_BLOOM_SPEED_MULT',
    'SAKURA_FULL_BLOOM_TICK_INTERVAL',
    'SAKURA_FULL_BLOOM_DURATION_PER_PETAL',
  ];
  const missingConstants = REQUIRED_CONSTANTS.filter(name => {
    try { return (0, eval)(`typeof ${name}`) === 'undefined'; }
    catch (_) { return true; }
  });
  if (missingConstants.length) {
    console.error(
      '[sakura.js] 找不到櫻的常數，請先把常數補丁貼進 character_constants.js：\n  ' +
      missingConstants.join('\n  ')
    );
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

  // ── 刺擊參數（純本檔內部，屬於「表現形式」而非角色數值）──
  const THRUST_LENGTH          = 110;   // 從本體中心向前延伸的判定長度
  const THRUST_HALF_WIDTH      = 18;    // 判定線段的半寬（總寬 36）
  const THRUST_ANIM_DURATION   = 0.22;  // 刺出→收回動畫時長

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
    try {
      if (typeof isBallInBossDryPowderZone === 'function') return isBallInBossDryPowderZone(b);
    } catch (_) {}
    return false;
  }
  function applyDmg(target, dmg, options) {
    try {
      if (typeof dealDamage === 'function') { dealDamage(target, dmg, options || {}); return; }
    } catch (_) {}
    if (target && Number.isFinite(target.hp)) target.hp = Math.max(0, target.hp - dmg);
  }
  function applyStatusSafe(target, effect) {
    try {
      if (typeof applyStatus === 'function') { applyStatus(target, effect); return; }
    } catch (_) {}
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

  // 櫻印：櫻對持有印記者的傷害 ×(1 + MARK_AMP)
  function sakuraDamage(ownerPlayer, ownerBall, target, base) {
    let dmg = base;
    if (target && target.sakuraMarkedTimer > 0 && target.sakuraMarkedOwnerPlayer === ownerPlayer) {
      dmg *= 1 + MARK_AMP;
    }
    return dmg;
  }

  // 點到線段的最短距離（刺擊判定）
  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
    const cx = x1 + dx * t, cy = y1 + dy * t;
    return Math.hypot(px - cx, py - cy);
  }

  // ══════════════════════════════════════════════════════════
  // 狀態初始化（懒初始化）
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
  // 八重櫻減傷：攔截 hp setter
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
    try {
      if (typeof hasStatusEffect === 'function' && hasStatusEffect(b, 'cooldownFreeze')) return true;
    } catch (_) {}
    return false;
  }

  // 近戰刺擊：判定 + 啟動動畫
  function performThrust(b, enemy) {
    const angle = Math.atan2(enemy.y - b.y, enemy.x - b.x);
    b._sakuraThrustAngle = angle;
    b._sakuraThrustAnim = THRUST_ANIM_DURATION;
    b._sakuraThrustAnimMax = THRUST_ANIM_DURATION;
    b._sakuraThrustHit = false;
    b._sakuraThrustHits = new Set();
    b.sakuraBasicTimer = BASIC_INTERVAL;

    // 從本體中心沿 angle 方向延伸 THRUST_LENGTH 的線段判定
    const x1 = b.x, y1 = b.y;
    const x2 = b.x + Math.cos(angle) * THRUST_LENGTH;
    const y2 = b.y + Math.sin(angle) * THRUST_LENGTH;

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

  // 刺擊動畫推進（純視覺）
  function tickThrustAnim(b, dt) {
    if (b._sakuraThrustAnim > 0) {
      b._sakuraThrustAnim -= dt;
      if (b._sakuraThrustAnim < 0) b._sakuraThrustAnim = 0;
    }
  }

  function updateSakuraLogic(b, dt, root) {
    if (isFrozen(b, root)) return;

    b.sakuraPetals = Math.max(0, Math.min(PETAL_MAX, b.sakuraPetals || 0));

    // 八重櫻充能恢復
    if (b.sakuraYaeRecharging) {
      b.sakuraYaeRechargeTimer -= dt;
      if (b.sakuraYaeRechargeTimer <= 0) {
        b.sakuraYaeRecharging = false;
        b.sakuraYaeRechargeTimer = 0;
        b.sakuraYaeCharges = YAE_MAX;
        pushFlash(b.x, b.y, 40, '#ffe0eb', 0.5);
      }
    }

    // 被動千本櫻（樱吹雪期間停用近距離 tick）
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

    // 刺擊動畫推進
    tickThrustAnim(b, dt);

    const enemy = getNearestEnemyTo(b.x, b.y, b.player);

    // 普攻：花刃刺擊
    if (b.sakuraBasicTimer > 0) b.sakuraBasicTimer -= dt;
    if (enemy && b.sakuraBasicTimer <= 0) {
      const reach = THRUST_LENGTH + getRadius(b) + getRadius(enemy);
      if (Math.hypot(enemy.x - b.x, enemy.y - b.y) <= reach) {
        performThrust(b, enemy);
      }
    }

    // 技能一：落櫻繽紛
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

    // 技能二：櫻印
    if (b.sakuraMarkTimer > 0) b.sakuraMarkTimer -= dt;
    if (enemy && b.sakuraMarkTimer <= 0) {
      b.sakuraMarkTimer = MARK_CD;
      enemy.sakuraMarkedTimer = MARK_DURATION;
      enemy.sakuraMarkedOwnerPlayer = b.player;
      b.sakuraPetals = Math.min(PETAL_MAX, b.sakuraPetals + 1);
      pushFlash(enemy.x, enemy.y, 36, '#ff8fb3', 0.4);
    }

    // 滿開：樱吹雪
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
      // 樱吹雪加速：主引擎已依原速度移動一次，這裡再補一次相同位移 ≈ 總位移 2 倍。
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

  // 落櫻繽紛領域
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

  // 櫻印計時器
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
  const ov = {
    canvas: null,
    ctx: null,
    lastRoot: null,
    lastTime: 0
  };

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
  // 繪製
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

    // 樱吹雪全場粉色濾鏡
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

    // 千本櫻範圍虛線圈（樱吹雪期間不畫）
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

    // 每顆櫻的個別特效
    for (const b of balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== TYPE) continue;
      const petals = Math.min(PETAL_MAX, b.sakuraPetals || 0);
      const bR = getRadius(b);

      // 刺擊動畫
      if (b._sakuraThrustAnim > 0 && b._sakuraThrustAnimMax > 0) {
        const t = 1 - b._sakuraThrustAnim / b._sakuraThrustAnimMax;
        let extend;
        if (t < 0.4) {
          extend = Math.sin((t / 0.4) * Math.PI * 0.5);
        } else {
          extend = Math.cos(((t - 0.4) / 0.6) * Math.PI * 0.5);
        }
        const reach = bR + THRUST_LENGTH * extend;
        const fade = 1 - Math.max(0, (t - 0.5) / 0.5) * 0.5;

        c.save();
        c.translate(b.x, b.y);
        c.rotate(b._sakuraThrustAngle);
        c.globalCompositeOperation = 'lighter';

        // 外層光暈
        c.globalAlpha = 0.35 * fade;
        c.fillStyle = '#ffd6e6';
        c.beginPath();
        c.moveTo(bR * 0.3, -THRUST_HALF_WIDTH * 1.6);
        c.lineTo(reach + 12, -3);
        c.lineTo(reach + 22, 0);
        c.lineTo(reach + 12, 3);
        c.lineTo(bR * 0.3, THRUST_HALF_WIDTH * 1.6);
        c.closePath();
        c.fill();

        // 主體花瓣尖刺
        c.globalAlpha = 0.95 * fade;
        c.fillStyle = '#ffa6c9';
        c.shadowColor = '#ff8fb3';
        c.shadowBlur = 14;
        c.beginPath();
        c.moveTo(bR * 0.4, -THRUST_HALF_WIDTH * 0.9);
        c.lineTo(reach, -4);
        c.lineTo(reach + 16, 0);
        c.lineTo(reach, 4);
        c.lineTo(bR * 0.4, THRUST_HALF_WIDTH * 0.9);
        c.closePath();
        c.fill();

        // 內層亮芯
        c.globalAlpha = 1;
        c.fillStyle = '#ffe0eb';
        c.shadowBlur = 8;
        c.beginPath();
        c.moveTo(bR * 0.5, -3);
        c.lineTo(reach + 4, -1);
        c.lineTo(reach + 10, 0);
        c.lineTo(reach + 4, 1);
        c.lineTo(bR * 0.5, 3);
        c.closePath();
        c.fill();

        // 沿刺擊方向的殘影花瓣
        c.globalAlpha = 0.55 * fade;
        c.fillStyle = '#ff8fb3';
        for (let i = 1; i <= 3; i++) {
          const px = bR * 0.4 + (reach - bR * 0.4) * (i / 4);
          const py = Math.sin(i * 1.4) * 4;
          c.beginPath();
          c.ellipse(px, py, 6 - i * 0.6, 3 - i * 0.3, 0, 0, Math.PI * 2);
          c.fill();
        }

        // 命中綻放
        if (b._sakuraThrustHit && t > 0.35 && t < 0.75) {
          const flash = Math.sin(((t - 0.35) / 0.4) * Math.PI);
          c.globalAlpha = flash * 0.9;
          c.fillStyle = '#fff0f5';
          c.shadowColor = '#ffa6c9'; c.shadowBlur = 20;
          c.beginPath();
          c.arc(reach + 6, 0, 8 + flash * 10, 0, Math.PI * 2);
          c.fill();
          c.globalAlpha = flash * 0.7;
          c.strokeStyle = '#ffd6e6'; c.lineWidth = 2;
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            c.beginPath();
            c.moveTo(reach + 6, 0);
            c.lineTo(reach + 6 + Math.cos(a) * (14 + flash * 10), Math.sin(a) * (14 + flash * 10));
            c.stroke();
          }
        }

        c.restore();
      }

      // 花瓣環繞
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

      // 八重櫻充能
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

  // 判斷戰鬥畫面是否仍在顯示：
  //   - 選角畫面顯示中（game-screen 被隱藏）→ 不是戰鬥
  //   - 結算 overlay 顯示中（已分出勝負）→ 不是戰鬥
  // 這兩種情況都必須完全停掉櫻的邏輯與音效，否則退出後仍會一直響攻擊音。
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

    // 新對局：清空舊場地的殘留
    if (root !== ov.lastRoot) {
      cleanupRoot(ov.lastRoot);
      ov.lastRoot = root;
    }

    if (!root || !Array.isArray(root.balls)) {
      syncOverlay(false);
      requestAnimationFrame(frame);
      return;
    }

    // 不在戰鬥畫面：整段跳過邏輯與繪製，只維持迴圈存活
    if (!isBattleActive()) {
      syncOverlay(false);
      // 重置計時基準，避免下次進戰鬥時 dt 暴衝
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

    // 該玩家死亡時清掉他的領域
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
