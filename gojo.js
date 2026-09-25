/* ============================================================================
 * gojo.js v5 — 現代最強視覺特效（強化版 + 戰鬥外守門）
 * 紫球蓄力修復 + 無量空處華麗 + 虛式紫炸裂 + 紫球路徑毀滅感
 *
 * v5 修正：
 *   1. 新增 isBattleActive() 守門：主引擎停機（退出／結算／matchEnded）後
 *      不再更新與繪製，解決現代最強勝利後畫面卡頓
 *   2. 偵測 state 更換時清空 FX 陣列，避免跨對局殘留
 *   3. syncOverlay 在非戰鬥時直接隱藏，不呼叫 getBoundingClientRect
 * ============================================================================ */
(() => {
  'use strict';

  const FX = {
    infinityPulses: [],
    clashBursts: [],
    fistBursts: [],
    purpleCharges: [],
    domainTears: [],     // 無量空處螢幕裂痕
    purpleTrails: [],    // 紫球路徑裂痕
    lastTime: 0,
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  // ═══════════════════════════════════════════════
  // 戰鬥狀態守門：判斷戰鬥是否仍在進行
  //   任一條件成立即視為「不在戰鬥」：
  //     1. game-screen 被隱藏（回到選角畫面）
  //     2. 結算 overlay 已出現（分出勝負）
  //     3. 主引擎已標記 matchEnded
  //   不在戰鬥時必須完全停掉更新與繪製，避免主引擎停機後特效殘留卡住畫面。
  // ═══════════════════════════════════════════════
  function isBattleActive() {
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen) return false;
    if (window.getComputedStyle(gameScreen).display === 'none') return false;
    const overlay = document.getElementById('overlay');
    if (overlay && overlay.classList.contains('show')) return false;
    if (typeof state !== 'undefined' && state && state.matchEnded) return false;
    return true;
  }

  // ═══════════════════════════════════════════════
  // Hook 1：gojoClashExplode → 無限制虛式紫爆炸
  // ═══════════════════════════════════════════════
  let hookedClashExplode = null;
  function tryHookClashExplode() {
    if (hookedClashExplode) return;
    if (typeof window.gojoClashExplode !== 'function') return;
    hookedClashExplode = window.gojoClashExplode;
    window.gojoClashExplode = function (b, cx, cy) {
      hookedClashExplode(b, cx, cy);
      spawnClashFX(cx, cy);
    };
    console.log('[gojo_vfx] gojoClashExplode hooked');
  }

  function spawnClashFX(cx, cy) {
    FX.clashBursts.push({
      x: cx, y: cy,
      life: 1.4, maxLife: 1.4,
      seed: Math.random() * 1000,
      rings: [
        { maxR: 260, w: 9, color: '#bf00ff', delay: 0 },
        { maxR: 210, w: 5, color: '#e0b0ff', delay: 0.06 },
        { maxR: 320, w: 3, color: '#ffffff', delay: 0.12 },
        { maxR: 380, w: 2, color: '#7a2cb8', delay: 0.20 }
      ],
      // 空間碎裂：從中心向外飛散的紫色方塊
      shards: Array.from({ length: 22 }, () => {
        const a = Math.random() * Math.PI * 2;
        const sp = rand(120, 420);
        return {
          x: cx, y: cy,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          rot: Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 8,
          size: rand(6, 16),
          life: rand(0.7, 1.3), maxLife: 1.3,
          color: Math.random() < 0.5 ? '#bf00ff' : '#e0b0ff'
        };
      }),
      // 白色裂痕線
      rays: Array.from({ length: 20 }, () => ({
        angle: Math.random() * Math.PI * 2,
        len: rand(140, 320),
        w: rand(2, 5)
      })),
      particles: Array.from({ length: 50 }, () => {
        const a = Math.random() * Math.PI * 2;
        const sp = rand(100, 480);
        const roll = Math.random();
        return {
          x: cx, y: cy,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: rand(0.5, 1.2), maxLife: 1.2,
          r: rand(2, 7),
          color: roll < 0.35 ? '#bf00ff' : (roll < 0.7 ? '#e0b0ff' : '#ffffff')
        };
      })
    });
  }

  // ═══════════════════════════════════════════════
  // Hook 2：fireGojoAttack → 紫球蓄力
  // ═══════════════════════════════════════════════
  let hookedFire = null;
  function tryHookFire() {
    if (hookedFire) return;
    if (typeof window.fireGojoAttack !== 'function') return;
    hookedFire = window.fireGojoAttack;
    window.fireGojoAttack = function (b, enemy) {
      const before = (b.gojoBalls || []).length;
      hookedFire(b, enemy);
      const after = b.gojoBalls || [];
      for (let i = before; i < after.length; i++) {
        const ball = after[i];
        if (ball && ball.type === 'purple') {
          ball.gojoCharging = 0.8;
          ball.gojoChargeMax = 0.8;
          ball.gojoOriginalVx = ball.vx;
          ball.gojoOriginalVy = ball.vy;
          ball.vx = 0;
          ball.vy = 0;
          ball.gojoChargingVisual = true;
          FX.purpleCharges.push({
            ball: ball,
            x: ball.x,
            y: ball.y,
            seed: Math.random() * 1000
          });
          FX.infinityPulses.push({ x: ball.x, y: ball.y, life: 0.35, maxLife: 0.35, color: '#bf00ff', big: true });
        }
      }
    };
    console.log('[gojo_vfx] fireGojoAttack hooked');
  }

  // ═══════════════════════════════════════════════
  // Hook 3：updateGojoBalls → 蓄力中的紫球不要被推進
  // ═══════════════════════════════════════════════
  let hookedUpdateBalls = null;
  function tryHookUpdateBalls() {
    if (hookedUpdateBalls) return;
    if (typeof window.updateGojoBalls !== 'function') return;
    hookedUpdateBalls = window.updateGojoBalls;
    window.updateGojoBalls = function (b, dt) {
      // 記住蓄力中的紫球，處理完後從 b.gojoBalls 暫時移除，
      // 避免原函式把它們當一般投射物推進
      if (!Array.isArray(b.gojoBalls)) return hookedUpdateBalls.call(this, b, dt);
      const paused = [];
      for (let i = b.gojoBalls.length - 1; i >= 0; i--) {
        const ball = b.gojoBalls[i];
        if (ball && ball.gojoChargingVisual) {
          paused.push(ball);
          b.gojoBalls.splice(i, 1);
        }
      }
      hookedUpdateBalls.call(this, b, dt);
      // 把它們放回
      for (const p of paused) b.gojoBalls.push(p);
    };
    console.log('[gojo_vfx] updateGojoBalls hooked');
  }

  // ═══════════════════════════════════════════════
  // Hook 4：applyGojoProjectilePull → 蒼吸收保留原始傷害
  // ═══════════════════════════════════════════════
  let hookedPull = null;
  function tryHookPull() {
    if (hookedPull) return;
    if (typeof window.applyGojoProjectilePull !== 'function') return;
    hookedPull = window.applyGojoProjectilePull;
    window.applyGojoProjectilePull = function (ball, projectiles, ownerPlayer, storage) {
      const restoreList = [];
      if (Array.isArray(projectiles)) {
        for (const p of projectiles) {
          if (p && p.gojoSlowing && Number.isFinite(p.gojoOriginalDamage) && p.damage === 0) {
            restoreList.push({ p: p, saved: p.damage });
            p.damage = p.gojoOriginalDamage;
          }
        }
      }
      try {
        hookedPull(ball, projectiles, ownerPlayer, storage);
      } finally {
        for (const entry of restoreList) entry.p.damage = entry.saved;
      }
    };
    console.log('[gojo_vfx] applyGojoProjectilePull hooked');
  }

  // ───────── 更新紫球蓄力 + 生成路徑裂痕 ─────────
  function updatePurpleCharges(dt) {
    for (let i = FX.purpleCharges.length - 1; i >= 0; i--) {
      const c = FX.purpleCharges[i];
      const ball = c.ball;
      if (!ball || !ball.active) {
        FX.purpleCharges.splice(i, 1);
        continue;
      }
      ball.gojoCharging -= dt;
      ball.x = c.x;
      ball.y = c.y;
      ball.vx = 0;
      ball.vy = 0;
      if (ball.gojoCharging <= 0) {
        ball.vx = ball.gojoOriginalVx || 0;
        ball.vy = ball.gojoOriginalVy || 0;
        ball.gojoCharging = 0;
        ball.gojoChargingVisual = false;
        FX.infinityPulses.push({ x: c.x, y: c.y, life: 0.6, maxLife: 0.6, color: '#bf00ff', big: true });
        FX.purpleCharges.splice(i, 1);
      }
    }
  }

  // 追蹤紫球的軌跡，讓它們路過留下裂痕
  const purpleTrailMap = new WeakMap();
  function trackPurpleTrails(dt) {
    if (!state || !state.balls) return;
    for (const b of state.balls) {
      if (!b || !b.char || b.char.type !== 'gojo') continue;
      if (!Array.isArray(b.gojoBalls)) continue;
      for (const ball of b.gojoBalls) {
        if (!ball || ball.type !== 'purple' || !ball.active || ball.gojoChargingVisual) continue;
        // 每 0.05 秒生成一個裂痕
        const last = purpleTrailMap.get(ball) || 0;
        if (performance.now() - last > 50) {
          purpleTrailMap.set(ball, performance.now());
          const spd = Math.hypot(ball.vx, ball.vy);
          const ang = spd > 1 ? Math.atan2(ball.vy, ball.vx) : 0;
          FX.purpleTrails.push({
            x: ball.x, y: ball.y,
            angle: ang,
            life: 0.75, maxLife: 0.75,
            seed: Math.random() * 1000,
            size: 22 + Math.random() * 10
          });
        }
        // 拉近附近的敵人
        for (const t of (typeof window.getAllCombatTargets === 'function' ? window.getAllCombatTargets() : [])) {
          if (!t || t.hp <= 0 || t.player === b.player) continue;
          const dx = ball.x - t.x, dy = ball.y - t.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 70 && d > 1) {
            t.vx += (dx / d) * 6;
            t.vy += (dy / d) * 6;
          }
        }
      }
    }
  }


   // ───────── 偵測無下限消耗 ─────────
  const seenSlowingProjectiles = new WeakSet();
  function detectInfinityConsume() {
    if (!state || !state.balls) return;
    // 投射物統一清單（定義於 index.html 主引擎）
    const arrays = (typeof window.getProjectileArrays === 'function')
      ? window.getProjectileArrays()
      : [];
    for (const arr of arrays) {
      for (const p of arr) {
        if (p && p.gojoSlowing && !seenSlowingProjectiles.has(p)) {
          seenSlowingProjectiles.add(p);
          FX.infinityPulses.push({ x: p.x, y: p.y, life: 0.55, maxLife: 0.55 });
        }
      }
    }
  }

  // ───────── 蒼拳偵測 ─────────
  const prevFistCd = new WeakMap();
  function detectFistAttack() {
    if (!state || !state.balls) return;
    for (const b of state.balls) {
      if (!b || !b.char || b.char.type !== 'gojo') continue;
      const prev = prevFistCd.get(b) || 0;
      const curr = b.gojoFistCooldown || 0;
      if (curr > prev + 0.2 && prev < 0.5) {
        const target = (typeof window.getNearestEnemyTo === 'function')
          ? window.getNearestEnemyTo(b.x, b.y, b.player) : null;
        if (target) {
          const angle = Math.atan2(target.y - b.y, target.x - b.x);
          FX.fistBursts.push({
            x: target.x, y: target.y,
            originX: b.x, originY: b.y, angle: angle,
            life: 0.42, maxLife: 0.42, seed: Math.random() * 1000
          });
        }
      }
      prevFistCd.set(b, curr);
    }
  }

  // ───────── Overlay ─────────
  let overlayCanvas = null;
  let overlayCtx = null;
  let lastRectW = 0, lastRectH = 0, lastLeft = 0, lastTop = 0;

  function ensureOverlay() {
    if (overlayCanvas && document.body.contains(overlayCanvas)) return;
    const arena = document.getElementById('arena');
    if (!arena) return;
    overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'gojo-vfx-overlay';
    overlayCanvas.style.cssText = 'position:fixed;pointer-events:none;z-index:18;display:none;';
    document.body.appendChild(overlayCanvas);
    overlayCtx = overlayCanvas.getContext('2d');
  }

  function hasGojo() {
    return state && state.balls && state.balls.some(function (b) {
      return b && b.hp > 0 && b.char && b.char.type === 'gojo';
    });
  }

  function syncOverlay() {
    ensureOverlay();
    const arena = document.getElementById('arena');
    if (!arena || !overlayCanvas) return;

    // 不在戰鬥：直接隱藏 overlay，不計算 getBoundingClientRect（避免強制佈局）
    if (!isBattleActive()) {
      overlayCanvas.style.display = 'none';
      return;
    }

    const active = FX.infinityPulses.length > 0
      || FX.clashBursts.length > 0
      || FX.fistBursts.length > 0
      || FX.purpleCharges.length > 0
      || FX.purpleTrails.length > 0
      || hasGojo();
    if (!active) {
      overlayCanvas.style.display = 'none';
      return;
    }
    const rect = arena.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (rect.width !== lastRectW || rect.height !== lastRectH) {
      overlayCanvas.width = Math.max(1, Math.round(rect.width * dpr));
      overlayCanvas.height = Math.max(1, Math.round(rect.height * dpr));
      lastRectW = rect.width;
      lastRectH = rect.height;
    }
    if (rect.left !== lastLeft || rect.top !== lastTop) {
      overlayCanvas.style.left = rect.left + 'px';
      overlayCanvas.style.top = rect.top + 'px';
      lastLeft = rect.left;
      lastTop = rect.top;
    }
    overlayCanvas.style.width = rect.width + 'px';
    overlayCanvas.style.height = rect.height + 'px';
    overlayCanvas.style.display = 'block';
  }

  function drawOverlay() {
    if (!overlayCtx || !overlayCanvas) return;
    const arena = document.getElementById('arena');
    if (!arena) return;
    const W = arena.width;
    const H = arena.height;
    const scaleX = overlayCanvas.width / Math.max(1, W);
    const scaleY = overlayCanvas.height / Math.max(1, H);
    overlayCtx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    overlayCtx.clearRect(0, 0, W, H);

    drawPurpleTrails();
    drawInfinityAura();
    drawInfinityPulses();
    drawPurpleChargingEffects();
    drawPurpleEnhancements();
    drawFistBursts();
    drawClashBursts();
    drawDomainEnhancements();
  }

  // ═══════════════════════════════════════════════
  // 紫球路徑裂痕
  // ═══════════════════════════════════════════════
  function drawPurpleTrails() {
    const time = performance.now() / 1000;
    for (const t of FX.purpleTrails) {
      const fade = clamp(t.life / t.maxLife, 0, 1);
      const prog = 1 - fade;

      overlayCtx.save();
      overlayCtx.globalCompositeOperation = 'lighter';
      overlayCtx.translate(t.x, t.y);
      overlayCtx.rotate(t.angle);

      // 中央撕裂線（會逐漸拉長）
      const len = t.size * (0.6 + prog * 0.8);
      overlayCtx.globalAlpha = fade * 0.9;
      overlayCtx.strokeStyle = '#bf00ff';
      overlayCtx.shadowColor = '#bf00ff';
      overlayCtx.shadowBlur = 20;
      overlayCtx.lineWidth = 3 * fade;
      overlayCtx.beginPath();
      overlayCtx.moveTo(-len, 0);
      overlayCtx.lineTo(len, 0);
      overlayCtx.stroke();

      // 白色高亮芯
      overlayCtx.globalAlpha = fade * 0.85;
      overlayCtx.strokeStyle = '#ffffff';
      overlayCtx.shadowColor = '#e0b0ff';
      overlayCtx.shadowBlur = 12;
      overlayCtx.lineWidth = 1.2;
      overlayCtx.beginPath();
      overlayCtx.moveTo(-len * 0.7, 0);
      overlayCtx.lineTo(len * 0.7, 0);
      overlayCtx.stroke();

      // 上下兩道鋸齒裂口
      overlayCtx.globalAlpha = fade * 0.7;
      overlayCtx.strokeStyle = '#e0b0ff';
      overlayCtx.shadowColor = '#bf00ff';
      overlayCtx.lineWidth = 1.8;
      for (let side = -1; side <= 1; side += 2) {
        overlayCtx.beginPath();
        const segs = 5;
        for (let i = 0; i <= segs; i++) {
          const px = -len + (len * 2) * (i / segs);
          const py = side * (2 + Math.sin(time * 12 + i + t.seed) * 2);
          if (i === 0) overlayCtx.moveTo(px, py);
          else overlayCtx.lineTo(px, py);
        }
        overlayCtx.stroke();
      }

      overlayCtx.restore();
    }
  }

  // ═══════════════════════════════════════════════
  // 無下限光環
  // ═══════════════════════════════════════════════
  function drawInfinityAura() {
    if (!state || !state.balls) return;
    const R = (typeof GOJO_INFINITY_RADIUS === 'number') ? GOJO_INFINITY_RADIUS : 80;
    const MAX = (typeof GOJO_INFINITY_MAX === 'number') ? GOJO_INFINITY_MAX : 10;

    for (const b of state.balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== 'gojo') continue;
      const inf = Math.max(0, Math.min(MAX, b.gojoInfinity || 0));
      const ratio = inf / MAX;
      const time = performance.now() / 1000;
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);

      overlayCtx.save();

      const fillAlpha = 0.04 + ratio * 0.06;
      const fillGrad = overlayCtx.createRadialGradient(b.x, b.y, b.r * 0.5, b.x, b.y, R);
      fillGrad.addColorStop(0, 'rgba(0,207,255,0)');
      fillGrad.addColorStop(0.6, 'rgba(0,207,255,' + (fillAlpha * 0.5) + ')');
      fillGrad.addColorStop(1, 'rgba(120,240,255,' + (fillAlpha * 1.6) + ')');
      overlayCtx.beginPath();
      overlayCtx.arc(b.x, b.y, R, 0, Math.PI * 2);
      overlayCtx.fillStyle = fillGrad;
      overlayCtx.fill();

      overlayCtx.globalAlpha = 0.12 + ratio * 0.18;
      overlayCtx.strokeStyle = '#9df0ff';
      overlayCtx.lineWidth = 0.6;
      const hexSize = R * 0.32;
      const hexRows = 5;
      for (let row = -hexRows; row <= hexRows; row++) {
        for (let col = -hexRows; col <= hexRows; col++) {
          const hx = b.x + col * hexSize * 1.5;
          const hy = b.y + row * hexSize * Math.sqrt(3) + (col % 2 ? hexSize * Math.sqrt(3) / 2 : 0);
          if (Math.hypot(hx - b.x, hy - b.y) > R * 0.92) continue;
          overlayCtx.beginPath();
          for (let i = 0; i <= 6; i++) {
            const a = i * Math.PI / 3 - Math.PI / 2;
            const px = hx + Math.cos(a) * hexSize * 0.5;
            const py = hy + Math.sin(a) * hexSize * 0.5;
            if (i === 0) overlayCtx.moveTo(px, py);
            else overlayCtx.lineTo(px, py);
          }
          overlayCtx.stroke();
        }
      }

      overlayCtx.globalAlpha = 1;
      overlayCtx.setLineDash([10, 7]);
      overlayCtx.lineDashOffset = -time * 40;
      overlayCtx.beginPath();
      overlayCtx.arc(b.x, b.y, R, 0, Math.PI * 2);
      overlayCtx.strokeStyle = 'rgba(0,207,255,' + (0.4 + ratio * 0.45) + ')';
      overlayCtx.lineWidth = 2;
      overlayCtx.shadowColor = '#00cfff';
      overlayCtx.shadowBlur = 10;
      overlayCtx.stroke();
      overlayCtx.setLineDash([]);

      const innerR = R * (0.55 + pulse * 0.08);
      overlayCtx.beginPath();
      overlayCtx.arc(b.x, b.y, innerR, 0, Math.PI * 2);
      overlayCtx.strokeStyle = 'rgba(160,240,255,' + (0.25 + ratio * 0.35) + ')';
      overlayCtx.lineWidth = 1.5;
      overlayCtx.shadowBlur = 6;
      overlayCtx.stroke();

      const dotCount = Math.max(3, Math.round(ratio * 10));
      for (let i = 0; i < dotCount; i++) {
        const a = time * 1.4 + (i / dotCount) * Math.PI * 2;
        const dx = b.x + Math.cos(a) * R * 0.94;
        const dy = b.y + Math.sin(a) * R * 0.94;
        overlayCtx.beginPath();
        overlayCtx.arc(dx, dy, 2.2, 0, Math.PI * 2);
        overlayCtx.fillStyle = 'rgba(200,245,255,' + (0.55 + ratio * 0.4) + ')';
        overlayCtx.shadowBlur = 10;
        overlayCtx.fill();
      }

      overlayCtx.restore();
    }
  }

  // ═══════════════════════════════════════════════
  // 無下限波紋
  // ═══════════════════════════════════════════════
  function drawInfinityPulses() {
    for (const p of FX.infinityPulses) {
      const prog = 1 - clamp(p.life / p.maxLife, 0, 1);
      const fade = clamp(p.life / p.maxLife, 0, 1);
      const bigScale = p.big ? 2.2 : 1;
      const r = (8 + prog * 32) * bigScale;

      overlayCtx.save();
      overlayCtx.globalCompositeOperation = 'lighter';
      overlayCtx.globalAlpha = fade * 0.9;
      overlayCtx.strokeStyle = p.color || '#00cfff';
      overlayCtx.shadowColor = p.color || '#00cfff';
      overlayCtx.shadowBlur = 20;
      overlayCtx.lineWidth = 3 * fade * bigScale;
      overlayCtx.beginPath();
      overlayCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
      overlayCtx.stroke();

      overlayCtx.globalAlpha = fade * 0.7;
      overlayCtx.lineWidth = 1.5;
      overlayCtx.beginPath();
      overlayCtx.moveTo(p.x - r, p.y); overlayCtx.lineTo(p.x + r, p.y);
      overlayCtx.moveTo(p.x, p.y - r); overlayCtx.lineTo(p.x, p.y + r);
      overlayCtx.stroke();
      overlayCtx.restore();
    }
  }

  // ═══════════════════════════════════════════════
  // 紫球蓄力：藍紅球聚攏
  // ═══════════════════════════════════════════════
  function drawPurpleChargingEffects() {
    const time = performance.now() / 1000;
    for (const c of FX.purpleCharges) {
      const ball = c.ball;
      if (!ball) continue;
      const prog = 1 - clamp(ball.gojoCharging / ball.gojoChargeMax, 0, 1);

      overlayCtx.save();
      overlayCtx.globalCompositeOperation = 'lighter';

      // 地面預警圓
      overlayCtx.globalAlpha = 0.35 * (1 - prog);
      overlayCtx.strokeStyle = '#bf00ff';
      overlayCtx.lineWidth = 2;
      overlayCtx.setLineDash([6, 6]);
      overlayCtx.lineDashOffset = time * 30;
      overlayCtx.beginPath();
      overlayCtx.arc(c.x, c.y, 70 - prog * 30, 0, Math.PI * 2);
      overlayCtx.stroke();
      overlayCtx.setLineDash([]);

      const mergeProg = clamp(prog / 0.75, 0, 1);
      const offsetDist = 60 * (1 - mergeProg);
      const rise = 10 * (1 - mergeProg);

      const blueX = c.x - offsetDist;
      const blueY = c.y - rise;
      const redX = c.x + offsetDist;
      const redY = c.y - rise;
      const orbR = 9 + 12 * mergeProg;

      if (mergeProg < 1) {
        const lineGrad = overlayCtx.createLinearGradient(blueX, blueY, redX, redY);
        lineGrad.addColorStop(0, 'rgba(0,207,255,' + (0.5 + 0.3 * mergeProg) + ')');
        lineGrad.addColorStop(0.5, 'rgba(200,100,255,' + (0.3 + 0.3 * mergeProg) + ')');
        lineGrad.addColorStop(1, 'rgba(255,68,68,' + (0.5 + 0.3 * mergeProg) + ')');
        overlayCtx.strokeStyle = lineGrad;
        overlayCtx.lineWidth = 2 + 3 * mergeProg;
        overlayCtx.shadowColor = '#bf00ff';
        overlayCtx.shadowBlur = 12;
        overlayCtx.beginPath();
        overlayCtx.moveTo(blueX, blueY);
        overlayCtx.lineTo(redX, redY);
        overlayCtx.stroke();
      }

      if (mergeProg < 0.98) {
        overlayCtx.shadowColor = '#00eaff';
        overlayCtx.shadowBlur = 22;
        const bg = overlayCtx.createRadialGradient(blueX - orbR * 0.3, blueY - orbR * 0.3, 1, blueX, blueY, orbR);
        bg.addColorStop(0, '#ffffff');
        bg.addColorStop(0.4, '#aaf0ff');
        bg.addColorStop(0.7, '#00cfff');
        bg.addColorStop(1, '#0066aa');
        overlayCtx.fillStyle = bg;
        overlayCtx.beginPath();
        overlayCtx.arc(blueX, blueY, orbR, 0, Math.PI * 2);
        overlayCtx.fill();
      }
      if (mergeProg < 0.98) {
        overlayCtx.shadowColor = '#ff4444';
        overlayCtx.shadowBlur = 22;
        const rg = overlayCtx.createRadialGradient(redX - orbR * 0.3, redY - orbR * 0.3, 1, redX, redY, orbR);
        rg.addColorStop(0, '#ffffff');
        rg.addColorStop(0.4, '#ffb0b0');
        rg.addColorStop(0.7, '#ff4444');
        rg.addColorStop(1, '#8a0000');
        overlayCtx.fillStyle = rg;
        overlayCtx.beginPath();
        overlayCtx.arc(redX, redY, orbR, 0, Math.PI * 2);
        overlayCtx.fill();
      }

      if (mergeProg > 0.85) {
        const flashProg = (mergeProg - 0.85) / 0.15;
        const flashAlpha = 1 - flashProg;
        const flashR = 25 + 40 * flashProg;
        const fg = overlayCtx.createRadialGradient(c.x, c.y, 0, c.x, c.y, flashR);
        fg.addColorStop(0, 'rgba(255,255,255,' + (flashAlpha * 0.95) + ')');
        fg.addColorStop(0.4, 'rgba(224,176,255,' + (flashAlpha * 0.7) + ')');
        fg.addColorStop(1, 'rgba(191,0,255,0)');
        overlayCtx.shadowColor = '#ffffff';
        overlayCtx.shadowBlur = 30 * flashAlpha;
        overlayCtx.fillStyle = fg;
        overlayCtx.beginPath();
        overlayCtx.arc(c.x, c.y, flashR, 0, Math.PI * 2);
        overlayCtx.fill();
      }

      // 環繞粒子
      const sparkCount = Math.round(8 + prog * 14);
      for (let i = 0; i < sparkCount; i++) {
        const a = time * 3 + (i / sparkCount) * Math.PI * 2 + c.seed;
        const sparkR = 40 - prog * 20 + Math.sin(time * 8 + i) * 5;
        const sx = c.x + Math.cos(a) * sparkR;
        const sy = c.y + Math.sin(a) * sparkR;
        overlayCtx.globalAlpha = 0.5 + prog * 0.5;
        overlayCtx.fillStyle = i % 2 ? '#00cfff' : '#ff4444';
        overlayCtx.shadowColor = i % 2 ? '#00cfff' : '#ff4444';
        overlayCtx.shadowBlur = 10;
        overlayCtx.beginPath();
        overlayCtx.arc(sx, sy, 1.2 + prog * 1.2, 0, Math.PI * 2);
        overlayCtx.fill();
      }

      overlayCtx.restore();
    }
  }

  // ═══════════════════════════════════════════════
  // 紫球主體
  // ═══════════════════════════════════════════════
  function drawPurpleEnhancements() {
    if (!state || !state.balls) return;
    const time = performance.now() / 1000;

    for (const b of state.balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== 'gojo') continue;
      if (!Array.isArray(b.gojoBalls)) continue;

      for (const ball of b.gojoBalls) {
        if (!ball || ball.type !== 'purple' || !ball.active) continue;
        if (ball.gojoChargingVisual) continue;

        overlayCtx.save();
        overlayCtx.globalCompositeOperation = 'lighter';

        // 額外拖尾
        const trail = ball.trail || [];
        for (let i = 0; i < trail.length; i++) {
          const t = trail[i];
          const frac = (i + 1) / trail.length;
          const angle = time * 8 + i * 0.7;
          const offset = 14 * (1 - frac);
          for (let k = 0; k < 2; k++) {
            const side = k === 0 ? 1 : -1;
            const px = t.x + Math.cos(angle + k * Math.PI) * offset * side;
            const py = t.y + Math.sin(angle + k * Math.PI) * offset * side;
            overlayCtx.globalAlpha = frac * 0.9;
            overlayCtx.fillStyle = k === 0 ? '#e0b0ff' : '#bf00ff';
            overlayCtx.shadowColor = '#bf00ff';
            overlayCtx.shadowBlur = 14 * frac;
            overlayCtx.beginPath();
            overlayCtx.arc(px, py, 2 + frac * 2.5, 0, Math.PI * 2);
            overlayCtx.fill();
          }
        }

        const pulse = 0.85 + 0.15 * Math.sin(time * 10);
        // 外光暈
        const auraGrad = overlayCtx.createRadialGradient(ball.x, ball.y, ball.r * 0.4, ball.x, ball.y, ball.r * 2.6);
        auraGrad.addColorStop(0, 'rgba(191,0,255,0.4)');
        auraGrad.addColorStop(0.5, 'rgba(191,0,255,0.15)');
        auraGrad.addColorStop(1, 'rgba(75,0,102,0)');
        overlayCtx.globalAlpha = pulse;
        overlayCtx.fillStyle = auraGrad;
        overlayCtx.beginPath();
        overlayCtx.arc(ball.x, ball.y, ball.r * 2.6, 0, Math.PI * 2);
        overlayCtx.fill();

        // 主體
        const coreGrad = overlayCtx.createRadialGradient(ball.x - 3, ball.y - 3, 1, ball.x, ball.y, ball.r * 1.2);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.25, '#f0d0ff');
        coreGrad.addColorStop(0.6, '#bf00ff');
        coreGrad.addColorStop(1, 'rgba(75,0,102,0.85)');
        overlayCtx.globalAlpha = 1;
        overlayCtx.fillStyle = coreGrad;
        overlayCtx.shadowColor = '#bf00ff';
        overlayCtx.shadowBlur = 40 * pulse;
        overlayCtx.beginPath();
        overlayCtx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        overlayCtx.fill();

        // 三層旋轉環
        for (let ring = 0; ring < 3; ring++) {
          const ringR = ball.r * (1.7 + ring * 0.55) * pulse;
          overlayCtx.globalAlpha = 0.6 - ring * 0.15;
          overlayCtx.strokeStyle = ring === 1 ? '#e0b0ff' : '#bf00ff';
          overlayCtx.lineWidth = 2.8 - ring * 0.7;
          overlayCtx.shadowColor = '#bf00ff';
          overlayCtx.shadowBlur = 22 - ring * 5;
          overlayCtx.beginPath();
          overlayCtx.arc(ball.x, ball.y, ringR,
            time * (1 + ring * 0.4),
            time * (1 + ring * 0.4) + Math.PI * 1.55);
          overlayCtx.stroke();
        }

        // 電場短刺
        for (let i = 0; i < 12; i++) {
          const a = time * 3 + (i / 12) * Math.PI * 2;
          const inner = ball.r * 1.55;
          const outer = ball.r * (2.2 + 0.6 * Math.sin(time * 12 + i));
          overlayCtx.globalAlpha = 0.8;
          overlayCtx.strokeStyle = '#e0b0ff';
          overlayCtx.lineWidth = 1.8;
          overlayCtx.shadowColor = '#bf00ff';
          overlayCtx.shadowBlur = 10;
          overlayCtx.beginPath();
          overlayCtx.moveTo(ball.x + Math.cos(a) * inner, ball.y + Math.sin(a) * inner);
          overlayCtx.lineTo(ball.x + Math.cos(a) * outer, ball.y + Math.sin(a) * outer);
          overlayCtx.stroke();
        }

        overlayCtx.restore();
      }
    }
  }

  // ═══════════════════════════════════════════════
  // 蒼拳
  // ═══════════════════════════════════════════════
  function drawFistBursts() {
    for (const fx of FX.fistBursts) {
      const prog = 1 - clamp(fx.life / fx.maxLife, 0, 1);
      const fade = clamp(fx.life / fx.maxLife, 0, 1);
      const dx = Math.cos(fx.angle);
      const dy = Math.sin(fx.angle);
      const dist = Math.hypot(fx.x - fx.originX, fx.y - fx.originY);

      overlayCtx.save();
      overlayCtx.globalCompositeOperation = 'lighter';

      const trailProg = Math.min(1, prog / 0.5);
      const trailLen = dist * trailProg;
      overlayCtx.globalAlpha = fade * 0.85;
      overlayCtx.strokeStyle = '#aaf0ff';
      overlayCtx.lineWidth = 6 * (1 - prog * 0.5);
      overlayCtx.shadowColor = '#00cfff';
      overlayCtx.shadowBlur = 18;
      overlayCtx.lineCap = 'round';
      overlayCtx.beginPath();
      overlayCtx.moveTo(fx.originX, fx.originY);
      overlayCtx.lineTo(fx.originX + dx * trailLen, fx.originY + dy * trailLen);
      overlayCtx.stroke();

      if (prog < 0.7) {
        const hitProg = prog / 0.7;
        const flashR = 20 + hitProg * 35;
        const flashGrad = overlayCtx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, flashR);
        flashGrad.addColorStop(0, 'rgba(255,255,255,' + ((1 - hitProg) * fade) + ')');
        flashGrad.addColorStop(0.3, 'rgba(170,240,255,' + ((1 - hitProg) * fade * 0.7) + ')');
        flashGrad.addColorStop(1, 'rgba(0,207,255,0)');
        overlayCtx.globalAlpha = 1;
        overlayCtx.fillStyle = flashGrad;
        overlayCtx.beginPath();
        overlayCtx.arc(fx.x, fx.y, flashR, 0, Math.PI * 2);
        overlayCtx.fill();

        for (let ring = 0; ring < 4; ring++) {
          const startR = 30 + ring * 12;
          const endR = 8;
          const ringProg = Math.min(1, (prog - ring * 0.05) / 0.7);
          if (ringProg <= 0) continue;
          const ringR = startR + (endR - startR) * ringProg;
          overlayCtx.globalAlpha = (1 - ringProg) * fade * 0.8;
          overlayCtx.strokeStyle = ring % 2 ? '#aaf0ff' : '#00cfff';
          overlayCtx.lineWidth = 2.5;
          overlayCtx.shadowColor = '#00cfff';
          overlayCtx.shadowBlur = 14;
          overlayCtx.beginPath();
          overlayCtx.arc(fx.x, fx.y, ringR, 0, Math.PI * 2);
          overlayCtx.stroke();
        }

        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + fx.seed;
          const inner = 12;
          const outer = 30 + hitProg * 40;
          overlayCtx.globalAlpha = (1 - hitProg) * fade * 0.75;
          overlayCtx.strokeStyle = '#aaf0ff';
          overlayCtx.lineWidth = 2;
          overlayCtx.beginPath();
          overlayCtx.moveTo(fx.x + Math.cos(a) * inner, fx.y + Math.sin(a) * inner);
          overlayCtx.lineTo(fx.x + Math.cos(a) * outer, fx.y + Math.sin(a) * outer);
          overlayCtx.stroke();
        }

        if (prog < 0.35) {
          overlayCtx.globalAlpha = (1 - prog / 0.35) * fade;
          overlayCtx.font = '28px serif';
          overlayCtx.textAlign = 'center';
          overlayCtx.textBaseline = 'middle';
          overlayCtx.fillText('\uD83D\uDC4A', fx.x, fx.y - 10 - prog * 30);
        }
      }

      overlayCtx.restore();
    }
  }

  // ═══════════════════════════════════════════════
  // 無限制虛式紫爆炸
  // ═══════════════════════════════════════════════
  function drawClashBursts() {
    for (const fx of FX.clashBursts) {
      const prog = 1 - clamp(fx.life / fx.maxLife, 0, 1);
      const fade = clamp(fx.life / fx.maxLife, 0, 1);

      overlayCtx.save();
      overlayCtx.globalCompositeOperation = 'lighter';

      // 衝擊波環
      for (const ring of fx.rings) {
        const localProg = Math.max(0, (prog - ring.delay) / (1 - ring.delay));
        if (localProg <= 0) continue;
        const ease = 1 - Math.pow(1 - localProg, 3);
        const r = ring.maxR * ease;
        const alpha = (1 - localProg) * fade;
        overlayCtx.globalAlpha = alpha;
        overlayCtx.strokeStyle = ring.color;
        overlayCtx.lineWidth = ring.w * (1 - localProg * 0.6);
        overlayCtx.shadowColor = ring.color;
        overlayCtx.shadowBlur = 35;
        overlayCtx.beginPath();
        overlayCtx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
        overlayCtx.stroke();
      }

      // 中心白閃
      if (prog < 0.4) {
        const flashAlpha = (1 - prog / 0.4) * fade;
        const flashR = 80 + prog * 180;
        const g = overlayCtx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, flashR);
        g.addColorStop(0, 'rgba(255,255,255,' + flashAlpha + ')');
        g.addColorStop(0.25, 'rgba(224,176,255,' + (flashAlpha * 0.8) + ')');
        g.addColorStop(0.6, 'rgba(191,0,255,' + (flashAlpha * 0.4) + ')');
        g.addColorStop(1, 'rgba(191,0,255,0)');
        overlayCtx.globalAlpha = 1;
        overlayCtx.fillStyle = g;
        overlayCtx.beginPath();
        overlayCtx.arc(fx.x, fx.y, flashR, 0, Math.PI * 2);
        overlayCtx.fill();
      }

      // 白色裂痕線
      for (const ray of fx.rays) {
        const inner = 30 + prog * 40;
        const outer = inner + ray.len * Math.min(1, prog / 0.6);
        overlayCtx.globalAlpha = (1 - prog) * fade * 0.9;
        overlayCtx.strokeStyle = '#ffffff';
        overlayCtx.lineWidth = ray.w * (1 - prog * 0.5);
        overlayCtx.shadowColor = '#bf00ff';
        overlayCtx.shadowBlur = 18;
        overlayCtx.beginPath();
        overlayCtx.moveTo(fx.x + Math.cos(ray.angle) * inner, fx.y + Math.sin(ray.angle) * inner);
        overlayCtx.lineTo(fx.x + Math.cos(ray.angle) * outer, fx.y + Math.sin(ray.angle) * outer);
        overlayCtx.stroke();
      }

      // 空間碎片
      for (const shard of fx.shards) {
        const shAlpha = clamp(shard.life / shard.maxLife, 0, 1);
        overlayCtx.save();
        overlayCtx.globalAlpha = shAlpha * 0.95;
        overlayCtx.translate(shard.x, shard.y);
        overlayCtx.rotate(shard.rot);
        overlayCtx.fillStyle = shard.color;
        overlayCtx.shadowColor = '#bf00ff';
        overlayCtx.shadowBlur = 18;
        overlayCtx.fillRect(-shard.size / 2, -shard.size / 2, shard.size, shard.size);
        overlayCtx.strokeStyle = '#ffffff';
        overlayCtx.lineWidth = 1;
        overlayCtx.strokeRect(-shard.size / 2, -shard.size / 2, shard.size, shard.size);
        overlayCtx.restore();
      }

      // 粒子
      for (const p of fx.particles) {
        const pa = clamp(p.life / p.maxLife, 0, 1);
        overlayCtx.globalAlpha = pa;
        overlayCtx.fillStyle = p.color;
        overlayCtx.shadowColor = p.color;
        overlayCtx.shadowBlur = 14;
        overlayCtx.beginPath();
        overlayCtx.arc(p.x, p.y, p.r * pa, 0, Math.PI * 2);
        overlayCtx.fill();
      }

      overlayCtx.restore();
    }
  }

  // ═══════════════════════════════════════════════
  // 無量空處強化
  // ═══════════════════════════════════════════════
  function drawDomainEnhancements() {
    if (!state || !state.balls) return;
    const time = performance.now() / 1000;

    for (const b of state.balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== 'gojo') continue;
      if (!b.gojoDomainActive) continue;

      const dur = (typeof GOJO_DOMAIN_DURATION === 'number') ? GOJO_DOMAIN_DURATION : 5;
      const remain = Math.max(0, b.gojoDomainTimer || 0);
      const entered = 1 - remain / dur;
      const safeR = (typeof GOJO_DOMAIN_SAFE_RADIUS === 'number') ? GOJO_DOMAIN_SAFE_RADIUS : 120;
      const maxR = Math.max(
        (typeof W !== 'undefined' ? W : 350),
        (typeof H !== 'undefined' ? H : 350)
      );

      overlayCtx.save();
      overlayCtx.globalCompositeOperation = 'lighter';

      // 1. 中心無量空處核心光
      const coreR = safeR * (0.8 + 0.2 * Math.sin(time * 4));
      const coreGrad = overlayCtx.createRadialGradient(b.x, b.y, 0, b.x, b.y, coreR);
      coreGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
      coreGrad.addColorStop(0.35, 'rgba(191,0,255,0.25)');
      coreGrad.addColorStop(0.7, 'rgba(120,40,200,0.15)');
      coreGrad.addColorStop(1, 'rgba(60,0,100,0)');
      overlayCtx.fillStyle = coreGrad;
      overlayCtx.beginPath();
      overlayCtx.arc(b.x, b.y, coreR, 0, Math.PI * 2);
      overlayCtx.fill();

      // 2. 旋轉符文環（三層反向）
      for (let ring = 0; ring < 3; ring++) {
        const r = safeR * (0.65 + ring * 0.28) + 10 * Math.sin(time * 2 + ring);
        const spin = time * (0.8 + ring * 0.35) * (ring % 2 ? -1 : 1);
        overlayCtx.globalAlpha = 0.55 - ring * 0.12;
        overlayCtx.strokeStyle = ring % 2 ? '#e0b0ff' : '#bf00ff';
        overlayCtx.lineWidth = 2.5;
        overlayCtx.shadowColor = '#bf00ff';
        overlayCtx.shadowBlur = 20;
        overlayCtx.setLineDash([10, 6]);
        overlayCtx.lineDashOffset = spin * 20;
        overlayCtx.beginPath();
        overlayCtx.arc(b.x, b.y, r, spin, spin + Math.PI * 1.6);
        overlayCtx.stroke();
        overlayCtx.beginPath();
        overlayCtx.arc(b.x, b.y, r, spin + Math.PI, spin + Math.PI * 2.6);
        overlayCtx.stroke();
        overlayCtx.setLineDash([]);
      }

      // 3. 向外擴散的多重能量波
      const waveCount = 4;
      for (let i = 0; i < waveCount; i++) {
        const t = (entered + i / waveCount) % 1;
        const wr = 40 + t * maxR * 0.9;
        overlayCtx.globalAlpha = (1 - t) * 0.5;
        overlayCtx.strokeStyle = i % 2 ? '#e0b0ff' : '#bf00ff';
        overlayCtx.lineWidth = 4;
        overlayCtx.shadowColor = '#bf00ff';
        overlayCtx.shadowBlur = 25;
        overlayCtx.beginPath();
        overlayCtx.arc(b.x, b.y, wr, 0, Math.PI * 2);
        overlayCtx.stroke();
      }

      // 4. 螢幕邊緣咒力流
      overlayCtx.globalAlpha = 0.35;
      overlayCtx.strokeStyle = '#bf00ff';
      overlayCtx.lineWidth = 3;
      overlayCtx.shadowColor = '#bf00ff';
      overlayCtx.shadowBlur = 20;
      const Wv = (typeof W !== 'undefined' ? W : 350);
      const Hv = (typeof H !== 'undefined' ? H : 350);
      const edgeMargin = 6;
      overlayCtx.beginPath();
      // 上
      for (let i = 0; i <= 20; i++) {
        const x = edgeMargin + (Wv - edgeMargin * 2) * (i / 20);
        const y = edgeMargin + Math.sin(time * 4 + i * 0.8) * 3;
        if (i === 0) overlayCtx.moveTo(x, y); else overlayCtx.lineTo(x, y);
      }
      // 下
      for (let i = 20; i >= 0; i--) {
        const x = edgeMargin + (Wv - edgeMargin * 2) * (i / 20);
        const y = Hv - edgeMargin + Math.sin(time * 4 + i * 0.8 + Math.PI) * 3;
        overlayCtx.lineTo(x, y);
      }
      overlayCtx.stroke();

      // 5. 每個受影響敵人頭上標記
      if (typeof window.getAllCombatTargets === 'function') {
        for (const t of window.getAllCombatTargets()) {
          if (!t || t.hp <= 0 || t.player === b.player) continue;
          const isSafe = b.gojoDomainSafeSet && b.gojoDomainSafeSet.has(t);
          const dd = Math.hypot(t.x - b.x, t.y - b.y);
          const inSafe = dd <= safeR + (t.r || 25);
          const state2 = isSafe || inSafe ? 'safe' : 'afflicted';

          overlayCtx.globalAlpha = 0.9;
          overlayCtx.font = 'bold 16px sans-serif';
          overlayCtx.textAlign = 'center';
          overlayCtx.textBaseline = 'middle';
          if (state2 === 'afflicted') {
            overlayCtx.fillStyle = '#ff88ff';
            overlayCtx.shadowColor = '#bf00ff';
            overlayCtx.shadowBlur = 14;
            overlayCtx.fillText('無量空處', t.x, t.y - (t.r || 25) - 24);
          } else {
            overlayCtx.fillStyle = '#9ef09e';
            overlayCtx.shadowColor = '#9ef09e';
            overlayCtx.shadowBlur = 10;
            overlayCtx.font = 'bold 12px sans-serif';
            overlayCtx.fillText('安全', t.x, t.y - (t.r || 25) - 20);
          }
        }
      }

      // 6. 剩餘時間大字
      overlayCtx.globalAlpha = 0.95;
      overlayCtx.font = 'bold 28px Cinzel, sans-serif';
      overlayCtx.textAlign = 'center';
      overlayCtx.textBaseline = 'middle';
      overlayCtx.fillStyle = '#e0b0ff';
      overlayCtx.shadowColor = '#bf00ff';
      overlayCtx.shadowBlur = 20;
      overlayCtx.fillText('無量空處', Wv / 2, Hv - 40);
      overlayCtx.font = 'bold 20px sans-serif';
      overlayCtx.fillStyle = '#ffffff';
      overlayCtx.fillText(remain.toFixed(1) + 's', Wv / 2, Hv - 12);

      overlayCtx.restore();
    }
  }

  // ═══════════════════════════════════════════════
  // 更新
  // ═══════════════════════════════════════════════
  function updateEffects(dt) {
    if (state && state.dioWorldGlobalActive) return;

    updatePurpleCharges(dt);
    trackPurpleTrails(dt);

    for (let i = FX.infinityPulses.length - 1; i >= 0; i--) {
      FX.infinityPulses[i].life -= dt;
      if (FX.infinityPulses[i].life <= 0) FX.infinityPulses.splice(i, 1);
    }
    for (let i = FX.fistBursts.length - 1; i >= 0; i--) {
      FX.fistBursts[i].life -= dt;
      if (FX.fistBursts[i].life <= 0) FX.fistBursts.splice(i, 1);
    }
    for (let i = FX.purpleTrails.length - 1; i >= 0; i--) {
      FX.purpleTrails[i].life -= dt;
      if (FX.purpleTrails[i].life <= 0) FX.purpleTrails.splice(i, 1);
    }
    for (let i = FX.clashBursts.length - 1; i >= 0; i--) {
      const fx = FX.clashBursts[i];
      fx.life -= dt;
      for (const p of fx.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life -= dt;
      }
      for (const shard of fx.shards) {
        shard.x += shard.vx * dt;
        shard.y += shard.vy * dt;
        shard.vx *= 0.92;
        shard.vy *= 0.92;
        shard.rot += shard.rotV * dt;
        shard.life -= dt;
      }
      if (fx.life <= 0) FX.clashBursts.splice(i, 1);
    }
  }

  // ═══════════════════════════════════════════════
  // 主循環
  // ═══════════════════════════════════════════════
  // 記住上一帧的 state 參照，用來偵測「新對局」
  let lastStateRef = null;

  function loop() {
    const t = performance.now();
    const dt = Math.min(0.05, Math.max(0, (t - (FX.lastTime || t)) / 1000));
    FX.lastTime = t;

    // 偵測新對局：state 被 startGame() 重新指派時，清空所有殘留特效
    // （FX 是模組層級陣列，不會隨 state 更換自動清空）
    if (typeof state !== 'undefined' && state !== lastStateRef) {
      lastStateRef = state;
      FX.infinityPulses.length = 0;
      FX.clashBursts.length = 0;
      FX.fistBursts.length = 0;
      FX.purpleCharges.length = 0;
      FX.domainTears.length = 0;
      FX.purpleTrails.length = 0;
    }

    // 不在戰鬥：跳過所有更新與繪製，只維持 rAF 存活
    // 這解決了「主引擎 cancelAnimationFrame 停機後，gojo.js 仍每帧重畫領域特效」造成的卡頓。
    if (!isBattleActive()) {
      if (overlayCanvas) overlayCanvas.style.display = 'none';
      requestAnimationFrame(loop);
      return;
    }

    tryHookClashExplode();
    tryHookFire();
    tryHookUpdateBalls();
    tryHookPull();
    detectInfinityConsume();
    detectFistAttack();
    updateEffects(dt);
    syncOverlay();
    if (overlayCanvas && overlayCanvas.style.display !== 'none') {
      drawOverlay();
    }
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { requestAnimationFrame(loop); }, { once: true });
  } else {
    requestAnimationFrame(loop);
  }

  console.log('[gojo_vfx] v5 已載入');
})();
