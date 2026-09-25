/**
 * gunner.js — 無名槍手擴充模組
 *
 * 依賴：
 *   - character_constants.js 需提供：
 *       GUNNER_SPIN_*（本體轉槍）
 *       GUNNER_BOUNTY_*（海克斯：賞金標誌）
 *       GUNNER_SPLIT_*（海克斯：分裂彈）
 *   - character_roster.js 的 gunner 條目需有 variants: gunner_bounty / gunner_split
 *   - index.html 只需加入 <script src="gunner.js"></script>
 *
 * 不改主引擎。
 */
(function () {
  'use strict';

  const TYPE = 'gunner';

  // ── 配色 ──
  const COLOR_BOUNTY      = '#f0c84a';
  const COLOR_BOUNTY_LITE = '#ffe9a8';
  const COLOR_SPLIT       = '#ffb347';
  const COLOR_SPLIT_CORE  = '#fff4c2';
  const COLOR_SPIN        = '#ffe066';
  const COLOR_SPIN_CORE   = '#fff9d0';

  // ══════════════════════════════════════════════════════════
  // 常數檢查
  // ══════════════════════════════════════════════════════════
  const REQUIRED_CONSTANTS = [
    'GUNNER_SPIN_DURATION', 'GUNNER_SPIN_RADIUS_MULT',
    'GUNNER_SPIN_ROTATE_SPEED', 'GUNNER_SPIN_FLASH_INTERVAL', 'GUNNER_SPIN_CLEAR_PARTICLE',
    'GUNNER_BOUNTY_CD', 'GUNNER_BOUNTY_DURATION', 'GUNNER_BOUNTY_HOMING_TURN', 'GUNNER_BOUNTY_MARK_R',
    'GUNNER_SPLIT_COUNT', 'GUNNER_SPLIT_DAMAGE_RATIO', 'GUNNER_SPLIT_SPEED',
    'GUNNER_SPLIT_LIFE', 'GUNNER_SPLIT_RADIUS',
  ];
  const missingConstants = REQUIRED_CONSTANTS.filter(name => {
    try { return (0, eval)(`typeof ${name}`) === 'undefined'; }
    catch (_) { return true; }
  });
  if (missingConstants.length) {
    console.error('[gunner.js] 找不到槍手常數，請先貼補丁到 character_constants.js：\n  ' +
      missingConstants.join('\n  '));
    return;
  }

  // 本體轉槍
  const SPIN_DURATION       = GUNNER_SPIN_DURATION;
  const SPIN_RADIUS_MULT    = GUNNER_SPIN_RADIUS_MULT;
  const SPIN_ROTATE_SPEED   = GUNNER_SPIN_ROTATE_SPEED;
  const SPIN_FLASH_INTERVAL = GUNNER_SPIN_FLASH_INTERVAL;
  const SPIN_CLEAR_PARTICLE = GUNNER_SPIN_CLEAR_PARTICLE;
  // 賞金標誌
  const BOUNTY_CD           = GUNNER_BOUNTY_CD;
  const BOUNTY_OPENING_CD   = (typeof GUNNER_BOUNTY_OPENING_CD === 'number') ? GUNNER_BOUNTY_OPENING_CD : GUNNER_BOUNTY_CD;
  const BOUNTY_DURATION     = GUNNER_BOUNTY_DURATION;
  const BOUNTY_HOMING_TURN  = GUNNER_BOUNTY_HOMING_TURN;
  const BOUNTY_MARK_R       = GUNNER_BOUNTY_MARK_R;
  // 分裂彈
  const SPLIT_COUNT         = GUNNER_SPLIT_COUNT;
  const SPLIT_DAMAGE_RATIO  = GUNNER_SPLIT_DAMAGE_RATIO;
  const SPLIT_SPEED         = GUNNER_SPLIT_SPEED;
  const SPLIT_LIFE          = GUNNER_SPLIT_LIFE;
  const SPLIT_RADIUS        = GUNNER_SPLIT_RADIUS;

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
  function getVariantIds(b) {
    if (!b || !b.char) return [];
    return Array.isArray(b.char._variantIds) ? b.char._variantIds : [];
  }
  function hasVariant(b, id) {
    return getVariantIds(b).includes(id);
  }

  // ══════════════════════════════════════════════════════════
  // 反投射物統一清單
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
      if (Array.isArray(b.sansBones))            list.push({ arr: b.sansBones });
      if (Array.isArray(b.emBullets))            list.push({ arr: b.emBullets });
      if (Array.isArray(b.cannonBalls))          list.push({ arr: b.cannonBalls });
      if (Array.isArray(b.oniichanTrackBalls))   list.push({ arr: b.oniichanTrackBalls });
      if (Array.isArray(b.gojoBalls))            list.push({ arr: b.gojoBalls });
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

  // 清除圓形範圍內的敵方投射物
  function clearProjectilesInRadius(cx, cy, radius, ownerPlayer) {
    const root = getRoot();
    if (!root) return 0;
    let count = 0;
    const arrays = getAllProjectileArrays();
    const r2 = radius * radius;
    for (const entry of arrays) {
      const arr = entry.arr;
      if (!Array.isArray(arr)) continue;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        if (!p) continue;
        const pOwner = getProjectileOwner(p);
        if (pOwner === ownerPlayer) continue;
        const dx = (Number(p.x) || 0) - cx;
        const dy = (Number(p.y) || 0) - cy;
        const pr = Number.isFinite(p.r) ? p.r : 8;
        const reach = radius + pr;
        if (dx * dx + dy * dy <= reach * reach) {
          // 廚神的刀是消耗資源：丟出當下 b.knives 就已扣除，正常只有撞牆才會變成
          // 可回收的 wallKnives 等待飛回補回刀數。轉槍若直接刪除飛行中的刀，
          // 會讓這把刀永遠進不了 wallKnives、b.knives 也補不回來，等於永久消失。
          // 因此這裡比照「撞牆」的處理方式：轉成可回收的 wallKnives，而不是直接刪掉。
          if (p.type === 'knife' && p.ownerBall && p.ownerBall.char &&
              p.ownerBall.char.type === 'chef' && p.ownerBall.hp > 0) {
            if (!Array.isArray(root.wallKnives)) root.wallKnives = [];
            root.wallKnives.push({
              x: p.x, y: p.y, angle: p.angle || 0,
              owner: p.owner, ownerBall: p.ownerBall, color: p.color,
            });
          }
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
    if (b._gunnerInit) return;
    b._gunnerInit = true;
    // 賞金標誌：開局先進入冷卻，不會一開場就掛標誌
    b.gunnerBountyCd = BOUNTY_OPENING_CD;
    // 轉槍（本體技能）
    b._gunnerPrevFiring     = undefined; // 上一帧的 gunnerFiring，用來偵測 6 發打完
    b._gunnerSpinTimer      = 0;
    b._gunnerSpinAngle      = 0;
    b._gunnerSpinFlashTimer = 0;
    b._gunnerSpinSparkTimer = 0;
  }

  // ══════════════════════════════════════════════════════════
  // Hook：fireProjectile → 標記槍手子彈
  // ══════════════════════════════════════════════════════════
  let hookedFireProjectile = null;
  function tryHookFireProjectile() {
    if (hookedFireProjectile) return;
    if (typeof window.fireProjectile !== 'function') return;
    hookedFireProjectile = window.fireProjectile;
    window.fireProjectile = function (ball, enemy, type, dmgOverride, spdOverride) {
      const result = hookedFireProjectile.call(this, ball, enemy, type, dmgOverride, spdOverride);
      if (result && ball && ball.char && ball.char.type === TYPE) {
        result._gunnerBullet = true;
        result._gunnerPrevX = result.x;
        result._gunnerPrevY = result.y;
        if (hasVariant(ball, 'gunner_bounty')) result._gunnerHoming = true;
        if (hasVariant(ball, 'gunner_split'))  result._gunnerSplit = true;
        if (result._gunnerSplitChild) {
          result._gunnerSplit = false;
          result._gunnerHoming = false;
        }
      }
      return result;
    };
    console.log('[gunner.js] fireProjectile hooked');
  }

  // ══════════════════════════════════════════════════════════
  // Hook：addProjectile → 標記槍手子彈
  // 槍手的主要連射（index.html「連射邏輯」段落）並不是走 fireProjectile()，
  // 而是直接呼叫 addProjectile({...})，只 hook fireProjectile 的話，
  // 槍手真正打出去的子彈永遠不會被貼上 _gunnerBullet / _gunnerHoming /
  // _gunnerSplit，導致追蹤與分裂形同虛設。這裡另外 hook addProjectile，
  // 用 owner 玩家編號反查槍手球本體，補上同一套標記。
  // ══════════════════════════════════════════════════════════
  let hookedAddProjectile = null;
  function tryHookAddProjectile() {
    if (hookedAddProjectile) return;
    if (typeof window.addProjectile !== 'function') return;
    hookedAddProjectile = window.addProjectile;
    window.addProjectile = function (projectile) {
      const result = hookedAddProjectile.call(this, projectile);
      if (result && result.type === 'bullet' && result.owner != null && !result._gunnerBullet) {
        const root = getRoot();
        const ownerBall = root && Array.isArray(root.balls)
          ? root.balls.find(b => b && b.player === result.owner && b.char && b.char.type === TYPE)
          : null;
        if (ownerBall) {
          result._gunnerBullet = true;
          if (!result.ownerBall) result.ownerBall = ownerBall;
          result._gunnerPrevX = result.x;
          result._gunnerPrevY = result.y;
          if (hasVariant(ownerBall, 'gunner_bounty')) result._gunnerHoming = true;
          if (hasVariant(ownerBall, 'gunner_split'))  result._gunnerSplit = true;
        }
      }
      return result;
    };
    console.log('[gunner.js] addProjectile hooked');
  }

  // ══════════════════════════════════════════════════════════
  // 轉槍（本體技能）
  //   - 偵測 gunnerFiring true → false 的那一帧
  //   - 進入 1 秒轉槍狀態
  //   - 期間消除半徑內所有敵方投射物
  // ══════════════════════════════════════════════════════════
  function detectSpinTrigger(b, root) {
    const now = !!b.gunnerFiring;
    if (b._gunnerPrevFiring === undefined) {
      b._gunnerPrevFiring = now;
      return;
    }
    if (b._gunnerPrevFiring === true && now === false) {
      // 6 發打完，觸發轉槍
      b._gunnerSpinTimer      = SPIN_DURATION;
      b._gunnerSpinAngle      = 0;
      b._gunnerSpinFlashTimer = 0;
      b._gunnerSpinSparkTimer = 0;
      pushFlash(b.x, b.y, getRadius(b) * SPIN_RADIUS_MULT, COLOR_SPIN, 0.35);
      playHit('knife');
    }
    b._gunnerPrevFiring = now;
  }

  function updateSpin(b, dt, root) {
    if (!(b._gunnerSpinTimer > 0)) return;
    b._gunnerSpinTimer -= dt;
    b._gunnerSpinAngle = (b._gunnerSpinAngle || 0) + dt * SPIN_ROTATE_SPEED;

    // 消除半徑內所有敵方投射物（每帧掃，新出現的子彈進來也會被消）
    const radius = getRadius(b) * SPIN_RADIUS_MULT;
    const cleared = clearProjectilesInRadius(b.x, b.y, radius, b.player);
    if (cleared > 0) {
      // 每次消除噴火花
      if (!root._gunnerSpinFX) root._gunnerSpinFX = [];
      root._gunnerSpinFX.push({
        x: b.x, y: b.y, radius,
        life: 0.22, maxLife: 0.22,
        count: Math.min(SPIN_CLEAR_PARTICLE * cleared, 20),
        seed: Math.random() * 1000,
      });
      pushFlash(b.x, b.y, radius * 0.7, COLOR_SPIN_CORE, 0.18);
    }

    // 週期性脈衝
    b._gunnerSpinFlashTimer -= dt;
    if (b._gunnerSpinFlashTimer <= 0) {
      b._gunnerSpinFlashTimer = SPIN_FLASH_INTERVAL;
      if (!root._gunnerSpinFX) root._gunnerSpinFX = [];
      root._gunnerSpinFX.push({
        x: b.x, y: b.y, radius: radius * 0.85,
        life: 0.15, maxLife: 0.15,
        count: 6,
        seed: Math.random() * 1000,
      });
    }

    if (b._gunnerSpinTimer <= 0) b._gunnerSpinTimer = 0;
  }

  // ══════════════════════════════════════════════════════════
  // 賞金標誌（海克斯）
  // ══════════════════════════════════════════════════════════
  function updateBountyMarkers(b, dt, root) {
    if (!hasVariant(b, 'gunner_bounty')) return;
    if (b.gunnerBountyCd > 0) b.gunnerBountyCd -= dt;
    if (b.gunnerBountyCd > 0) return;
    const enemy = getNearestEnemyTo(b.x, b.y, b.player);
    if (!enemy) return;
    b.gunnerBountyCd = BOUNTY_CD;
    enemy.gunnerBountyTimer = BOUNTY_DURATION;
    enemy.gunnerBountyOwnerPlayer = b.player;
    pushFlash(enemy.x, enemy.y, BOUNTY_MARK_R, COLOR_BOUNTY, 0.4);
  }

  function tickBountyTimers(dt, root) {
    for (const t of (root.balls || [])) {
      if (!t || !(t.gunnerBountyTimer > 0)) continue;
      t.gunnerBountyTimer -= dt;
      if (t.gunnerBountyTimer <= 0) {
        t.gunnerBountyTimer = 0;
        t.gunnerBountyOwnerPlayer = null;
      }
    }
  }

  function applyBountyHoming(dt, root) {
    if (!root.projectiles) return;
    for (const p of root.projectiles) {
      if (!p || !p._gunnerBullet || !p._gunnerHoming) continue;
      const marked = (root.balls || []).find(t =>
        t && t.hp > 0 &&
        t.gunnerBountyTimer > 0 &&
        t.gunnerBountyOwnerPlayer === p.owner &&
        t.player !== p.owner
      );
      if (!marked) continue;
      const dx = marked.x - p.x;
      const dy = marked.y - p.y;
      const desired = Math.atan2(dy, dx);
      const cur = Math.atan2(p.vy, p.vx);
      let diff = desired - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const maxTurn = BOUNTY_HOMING_TURN * dt;
      const turn = Math.max(-maxTurn, Math.min(maxTurn, diff));
      const newAngle = cur + turn;
      const spd = Math.hypot(p.vx, p.vy) || 1;
      p.vx = Math.cos(newAngle) * spd;
      p.vy = Math.sin(newAngle) * spd;
      p.angle = newAngle;
    }
  }

  // ══════════════════════════════════════════════════════════
  // 分裂彈（海克斯）
  // ══════════════════════════════════════════════════════════
  let lastBullets = new Set();

  function trackBulletsAndSplit(dt, root) {
    if (!root.projectiles) {
      lastBullets = new Set();
      return;
    }
    const current = new Set();
    const wall = getWall(), Wd = getW(), Hd = getH();
    const WALL_SNAP = 6;

    for (const p of root.projectiles) {
      if (!p || !p._gunnerBullet) continue;
      p._gunnerPrevX = p.x;
      p._gunnerPrevY = p.y;
      current.add(p);
    }

    for (const prev of lastBullets) {
      if (current.has(prev)) continue;
      if (!prev._gunnerSplit) continue;
      if (prev._gunnerSplitChild) continue;
      const px = prev._gunnerPrevX ?? prev.x;
      const py = prev._gunnerPrevY ?? prev.y;
      const nearWall =
        px <= wall + WALL_SNAP || px >= Wd - wall - WALL_SNAP ||
        py <= wall + WALL_SNAP || py >= Hd - wall - WALL_SNAP;
      if (!nearWall) continue;
      spawnSplitBullets(prev, px, py, root);
    }

    lastBullets = current;
  }

  function spawnSplitBullets(parent, cx, cy, root) {
    if (!root.projectiles) root.projectiles = [];
    const baseDmg = parent.damage || 45;
    const dmg = baseDmg * SPLIT_DAMAGE_RATIO;
    const wall = getWall();
    const Wd = getW(), Hd = getH();
    const baseAngle = Math.random() * Math.PI * 2;
    for (let i = 0; i < SPLIT_COUNT; i++) {
      const a = baseAngle + (i / SPLIT_COUNT) * Math.PI * 2;
      const nx = cx + Math.cos(a) * 4;
      const ny = cy + Math.sin(a) * 4;
      const sx = Math.max(wall + SPLIT_RADIUS, Math.min(Wd - wall - SPLIT_RADIUS, nx));
      const sy = Math.max(wall + SPLIT_RADIUS, Math.min(Hd - wall - SPLIT_RADIUS, ny));
      const bullet = {
        x: sx, y: sy,
        vx: Math.cos(a) * SPLIT_SPEED,
        vy: Math.sin(a) * SPLIT_SPEED,
        owner: parent.owner,
        ownerBall: parent.ownerBall,
        type: 'bullet',
        color: parent.color,
        damage: dmg,
        r: SPLIT_RADIUS,
        life: SPLIT_LIFE,
        angle: a,
        active: true,
        _gunnerBullet: true,
        _gunnerSplitChild: true,
        _gunnerPrevX: sx,
        _gunnerPrevY: sy,
      };
      if (typeof createProjectile === 'function') {
        root.projectiles.push(createProjectile(bullet));
      } else {
        root.projectiles.push(bullet);
      }
    }
    if (!root._gunnerSplitFX) root._gunnerSplitFX = [];
    root._gunnerSplitFX.push({
      x: cx, y: cy,
      life: 0.5, maxLife: 0.5,
      seed: Math.random() * 1000,
      count: SPLIT_COUNT,
    });
    pushFlash(cx, cy, 32, COLOR_SPLIT, 0.3);
    playHit('knife');
  }

  // ══════════════════════════════════════════════════════════
  // Overlay
  // ══════════════════════════════════════════════════════════
  const ov = { canvas: null, ctx: null, lastRoot: null, lastTime: 0 };

  function setupOverlay() {
    if (ov.canvas && document.body.contains(ov.canvas)) return;
    const c = document.createElement('canvas');
    c.id = 'gunner-overlay';
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

    // 賞金標誌
    for (const t of balls) {
      if (!t || !(t.gunnerBountyTimer > 0)) continue;
      const total = BOUNTY_DURATION;
      const remain = Math.max(0, t.gunnerBountyTimer);
      const fade = Math.min(1, remain / 0.4);
      const pulse = 0.55 + 0.45 * Math.sin(elapsed * 6);
      const bR = getRadius(t);

      c.save();
      c.translate(t.x, t.y);
      c.strokeStyle = `rgba(240,200,74,${0.75 * fade})`;
      c.lineWidth = 2.4;
      c.shadowColor = COLOR_BOUNTY;
      c.shadowBlur = 14;
      c.beginPath();
      c.arc(0, 0, bR + 14 + pulse * 3, 0, Math.PI * 2);
      c.stroke();

      c.setLineDash([5, 5]);
      c.lineDashOffset = -elapsed * 30;
      c.strokeStyle = `rgba(255,233,168,${0.7 * fade})`;
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(0, 0, bR + 8, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);

      c.strokeStyle = `rgba(255,233,168,${0.9 * fade})`;
      c.lineWidth = 2;
      const cr = bR + 20;
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + Math.PI / 4;
        const cos = Math.cos(a), sin = Math.sin(a);
        c.beginPath();
        c.moveTo(cos * (cr - 6), sin * (cr - 6));
        c.lineTo(cos * cr, sin * cr);
        c.stroke();
      }

      c.shadowBlur = 0;
      c.strokeStyle = `rgba(255,233,168,${0.65 * fade})`;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(-6, 0); c.lineTo(6, 0);
      c.moveTo(0, -6); c.lineTo(0, 6);
      c.stroke();

      c.strokeStyle = `rgba(240,200,74,${0.5 * fade})`;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, bR + 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (remain / total));
      c.stroke();

      c.shadowBlur = 0;
      c.restore();
    }

    // 轉槍：槍手身上的旋轉光環
    for (const b of balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== TYPE) continue;
      if (!(b._gunnerSpinTimer > 0)) continue;
      const bR = getRadius(b);
      const radius = bR * SPIN_RADIUS_MULT;
      const angle = b._gunnerSpinAngle || 0;
      const fade = Math.min(1, b._gunnerSpinTimer / SPIN_DURATION);
      const ringFade = fade < 0.15 ? fade / 0.15 : Math.min(1, fade / 0.3);

      c.save();
      c.translate(b.x, b.y);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ringFade;

      // 轉槍主環（快速旋轉的金色虛線環）
      c.strokeStyle = COLOR_SPIN;
      c.lineWidth = 3;
      c.shadowColor = COLOR_SPIN;
      c.shadowBlur = 16;
      c.setLineDash([10, 8]);
      c.lineDashOffset = -angle * 14;
      c.beginPath();
      c.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);

      // 內環（反向旋轉）
      c.strokeStyle = COLOR_SPIN_CORE;
      c.lineWidth = 2;
      c.shadowBlur = 10;
      c.setLineDash([4, 6]);
      c.lineDashOffset = angle * 20;
      c.beginPath();
      c.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);

      // 轉槍時的「槍管」旋轉弧線（4 條，代表掃描方向）
      c.shadowBlur = 12;
      c.lineWidth = 3.5;
      c.strokeStyle = COLOR_SPIN_CORE;
      for (let k = 0; k < 4; k++) {
        const a0 = angle + k * Math.PI / 2;
        c.beginPath();
        c.arc(0, 0, radius * 0.62, a0, a0 + 0.7);
        c.stroke();
      }

      // 邊緣光點
      c.shadowBlur = 14;
      c.fillStyle = COLOR_SPIN_CORE;
      for (let k = 0; k < 6; k++) {
        const a0 = -angle + k * Math.PI / 3;
        const pr = radius * (0.85 + 0.1 * Math.sin(elapsed * 8 + k));
        c.beginPath();
        c.arc(Math.cos(a0) * pr, Math.sin(a0) * pr, 2.2, 0, Math.PI * 2);
        c.fill();
      }

      c.restore();
    }

    // 轉槍消除火花
    if (root._gunnerSpinFX) {
      for (const fx of root._gunnerSpinFX) {
        const prog = 1 - Math.max(0, fx.life / fx.maxLife);
        const fade = Math.max(0, fx.life / fx.maxLife);
        c.save();
        c.translate(fx.x, fx.y);
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = fade;
        c.strokeStyle = COLOR_SPIN_CORE;
        c.lineWidth = 2;
        c.shadowColor = COLOR_SPIN;
        c.shadowBlur = 12;
        const baseAngle = fx.seed;
        for (let i = 0; i < fx.count; i++) {
          const a = baseAngle + (i / fx.count) * Math.PI * 2 + prog * 1.2;
          const inner = fx.radius * 0.5;
          const outer = fx.radius * (0.85 + prog * 0.2);
          c.beginPath();
          c.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
          c.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
          c.stroke();
        }
        c.shadowBlur = 0;
        c.restore();
      }
    }

    // 分裂爆閃
    if (root._gunnerSplitFX) {
      for (const fx of root._gunnerSplitFX) {
        const prog = 1 - Math.max(0, fx.life / fx.maxLife);
        const fade = Math.max(0, fx.life / fx.maxLife);
        c.save();
        c.translate(fx.x, fx.y);
        c.globalCompositeOperation = 'lighter';
        const cg = c.createRadialGradient(0, 0, 0, 0, 0, 32 + prog * 20);
        cg.addColorStop(0, `rgba(255,244,194,${fade})`);
        cg.addColorStop(0.3, `rgba(255,179,71,${fade * 0.7})`);
        cg.addColorStop(1, 'rgba(255,179,71,0)');
        c.fillStyle = cg;
        c.beginPath();
        c.arc(0, 0, 32 + prog * 20, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = `rgba(255,233,168,${fade * 0.85})`;
        c.lineWidth = 2;
        c.shadowColor = COLOR_SPLIT;
        c.shadowBlur = 12;
        const base = fx.seed;
        for (let i = 0; i < fx.count; i++) {
          const a = base + (i / fx.count) * Math.PI * 2;
          const inner = 6 + prog * 6;
          const outer = 20 + prog * 26;
          c.beginPath();
          c.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
          c.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
          c.stroke();
        }
        c.shadowBlur = 0;
        c.restore();
      }
    }

    // 槍手子彈拖尾（讓玩家能看見「追蹤弧線」）
    if (root.projectiles) {
      for (const p of root.projectiles) {
        if (!p || !p._gunnerBullet || !p._gunnerHoming) continue;
        c.save();
        c.globalAlpha = 0.5;
        c.strokeStyle = COLOR_BOUNTY;
        c.lineWidth = 2;
        c.shadowColor = COLOR_BOUNTY;
        c.shadowBlur = 8;
        c.beginPath();
        c.moveTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
        c.lineTo(p.x, p.y);
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
    delete root._gunnerSplitFX;
    delete root._gunnerSpinFX;
    lastBullets = new Set();
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

    tryHookFireProjectile();
    tryHookAddProjectile();

    const dt = Math.min(0.05, Math.max(0, (t - (ov.lastTime || t)) / 1000));
    ov.lastTime = t;
    const elapsed = root.elapsed || (t / 1000);

    // 槍手主邏輯
    const gunners = root.balls.filter(b => b && b.hp > 0 && b.char && b.char.type === TYPE);
    for (const b of gunners) {
      ensureState(b);
      // 本體：轉槍
      detectSpinTrigger(b, root);
      updateSpin(b, dt, root);
      // 海克斯：賞金
      updateBountyMarkers(b, dt, root);
    }

    // 標記計時
    tickBountyTimers(dt, root);
    // 追蹤
    applyBountyHoming(dt, root);
    // 分裂
    trackBulletsAndSplit(dt, root);

    // 特效壽命
    if (root._gunnerSplitFX) {
      for (let i = root._gunnerSplitFX.length - 1; i >= 0; i--) {
        root._gunnerSplitFX[i].life -= dt;
        if (root._gunnerSplitFX[i].life <= 0) root._gunnerSplitFX.splice(i, 1);
      }
    }
    if (root._gunnerSpinFX) {
      for (let i = root._gunnerSpinFX.length - 1; i >= 0; i--) {
        root._gunnerSpinFX[i].life -= dt;
        if (root._gunnerSpinFX[i].life <= 0) root._gunnerSpinFX.splice(i, 1);
      }
    }

    const active =
      gunners.length > 0 ||
      (root._gunnerSplitFX && root._gunnerSplitFX.length > 0) ||
      (root._gunnerSpinFX && root._gunnerSpinFX.length > 0) ||
      (root.balls || []).some(b => b && b.gunnerBountyTimer > 0) ||
      (root.balls || []).some(b => b && b._gunnerSpinTimer > 0);

    syncOverlay(active);
    drawAll(elapsed, active);

    requestAnimationFrame(frame);
  }

  function start() {
    setupOverlay();
    tryHookFireProjectile();
    tryHookAddProjectile();
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  console.log('[gunner.js] v2 已載入（轉槍 + 賞金標誌 + 分裂彈）');
})();
