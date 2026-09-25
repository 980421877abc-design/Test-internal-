/**
 * boshi.js — 博士📡 外部擴充模組（粉紫配色）
 *
 * 依賴：
 *   - character_constants.js 需提供 BOSHI_* 常數
 *   - character_roster.js 需提供 { id:'boshi', type:'boshi', ... } 條目
 *   - index.html 只需加入 <script src="boshi.js"></script>
 *
 * 配色：
 *   主色 #c77dff（粉紫）／亮色 #e8b3ff／深紫 #7a2cb8
 *   爆擊閃電 #ff9fe0 + #ffe0f8
 */
(function () {
  'use strict';

  const TYPE = 'boshi';

  // ── 配色 ──
  const COLOR_MAIN     = '#c77dff';
  const COLOR_LIGHT    = '#e8b3ff';
  const COLOR_DEEP     = '#7a2cb8';
  const COLOR_CRIT     = '#ff9fe0';
  const COLOR_CRIT_CORE= '#ffe0f8';
  const COLOR_SHIELD   = '#e8b3ff';

  // ══════════════════════════════════════════════════════════
  // 常數來源
  // ══════════════════════════════════════════════════════════
  const REQUIRED_CONSTANTS = [
    'BOSHI_CRIT_CHANCE', 'BOSHI_CRIT_MULT', 'BOSHI_CRIT_LIGHTNING_DMG', 'BOSHI_CRIT_LIGHTNING_PARA',
    'BOSHI_ORB_COUNT', 'BOSHI_ORB_RADIUS', 'BOSHI_ORB_LASER_INTERVAL', 'BOSHI_ORB_LASER_DAMAGE',
    'BOSHI_ORB_LASER_SPEED', 'BOSHI_ORB_LASER_LIFE', 'BOSHI_ORB_ROTATE_SPEED',
    'BOSHI_SHIELD_MAX', 'BOSHI_SHIELD_REDUCE',
    'BOSHI_EM_FIELD_RADIUS', 'BOSHI_EM_FIELD_DURATION', 'BOSHI_EM_FIELD_CD',
    'BOSHI_EM_FIELD_THROW_SPEED', 'BOSHI_EM_FIELD_MAX_DIST', 'BOSHI_EM_FIELD_DPS', 'BOSHI_EM_FIELD_RING_TOL',
    'BOSHI_QUANTUM_CD', 'BOSHI_QUANTUM_STUN', 'BOSHI_QUANTUM_DURATION', 'BOSHI_QUANTUM_HALF_WIDTH',
    'BOSHI_QUANTUM_PULSE_CD', 'BOSHI_QUANTUM_PULSE_RATIO', 'BOSHI_QUANTUM_PULSE_DMG_CAP',
  ];
  const missingConstants = REQUIRED_CONSTANTS.filter(name => {
    try { return (0, eval)(`typeof ${name}`) === 'undefined'; }
    catch (_) { return true; }
  });
  if (missingConstants.length) {
    console.error('[boshi.js] 找不到博士的常數，請先把常數補丁貼進 character_constants.js：\n  ' +
      missingConstants.join('\n  '));
    return;
  }

  const CRIT_CHANCE        = BOSHI_CRIT_CHANCE;
  const CRIT_MULT          = BOSHI_CRIT_MULT;
  const CRIT_LIGHTNING_DMG = BOSHI_CRIT_LIGHTNING_DMG;
  const CRIT_LIGHTNING_PARA= BOSHI_CRIT_LIGHTNING_PARA;
  const ORB_COUNT          = BOSHI_ORB_COUNT;
  const ORB_RADIUS         = BOSHI_ORB_RADIUS;
  const ORB_LASER_INTERVAL = BOSHI_ORB_LASER_INTERVAL;
  const ORB_LASER_DAMAGE   = BOSHI_ORB_LASER_DAMAGE;
  const ORB_LASER_SPEED    = BOSHI_ORB_LASER_SPEED;
  const ORB_LASER_LIFE     = BOSHI_ORB_LASER_LIFE;
  const ORB_ROTATE_SPEED   = BOSHI_ORB_ROTATE_SPEED;
  const SHIELD_MAX         = BOSHI_SHIELD_MAX;
  const SHIELD_REDUCE      = BOSHI_SHIELD_REDUCE;
  const EM_RADIUS          = BOSHI_EM_FIELD_RADIUS;
  const EM_DURATION        = BOSHI_EM_FIELD_DURATION;
  const EM_CD              = BOSHI_EM_FIELD_CD;
  const EM_THROW_SPEED     = BOSHI_EM_FIELD_THROW_SPEED;
  const EM_MAX_DIST        = BOSHI_EM_FIELD_MAX_DIST;
  const EM_DPS             = BOSHI_EM_FIELD_DPS;
  const EM_RING_TOL        = BOSHI_EM_FIELD_RING_TOL;
  const QUANTUM_CD         = BOSHI_QUANTUM_CD;
  const QUANTUM_STUN       = BOSHI_QUANTUM_STUN;
  const QUANTUM_DURATION   = BOSHI_QUANTUM_DURATION;
  const QUANTUM_HALF_WIDTH = BOSHI_QUANTUM_HALF_WIDTH;
  const QUANTUM_PULSE_CD   = BOSHI_QUANTUM_PULSE_CD;
  const QUANTUM_PULSE_RATIO= BOSHI_QUANTUM_PULSE_RATIO;
  const QUANTUM_PULSE_CAP  = BOSHI_QUANTUM_PULSE_DMG_CAP;

  // ══════════════════════════════════════════════════════════
  // 工具
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
  function getRadius(b) {
    const r = Number(b && b.r);
    if (Number.isFinite(r) && r > 0) return r;
    try { return (typeof RADIUS !== 'undefined') ? RADIUS : 25; } catch (_) { return 25; }
  }
  function getAllTargets() {
    try { if (typeof getAllCombatTargets === 'function') return getAllCombatTargets(); } catch (_) {}
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
  function playHit(type) {
    try { if (typeof playHitSound === 'function') playHitSound(type); } catch (_) {}
  }
  function pushFlash(x, y, r, color, t) {
    const root = getRoot();
    if (!root || !root.hitFlashes) return;
    root.hitFlashes.push({ x, y, r, alpha: 1, color, t });
  }
  function applyStatusSafe(target, effect) {
    try { if (typeof applyStatus === 'function') { applyStatus(target, effect); return; } } catch (_) {}
    if (effect.id === 'slow') {
      target.curseSlowTimer = Math.max(target.curseSlowTimer || 0, effect.duration);
      target.curseSlowFactor = effect.strength;
    }
  }
  function applyDamageSafe(target, dmg, options) {
    try {
      if (typeof dealDamage === 'function') { dealDamage(target, dmg, options || {}); return; }
    } catch (_) {}
    if (target && Number.isFinite(target.hp)) target.hp = Math.max(0, target.hp - dmg);
  }

  // ══════════════════════════════════════════════════════════
  // 反投射物：統一清單
  // ══════════════════════════════════════════════════════════
  function getAllProjectileArrays() {
    const root = getRoot();
    if (!root) return [];
    const list = [];
    const push = (arr) => { if (Array.isArray(arr)) list.push({ arr }); };
    push(root.projectiles);
    push(root.otisMagicBullets);
    push(root.getoUltimateProjectiles);
    push(root.tigerNovaNeedles);
    push(root.oniichanSpikes);
    push(root.fisherOceanWaves);
    push(root.starSmallStars);
    push(root.curseSlashFX);
    push(root.curseFireFX);
    push(root.obitoFireballs);
    push(root.starBigStars);
    push(root.starMeteors);
    push(root.kashimoDeerOrbs);
    push(root.bossDryPowderExtinguishers);
    if (root.dioSteamroller) list.push({ arr: [root.dioSteamroller] });
    for (const b of (root.balls || [])) {
      if (!b) continue;
      if (Array.isArray(b.sansBones))           list.push({ arr: b.sansBones });
      if (Array.isArray(b.emBullets))           list.push({ arr: b.emBullets });
      if (Array.isArray(b.cannonBalls))         list.push({ arr: b.cannonBalls });
      if (Array.isArray(b.oniichanTrackBalls))  list.push({ arr: b.oniichanTrackBalls });
      if (Array.isArray(b.gojoBalls))           list.push({ arr: b.gojoBalls });
      if (Array.isArray(b.johnnyAct4Projectiles)) list.push({ arr: b.johnnyAct4Projectiles });
    }
    return list;
  }

  function getProjectileOwner(p) {
    if (!p) return null;
    if (p.owner != null) return p.owner;
    if (p.ownerBall && p.ownerBall.player != null) return p.ownerBall.player;
    return null;
  }

  function clearProjectilesIf(filterFn) {
    let count = 0;
    const arrays = getAllProjectileArrays();
    for (const entry of arrays) {
      const arr = entry.arr;
      if (!Array.isArray(arr)) continue;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        if (!p) continue;
        const owner = getProjectileOwner(p);
        if (filterFn(p, owner)) {
          if (typeof p.active === 'boolean') p.active = false;
          arr.splice(i, 1);
          count++;
        }
      }
    }
    return count;
  }

  // ══════════════════════════════════════════════════════════
  // 狀態初始化
  // ══════════════════════════════════════════════════════════
  function ensureState(b) {
    if (b._boshiInit) return;
    b._boshiInit = true;
    b.boshiShield         = SHIELD_MAX;
    b.boshiOrbAngle       = 0;
    b.boshiOrbLaserTimer  = ORB_LASER_INTERVAL;
    b.boshiEmCd           = EM_CD * 0.4;
    b.boshiQuantumCd      = QUANTUM_CD;
    b.boshiCritFlashTimer = 0;
  }

  // ══════════════════════════════════════════════════════════
  // 護盾：hook dealDamage
  // ══════════════════════════════════════════════════════════
  let hookedDealDamage = null;
  function tryHookDealDamage() {
    if (hookedDealDamage) return;
    if (typeof window.dealDamage !== 'function') return;
    hookedDealDamage = window.dealDamage;
    window.dealDamage = function (target, dmg, options) {
      const opts = options || {};
      if (target && target.char && target.char.type === TYPE) {
        const bypass = opts.bypassParry || opts.codeKill || opts.worldSlash || opts.otisSureHit;
        const protectedState = target.invincible || target.opmExecuted;
        const hasShield = (target.boshiShield || 0) > 0;
        const validDmg = Number.isFinite(dmg) && dmg > 0;
        if (!bypass && !protectedState && hasShield && validDmg) {
          target.boshiShield -= 1;
          dmg = dmg * (1 - SHIELD_REDUCE);
          const root = getRoot();
          if (root && root.hitFlashes) {
            root.hitFlashes.push({ x: target.x, y: target.y, r: 32, alpha: 1, color: COLOR_SHIELD, t: 0.3 });
          }
        }
      }
      return hookedDealDamage.call(this, target, dmg, options);
    };
    console.log('[boshi] dealDamage hooked');
  }

  // ══════════════════════════════════════════════════════════
  // 爆擊閃電
  // ══════════════════════════════════════════════════════════
  function applyCritLightning(b, target) {
    if (!target || target.hp <= 0) return;
    applyDamageSafe(target, CRIT_LIGHTNING_DMG, {
      attackerPlayer: b.player, attackerBall: b, boshiCritLightning: true
    });
    if (!(target.char && target.char.type === 'baie' && target.baieLoveActive)) {
      target.thunderParalyzed = Math.max(target.thunderParalyzed || 0, CRIT_LIGHTNING_PARA);
    }
    const root = getRoot();
    if (root && root.thunderStunFX) {
      root.thunderStunFX.push({ x: target.x, y: target.y, life: 0.3, maxLife: 0.3 });
    }
    // 記錄閃電特效（給 overlay 繪製）
    if (!root._boshiCritBolts) root._boshiCritBolts = [];
    root._boshiCritBolts.push({
      x: target.x, y: target.y,
      life: 0.45, maxLife: 0.45,
      seed: Math.random() * 1000,
    });
    pushFlash(target.x, target.y, 36, COLOR_CRIT, 0.3);
    if (b) b.boshiCritFlashTimer = 0.3;
  }

  // ══════════════════════════════════════════════════════════
  // 電球雷射
  // ══════════════════════════════════════════════════════════
  function fireOrbLasers(b, root) {
    if (!root._boshiLasers) root._boshiLasers = [];
    const enemies = getAllTargets().filter(t =>
      t && t.hp > 0 &&
      (t.player ?? t.ownerPlayer ?? t.owner) !== b.player &&
      !t.ewCamouflaged
    );
    if (enemies.length === 0) return;

    const sorted = enemies.slice().sort((a, c) => {
      const da = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
      const dc = (c.x - b.x) ** 2 + (c.y - b.y) ** 2;
      return da - dc;
    });

    for (let i = 0; i < ORB_COUNT; i++) {
      const target = sorted[i % sorted.length];
      if (!target) continue;
      const orbAngle = b.boshiOrbAngle + (i / ORB_COUNT) * Math.PI * 2;
      const ox = b.x + Math.cos(orbAngle) * ORB_RADIUS;
      const oy = b.y + Math.sin(orbAngle) * ORB_RADIUS;
      const angle = Math.atan2(target.y - oy, target.x - ox);
      const isCrit = Math.random() < CRIT_CHANCE;
      root._boshiLasers.push({
        x: ox, y: oy,
        vx: Math.cos(angle) * ORB_LASER_SPEED,
        vy: Math.sin(angle) * ORB_LASER_SPEED,
        owner: b.player,
        ownerBall: b,
        damage: isCrit ? ORB_LASER_DAMAGE * CRIT_MULT : ORB_LASER_DAMAGE,
        r: 6,
        life: ORB_LASER_LIFE,
        angle,
        isCrit,
      });
    }
    playHit('knife');
  }

  function updateOrbLasers(dt, root) {
    if (!root._boshiLasers) root._boshiLasers = [];
    const arr = root._boshiLasers;
    const W = getW(), H = getH();
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      if (!p) { arr.splice(i, 1); continue; }
      if (root.dioWorldGlobalActive && (!root.dioWorldCaster || p.owner !== root.dioWorldCaster.player)) continue;
      if (p.gojoSlowing) continue;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
        arr.splice(i, 1);
        continue;
      }

      let hit = false;
      for (const foe of getAllTargets()) {
        if (!foe || foe.hp <= 0) continue;
        if ((foe.player ?? foe.ownerPlayer ?? foe.owner) === p.owner) continue;
        if (foe.ewCamouflaged) continue;
        if (Math.hypot(foe.x - p.x, foe.y - p.y) < getRadius(foe) + p.r) {
          applyDamageSafe(foe, p.damage, { attackerPlayer: p.owner, attackerBall: p.ownerBall });
          if (p.isCrit) applyCritLightning(p.ownerBall, foe);
          pushFlash(foe.x, foe.y, p.isCrit ? 32 : 22, p.isCrit ? COLOR_CRIT : COLOR_MAIN, 0.22);
          hit = true;
          break;
        }
      }
      if (hit) arr.splice(i, 1);
    }
  }

  // ══════════════════════════════════════════════════════════
  // 電磁場裝置
  // ══════════════════════════════════════════════════════════
  function castEmField(b, root) {
    if (!root._boshiEmFields) root._boshiEmFields = [];
    const enemy = getNearestEnemyTo(b.x, b.y, b.player);
    if (!enemy) return;
    const angle = Math.atan2(enemy.y - b.y, enemy.x - b.x);
    const dist = Math.min(EM_MAX_DIST, Math.hypot(enemy.x - b.x, enemy.y - b.y));
    const tx = b.x + Math.cos(angle) * dist;
    const ty = b.y + Math.sin(angle) * dist;
    root._boshiEmFields.push({
      owner: b.player,
      ownerBall: b,
      x: tx, y: ty,
      radius: EM_RADIUS,
      life: EM_DURATION,
      maxLife: EM_DURATION,
      tickTimer: 0,
      enterFlags: Object.create(null),
    });
    pushFlash(tx, ty, EM_RADIUS, COLOR_MAIN, 0.35);
    playHit('knife');
  }

  function updateEmFields(dt, root) {
    if (!root._boshiEmFields) root._boshiEmFields = [];
    const arr = root._boshiEmFields;
    for (let i = arr.length - 1; i >= 0; i--) {
      const f = arr[i];
      if (!f) { arr.splice(i, 1); continue; }
      if (root.dioWorldGlobalActive && (!root.dioWorldCaster || f.owner !== root.dioWorldCaster.player)) continue;
      f.life -= dt;
      if (f.life <= 0) { arr.splice(i, 1); continue; }

      // 消除敵人投射物（碰到邊緣）
      clearProjectilesIf((p, owner) => {
        if (owner === f.owner) return false;
        const d = Math.hypot(p.x - f.x, p.y - f.y);
        return d >= f.radius - EM_RING_TOL && d <= f.radius + EM_RING_TOL;
      });

      // 敵人進入場內：每秒 10 傷（不爆擊）
      for (const foe of getAllTargets()) {
        if (!foe || foe.hp <= 0) continue;
        if ((foe.player ?? foe.ownerPlayer ?? foe.owner) === f.owner) continue;
        if (Math.hypot(foe.x - f.x, foe.y - f.y) <= f.radius + getRadius(foe)) {
          f.tickTimer -= dt;
          if (f.tickTimer <= 0) {
            f.tickTimer += 1.0;
            applyDamageSafe(foe, EM_DPS, { attackerPlayer: f.owner, attackerBall: f.ownerBall, continuousDamage: true });
            pushFlash(foe.x, foe.y, 16, COLOR_MAIN, 0.22);
          }
        }
      }

      // 博士本人進入 +1 層護盾（每個場地只加一次）
      const owner = f.ownerBall;
      if (owner && owner.hp > 0 && !f.enterFlags.owner) {
        if (Math.hypot(owner.x - f.x, owner.y - f.y) <= f.radius + getRadius(owner)) {
          f.enterFlags.owner = true;
          owner.boshiShield = Math.min(SHIELD_MAX, (owner.boshiShield || 0) + 1);
          pushFlash(owner.x, owner.y, 30, COLOR_LIGHT, 0.4);
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 量子躍遷器
  // ══════════════════════════════════════════════════════════
  function castQuantum(b, root) {
    if (!root._boshiQuanta) root._boshiQuanta = [];
    const enemy = getNearestEnemyTo(b.x, b.y, b.player);
    if (!enemy) return;
    const angle = Math.atan2(enemy.y - b.y, enemy.x - b.x);

    // 瞬移到敵人旁
    const stopDist = getRadius(b) + getRadius(enemy) + 8;
    const tx = enemy.x - Math.cos(angle) * stopDist;
    const ty = enemy.y - Math.sin(angle) * stopDist;
    const fromX = b.x, fromY = b.y;
    b.x = tx; b.y = ty;
    b.vx = 0; b.vy = 0;
    pushFlash(tx, ty, 42, COLOR_MAIN, 0.4);

    // 構造矩形領域：
    //   方向 = angle（博士→敵人），長度貫穿場地兩端
    //   寬度 = 2 × QUANTUM_HALF_WIDTH
    //   起點 = 領域方向反向延伸至牆邊，終點 = 正向延伸至牆邊
    const W = getW(), H = getH();
    const halfW = QUANTUM_HALF_WIDTH;
    const ux = Math.cos(angle), uy = Math.sin(angle);
    // 從博士位置往回推到牆邊（負方向）
    let backT = Infinity;
    if (ux > 0) backT = Math.min(backT, (0 - b.x) / ux);
    else if (ux < 0) backT = Math.min(backT, (W - b.x) / ux);
    if (uy > 0) backT = Math.min(backT, (0 - b.y) / uy);
    else if (uy < 0) backT = Math.min(backT, (H - b.y) / uy);
    if (!isFinite(backT)) backT = -Math.hypot(W, H);
    // 從博士位置往前推到牆邊（正方向）
    let forwardT = Infinity;
    if (ux > 0) forwardT = Math.min(forwardT, (W - b.x) / ux);
    else if (ux < 0) forwardT = Math.min(forwardT, (0 - b.x) / ux);
    if (uy > 0) forwardT = Math.min(forwardT, (H - b.y) / uy);
    else if (uy < 0) forwardT = Math.min(forwardT, (0 - b.y) / uy);
    if (!isFinite(forwardT)) forwardT = Math.hypot(W, H);

    const startX = b.x + ux * backT;
    const startY = b.y + uy * backT;
    const endX   = b.x + ux * forwardT;
    const endY   = b.y + uy * forwardT;

    const zone = {
      owner: b.player,
      ownerBall: b,
      angle,
      ux, uy,
      startX, startY,
      endX, endY,
      halfWidth: halfW,
      life: QUANTUM_DURATION,
      maxLife: QUANTUM_DURATION,
      pulseTimer: 0,
      // 傷害累積池：每 1 秒結算一次
      damagePool: 0,
      pulseCount: 0,
      pulses: [], // 目前的脈衝掃描特效
    };
    root._boshiQuanta.push(zone);

    // 生成時：領域內敵人麻痺 1 秒 + 清除所有敵方投射物
    for (const foe of getAllTargets()) {
      if (!foe || foe.hp <= 0) continue;
      if ((foe.player ?? foe.ownerPlayer ?? foe.owner) === b.player) continue;
      if (isPointInQuantumZone(foe.x, foe.y, zone, getRadius(foe))) {
        if (!(foe.char && foe.char.type === 'baie' && foe.baieLoveActive)) {
          foe.thunderParalyzed = Math.max(foe.thunderParalyzed || 0, QUANTUM_STUN);
          foe.vx = 0; foe.vy = 0;
        }
      }
    }
    clearProjectilesIf((p, owner) => owner !== b.player);

    pushFlash(tx, ty, 42, COLOR_MAIN, 0.5);
    playHit('opm');
  }

  // 點是否在矩形領域內（含半寬與目標半徑）
  function isPointInQuantumZone(px, py, zone, extraR = 0) {
    const dx = px - zone.startX;
    const dy = py - zone.startY;
    const along = dx * zone.ux + dy * zone.uy;         // 投影到長軸
    const perp  = dx * -zone.uy + dy * zone.ux;        // 投影到短軸
    const len = Math.hypot(zone.endX - zone.startX, zone.endY - zone.startY);
    if (along < -extraR || along > len + extraR) return false;
    if (Math.abs(perp) > zone.halfWidth + extraR) return false;
    return true;
  }

  function updateQuantum(dt, root) {
    if (!root._boshiQuanta) root._boshiQuanta = [];
    const arr = root._boshiQuanta;
    for (let i = arr.length - 1; i >= 0; i--) {
      const z = arr[i];
      if (!z) { arr.splice(i, 1); continue; }
      if (root.dioWorldGlobalActive && (!root.dioWorldCaster || z.owner !== root.dioWorldCaster.player)) continue;
      z.life -= dt;
      if (z.life <= 0) { arr.splice(i, 1); continue; }

      // 脈衝計時
      z.pulseTimer -= dt;
      if (z.pulseTimer <= 0) {
        z.pulseTimer += QUANTUM_PULSE_CD;
        // 結算上一秒累積的傷害 ×10%
        const pulseDmg = Math.min(QUANTUM_PULSE_CAP, z.damagePool * QUANTUM_PULSE_RATIO);
        if (pulseDmg > 0) {
          for (const foe of getAllTargets()) {
            if (!foe || foe.hp <= 0) continue;
            if ((foe.player ?? foe.ownerPlayer ?? foe.owner) === z.owner) continue;
            if (isPointInQuantumZone(foe.x, foe.y, z, getRadius(foe))) {
              applyDamageSafe(foe, pulseDmg, { attackerPlayer: z.owner, attackerBall: z.ownerBall });
              pushFlash(foe.x, foe.y, 24, COLOR_LIGHT, 0.3);
            }
          }
        }
        z.damagePool = 0;
        z.pulseCount += 1;
        // 脈衝掃描特效：從領域起點牆掃到終點牆
        z.pulses.push({
          t: 0,
          life: QUANTUM_PULSE_CD * 0.9,
          maxLife: QUANTUM_PULSE_CD * 0.9,
        });
      }

      // 推進脈衝掃描特效
      for (let pi = z.pulses.length - 1; pi >= 0; pi--) {
        const pl = z.pulses[pi];
        pl.t += dt / pl.life;
        if (pl.t >= 1) z.pulses.splice(pi, 1);
      }

      // 領域內隊友位置造成的傷害累積 → 走 hook
      // 由 hookDamageForPool 攔截，這裡不做事
    }
  }

  // ══════════════════════════════════════════════════════════
  // 領域傷害累積：hook dealDamage
  //   - 攻擊者位置在量子領域內 → 累積到該領域的 damagePool
  //   - 博士或隊友都算
  //   - 排除領域自己的脈衝傷害（避免自我循環）
  // ══════════════════════════════════════════════════════════
  let hookedDealDamageForPool = null;
  function tryHookDamageForPool() {
    if (hookedDealDamageForPool) return;
    if (typeof window.dealDamage !== 'function') return;
    hookedDealDamageForPool = window.dealDamage;
    window.dealDamage = function (target, dmg, options) {
      const opts = options || {};
      const root = getRoot();
      // 只累積：有 attackerBall 且傷害 > 0 且不是領域脈衝
      if (root && root._boshiQuanta && opts.attackerBall && !opts.boshiPulseDamage && Number.isFinite(dmg) && dmg > 0) {
        const attacker = opts.attackerBall;
        for (const z of root._boshiQuanta) {
          // 攻擊者必須是博士的隊友
          if (attacker.player !== z.owner) continue;
          // 攻擊者位置要在領域內
          if (!isPointInQuantumZone(attacker.x, attacker.y, z, getRadius(attacker))) continue;
          z.damagePool += dmg;
        }
      }
      return hookedDealDamageForPool.call(this, target, dmg, options);
    };
  }

  // ══════════════════════════════════════════════════════════
  // 主邏輯
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

  function updateBoshiLogic(b, dt, root) {
    if (isFrozen(b, root)) return;

    // 電球旋轉
    b.boshiOrbAngle += dt * ORB_ROTATE_SPEED;

    // 電球雷射：間隔到齊射
    b.boshiOrbLaserTimer -= dt;
    if (b.boshiOrbLaserTimer <= 0) {
      b.boshiOrbLaserTimer += ORB_LASER_INTERVAL;
      fireOrbLasers(b, root);
    }

    // 技能一：電磁場
    if (b.boshiEmCd > 0) b.boshiEmCd -= dt;
    if (b.boshiEmCd <= 0) {
      const enemy = getNearestEnemyTo(b.x, b.y, b.player);
      if (enemy) {
        castEmField(b, root);
        b.boshiEmCd = EM_CD;
      }
    }

    // 技能二：量子躍遷器
    if (b.boshiQuantumCd > 0) b.boshiQuantumCd -= dt;
    if (b.boshiQuantumCd <= 0) {
      const enemy = getNearestEnemyTo(b.x, b.y, b.player);
      if (enemy) {
        castQuantum(b, root);
        b.boshiQuantumCd = QUANTUM_CD;
      }
    }

    // 爆擊閃光計時
    if (b.boshiCritFlashTimer > 0) b.boshiCritFlashTimer -= dt;
  }

  // ══════════════════════════════════════════════════════════
  // Overlay
  // ══════════════════════════════════════════════════════════
  const ov = { canvas: null, ctx: null, lastRoot: null, lastTime: 0 };

  function setupOverlay() {
    if (ov.canvas && document.body.contains(ov.canvas)) return;
    const c = document.createElement('canvas');
    c.id = 'boshi-overlay';
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

  // 畫一條鋸齒狀閃電從 (x1,y1) 到 (x2,y2)
  function drawLightning(c, x1, y1, x2, y2, seed, width, color, coreColor) {
    const segs = 7;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const perpX = -dy / len, perpY = dx / len;
    c.beginPath();
    c.moveTo(x1, y1);
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const jitter = Math.sin(seed + i * 7.13) * 8 * (1 - Math.abs(t - 0.5) * 1.2);
      c.lineTo(x1 + dx * t + perpX * jitter, y1 + dy * t + perpY * jitter);
    }
    c.lineTo(x2, y2);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.shadowColor = color;
    c.shadowBlur = 18;
    c.stroke();
    c.shadowBlur = 6;
    c.strokeStyle = coreColor;
    c.lineWidth = width * 0.42;
    c.stroke();
    c.shadowBlur = 0;
  }

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

    // 電磁場
    if (root._boshiEmFields) {
      for (const f of root._boshiEmFields) {
        const fade = Math.min(1, f.life / f.maxLife);
        const pulse = 0.55 + 0.25 * Math.sin(elapsed * 6);
        c.save();
        // 內圈紫霧
        const grad = c.createRadialGradient(f.x, f.y, f.radius * 0.3, f.x, f.y, f.radius);
        grad.addColorStop(0, `rgba(199,125,255,${0.06 * fade})`);
        grad.addColorStop(0.7, `rgba(199,125,255,${0.16 * fade})`);
        grad.addColorStop(1, `rgba(122,44,184,${0.28 * fade})`);
        c.fillStyle = grad;
        c.beginPath();
        c.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        c.fill();

        // 外環
        c.strokeStyle = `rgba(232,179,255,${0.55 + pulse * 0.3})`;
        c.lineWidth = 2.4;
        c.shadowColor = COLOR_MAIN;
        c.shadowBlur = 14;
        c.beginPath();
        c.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        c.stroke();

        // 內圈虛線
        c.setLineDash([8, 6]);
        c.lineDashOffset = -elapsed * 30;
        c.strokeStyle = `rgba(199,125,255,${0.5 * fade})`;
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(f.x, f.y, f.radius * 0.68, 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
        c.shadowBlur = 0;

        // 場內電弧
        for (let k = 0; k < 4; k++) {
          const a1 = elapsed * 1.6 + k * Math.PI / 2;
          const a2 = a1 + Math.PI * 0.7;
          const r1 = f.radius * (0.4 + 0.2 * Math.sin(elapsed * 5 + k));
          const x1 = f.x + Math.cos(a1) * r1;
          const y1 = f.y + Math.sin(a1) * r1;
          const x2 = f.x + Math.cos(a2) * r1;
          const y2 = f.y + Math.sin(a2) * r1;
          c.strokeStyle = `rgba(232,179,255,${0.5 * fade})`;
          c.lineWidth = 1.3;
          c.shadowColor = COLOR_MAIN;
          c.shadowBlur = 8;
          c.beginPath();
          c.moveTo(x1, y1);
          c.lineTo(x2, y2);
          c.stroke();
          c.shadowBlur = 0;
        }
        c.restore();
      }
    }

    // 量子領域
    if (root._boshiQuanta) {
      for (const z of root._boshiQuanta) {
        const fade = Math.min(1, z.life / z.maxLife);
        const len = Math.hypot(z.endX - z.startX, z.endY - z.startY);
        const cx = (z.startX + z.endX) / 2;
        const cy = (z.startY + z.endY) / 2;

        c.save();
        c.translate(cx, cy);
        c.rotate(z.angle);

        // 領域底色
        const grad = c.createLinearGradient(-len / 2, 0, len / 2, 0);
        grad.addColorStop(0, `rgba(199,125,255,${0.08 * fade})`);
        grad.addColorStop(0.5, `rgba(232,179,255,${0.16 * fade})`);
        grad.addColorStop(1, `rgba(199,125,255,${0.08 * fade})`);
        c.fillStyle = grad;
        c.fillRect(-len / 2, -z.halfWidth, len, z.halfWidth * 2);

        // 領域邊界
        c.strokeStyle = `rgba(232,179,255,${0.65 * fade})`;
        c.lineWidth = 2;
        c.shadowColor = COLOR_MAIN;
        c.shadowBlur = 12;
        c.strokeRect(-len / 2, -z.halfWidth, len, z.halfWidth * 2);

        // 中央脈動線
        c.setLineDash([12, 8]);
        c.lineDashOffset = -elapsed * 60;
        c.strokeStyle = `rgba(199,125,255,${0.4 * fade})`;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(-len / 2, 0);
        c.lineTo(len / 2, 0);
        c.stroke();
        c.setLineDash([]);
        c.shadowBlur = 0;

        // 脈衝掃描：由「起點牆」往「終點牆」掃
        for (const pl of z.pulses) {
          const t = pl.t;
          const px = -len / 2 + len * t;
          const alpha = Math.sin(t * Math.PI);
          c.strokeStyle = `rgba(255,224,248,${alpha * 0.85})`;
          c.lineWidth = 3;
          c.shadowColor = COLOR_LIGHT;
          c.shadowBlur = 22;
          c.beginPath();
          c.moveTo(px, -z.halfWidth);
          c.lineTo(px, z.halfWidth);
          c.stroke();
          // 掃描時的小閃電
          for (let k = 0; k < 3; k++) {
            const yy = -z.halfWidth + ((k + 0.5) / 3) * z.halfWidth * 2;
            drawLightning(c, px - 20, yy, px + 20, yy, pl.t * 100 + k * 13, 1.2, COLOR_LIGHT, COLOR_CRIT_CORE);
          }
          c.shadowBlur = 0;
        }

        // 領域標題
        c.globalAlpha = fade * 0.85;
        c.fillStyle = COLOR_LIGHT;
        c.font = 'bold 10px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('量子領域', 0, -z.halfWidth - 10);
        c.globalAlpha = 1;

        c.restore();
      }
    }

    // 每顆博士：電球 + 護盾 + 爆擊閃光
    for (const b of balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== TYPE) continue;
      const bR = getRadius(b);
      const time = elapsed;

      // 電球
      for (let i = 0; i < ORB_COUNT; i++) {
        const a = b.boshiOrbAngle + (i / ORB_COUNT) * Math.PI * 2;
        const ox = b.x + Math.cos(a) * ORB_RADIUS;
        const oy = b.y + Math.sin(a) * ORB_RADIUS;

        c.save();
        // 外光暈
        const gg = c.createRadialGradient(ox, oy, 0, ox, oy, 14);
        gg.addColorStop(0, 'rgba(255,255,255,0.85)');
        gg.addColorStop(0.4, 'rgba(232,179,255,0.7)');
        gg.addColorStop(1, 'rgba(199,125,255,0)');
        c.fillStyle = gg;
        c.beginPath();
        c.arc(ox, oy, 14, 0, Math.PI * 2);
        c.fill();

        // 主體
        const coreGrad = c.createRadialGradient(ox - 2, oy - 2, 1, ox, oy, 6);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.4, COLOR_LIGHT);
        coreGrad.addColorStop(1, COLOR_MAIN);
        c.fillStyle = coreGrad;
        c.shadowColor = COLOR_MAIN;
        c.shadowBlur = 16;
        c.beginPath();
        c.arc(ox, oy, 5.5, 0, Math.PI * 2);
        c.fill();

        // 電球與博士本體之間的電力線
        c.strokeStyle = `rgba(232,179,255,${0.3 + 0.2 * Math.sin(time * 6 + i)})`;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(b.x + Math.cos(a) * bR, b.y + Math.sin(a) * bR);
        c.lineTo(ox, oy);
        c.stroke();
        c.shadowBlur = 0;
        c.restore();
      }

      // 護盾環（每層一圈）
      const shield = Math.min(SHIELD_MAX, b.boshiShield || 0);
      if (shield > 0) {
        c.save();
        c.translate(b.x, b.y);
        for (let s = 0; s < shield; s++) {
          const rr = bR + 6 + s * 4;
          const a0 = time * 0.9 * (s % 2 ? -1 : 1) + s * 1.3;
          c.strokeStyle = `rgba(232,179,255,${0.55 - s * 0.12})`;
          c.lineWidth = 2;
          c.shadowColor = COLOR_LIGHT;
          c.shadowBlur = 10;
          c.setLineDash([14, 8]);
          c.lineDashOffset = -time * 20 * (s + 1);
          c.beginPath();
          c.arc(0, 0, rr, a0, a0 + Math.PI * 1.5);
          c.stroke();
          c.setLineDash([]);
        }
        c.shadowBlur = 0;
        c.restore();
      }

      // 爆擊閃光（博士本體）
      if ((b.boshiCritFlashTimer || 0) > 0) {
        const flash = b.boshiCritFlashTimer / 0.3;
        c.save();
        const fg = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, bR + 30);
        fg.addColorStop(0, `rgba(255,224,248,${flash * 0.9})`);
        fg.addColorStop(0.4, `rgba(255,159,224,${flash * 0.6})`);
        fg.addColorStop(1, 'rgba(199,125,255,0)');
        c.fillStyle = fg;
        c.beginPath();
        c.arc(b.x, b.y, bR + 30, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    // 電球雷射
    if (root._boshiLasers) {
      for (const p of root._boshiLasers) {
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.angle);
        const tailLen = 18;
        const tg = c.createLinearGradient(-tailLen, 0, 0, 0);
        const col = p.isCrit ? COLOR_CRIT : COLOR_MAIN;
        tg.addColorStop(0, 'rgba(199,125,255,0)');
        tg.addColorStop(1, col);
        c.fillStyle = tg;
        c.beginPath();
        c.moveTo(-tailLen, -2.4);
        c.lineTo(0, -5);
        c.lineTo(6, 0);
        c.lineTo(0, 5);
        c.lineTo(-tailLen, 2.4);
        c.closePath();
        c.fill();
        c.shadowColor = p.isCrit ? COLOR_CRIT : COLOR_MAIN;
        c.shadowBlur = p.isCrit ? 20 : 12;
        c.fillStyle = p.isCrit ? COLOR_CRIT_CORE : '#ffffff';
        c.beginPath();
        c.arc(2, 0, p.isCrit ? 4 : 3, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
        c.restore();
      }
    }

    // 爆擊閃電
    if (root._boshiCritBolts) {
      for (const bolt of root._boshiCritBolts) {
        const prog = 1 - Math.max(0, bolt.life / bolt.maxLife);
        const fade = Math.max(0, bolt.life / bolt.maxLife);
        c.save();
        c.globalAlpha = fade;
        // 從天而降
        for (let k = 0; k < 3; k++) {
          const seed = bolt.seed + k * 19.7;
          const startX = bolt.x + (k - 1) * 8;
          const startY = bolt.y - 90;
          drawLightning(c, startX, startY, bolt.x + (k - 1) * 4, bolt.y, seed, 2.5 - k * 0.6, COLOR_CRIT, COLOR_CRIT_CORE);
        }
        // 落點衝擊環
        c.strokeStyle = COLOR_CRIT;
        c.lineWidth = 2;
        c.shadowColor = COLOR_CRIT;
        c.shadowBlur = 20;
        c.beginPath();
        c.arc(bolt.x, bolt.y, 12 + prog * 30, 0, Math.PI * 2);
        c.stroke();
        c.shadowBlur = 0;
        c.restore();
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 主迴圈
  // ══════════════════════════════════════════════════════════
  function cleanupRoot(root) {
    if (!root) return;
    delete root._boshiLasers;
    delete root._boshiEmFields;
    delete root._boshiQuanta;
    delete root._boshiCritBolts;
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

    // 每帧嘗試 hook，直到成功
    tryHookDealDamage();
    tryHookDamageForPool();

    const dt = Math.min(0.05, Math.max(0, (t - (ov.lastTime || t)) / 1000));
    ov.lastTime = t;
    const elapsed = root.elapsed || (t / 1000);

    // 博士主邏輯
    const bodies = root.balls.filter(b => b && b.hp > 0 && b.char && b.char.type === TYPE);
    for (const b of bodies) {
      ensureState(b);
      updateBoshiLogic(b, dt, root);
    }

    // 更新獨立投射物與效果
    updateOrbLasers(dt, root);
    updateEmFields(dt, root);
    updateQuantum(dt, root);

    // 爆擊閃電生命週期
    if (root._boshiCritBolts) {
      for (let i = root._boshiCritBolts.length - 1; i >= 0; i--) {
        root._boshiCritBolts[i].life -= dt;
        if (root._boshiCritBolts[i].life <= 0) root._boshiCritBolts.splice(i, 1);
      }
    }

    // 死亡清理
    const deadPlayers = new Set();
    for (const b of root.balls) {
      if (b && b.char && b.char.type === TYPE && b.hp <= 0) deadPlayers.add(b.player);
    }
    if (deadPlayers.size) {
      if (root._boshiLasers)   root._boshiLasers   = root._boshiLasers.filter(p => !deadPlayers.has(p.owner));
      if (root._boshiEmFields) root._boshiEmFields = root._boshiEmFields.filter(f => !deadPlayers.has(f.owner));
      if (root._boshiQuanta)   root._boshiQuanta   = root._boshiQuanta.filter(z => !deadPlayers.has(z.owner));
    }

    const active =
      bodies.length > 0 ||
      (root._boshiLasers && root._boshiLasers.length > 0) ||
      (root._boshiEmFields && root._boshiEmFields.length > 0) ||
      (root._boshiQuanta && root._boshiQuanta.length > 0) ||
      (root._boshiCritBolts && root._boshiCritBolts.length > 0);

    syncOverlay(active);
    drawAll(elapsed, active);

    requestAnimationFrame(frame);
  }

  function start() {
    setupOverlay();
    tryHookDealDamage();
    tryHookDamageForPool();
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  console.log('[boshi] v1 已載入（粉紫配色）');
})();
