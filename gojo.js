/* ============================================================================
 * gojo_vfx.js v2 — 現代最強視覺特效補丁
 * 獨立 overlay canvas：不會干擾主引擎渲染
 *
 * 效果：
 *   1. 無下限範圍光環（常駐，量條越低越暗）
 *   2. 無下限消耗時的波紋脈衝
 *   3. 紫球蓄力（藍紅球從兩側聚攏融合）+ 發射爆發
 *   4. 紫球主體增強（螺旋粒子 + 三層旋轉光環 + 電場短刺 + 中心白閃）
 *   5. 蒼拳命中特效（拳頭軌跡 + 引力收縮圈 + 放射拳壓線）
 *   6. 無限制虛式紫爆炸（多層衝擊波 + 放射光線 + 粒子飛散）
 * ============================================================================ */
(() => {
  'use strict';

  const FX = {
    infinityPulses: [],
    clashBursts: [],
    fistBursts: [],
    purpleCharges: [],
    lastTime: 0,
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  // ───────── Hook gojoClashExplode ─────────
  let hookedClashExplode = null;
  function tryHookClashExplode() {
    if (hookedClashExplode) return;
    if (typeof window.gojoClashExplode === 'function') {
      hookedClashExplode = window.gojoClashExplode;
      window.gojoClashExplode = function (b, cx, cy) {
        hookedClashExplode(b, cx, cy);
        spawnClashFX(cx, cy);
      };
      console.log('[gojo_vfx] gojoClashExplode hooked');
    }
  }

  function spawnClashFX(cx, cy) {
    FX.clashBursts.push({
      x: cx, y: cy,
      life: 1.0, maxLife: 1.0,
      seed: Math.random() * 1000,
      rings: [
        { maxR: 220, w: 6, color: '#bf00ff', delay: 0 },
        { maxR: 180, w: 4, color: '#e0b0ff', delay: 0.08 },
        { maxR: 280, w: 2, color: '#ffffff', delay: 0.15 },
      ],
      rays: Array.from({ length: 14 }, () => ({
        angle: Math.random() * Math.PI * 2,
        len: rand(100, 220),
      })),
      particles: Array.from({ length: 36 }, () => {
        const a = Math.random() * Math.PI * 2;
        const sp = rand(80, 340);
        const roll = Math.random();
        return {
          x: cx, y: cy,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: rand(0.4, 0.9), maxLife: 0.9,
          r: rand(2, 6),
          color: roll < 0.4 ? '#bf00ff' : (roll < 0.8 ? '#e0b0ff' : '#ffffff'),
        };
      }),
    });
  }

  // ───────── Hook fireGojoAttack（偵測紫球發射 → 觸發蓄力）─────────
  let hookedFire = null;
  function tryHookFire() {
    if (hookedFire) return;
    if (typeof window.fireGojoAttack === 'function') {
      hookedFire = window.fireGojoAttack;
      window.fireGojoAttack = function (b, enemy) {
        const before = (b.gojoBalls || []).length;
        hookedFire(b, enemy);
        const after = b.gojoBalls || [];
        for (let i = before; i < after.length; i++) {
          const ball = after[i];
          if (ball && ball.type === 'purple') {
            ball.gojoCharging = 0.5;
            ball.gojoChargeMax = 0.5;
            ball.gojoOriginalVx = ball.vx;
            ball.gojoOriginalVy = ball.vy;
            ball.vx = 0;
            ball.vy = 0;
            FX.purpleCharges.push({
              ball,
              x: ball.x,
              y: ball.y,
              seed: Math.random() * 1000,
            });
            FX.infinityPulses.push({ x: ball.x, y: ball.y, life: 0.35, maxLife: 0.35, color: '#bf00ff', big: true });
          }
        }
      };
      console.log('[gojo_vfx] fireGojoAttack hooked');
    }
  }

  // 更新紫球蓄力
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
        FX.infinityPulses.push({ x: c.x, y: c.y, life: 0.5, maxLife: 0.5, color: '#bf00ff', big: true });
        FX.purpleCharges.splice(i, 1);
      }
    }
  }

  // ───────── 偵測無下限消耗 ─────────
  const seenSlowingProjectiles = new WeakSet();
  function detectInfinityConsume() {
    if (!state || !state.balls) return;
    const arrays = [
      state.projectiles,
      state.otisMagicBullets,
      state.getoUltimateProjectiles,
      state.tigerNovaNeedles,
      state.oniichanSpikes,
      state.fisherOceanWaves,
    ].filter(Array.isArray);
    for (const arr of arrays) {
      for (const p of arr) {
        if (p && p.gojoSlowing && !seenSlowingProjectiles.has(p)) {
          seenSlowingProjectiles.add(p);
          FX.infinityPulses.push({ x: p.x, y: p.y, life: 0.55, maxLife: 0.55 });
        }
      }
    }
  }

  // ───────── 偵測蒼拳出拳 ─────────
  const prevFistCd = new WeakMap();
  function detectFistAttack() {
    if (!state || !state.balls) return;
    for (const b of state.balls) {
      if (!b || b.char?.type !== 'gojo') continue;
      const prev = prevFistCd.get(b) ?? 0;
      const curr = b.gojoFistCooldown ?? 0;
      if (curr > prev + 0.2 && prev < 0.5) {
        spawnFistFX(b);
      }
      prevFistCd.set(b, curr);
    }
  }

  function spawnFistFX(b) {
    const target = window.getNearestEnemyTo
      ? window.getNearestEnemyTo(b.x, b.y, b.player)
      : null;
    if (!target) return;
    const angle = Math.atan2(target.y - b.y, target.x - b.x);
    FX.fistBursts.push({
      x: target.x,
      y: target.y,
      originX: b.x,
      originY: b.y,
      angle,
      life: 0.42,
      maxLife: 0.42,
      seed: Math.random() * 1000,
    });
  }

  // ───────── Overlay canvas ─────────
  let overlayCanvas = null;
  let overlayCtx = null;

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
    return state && state.balls && state.balls.some(b =>
      b && b.hp > 0 && b.char && b.char.type === 'gojo'
    );
  }

  function syncOverlay() {
    ensureOverlay();
    const arena = document.getElementById('arena');
    if (!arena || !overlayCanvas) return;
    const active = FX.infinityPulses.length > 0
      || FX.clashBursts.length > 0
      || FX.fistBursts.length > 0
      || FX.purpleCharges.length > 0
      || hasGojo();
    if (!active) {
      overlayCanvas.style.display = 'none';
      return;
    }
    const rect = arena.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    overlayCanvas.width = Math.max(1, Math.round(arena.width * dpr));
    overlayCanvas.height = Math.max(1, Math.round(arena.height * dpr));
    overlayCanvas.style.left = rect.left + 'px';
    overlayCanvas.style.top = rect.top + 'px';
    overlayCanvas.style.width = rect.width + 'px';
    overlayCanvas.style.height = rect.height + 'px';
    overlayCanvas.style.display = 'block';
  }

  // ───────── 主繪製 ─────────
  function drawOverlay() {
    if (!overlayCtx || !overlayCanvas) return;
    const arena = document.getElementById('arena');
    if (!arena) return;
    const W = arena.width;
    const H = arena.height;
    const dpr = overlayCanvas.width / Math.max(1, W);
    overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    overlayCtx.clearRect(0, 0, W, H);

    drawInfinityAura();
    drawInfinityPulses();
    drawPurpleChargingEffects();
    drawPurpleEnhancements();
    drawFistBursts();
    drawClashBursts();
  }

  // ═══════════════════════════════════════════════
  // 1. 無下限範圍光環
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
      fillGrad.addColorStop(0.6, `rgba(0,207,255,${fillAlpha * 0.5})`);
      fillGrad.addColorStop(1, `rgba(120,240,255,${fillAlpha * 1.6})`);
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
      overlayCtx.strokeStyle = `rgba(0,207,255,${0.4 + ratio * 0.45})`;
      overlayCtx.lineWidth = 2;
      overlayCtx.shadowColor = '#00cfff';
      overlayCtx.shadowBlur = 10;
      overlayCtx.stroke();
      overlayCtx.setLineDash([]);

      const innerR = R * (0.55 + pulse * 0.08);
      overlayCtx.beginPath();
      overlayCtx.arc(b.x, b.y, innerR, 0, Math.PI * 2);
      overlayCtx.strokeStyle = `rgba(160,240,255,${0.25 + ratio * 0.35})`;
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
        overlayCtx.fillStyle = `rgba(200,245,255,${0.55 + ratio * 0.4})`;
        overlayCtx.shadowBlur = 10;
        overlayCtx.fill();
      }

      overlayCtx.restore();
    }
  }

  // ═══════════════════════════════════════════════
  // 2. 無下限消耗波紋
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
  // 3. 紫球蓄力：藍紅球從兩側聚攏融合
  // ═══════════════════════════════════════════════
  function drawPurpleChargingEffects() {
    const time = performance.now() / 1000;
    for (const c of FX.purpleCharges) {
      const ball = c.ball;
      if (!ball) continue;
      const prog = 1 - clamp(ball.gojoCharging / ball.gojoChargeMax, 0, 1);

      overlayCtx.save();
      overlayCtx.globalCompositeOperation = 'lighter';

      const mergeProg = clamp(prog / 0.75, 0, 1);
      const offsetDist = 60 * (1 - mergeProg);
      const rise = 10 * (1 - mergeProg);

      const blueX = c.x - offsetDist;
      const blueY = c.y - rise;
      const redX = c.x + offsetDist;
      const redY = c.y - rise;
      const orbR = 9 + 12 * mergeProg;

      // 兩球之間的張力連線
      if (mergeProg < 1) {
        const lineGrad = overlayCtx.createLinearGradient(blueX, blueY, redX, redY);
        lineGrad.addColorStop(0, `rgba(0,207,255,${0.5 + 0.3 * mergeProg})`);
        lineGrad.addColorStop(0.5, `rgba(200,100,255,${0.3 + 0.3 * mergeProg})`);
        lineGrad.addColorStop(1, `rgba(255,68,68,${0.5 + 0.3 * mergeProg})`);
        overlayCtx.strokeStyle = lineGrad;
        overlayCtx.lineWidth = 2 + 3 * mergeProg;
        overlayCtx.shadowColor = '#bf00ff';
        overlayCtx.shadowBlur = 12;
        overlayCtx.beginPath();
        overlayCtx.moveTo(blueX, blueY);
        overlayCtx.lineTo(redX, redY);
        overlayCtx.stroke();
      }

      // 藍球
      if (mergeProg < 0.98) {
        overlayCtx.shadowColor = '#00eaff';
        overlayCtx.shadowBlur = 22;
        const blueGrad = overlayCtx.createRadialGradient(
          blueX - orbR * 0.3, blueY - orbR * 0.3, 1,
          blueX, blueY, orbR
        );
        blueGrad.addColorStop(0, '#ffffff');
        blueGrad.addColorStop(0.4, '#aaf0ff');
        blueGrad.addColorStop(0.7, '#00cfff');
        blueGrad.addColorStop(1, '#0066aa');
        overlayCtx.fillStyle = blueGrad;
        overlayCtx.beginPath();
        overlayCtx.arc(blueX, blueY, orbR, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.strokeStyle = 'rgba(200,250,255,0.8)';
        overlayCtx.lineWidth = 1.5;
        overlayCtx.shadowBlur = 0;
        overlayCtx.stroke();
      }

      // 紅球
      if (mergeProg < 0.98) {
        overlayCtx.shadowColor = '#ff4444';
        overlayCtx.shadowBlur = 22;
        const redGrad = overlayCtx.createRadialGradient(
          redX - orbR * 0.3, redY - orbR * 0.3, 1,
          redX, redY, orbR
        );
        redGrad.addColorStop(0, '#ffffff');
        redGrad.addColorStop(0.4, '#ffb0b0');
        redGrad.addColorStop(0.7, '#ff4444');
        redGrad.addColorStop(1, '#8a0000');
        overlayCtx.fillStyle = redGrad;
        overlayCtx.beginPath();
        overlayCtx.arc(redX, redY, orbR, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.strokeStyle = 'rgba(255,220,220,0.8)';
        overlayCtx.lineWidth = 1.5;
        overlayCtx.shadowBlur = 0;
        overlayCtx.stroke();
      }

      // 融合瞬間爆閃
      if (mergeProg > 0.85) {
        const flashProg = (mergeProg - 0.85) / 0.15;
        const flashAlpha = 1 - flashProg;
        const flashR = 20 + 30 * flashProg;

        overlayCtx.shadowColor = '#ffffff';
        overlayCtx.shadowBlur = 30 * flashAlpha;
        const flashGrad = overlayCtx.createRadialGradient(
          c.x, c.y, 0, c.x, c.y, flashR
        );
        flashGrad.addColorStop(0, `rgba(255,255,255,${flashAlpha * 0.95})`);
        flashGrad.addColorStop(0.4, `rgba(224,176,255,${flashAlpha * 0.7})`);
        flashGrad.addColorStop(1, 'rgba(191,0,255,0)');
        overlayCtx.fillStyle = flashGrad;
        overlayCtx.beginPath();
        overlayCtx.arc(c.x, c.y, flashR, 0, Math.PI * 2);
        overlayCtx.fill();

        const ringR = 15 + flashProg * 45;
        overlayCtx.globalAlpha = flashAlpha * 0.85;
        overlayCtx.strokeStyle = '#bf00ff';
        overlayCtx.lineWidth = 3 * flashAlpha + 1;
        overlayCtx.shadowColor = '#bf00ff';
        overlayCtx.shadowBlur = 20;
        overlayCtx.beginPath();
        overlayCtx.arc(c.x, c.y, ringR, 0, Math.PI * 2);
        overlayCtx.stroke();
        overlayCtx.globalAlpha = 1;
      }

      // 環繞粒子
      const sparkCount = Math.round(6 + prog * 10);
      for (let i = 0; i < sparkCount; i++) {
        const a = time * 3 + (i / sparkCount) * Math.PI * 2 + c.seed;
        const sparkR = 30 - prog * 15 + Math.sin(time * 8 + i) * 4;
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
  // 4. 紫球主體增強
  // ═══════════════════════════════════════════════
  function drawPurpleEnhancements() {
    if (!state || !state.balls) return;
    const time = performance.now() / 1000;

    for (const b of state.balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== 'gojo') continue;
      if (!Array.isArray(b.gojoBalls)) continue;

      for (const ball of b.gojoBalls) {
        if (!ball || ball.type !== 'purple' || !ball.active) continue;

        overlayCtx.save();
        overlayCtx.globalCompositeOperation = 'lighter';

        const trail = ball.trail || [];
        for (let i = 0; i < trail.length; i++) {
          const t = trail[i];
          const frac = (i + 1) / trail.length;
          const angle = time * 8 + i * 0.7;
          const offset = 12 * (1 - frac);
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
        const coreGrad = overlayCtx.createRadialGradient(
          ball.x - 3, ball.y - 3, 1,
          ball.x, ball.y, ball.r * 1.2
        );
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.25, '#f0d0ff');
        coreGrad.addColorStop(0.6, '#bf00ff');
        coreGrad.addColorStop(1, 'rgba(75,0,102,0.85)');
        overlayCtx.globalAlpha = 1;
        overlayCtx.fillStyle = coreGrad;
        overlayCtx.shadowColor = '#bf00ff';
        overlayCtx.shadowBlur = 35 * pulse;
        overlayCtx.beginPath();
        overlayCtx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        overlayCtx.fill();

        for (let ring = 0; ring < 3; ring++) {
          const ringR = ball.r * (1.7 + ring * 0.55) * pulse;
          const alpha = 0.55 - ring * 0.15;
          overlayCtx.globalAlpha = alpha;
          overlayCtx.strokeStyle = ring === 1 ? '#e0b0ff' : '#bf00ff';
          overlayCtx.lineWidth = 2.8 - ring * 0.7;
          overlayCtx.shadowColor = '#bf00ff';
          overlayCtx.shadowBlur = 22 - ring * 5;
          overlayCtx.beginPath();
          overlayCtx.arc(
            ball.x, ball.y, ringR,
            time * (1 + ring * 0.4),
            time * (1 + ring * 0.4) + Math.PI * 1.55
          );
          overlayCtx.stroke();
        }

        const spikeCount = 10;
        for (let i = 0; i < spikeCount; i++) {
          const a = time * 3 + (i / spikeCount) * Math.PI * 2;
          const inner = ball.r * 1.55;
          const outer = ball.r * (2.1 + 0.5 * Math.sin(time * 12 + i));
          overlayCtx.globalAlpha = 0.75;
          overlayCtx.strokeStyle = '#e0b0ff';
          overlayCtx.lineWidth = 1.8;
          overlayCtx.shadowColor = '#bf00ff';
          overlayCtx.shadowBlur = 10;
          overlayCtx.beginPath();
          overlayCtx.moveTo(ball.x + Math.cos(a) * inner, ball.y + Math.sin(a) * inner);
          overlayCtx.lineTo(ball.x + Math.cos(a) * outer, ball.y + Math.sin(a) * outer);
          overlayCtx.stroke();
        }

        overlayCtx.globalAlpha = 0.95;
        overlayCtx.fillStyle = '#ffffff';
        overlayCtx.shadowColor = '#ffffff';
        overlayCtx.shadowBlur = 18;
        overlayCtx.beginPath();
        overlayCtx.arc(ball.x, ball.y, ball.r * 0.4 * pulse, 0, Math.PI * 2);
        overlayCtx.fill();

        overlayCtx.restore();
      }
    }
  }

  // ═══════════════════════════════════════════════
  // 5. 蒼拳命中特效
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

      overlayCtx.globalAlpha = fade * 0.7;
      overlayCtx.strokeStyle = '#ffffff';
      overlayCtx.lineWidth = 2;
      overlayCtx.shadowBlur = 10;
      overlayCtx.beginPath();
      overlayCtx.moveTo(fx.originX, fx.originY);
      overlayCtx.lineTo(fx.originX + dx * trailLen, fx.originY + dy * trailLen);
      overlayCtx.stroke();

      if (prog < 0.7) {
        const hitProg = prog / 0.7;
        const flashR = 20 + hitProg * 35;

        const flashGrad = overlayCtx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, flashR);
        flashGrad.addColorStop(0, `rgba(255,255,255,${(1 - hitProg) * fade})`);
        flashGrad.addColorStop(0.3, `rgba(170,240,255,${(1 - hitProg) * fade * 0.7})`);
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

        const rayCount = 8;
        for (let i = 0; i < rayCount; i++) {
          const a = (i / rayCount) * Math.PI * 2 + fx.seed;
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
          overlayCtx.fillText('👊', fx.x, fx.y - 10 - prog * 30);
        }
      }

      overlayCtx.restore();
    }
  }

  // ═══════════════════════════════════════════════
  // 6. 無限制虛式紫爆炸
  // ═══════════════════════════════════════════════
  function drawClashBursts() {
    for (const fx of FX.clashBursts) {
      const prog = 1 - clamp(fx.life / fx.maxLife, 0, 1);
      const fade = clamp(fx.life / fx.maxLife, 0, 1);

      overlayCtx.save();
      overlayCtx.globalCompositeOperation = 'lighter';

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
        overlayCtx.shadowBlur = 30;
        overlayCtx.beginPath();
        overlayCtx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
        overlayCtx.stroke();
      }

      if (prog < 0.35) {
        const flashAlpha = (1 - prog / 0.35) * fade;
        const flashR = 60 + prog * 120;
        const g = overlayCtx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, flashR);
        g.addColorStop(0, `rgba(255,255,255,${flashAlpha})`);
        g.addColorStop(0.3, `rgba(224,176,255,${flashAlpha * 0.6})`);
        g.addColorStop(1, 'rgba(191,0,255,0)');
        overlayCtx.globalAlpha = 1;
        overlayCtx.fillStyle = g;
        overlayCtx.beginPath();
        overlayCtx.arc(fx.x, fx.y, flashR, 0, Math.PI * 2);
        overlayCtx.fill();
      }

      for (let ri = 0; ri < fx.rays.length; ri++) {
        const ray = fx.rays[ri];
        const inner = 20 + prog * 30;
        const outer = inner + ray.len * Math.min(1, prog / 0.6);
        overlayCtx.globalAlpha = (1 - prog) * fade * 0.9;
        overlayCtx.strokeStyle = (ri % 2 === 0) ? '#e0b0ff' : '#bf00ff';
        overlayCtx.lineWidth = 2.5;
        overlayCtx.shadowColor = '#bf00ff';
        overlayCtx.shadowBlur = 16;
        overlayCtx.beginPath();
        overlayCtx.moveTo(fx.x + Math.cos(ray.angle) * inner, fx.y + Math.sin(ray.angle) * inner);
        overlayCtx.lineTo(fx.x + Math.cos(ray.angle) * outer, fx.y + Math.sin(ray.angle) * outer);
        overlayCtx.stroke();
      }

      for (const p of fx.particles) {
        const particleAlpha = clamp(p.life / p.maxLife, 0, 1);
        overlayCtx.globalAlpha = particleAlpha;
        overlayCtx.fillStyle = p.color;
        overlayCtx.shadowColor = p.color;
        overlayCtx.shadowBlur = 14;
        overlayCtx.beginPath();
        overlayCtx.arc(p.x, p.y, p.r * particleAlpha, 0, Math.PI * 2);
        overlayCtx.fill();
      }

      overlayCtx.restore();
    }
  }

  // ═══════════════════════════════════════════════
  // 更新
  // ═══════════════════════════════════════════════
  function updateEffects(dt) {
    if (state && state.dioWorldGlobalActive) return;

    updatePurpleCharges(dt);

    for (let i = FX.infinityPulses.length - 1; i >= 0; i--) {
      FX.infinityPulses[i].life -= dt;
      if (FX.infinityPulses[i].life <= 0) FX.infinityPulses.splice(i, 1);
    }

    for (let i = FX.fistBursts.length - 1; i >= 0; i--) {
      FX.fistBursts[i].life -= dt;
      if (FX.fistBursts[i].life <= 0) FX.fistBursts.splice(i, 1);
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
      if (fx.life <= 0) FX.clashBursts.splice(i, 1);
    }
  }

  // ═══════════════════════════════════════════════
  // 主循環
  // ═══════════════════════════════════════════════
  function loop() {
    const t = performance.now();
    const dt = Math.min(0.05, Math.max(0, (t - (FX.lastTime || t)) / 1000));
    FX.lastTime = t;

    tryHookClashExplode();
    tryHookFire();
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
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(loop), { once: true });
  } else {
    requestAnimationFrame(loop);
  }

  console.log('[gojo_vfx] 現代最強視覺特效 v2 已載入');
})();
