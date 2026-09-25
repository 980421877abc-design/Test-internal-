/**
 * yelan.js — 夜蘭🎲 外部擴充模組（v6）
 *
 * v6：
 *   - 修正蓄力光暈在凍結狀態下卡住
 *   - 籠絡縱命索改為「穿過全部敵人才收招」，碰過的敵人不重複觸發
 *   - 淵圖玲瓏水箭改為從不同起始點瞄準同一目標，視覺匯聚
 *   - pushFlash 加上限、破局矢防重複觸發、dt 非有限值保護、FX life 過濾
 *   - 拔掉 DICE_SLOW_FACTOR / DICE_SLOW_DUR 的 fallback，缺常數就報錯停用
 *
 * 依賴：
 *   - character_constants.js 需提供 YELAN_* 常數
 *     （含 YELAN_DICE_ARROW_SLOW_FACTOR、YELAN_DICE_ARROW_SLOW_DUR）
 *   - character_roster.js 需提供 { id:'yelan', type:'yelan', ... }
 *   - index.html 需加入 <script src="yelan.js"></script>
 *   - index.html 球球碰撞 skip 需加入 yelanDashing 條件
 */
(function () {
  'use strict';

  const TYPE = 'yelan';

  const COLOR_YELAN      = '#4cc9f0';
  const COLOR_YELAN_LT   = '#a8e6ff';
  const COLOR_YELAN_CORE = '#ffffff';

  const DASH_SPEEDLINE_COUNT = 14;
  const FX_HARD_CAP          = 250;   // yelan 自有 FX 硬上限
  const HITFLASH_SOFT_CAP    = 60;    // 主動 push 的 hitFlash 上限

  // ══════════════════════════════════════════════════════════
  // 常數檢查
  // ══════════════════════════════════════════════════════════
  const REQUIRED_CONSTANTS = [
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
    'YELAN_DICE_TRIGGER_CD',
    'YELAN_DICE_ARROW_SLOW_FACTOR', 'YELAN_DICE_ARROW_SLOW_DUR',
  ];
  const missingConstants = REQUIRED_CONSTANTS.filter(name => {
    try { return (0, eval)(`typeof ${name}`) === 'undefined'; }
    catch (_) { return true; }
  });
  if (missingConstants.length) {
    console.error('[yelan.js] 找不到夜蘭常數，請先貼補丁到 character_constants.js：\n  ' +
      missingConstants.join('\n  '));
    return;
  }

  const DICE_SLOW_FACTOR = YELAN_DICE_ARROW_SLOW_FACTOR;
  const DICE_SLOW_DUR    = YELAN_DICE_ARROW_SLOW_DUR;

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
  function getWall() {
    try { return (typeof WALL !== 'undefined') ? WALL : 1; } catch (_) { return 1; }
  }
  function getRadius(b) {
    const r = Number(b && b.r);
    if (Number.isFinite(r) && r > 0) return r;
    try { return (typeof RADIUS !== 'undefined') ? RADIUS : 25; } catch (_) { return 25; }
  }
  function getBaseSpeed() {
    try { return (typeof BASE_SPEED === 'number' && BASE_SPEED > 0) ? BASE_SPEED : 140; } catch (_) { return 140; }
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
  function pushFlash(x, y, r, color, t) {
    const root = getRoot();
    if (!root || !root.hitFlashes) return;
    // 防止異常邏輯每幀 push 造成累積卡場
    if (root.hitFlashes.length >= HITFLASH_SOFT_CAP) {
      root.hitFlashes.splice(0, root.hitFlashes.length - HITFLASH_SOFT_CAP + 1);
    }
    root.hitFlashes.push({ x, y, r, alpha: 1, color, t });
  }
  function playHit(type) {
    try { if (typeof playHitSound === 'function') playHitSound(type); } catch (_) {}
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
  function isFrozen(b, root) {
    if (!b) return true;
    if (root && root.dioWorldGlobalActive && root.dioWorldCaster !== b) return true;
    if (b.obitoInSpace) return true;
    if (b.pucciDiscFrozen) return true;
    if (b.cooldownFreezeTimer > 0) return true;
    if (b.arenaFrozen > 0) return true;
    try { if (typeof hasStatusEffect === 'function' && hasStatusEffect(b, 'cooldownFreeze')) return true; } catch (_) {}
    return false;
  }

  // ══════════════════════════════════════════════════════════
  // 狀態初始化
  // ══════════════════════════════════════════════════════════
  function ensureState(b) {
    if (b._yelanInit) return;
    b._yelanInit = true;
    b.yelanBasicTimer = 0;
    b.yelanCharging = false;
    b.yelanChargeTimer = 0;
    b.yelanSlowRefreshTimer = 0;
    b.yelanBreakCounter = 0;
    b.yelanDashCd = YELAN_DASH_CD;
    b.yelanDashing = false;
    b.yelanDashTimer = 0;
    b.yelanDashTrailTimer = 0;
    b.yelanDashHitSet = new Set();      // v6：碰過的敵人，避免重複觸發
    b.yelanDiceCd = YELAN_DICE_CD;
    b.yelanDiceTimer = 0;
    b.yelanDiceStartAt = 0;
    b.yelanDiceArrowCd = 0;
  }

  // ══════════════════════════════════════════════════════════
  // 自有投射物
  // ══════════════════════════════════════════════════════════
  function ensureProjectiles(root) {
    if (!Array.isArray(root.yelanProjectiles)) root.yelanProjectiles = [];
    return root.yelanProjectiles;
  }

  function fireBasicArrow(root, b, enemy) {
    const baseAngle = Math.atan2(enemy.y - b.y, enemy.x - b.x);
    const angle = baseAngle + (Math.random() - 0.5) * 0.12;
    const r = getRadius(b);
    ensureProjectiles(root).push({
      kind: 'basic',
      x: b.x + Math.cos(angle) * (r + 4),
      y: b.y + Math.sin(angle) * (r + 4),
      vx: Math.cos(angle) * YELAN_BASIC_SPEED,
      vy: Math.sin(angle) * YELAN_BASIC_SPEED,
      r: YELAN_BASIC_RADIUS,
      life: YELAN_BASIC_LIFE,
      maxLife: YELAN_BASIC_LIFE,
      age: 0,
      owner: b.player,
      ownerBall: b,
      damage: YELAN_BASIC_DAMAGE,
      angle,
    });
    playHit('knife');
  }

  function fireBreakArrow(root, b, enemy) {
    const baseAngle = Math.atan2(enemy.y - b.y, enemy.x - b.x);
    const angle = baseAngle + (Math.random() - 0.5) * 0.08;
    const r = getRadius(b);
    ensureProjectiles(root).push({
      kind: 'break',
      x: b.x + Math.cos(angle) * (r + 4),
      y: b.y + Math.sin(angle) * (r + 4),
      vx: Math.cos(angle) * YELAN_BREAK_SPEED,
      vy: Math.sin(angle) * YELAN_BREAK_SPEED,
      r: YELAN_BREAK_RADIUS_BOLT,
      life: YELAN_BREAK_LIFE,
      maxLife: YELAN_BREAK_LIFE,
      age: 0,
      owner: b.player,
      ownerBall: b,
      damage: YELAN_BREAK_DAMAGE,
      angle,
      _yelanExploded: false,
    });
    playHit('knife');
  }

  // v6：三發從不同起始點瞄準同一目標點，視覺匯聚
  function fireDiceArrows(root, owner, target) {
    const count = YELAN_DICE_ARROW_COUNT;
    const r = getRadius(owner);
    const tx = target.x, ty = target.y;

    const aim = Math.atan2(ty - owner.y, tx - owner.x);
    const perpAngle = aim + Math.PI / 2;
    const startSpread = r * 0.9;

    for (let i = 0; i < count; i++) {
      const offset = count > 1 ? (i - (count - 1) / 2) : 0;
      const sx = owner.x + Math.cos(perpAngle) * offset * startSpread;
      const sy = owner.y + Math.sin(perpAngle) * offset * startSpread;
      const dx = tx - sx, dy = ty - sy;
      const d = Math.hypot(dx, dy) || 1;
      const angle = Math.atan2(dy, dx);

      ensureProjectiles(root).push({
        kind: 'dice',
        x: sx, y: sy,
        vx: Math.cos(angle) * YELAN_DICE_ARROW_SPEED,
        vy: Math.sin(angle) * YELAN_DICE_ARROW_SPEED,
        r: YELAN_DICE_ARROW_RADIUS,
        life: YELAN_DICE_ARROW_LIFE,
        maxLife: YELAN_DICE_ARROW_LIFE,
        age: 0,
        owner: owner.player,
        ownerBall: owner,
        damage: YELAN_DICE_ARROW_DAMAGE,
        angle,
        slowFactor: DICE_SLOW_FACTOR,
        slowDur: DICE_SLOW_DUR,
      });
    }
  }

  function explodeBreak(root, p) {
    if (p._yelanExploded) return;
    p._yelanExploded = true;

    const radius = YELAN_BREAK_RADIUS;
    const damage = YELAN_BREAK_DAMAGE;
    for (const t of getAllTargets()) {
      if (!t || t.hp <= 0) continue;
      if ((t.player ?? t.ownerPlayer ?? t.owner) === p.owner) continue;
      if (Math.hypot(t.x - p.x, t.y - p.y) <= radius + getRadius(t)) {
        applyDmg(t, damage, { attackerPlayer: p.owner, attackerBall: p.ownerBall });
        if ((t.emVulnTimer || 0) <= 0 || (t.emVulnPct || 0) < YELAN_SOAK_VULN) {
          t.emVulnPct = Math.max(t.emVulnPct || 0, YELAN_SOAK_VULN);
        }
        t.emVulnTimer = Math.max(t.emVulnTimer || 0, YELAN_BREAK_SOAK_DURATION);
      }
    }
    pushFlash(p.x, p.y, radius, COLOR_YELAN, 0.4);
    if (!Array.isArray(root._yelanFx)) root._yelanFx = [];
    if (root._yelanFx.length < FX_HARD_CAP) {
      root._yelanFx.push({
        kind: 'breakExplosion',
        x: p.x, y: p.y, radius,
        life: 0.5, maxLife: 0.5,
        seed: Math.random() * 1000,
      });
    }
    playHit('opm');
  }

  function updateArrows(root, dt) {
    const arr = ensureProjectiles(root);
    const W = getW(), H = getH(), wall = getWall();
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      let dead = false;

      if (p.x - p.r < wall || p.x + p.r > W - wall ||
          p.y - p.r < wall || p.y + p.r > H - wall) {
        if (p.kind === 'break') explodeBreak(root, p);
        dead = true;
      }

      if (!dead && p.age >= 0.05) {
        for (const t of getAllTargets()) {
          if (!t || t.hp <= 0) continue;
          if ((t.player ?? t.ownerPlayer ?? t.owner) === p.owner) continue;
          if (Math.hypot(t.x - p.x, t.y - p.y) <= getRadius(t) + p.r) {
            if (p.kind === 'break') {
              explodeBreak(root, p);
            } else {
              applyDmg(t, p.damage, { attackerPlayer: p.owner, attackerBall: p.ownerBall });
              if (p.slowFactor && p.slowDur) {
                applyStatusSafe(t, {
                  id: 'slow',
                  duration: p.slowDur,
                  strength: p.slowFactor,
                  source: 'yelan_dice_arrow',
                  stackMode: 'refreshMax',
                });
              }
              pushFlash(t.x, t.y, 14, COLOR_YELAN, 0.2);
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
  // 普攻
  // ══════════════════════════════════════════════════════════
  function updateBasic(b, dt, root) {
    if (b.yelanCharging) {
      b.yelanChargeTimer -= dt;
      b.yelanSlowRefreshTimer -= dt;
      if (b.yelanSlowRefreshTimer <= 0) {
        b.yelanSlowRefreshTimer = 0.1;
        applyStatusSafe(b, {
          id: 'slow',
          duration: 0.15,
          strength: YELAN_BASIC_CHARGE_SLOW,
          source: 'yelan_charge',
          stackMode: 'refreshMax',
        });
      }
      if (b.yelanChargeTimer <= 0) {
        b.yelanCharging = false;
        const enemy = getNearestEnemyTo(b.x, b.y, b.player);
        if (enemy) {
          b.yelanBreakCounter = (b.yelanBreakCounter || 0) + 1;
          if (b.yelanBreakCounter > YELAN_BREAK_EVERY_N) {
            b.yelanBreakCounter = 0;
            fireBreakArrow(root, b, enemy);
          } else {
            fireBasicArrow(root, b, enemy);
          }
        }
        b.yelanBasicTimer = YELAN_BASIC_CD;
      }
      return;
    }

    b.yelanBasicTimer -= dt;
    if (b.yelanBasicTimer > 0) return;

    const enemy = getNearestEnemyTo(b.x, b.y, b.player);
    if (!enemy) { b.yelanBasicTimer = 0.2; return; }

    if ((b.yelanBreakCounter || 0) + 1 > YELAN_BREAK_EVERY_N) {
      b.yelanBreakCounter = 0;
      fireBreakArrow(root, b, enemy);
      b.yelanBasicTimer = YELAN_BASIC_CD;
    } else {
      b.yelanCharging = true;
      b.yelanChargeTimer = YELAN_BASIC_CHARGE;
      b.yelanSlowRefreshTimer = 0;
    }
  }

  // ══════════════════════════════════════════════════════════
  // 籠絡縱命索：穿過全部敵人才收招，碰過的敵人不重複觸發
  // ══════════════════════════════════════════════════════════
  function updateDash(b, dt, root) {
    if (b.yelanDashing) {
      b.yelanDashTimer -= dt;
      if (!b.yelanDashHitSet) b.yelanDashHitSet = new Set();

      // 目標選擇：優先朝「還沒碰過的敵人」移動
      let nextTarget = null, bestD = Infinity;
      for (const t of getAllTargets()) {
        if (!t || t.hp <= 0) continue;
        if ((t.player ?? t.ownerPlayer ?? t.owner) === b.player) continue;
        if (b.yelanDashHitSet.has(t)) continue;
        const d = (t.x - b.x) ** 2 + (t.y - b.y) ** 2;
        if (d < bestD) { bestD = d; nextTarget = t; }
      }

      // 全部敵人都碰過 → 立刻收招
      if (!nextTarget) {
        b.yelanDashTimer = 0;
      } else {
        const angle = Math.atan2(nextTarget.y - b.y, nextTarget.x - b.x);
        const speed = getBaseSpeed() * YELAN_DASH_SPEED_MULT;
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
      }

      // 衝刺殘影
      b.yelanDashTrailTimer -= dt;
      if (b.yelanDashTrailTimer <= 0) {
        b.yelanDashTrailTimer = 0.06;
        if (!Array.isArray(root._yelanFx)) root._yelanFx = [];
        if (root._yelanFx.length < FX_HARD_CAP) {
          root._yelanFx.push({
            kind: 'dashTrail',
            x: b.x, y: b.y,
            life: 0.35, maxLife: 0.35,
          });
        }
      }

      // 穿透標記：碰過的敵人加入 Set，絕不重複觸發同一人
      for (const t of getAllTargets()) {
        if (!t || t.hp <= 0) continue;
        if ((t.player ?? t.ownerPlayer ?? t.owner) === b.player) continue;
        if (b.yelanDashHitSet.has(t)) continue;
        if (Math.hypot(t.x - b.x, t.y - b.y) <= getRadius(b) + getRadius(t) + 4) {
          b.yelanDashHitSet.add(t);
          t.yelanMarkedBy = b.player;
          pushFlash(t.x, t.y, 30, COLOR_YELAN, 0.28);
        }
      }

      // 收招：時間到或已穿過全部敵人
      if (b.yelanDashTimer <= 0) {
        b.yelanDashing = false;
        for (const t of getAllTargets()) {
          if (!t || t.hp <= 0) continue;
          if (t.yelanMarkedBy !== b.player) continue;
          applyDmg(t, YELAN_DASH_MARK_DAMAGE, { attackerPlayer: b.player, attackerBall: b });
          t.yelanMarkedBy = null;
          pushFlash(t.x, t.y, 40, COLOR_YELAN, 0.4);
        }
        b.yelanDashHitSet.clear();
        b.yelanBreakCounter = YELAN_BREAK_EVERY_N;
      }
      return;
    }

    b.yelanDashCd -= dt;
    if (b.yelanDashCd > 0) return;
    const enemy = getNearestEnemyTo(b.x, b.y, b.player);
    if (!enemy) { b.yelanDashCd = 0.2; return; }

    b.yelanDashing = true;
    b.yelanDashTimer = YELAN_DASH_DURATION;
    b.yelanDashTrailTimer = 0;
    b.yelanDashCd = YELAN_DASH_CD;
    b.yelanDashHitSet = new Set();

    // 釋放瞬間：速度線
    if (!Array.isArray(root._yelanFx)) root._yelanFx = [];
    const aim = Math.atan2(enemy.y - b.y, enemy.x - b.x);
    if (root._yelanFx.length < FX_HARD_CAP) {
      root._yelanFx.push({
        kind: 'dashBurst',
        x: b.x, y: b.y,
        angle: aim,
        count: DASH_SPEEDLINE_COUNT,
        life: 0.35, maxLife: 0.35,
        seed: Math.random() * 1000,
      });
    }
    pushFlash(b.x, b.y, getRadius(b) + 24, COLOR_YELAN, 0.35);
  }

  // ══════════════════════════════════════════════════════════
  // 淵圖玲瓏骰
  // ══════════════════════════════════════════════════════════
  function updateDiceSkill(b, dt, root) {
    b.yelanDiceCd -= dt;
    if (b.yelanDiceCd > 0) return;

    const enemy = getNearestEnemyTo(b.x, b.y, b.player);
    if (!enemy) { b.yelanDiceCd = 0.2; return; }

    b.yelanDiceCd = YELAN_DICE_CD;

    for (const t of getAllTargets()) {
      if (!t || t.hp <= 0) continue;
      if ((t.player ?? t.ownerPlayer ?? t.owner) === b.player) continue;
      if (Math.hypot(t.x - b.x, t.y - b.y) <= YELAN_DICE_RADIUS + getRadius(t)) {
        applyDmg(t, YELAN_DICE_DAMAGE, { attackerPlayer: b.player, attackerBall: b });
      }
    }
    pushFlash(b.x, b.y, YELAN_DICE_RADIUS, COLOR_YELAN, 0.5);

    const now = Number.isFinite(root.elapsed) ? root.elapsed : 0;
    for (const ally of (root.balls || [])) {
      if (!ally || ally.hp <= 0) continue;
      if (ally.player !== b.player) continue;
      ally.yelanDiceTimer = Math.max(ally.yelanDiceTimer || 0, YELAN_DICE_DURATION);
      ally.yelanDiceStartAt = now;
      if (ally.yelanDiceArrowCd == null) ally.yelanDiceArrowCd = 0;
    }
  }

  function updateDiceBuff(b, dt) {
    if ((b.yelanDiceTimer || 0) > 0) {
      b.yelanDiceTimer -= dt;
      if (b.yelanDiceTimer < 0) b.yelanDiceTimer = 0;
    }
    if ((b.yelanDiceArrowCd || 0) > 0) {
      b.yelanDiceArrowCd -= dt;
    }
  }

  // ══════════════════════════════════════════════════════════
  // dealDamage hook：妙轉隨心 + 水箭觸發
  // ══════════════════════════════════════════════════════════
  let hookedDealDamage = null;
  function tryHookDealDamage() {
    if (hookedDealDamage) return;
    if (typeof window.dealDamage !== 'function') return;
    hookedDealDamage = window.dealDamage;
    window.dealDamage = function (target, dmg, options) {
      const opts = options || {};
      const attacker = opts.attackerBall;
      if (attacker && attacker.char && attacker.char.type === TYPE && dmg > 0 && !opts.yelanDiceArrow) {
        if ((attacker.yelanDiceTimer || 0) > 0) {
          const root = getRoot();
          const now = (root && Number.isFinite(root.elapsed)) ? root.elapsed : 0;
          const elapsed = Math.max(0, now - (attacker.yelanDiceStartAt || 0));
          const ticks = Math.floor(elapsed / YELAN_MASTER_GROWTH_TICK);
          const bonus = Math.min(
            YELAN_MASTER_MAX,
            YELAN_MASTER_BASE_DMG + ticks * YELAN_MASTER_GROWTH
          );
          dmg = dmg * (1 + bonus);
        }
        if ((attacker.yelanDiceTimer || 0) > 0
            && (attacker.yelanDiceArrowCd || 0) <= 0
            && target && target !== attacker && target.hp > 0) {
          attacker.yelanDiceArrowCd = YELAN_DICE_TRIGGER_CD;
          const root = getRoot();
          if (root) fireDiceArrows(root, attacker, target);
        }
      }
      return hookedDealDamage.call(this, target, dmg, options);
    };
    console.log('[yelan.js] dealDamage hooked');
  }

  // ══════════════════════════════════════════════════════════
  // Overlay
  // ══════════════════════════════════════════════════════════
  const ov = { canvas: null, ctx: null, lastRoot: null, lastTime: 0 };

  function setupOverlay() {
    if (ov.canvas && document.body.contains(ov.canvas)) return;
    const c = document.createElement('canvas');
    c.id = 'yelan-overlay';
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
    const Wd = getW(), Hd = getH();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    ov.canvas.width = Math.max(1, Math.round(Wd * dpr));
    ov.canvas.height = Math.max(1, Math.round(Hd * dpr));
    ov.canvas.style.left = rect.left + 'px';
    ov.canvas.style.top = rect.top + 'px';
    ov.canvas.style.width = rect.width + 'px';
    ov.canvas.style.height = rect.height + 'px';
    ov.canvas.style.display = active ? 'block' : 'none';
  }

  function drawDice(c, x, y, rotation) {
    c.save();
    c.translate(x, y);
    c.rotate(rotation);
    const size = 4;
    c.fillStyle = '#f2fbff';
    c.strokeStyle = COLOR_YELAN;
    c.lineWidth = 1;
    c.beginPath();
    c.rect(-size, -size, size * 2, size * 2);
    c.fill();
    c.stroke();
    c.fillStyle = '#1a3a4a';
    for (const [dx, dy] of [[-1.5, -1.5], [0, 0], [1.5, 1.5]]) {
      c.beginPath();
      c.arc(dx, dy, 1, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  function drawArrow(c, p) {
    const isBreak = p.kind === 'break';
    const isDice = p.kind === 'dice';
    const tail = isBreak ? 26 : isDice ? 18 : 22;
    const headLen = isBreak ? 12 : isDice ? 8 : 10;
    const headHalf = isBreak ? 3.5 : isDice ? 2.4 : 2.8;

    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle);

    const tg = c.createLinearGradient(-tail, 0, 0, 0);
    tg.addColorStop(0, 'rgba(168,230,255,0)');
    tg.addColorStop(1, isBreak ? 'rgba(200,242,255,0.85)' : 'rgba(168,230,255,0.55)');
    c.strokeStyle = tg;
    c.lineWidth = isBreak ? 2.8 : isDice ? 1.6 : 2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-tail, 0);
    c.lineTo(0, 0);
    c.stroke();

    c.fillStyle = isBreak ? '#f0faff' : isDice ? '#cfefff' : '#e0f7ff';
    c.beginPath();
    c.moveTo(headLen, 0);
    c.lineTo(-2, -headHalf);
    c.lineTo(-2, headHalf);
    c.closePath();
    c.fill();

    if (isBreak) {
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(3, 0, 1.6, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  }

  function drawAll(elapsed, active) {
    const c = ov.ctx;
    if (!c) return;
    const root = getRoot();
    if (!root) return;
    const Wd = getW(), Hd = getH();
    const dpr = ov.canvas.width / Math.max(1, Wd);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, Wd, Hd);
    if (!active) return;

    const balls = root.balls || [];

    // 骰子
    for (const b of balls) {
      if (!b || b.hp <= 0) continue;
      if (!(b.yelanDiceTimer > 0)) continue;
      const bR = getRadius(b);
      const orbitAngle = elapsed * 1.6;
      const orbitR = bR + 26;
      const ox = b.x + Math.cos(orbitAngle) * orbitR;
      const oy = b.y + Math.sin(orbitAngle) * orbitR;
      drawDice(c, ox, oy, orbitAngle * 1.3);
    }

    // FX：爆炸、衝刺殘影、釋放速度線
    if (root._yelanFx) {
      for (const fx of root._yelanFx) {
        const prog = 1 - Math.max(0, fx.life / fx.maxLife);
        const fade = Math.max(0, fx.life / fx.maxLife);

        if (fx.kind === 'breakExplosion') {
          c.save();
          c.translate(fx.x, fx.y);
          c.globalAlpha = fade;
          c.strokeStyle = COLOR_YELAN;
          c.lineWidth = 3;
          c.beginPath();
          c.arc(0, 0, fx.radius * (0.6 + prog * 0.4), 0, Math.PI * 2);
          c.stroke();
          c.globalAlpha = fade * 0.5;
          c.lineWidth = 1.5;
          c.beginPath();
          c.arc(0, 0, fx.radius * (0.4 + prog * 0.25), 0, Math.PI * 2);
          c.stroke();
          c.restore();
        } else if (fx.kind === 'dashTrail') {
          c.save();
          c.globalAlpha = fade * 0.55;
          c.fillStyle = COLOR_YELAN_LT;
          c.beginPath();
          c.ellipse(fx.x, fx.y, 10 + prog * 6, 7 + prog * 4, 0, 0, Math.PI * 2);
          c.fill();
          c.restore();
        } else if (fx.kind === 'dashBurst') {
          c.save();
          c.translate(fx.x, fx.y);
          c.globalAlpha = fade * 0.9;
          c.strokeStyle = COLOR_YELAN_LT;
          c.lineCap = 'round';
          const r0 = 20 + prog * 40;
          const r1 = r0 + 22 * (1 - prog);
          for (let k = 0; k < fx.count; k++) {
            const a = (k / fx.count) * Math.PI * 2 + fx.seed;
            c.lineWidth = 1.6 + (k % 3) * 0.6;
            c.beginPath();
            c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
            c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
            c.stroke();
          }
          c.globalAlpha = fade;
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(Math.cos(fx.angle) * 14, Math.sin(fx.angle) * 14);
          c.lineTo(Math.cos(fx.angle) * (60 + (1 - prog) * 60), Math.sin(fx.angle) * (60 + (1 - prog) * 60));
          c.stroke();
          c.restore();
        }
      }
    }

    // 箭矢
    const arrows = root.yelanProjectiles;
    if (Array.isArray(arrows)) {
      for (const p of arrows) drawArrow(c, p);
    }

    // 蓄力光暈
    for (const b of balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== TYPE) continue;
      if (!b.yelanCharging) continue;
      if (isFrozen(b, root)) continue;
      const prog = 1 - Math.max(0, b.yelanChargeTimer) / YELAN_BASIC_CHARGE;
      if (!Number.isFinite(prog)) continue;
      const bR = getRadius(b);
      c.save();
      c.globalAlpha = 0.4 + prog * 0.4;
      c.strokeStyle = COLOR_YELAN;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(b.x, b.y, bR + 10 + prog * 8, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    // 被標記敵人
    for (const t of balls) {
      if (!t || t.hp <= 0) continue;
      if (!t.yelanMarkedBy) continue;
      const bR = getRadius(t);
      c.save();
      c.globalAlpha = 0.85;
      c.strokeStyle = COLOR_YELAN;
      c.lineWidth = 2.5;
      c.setLineDash([6, 5]);
      c.lineDashOffset = -elapsed * 30;
      c.beginPath();
      c.arc(t.x, t.y, bR + 10, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }
  }

  // ══════════════════════════════════════════════════════════
  // 主迴圈
  // ══════════════════════════════════════════════════════════
  function cleanupRoot(root) {
    if (!root) return;
    delete root._yelanFx;
    delete root.yelanProjectiles;
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

    tryHookDealDamage();

    ensureProjectiles(root);
    if (!Array.isArray(root._yelanFx)) root._yelanFx = [];

    const dt = Math.min(0.05, Math.max(0, (t - (ov.lastTime || t)) / 1000));
    ov.lastTime = t;

    // dt 非有限值保護：避免 NaN 讓 life 永不遞減
    if (!Number.isFinite(dt) || dt < 0) {
      requestAnimationFrame(frame);
      return;
    }

    const elapsed = Number.isFinite(root.elapsed) ? root.elapsed : (t / 1000);

    // FX 壽命：獨立於夜蘭是否存活，避免夜蘭死亡後特效殘留
    if (root._yelanFx) {
      for (let i = root._yelanFx.length - 1; i >= 0; i--) {
        const fx = root._yelanFx[i];
        if (!Number.isFinite(fx.life) || !Number.isFinite(fx.maxLife)) {
          root._yelanFx.splice(i, 1);
          continue;
        }
        fx.life -= dt;
        if (fx.life <= 0) root._yelanFx.splice(i, 1);
      }
      if (root._yelanFx.length > FX_HARD_CAP) {
        root._yelanFx.splice(0, root._yelanFx.length - FX_HARD_CAP);
      }
    }

    // 夜蘭主邏輯
    const yelans = root.balls.filter(b => b && b.hp > 0 && b.char && b.char.type === TYPE);
    for (const b of yelans) {
      ensureState(b);
      if (isFrozen(b, root)) {
        // 凍結時清掉蓄力狀態，避免光暈卡住
        if (b.yelanCharging) {
          b.yelanCharging = false;
          b.yelanChargeTimer = 0;
          b.yelanSlowRefreshTimer = 0;
        }
        continue;
      }
      updateBasic(b, dt, root);
      updateDash(b, dt, root);
      updateDiceSkill(b, dt, root);
    }

    // 骰子 buff 倒數
    for (const b of root.balls) {
      if (!b || b.hp <= 0) continue;
      if ((b.yelanDiceTimer || 0) > 0 || (b.yelanDiceArrowCd || 0) > 0) {
        updateDiceBuff(b, dt);
      }
    }

    // 箭矢：移動、碰撞、壽命
    updateArrows(root, dt);

    // 死亡清理
    const deadPlayers = new Set();
    for (const b of root.balls) {
      if (b && b.char && b.char.type === TYPE && b.hp <= 0) deadPlayers.add(b.player);
    }
    if (deadPlayers.size && Array.isArray(root.yelanProjectiles)) {
      root.yelanProjectiles = root.yelanProjectiles.filter(p => !deadPlayers.has(p.owner));
    }
    // 死亡時把衝刺狀態收乾淨（避免殘留 yelanDashing）
    for (const b of root.balls) {
      if (b && b.char && b.char.type === TYPE && b.hp <= 0) {
        b.yelanDashing = false;
        b.yelanCharging = false;
        b.yelanChargeTimer = 0;
        if (b.yelanDashHitSet) b.yelanDashHitSet.clear();
      }
    }

    const active =
      yelans.length > 0
      || (root._yelanFx && root._yelanFx.length > 0)
      || (root.yelanProjectiles && root.yelanProjectiles.length > 0)
      || (root.balls || []).some(b => b && b.yelanDiceTimer > 0)
      || (root.balls || []).some(b => b && b.yelanMarkedBy);

    syncOverlay(active);
    drawAll(elapsed, active);

    requestAnimationFrame(frame);
  }

  function start() {
    setupOverlay();
    tryHookDealDamage();
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  console.log('[yelan.js] v6 已載入（蓄力/衝刺/水箭/特效累積 修正）');
})();
