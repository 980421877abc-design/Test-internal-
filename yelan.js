/**
 * yelan.js — 夜蘭🎲 外部擴充模組（v3）
 *
 * v3 重寫：
 *   - 絡命絲改為「一條絲一個物件」，points 陣列記錄路徑
 *   - 敵人身上的 yelanThreadCd 作為最小受傷間隔（全絲共用）
 *   - 修掉舊版「每段獨立冷卻 → 看起來沒有間隔」的問題
 *
 * 依賴：
 *   - character_constants.js 需提供 YELAN_* 常數
 *   - character_roster.js 需提供 { id:'yelan', type:'yelan', ... }
 *   - index.html 需加入 <script src="yelan.js"></script>
 *   - index.html 球球碰撞 skip 需加入 yelanDashing 條件
 *   - index.html 需提供 window.getProjectileArrays()
 *   - （可選）主引擎投射物繪製迴圈需跳過 yelan_* type，否則會畫成酒瓶
 */
(function () {
  'use strict';

  const TYPE = 'yelan';

  const COLOR_YELAN      = '#4cc9f0';
  const COLOR_YELAN_LT   = '#a8e6ff';
  const COLOR_YELAN_CORE = '#ffffff';

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
    'YELAN_DASH_THREAD_WIDTH', 'YELAN_DASH_THREAD_HIT_RADIUS', 'YELAN_DASH_THREAD_LIFE',
    'YELAN_DASH_THREAD_DAMAGE', 'YELAN_DASH_THREAD_SLOW_FACTOR', 'YELAN_DASH_THREAD_SLOW_DUR',
    'YELAN_DASH_THREAD_HIT_CD', 'YELAN_DASH_THREAD_SAMPLE_INTERVAL',
    'YELAN_DICE_CD', 'YELAN_DICE_DURATION', 'YELAN_DICE_DAMAGE', 'YELAN_DICE_RADIUS',
    'YELAN_DICE_ARROW_COUNT', 'YELAN_DICE_ARROW_DAMAGE', 'YELAN_DICE_ARROW_SPEED',
    'YELAN_DICE_ARROW_SPREAD', 'YELAN_DICE_ARROW_RADIUS', 'YELAN_DICE_ARROW_LIFE',
    'YELAN_DICE_TRIGGER_CD',
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
  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
    const cx = x1 + dx * t, cy = y1 + dy * t;
    return Math.hypot(px - cx, py - cy);
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
    b.yelanDashSampleTimer = 0;
    b.yelanThread = null;
    b.yelanDiceCd = YELAN_DICE_CD;
    b.yelanDiceTimer = 0;
    b.yelanDiceStartAt = 0;
    b.yelanDiceArrowCd = 0;
  }

  // ══════════════════════════════════════════════════════════
  // 投射物發射
  // ══════════════════════════════════════════════════════════
  function spawnProjectile(spec) {
    try {
      if (typeof addProjectile === 'function') return addProjectile(spec);
    } catch (_) {}
    const root = getRoot();
    if (!root) return null;
    if (!Array.isArray(root.projectiles)) root.projectiles = [];
    root.projectiles.push(spec);
    return spec;
  }

  function fireBasicArrow(root, b, enemy) {
    const angle = Math.atan2(enemy.y - b.y, enemy.x - b.x);
    const r = getRadius(b);
    spawnProjectile({
      x: b.x + Math.cos(angle) * (r + 6),
      y: b.y + Math.sin(angle) * (r + 6),
      vx: Math.cos(angle) * YELAN_BASIC_SPEED,
      vy: Math.sin(angle) * YELAN_BASIC_SPEED,
      type: 'yelan_arrow',
      owner: b.player,
      ownerBall: b,
      damage: YELAN_BASIC_DAMAGE,
      r: YELAN_BASIC_RADIUS,
      life: YELAN_BASIC_LIFE,
      angle,
      color: COLOR_YELAN_LT,
      active: true,
    });
    playHit('knife');
  }

  function fireBreakArrow(root, b, enemy) {
    const angle = Math.atan2(enemy.y - b.y, enemy.x - b.x);
    const r = getRadius(b);
    // damage: 0 —— 命中判定由消失偵測觸發範圍爆炸，避免二段傷害
    spawnProjectile({
      x: b.x + Math.cos(angle) * (r + 6),
      y: b.y + Math.sin(angle) * (r + 6),
      vx: Math.cos(angle) * YELAN_BREAK_SPEED,
      vy: Math.sin(angle) * YELAN_BREAK_SPEED,
      type: 'yelan_break_arrow',
      owner: b.player,
      ownerBall: b,
      damage: 0,
      r: YELAN_BREAK_RADIUS_BOLT,
      life: YELAN_BREAK_LIFE,
      angle,
      color: COLOR_YELAN_LT,
      active: true,
    });
    playHit('knife');
  }

  function fireDiceArrows(root, owner, target) {
    const count = YELAN_DICE_ARROW_COUNT;
    const baseAngle = Math.atan2(target.y - owner.y, target.x - owner.x);
    const r = getRadius(owner);
    for (let i = 0; i < count; i++) {
      const offset = count > 1
        ? (i - (count - 1) / 2) * (YELAN_DICE_ARROW_SPREAD / (count - 1))
        : 0;
      const angle = baseAngle + offset;
      spawnProjectile({
        x: owner.x + Math.cos(angle) * (r + 8),
        y: owner.y + Math.sin(angle) * (r + 8),
        vx: Math.cos(angle) * YELAN_DICE_ARROW_SPEED,
        vy: Math.sin(angle) * YELAN_DICE_ARROW_SPEED,
        type: 'yelan_dice_arrow',
        owner: owner.player,
        ownerBall: owner,
        damage: YELAN_DICE_ARROW_DAMAGE,
        r: YELAN_DICE_ARROW_RADIUS,
        life: YELAN_DICE_ARROW_LIFE,
        angle,
        color: COLOR_YELAN_LT,
        active: true,
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // 破局矢爆炸
  // ══════════════════════════════════════════════════════════
  function explodeBreakArrow(root, p, x, y) {
    const radius = YELAN_BREAK_RADIUS;
    const damage = YELAN_BREAK_DAMAGE;
    for (const t of getAllTargets()) {
      if (!t || t.hp <= 0) continue;
      if ((t.player ?? t.ownerPlayer ?? t.owner) === p.owner) continue;
      if (Math.hypot(t.x - x, t.y - y) <= radius + getRadius(t)) {
        applyDmg(t, damage, { attackerPlayer: p.owner, attackerBall: p.ownerBall });
        if ((t.emVulnTimer || 0) <= 0 || (t.emVulnPct || 0) < YELAN_SOAK_VULN) {
          t.emVulnPct = Math.max(t.emVulnPct || 0, YELAN_SOAK_VULN);
        }
        t.emVulnTimer = Math.max(t.emVulnTimer || 0, YELAN_BREAK_SOAK_DURATION);
      }
    }
    pushFlash(x, y, radius, COLOR_YELAN, 0.4);
    if (!Array.isArray(root._yelanFx)) root._yelanFx = [];
    root._yelanFx.push({
      kind: 'breakExplosion',
      x, y, radius,
      life: 0.5, maxLife: 0.5,
      seed: Math.random() * 1000,
    });
    playHit('opm');
  }

  // 破局矢消失時是否該爆炸：只有牆邊或敵人附近才爆，
  // 避免被 gojo 無限、boshi 電磁場、gunner 轉槍在半空中吸收時誤爆。
  function shouldBreakExplode(p) {
    const W = getW(), H = getH(), wall = getWall();
    const snap = 14;
    if (p.x <= wall + snap || p.x >= W - wall - snap ||
        p.y <= wall + snap || p.y >= H - wall - snap) {
      return true;
    }
    for (const t of getAllTargets()) {
      if (!t || t.hp <= 0) continue;
      if ((t.player ?? t.ownerPlayer ?? t.owner) === p.owner) continue;
      if (Math.hypot(t.x - p.x, t.y - p.y) <= getRadius(t) + p.r + 8) {
        return true;
      }
    }
    return false;
  }

  let lastYelanArrows = new Set();
  function detectBreakArrows(root) {
    if (!Array.isArray(root.projectiles)) {
      lastYelanArrows = new Set();
      return;
    }
    const current = new Set();
    for (const p of root.projectiles) {
      if (!p || p.type !== 'yelan_break_arrow') continue;
      current.add(p);
    }
    for (const prev of lastYelanArrows) {
      if (current.has(prev)) continue;
      if (shouldBreakExplode(prev)) {
        explodeBreakArrow(root, prev, prev.x, prev.y);
      }
    }
    lastYelanArrows = current;
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
  // 籠絡縱命索
  // ══════════════════════════════════════════════════════════
  function updateDash(b, dt, root) {
    if (b.yelanDashing) {
      b.yelanDashTimer -= dt;

      const enemy = getNearestEnemyTo(b.x, b.y, b.player);
      if (enemy) {
        const angle = Math.atan2(enemy.y - b.y, enemy.x - b.x);
        const speed = getBaseSpeed() * YELAN_DASH_SPEED_MULT;
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
      }

      // 穿透標記
      for (const t of getAllTargets()) {
        if (!t || t.hp <= 0) continue;
        if ((t.player ?? t.ownerPlayer ?? t.owner) === b.player) continue;
        if (t.yelanMarkedBy === b.player) continue;
        if (Math.hypot(t.x - b.x, t.y - b.y) <= getRadius(b) + getRadius(t) + 4) {
          t.yelanMarkedBy = b.player;
        }
      }

      // 取樣：把當前位置 push 到本條絲的 points
      b.yelanDashSampleTimer -= dt;
      if (b.yelanDashSampleTimer <= 0) {
        b.yelanDashSampleTimer = YELAN_DASH_THREAD_SAMPLE_INTERVAL;
        if (b.yelanThread) {
          const pts = b.yelanThread.points;
          const last = pts[pts.length - 1];
          if (last) {
            const dx = b.x - last.x;
            const dy = b.y - last.y;
            if (dx * dx + dy * dy > 4) {
              pts.push({ x: b.x, y: b.y });
            }
          }
        }
      }

      // 技能結束：引爆標記
      if (b.yelanDashTimer <= 0) {
        b.yelanDashing = false;
        b.yelanThread = null;
        for (const t of getAllTargets()) {
          if (!t || t.hp <= 0) continue;
          if (t.yelanMarkedBy !== b.player) continue;
          applyDmg(t, YELAN_DASH_MARK_DAMAGE, { attackerPlayer: b.player, attackerBall: b });
          t.yelanMarkedBy = null;
          pushFlash(t.x, t.y, 40, COLOR_YELAN, 0.4);
        }
        // 釋放技能後下次普攻即為破局矢
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
    b.yelanDashSampleTimer = 0;
    b.yelanDashCd = YELAN_DASH_CD;
    b.yelanThread = {
      points: [{ x: b.x, y: b.y }],
      owner: b.player,
      ownerBall: b,
      life: YELAN_DASH_THREAD_LIFE,
      maxLife: YELAN_DASH_THREAD_LIFE,
    };
    if (!Array.isArray(root.yelanThreads)) root.yelanThreads = [];
    root.yelanThreads.push(b.yelanThread);
    pushFlash(b.x, b.y, getRadius(b) + 20, COLOR_YELAN, 0.35);
  }

  // ══════════════════════════════════════════════════════════
  // 絡命絲判定
  // ══════════════════════════════════════════════════════════
  function updateThreads(root, dt) {
    const arr = root.yelanThreads;
    if (!Array.isArray(arr)) return;
    for (let i = arr.length - 1; i >= 0; i--) {
      const th = arr[i];
      th.life -= dt;
      if (th.life <= 0) { arr.splice(i, 1); continue; }
      const pts = th.points;
      if (!pts || pts.length < 2) continue;

      for (const t of getAllTargets()) {
        if (!t || t.hp <= 0) continue;
        if ((t.player ?? t.ownerPlayer ?? t.owner) === th.owner) continue;
        if ((t.yelanThreadCd || 0) > 0) continue;

        const hitR = getRadius(t) + YELAN_DASH_THREAD_HIT_RADIUS;
        let hit = false;
        for (let j = 0; j < pts.length - 1; j++) {
          const p1 = pts[j], p2 = pts[j + 1];
          if (pointToSegmentDistance(t.x, t.y, p1.x, p1.y, p2.x, p2.y) <= hitR) {
            hit = true;
            break;
          }
        }
        if (!hit) continue;

        t.yelanThreadCd = YELAN_DASH_THREAD_HIT_CD;
        applyDmg(t, YELAN_DASH_THREAD_DAMAGE, { attackerPlayer: th.owner, attackerBall: th.ownerBall });
        applyStatusSafe(t, {
          id: 'slow',
          duration: YELAN_DASH_THREAD_SLOW_DUR,
          strength: YELAN_DASH_THREAD_SLOW_FACTOR,
          source: 'yelan_thread',
          stackMode: 'refreshMax',
        });
        pushFlash(t.x, t.y, 22, COLOR_YELAN, 0.3);
      }
    }
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

  function drawDice(c, x, y, rotation, pulse) {
    c.save();
    c.translate(x, y);
    c.rotate(rotation);
    c.shadowColor = COLOR_YELAN;
    c.shadowBlur = 14 * pulse;
    const size = 7;
    const grad = c.createLinearGradient(-size, -size, size, size);
    grad.addColorStop(0, COLOR_YELAN_CORE);
    grad.addColorStop(0.45, COLOR_YELAN_LT);
    grad.addColorStop(1, COLOR_YELAN);
    c.fillStyle = grad;
    c.beginPath();
    c.rect(-size, -size, size * 2, size * 2);
    c.fill();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.4;
    c.stroke();
    c.shadowBlur = 0;
    c.fillStyle = '#1a3a4a';
    const dots = [
      [-size * 0.45, -size * 0.45],
      [0, 0],
      [size * 0.45, size * 0.45],
    ];
    for (const [dx, dy] of dots) {
      c.beginPath();
      c.arc(dx, dy, 1.8, 0, Math.PI * 2);
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

    // 玄擲玲瓏骰
    for (const b of balls) {
      if (!b || b.hp <= 0) continue;
      if (!(b.yelanDiceTimer > 0)) continue;
      const bR = getRadius(b);
      const pulse = 0.8 + 0.2 * Math.sin(elapsed * 6 + b.player);
      const orbitAngle = elapsed * 1.6;
      const ox = b.x + Math.cos(orbitAngle) * (bR + 22);
      const oy = b.y + Math.sin(orbitAngle) * (bR + 22);
      c.save();
      c.globalAlpha = 0.35 * pulse;
      c.strokeStyle = COLOR_YELAN_LT;
      c.lineWidth = 1;
      c.setLineDash([4, 5]);
      c.beginPath();
      c.arc(b.x, b.y, bR + 22, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.restore();
      drawDice(c, ox, oy, orbitAngle * 1.3, pulse);
    }

    // 絡命絲（一條一物件，points 折線）
    if (root.yelanThreads) {
      for (const th of root.yelanThreads) {
        const pts = th.points;
        if (!pts || pts.length < 2) continue;
        const fade = Math.min(1, th.life / 0.6);
        c.save();
        c.globalAlpha = fade * 0.9;
        c.strokeStyle = COLOR_YELAN_LT;
        c.shadowColor = COLOR_YELAN;
        c.shadowBlur = 10;
        c.lineWidth = YELAN_DASH_THREAD_WIDTH;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(pts[0].x, pts[0].y);
        for (let j = 1; j < pts.length; j++) c.lineTo(pts[j].x, pts[j].y);
        c.stroke();
        c.restore();
      }
    }

    // 破局矢爆炸
    if (root._yelanFx) {
      for (const fx of root._yelanFx) {
        if (fx.kind !== 'breakExplosion') continue;
        const prog = 1 - Math.max(0, fx.life / fx.maxLife);
        const fade = Math.max(0, fx.life / fx.maxLife);
        c.save();
        c.translate(fx.x, fx.y);
        c.globalAlpha = fade;
        c.strokeStyle = COLOR_YELAN;
        c.shadowColor = COLOR_YELAN;
        c.shadowBlur = 20;
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
      }
    }

    // 投射物繪製（從 state.projectiles 讀 yelan 三種箭矢）
    if (Array.isArray(root.projectiles)) {
      for (const p of root.projectiles) {
        if (!p || !p.type || p.type.indexOf('yelan_') !== 0) continue;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.angle || 0);
        if (p.type === 'yelan_break_arrow') {
          c.shadowColor = COLOR_YELAN;
          c.shadowBlur = 18;
          c.fillStyle = COLOR_YELAN_LT;
          c.beginPath();
          c.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = COLOR_YELAN_CORE;
          c.beginPath();
          c.ellipse(2, 0, 4, 2, 0, 0, Math.PI * 2);
          c.fill();
        } else if (p.type === 'yelan_dice_arrow') {
          c.shadowColor = COLOR_YELAN;
          c.shadowBlur = 10;
          c.fillStyle = COLOR_YELAN_LT;
          c.beginPath();
          c.ellipse(0, 0, 7, 3.2, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = COLOR_YELAN_CORE;
          c.beginPath();
          c.ellipse(1.5, 0, 2.5, 1.4, 0, 0, Math.PI * 2);
          c.fill();
        } else {
          c.shadowColor = COLOR_YELAN;
          c.shadowBlur = 8;
          c.fillStyle = '#e0f7ff';
          c.beginPath();
          c.ellipse(0, 0, 8, 2.8, 0, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
    }

    // 蓄力光暈
    for (const b of balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== TYPE) continue;
      if (!b.yelanCharging) continue;
      const prog = 1 - Math.max(0, b.yelanChargeTimer) / YELAN_BASIC_CHARGE;
      const bR = getRadius(b);
      c.save();
      c.globalAlpha = 0.5 + prog * 0.4;
      c.strokeStyle = COLOR_YELAN;
      c.shadowColor = COLOR_YELAN;
      c.shadowBlur = 18;
      c.lineWidth = 3;
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
      c.shadowColor = COLOR_YELAN;
      c.shadowBlur = 14;
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
    delete root.yelanThreads;
    delete root._yelanFx;
    lastYelanArrows = new Set();
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

    if (!Array.isArray(root.yelanThreads)) root.yelanThreads = [];
    if (!Array.isArray(root._yelanFx)) root._yelanFx = [];

    const dt = Math.min(0.05, Math.max(0, (t - (ov.lastTime || t)) / 1000));
    ov.lastTime = t;
    const elapsed = Number.isFinite(root.elapsed) ? root.elapsed : (t / 1000);

    // 夜蘭主邏輯
    const yelans = root.balls.filter(b => b && b.hp > 0 && b.char && b.char.type === TYPE);
    for (const b of yelans) {
      ensureState(b);
      if (isFrozen(b, root)) continue;
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

    // 絡命絲對每個敵人的獨立冷卻
    for (const t of root.balls) {
      if (!t || t.hp <= 0) continue;
      if ((t.yelanThreadCd || 0) > 0) {
        t.yelanThreadCd -= dt;
        if (t.yelanThreadCd < 0) t.yelanThreadCd = 0;
      }
    }

    // 破局矢消失偵測
    detectBreakArrows(root);

    // 絡命絲判定
    updateThreads(root, dt);

    // 特效壽命
    if (root._yelanFx) {
      for (let i = root._yelanFx.length - 1; i >= 0; i--) {
        root._yelanFx[i].life -= dt;
        if (root._yelanFx[i].life <= 0) root._yelanFx.splice(i, 1);
      }
    }

    // 死亡清理
    const deadPlayers = new Set();
    for (const b of root.balls) {
      if (b && b.char && b.char.type === TYPE && b.hp <= 0) deadPlayers.add(b.player);
    }
    if (deadPlayers.size && Array.isArray(root.yelanThreads)) {
      root.yelanThreads = root.yelanThreads.filter(th => !deadPlayers.has(th.owner));
    }

    const active =
      yelans.length > 0
      || (root.yelanThreads && root.yelanThreads.length > 0)
      || (root._yelanFx && root._yelanFx.length > 0)
      || (root.balls || []).some(b => b && b.yelanDiceTimer > 0)
      || (root.balls || []).some(b => b && b.yelanMarkedBy)
      || (Array.isArray(root.projectiles) && root.projectiles.some(p => p && p.type && p.type.indexOf('yelan_') === 0));

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

  console.log('[yelan.js] v3 已載入（絡命絲重寫）');
})();
