/* ultrafix.js — 超界者 / 廚神海克斯修補 */
(() => {
  'use strict';

  const FX = {
    warpTrails: [],
    blackHoleBursts: [],
    chefPressureBursts: [],
    lastTime: 0,
  };

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  // ═══ 補丁 1：boundaryUpdate（時停修復 + 迷彩改用 camouflaged + 維度躍遷殘影） ═══
  window.boundaryUpdate = function boundaryUpdatePatched(b, dt) {
    if (!b || b.hp <= 0) return;
    if (b.char?.type !== 'boundary') return;
    if (state.dioWorldGlobalActive && b !== state.dioWorldCaster) return;

    if (!b.boundaryWarpUsed && (b.hp <= BOUNDARY_WARP_TRIGGER_HP ||
        (state.elapsed || 0) >= BOUNDARY_WARP_TRIGGER_TIME)) {
      window.boundaryTriggerWarp(b);
    }

    if (b.boundaryWarpActive) {
      b.boundaryWarpTimer -= dt;
      b.invincible = true;

      FX.warpTrails.push({
        x: b.x, y: b.y,
        angle: b.boundaryWarpAngle || 0,
        life: 0.55, maxLife: 0.55,
        seed: Math.random() * 1000
      });
      if (FX.warpTrails.length > 80) FX.warpTrails.shift();

      const target = window.getNearestEnemyTo(b.x, b.y, b.player);
      if (target) {
        const d = Math.hypot(target.x - b.x, target.y - b.y) || 1;
        const desired = Math.atan2(target.y - b.y, target.x - b.x);
        let turn = desired - (b.boundaryWarpAngle || 0);
        while (turn > Math.PI) turn -= Math.PI * 2;
        while (turn < -Math.PI) turn += Math.PI * 2;
        const maxTurn = BOUNDARY_WARP_TURN_RATE * dt;
        b.boundaryWarpAngle += Math.max(-maxTurn, Math.min(maxTurn, turn));
        b.vx = Math.cos(b.boundaryWarpAngle) * BOUNDARY_WARP_SPEED;
        b.vy = Math.sin(b.boundaryWarpAngle) * BOUNDARY_WARP_SPEED;

        const lastHit = b.boundaryWarpHits.get(target) ?? -Infinity;
        if (d <= (b.r || RADIUS) + (target.r || RADIUS) + 8 &&
            (state.elapsed - lastHit) >= BOUNDARY_WARP_HIT_INTERVAL) {
          b.boundaryWarpHits.set(target, state.elapsed);
          window.dealDamage(target, BOUNDARY_WARP_DAMAGE, {
            attackerPlayer: b.player, attackerBall: b
          });
        }
      }

      b.camouflaged = false;
      b.ewCamouflaged = false;
      b.ewCamouflageSource = null;

      if (b.boundaryWarpTimer <= 0) {
        b.boundaryWarpActive = false;
        b.invincible = false;
      }
    } else {
      b.boundaryPhaseTimer -= dt;
      if (b.boundaryPhaseTimer <= 0) {
        b.boundaryCamouflage = !b.boundaryCamouflage;
        b.boundaryPhase = b.boundaryCamouflage ? 'camouflage' : 'normal';
        b.boundaryPhaseTimer = b.boundaryCamouflage
          ? BOUNDARY_CAMOUFLAGE_DURATION
          : BOUNDARY_CAMOUFLAGE_NORMAL;
      }

      // 迷彩改用 camouflaged：白蛇看得到，一般傷害仍被擋
      b.camouflaged = b.boundaryCamouflage;
      b.ewCamouflaged = false;
      b.ewCamouflageSource = null;

      b.boundaryBlackHoleTimer -= dt;
      if (b.boundaryBlackHoleTimer <= 0) {
        b.boundaryBlackHoleTimer = BOUNDARY_BLACK_HOLE_INTERVAL;
        b.boundaryPendingHole = true;
      }
    }
  };

  // ═══ 補丁 2：boundaryExplodeHole（黑洞爆裂特效） ═══
  window.boundaryExplodeHole = function boundaryExplodeHolePatched(hole) {
    if (!hole) return;
    state.hitFlashes.push({
      x: hole.x, y: hole.y,
      r: BOUNDARY_BLACK_HOLE_BLAST_RADIUS,
      alpha: 1.15, color: '#b46cff', t: 0.5
    });
    FX.blackHoleBursts.push({
      x: hole.x, y: hole.y,
      life: 0.75, maxLife: 0.75,
      radius: BOUNDARY_BLACK_HOLE_BLAST_RADIUS,
      seed: Math.random() * 1000
    });
    if (FX.blackHoleBursts.length > 30) FX.blackHoleBursts.shift();
    for (const target of state.balls) {
      if (!target || target.hp <= 0 || target.player === hole.ownerPlayer) continue;
      if (Math.hypot(target.x - hole.x, target.y - hole.y) <=
          BOUNDARY_BLACK_HOLE_BLAST_RADIUS + (target.r || RADIUS)) {
        window.dealDamage(target, BOUNDARY_BLACK_HOLE_BLAST_DAMAGE, {
          attackerPlayer: hole.ownerPlayer,
          attackerBall: hole.ownerBall
        });
      }
    }
  };

  // ═══ 補丁 3：triggerChefPressureBurst（高壓鍋爆裂特效） ═══
  window.triggerChefPressureBurst = function triggerChefPressureBurstPatched(chef) {
    if (!chef || chef.hp <= 0 || !window.chefHasHex(chef.char, 'pressure_cooker')) return false;
    if (!chef.chefPressureReady || !chef.chefPressureBurstPending) return false;
    if ((Number(chef.chefPressure) || 0) < CHEF_PRESSURE_MAX) return false;

    chef.chefPressure = 0;
    chef.chefPressureReady = false;
    chef.chefPressureBurstPending = false;

    const targets = window.getAllCombatTargets().filter(t => {
      if (!t || t.hp <= 0 || t.player === chef.player) return false;
      const dx = Number(t.x) - Number(chef.x);
      const dy = Number(t.y) - Number(chef.y);
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return false;
      return Math.hypot(dx, dy) <= CHEF_PRESSURE_BLAST_RADIUS + window.getCombatRadius(t);
    });

    for (const target of targets) {
      if (!target || target.hp <= 0) continue;
      window.dealDamage(target, CHEF_PRESSURE_BLAST_DAMAGE, {
        attackerBall: chef,
        attackerPlayer: chef.player,
        chefPressureBurst: true
      });
    }

    if (state) {
      state.hitFlashes.push({ x: chef.x, y: chef.y, r: CHEF_PRESSURE_BLAST_RADIUS * 0.8, alpha: 1, color: CHEF_PRESSURE_FLASH_COLOR, t: 0.4 });
      state.hitFlashes.push({ x: chef.x, y: chef.y, r: CHEF_PRESSURE_BLAST_RADIUS * 0.42, alpha: 0.85, color: '#fff1c1', t: 0.22 });
      state.damageNumbers.push({ x: chef.x, y: chef.y - chef.r - 16, value: '高壓鍋！', color: CHEF_PRESSURE_FLASH_COLOR, life: 0.7, maxLife: 0.7, scale: 0.9 });
      FX.chefPressureBursts.push({
        x: chef.x, y: chef.y,
        life: 0.6, maxLife: 0.6,
        radius: CHEF_PRESSURE_BLAST_RADIUS,
        seed: Math.random() * 1000,
        isParticle: false
      });
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = rand(70, 260);
        FX.chefPressureBursts.push({
          x: chef.x, y: chef.y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: rand(0.45, 0.85),
          maxLife: 0.9,
          radius: rand(3, 8),
          isParticle: true
        });
      }
    }

    window.playHitSound('opm');
    return true;
  };

  // ═══ Overlay canvas ═══
  let overlayCanvas = null;
  let overlayCtx = null;

  function ensureOverlay() {
    if (overlayCanvas && document.body.contains(overlayCanvas)) return;
    const arena = document.getElementById('arena');
    if (!arena) return;
    overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'ultrafix-overlay';
    overlayCanvas.style.cssText = 'position:fixed;pointer-events:none;z-index:19;display:none;';
    document.body.appendChild(overlayCanvas);
    overlayCtx = overlayCanvas.getContext('2d');
  }

  function syncOverlay() {
    ensureOverlay();
    const arena = document.getElementById('arena');
    if (!arena || !overlayCanvas) return;
    const active = FX.warpTrails.length > 0
      || FX.blackHoleBursts.length > 0
      || FX.chefPressureBursts.length > 0;
    if (!active) {
      overlayCanvas.style.display = 'none';
      return;
    }
    const rect = arena.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = arena.width;
    const H = arena.height;
    overlayCanvas.width = Math.max(1, Math.round(W * dpr));
    overlayCanvas.height = Math.max(1, Math.round(H * dpr));
    overlayCanvas.style.left = rect.left + 'px';
    overlayCanvas.style.top = rect.top + 'px';
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
    const dpr = overlayCanvas.width / Math.max(1, W);
    overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    overlayCtx.clearRect(0, 0, W, H);

    // 維度躍遷殘影
    for (const t of FX.warpTrails) {
      const prog = clamp(t.life / t.maxLife, 0, 1);
      overlayCtx.save();
      overlayCtx.translate(t.x, t.y);
      overlayCtx.rotate(t.angle);

      overlayCtx.globalAlpha = prog * 0.55;
      overlayCtx.strokeStyle = '#8ee7ff';
      overlayCtx.shadowColor = '#67ddff';
      overlayCtx.shadowBlur = 20 * prog;
      overlayCtx.lineWidth = 2.5;
      overlayCtx.beginPath();
      overlayCtx.moveTo(-24 * prog, 0);
      overlayCtx.lineTo(-9 * prog, -9 * prog);
      overlayCtx.lineTo(4 * prog, 6 * prog);
      overlayCtx.lineTo(22 * prog, -3 * prog);
      overlayCtx.stroke();

      overlayCtx.globalAlpha = prog * 0.85;
      overlayCtx.strokeStyle = '#ffffff';
      overlayCtx.lineWidth = 1.2;
      overlayCtx.shadowBlur = 10;
      overlayCtx.beginPath();
      overlayCtx.moveTo(-18 * prog, 0);
      overlayCtx.lineTo(16 * prog, 0);
      overlayCtx.stroke();

      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + t.seed;
        const r = (10 + k * 5) * prog;
        overlayCtx.globalAlpha = prog * 0.8;
        overlayCtx.fillStyle = k % 2 ? '#e6faff' : '#a6f0ff';
        overlayCtx.beginPath();
        overlayCtx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.8 * prog, 0, Math.PI * 2);
        overlayCtx.fill();
      }

      overlayCtx.globalAlpha = prog * 0.35;
      overlayCtx.strokeStyle = '#c8f7ff';
      overlayCtx.shadowBlur = 14;
      overlayCtx.lineWidth = 1.5;
      overlayCtx.beginPath();
      overlayCtx.arc(0, 0, 26 * prog, 0, Math.PI * 2);
      overlayCtx.stroke();

      overlayCtx.restore();
    }

    // 黑洞爆裂
    for (const fx of FX.blackHoleBursts) {
      const prog = 1 - clamp(fx.life / fx.maxLife, 0, 1);
      const fade = clamp(fx.life / fx.maxLife, 0, 1);
      const r = fx.radius * (0.35 + prog * 1.3);
      overlayCtx.save();
      overlayCtx.globalCompositeOperation = 'lighter';

      overlayCtx.globalAlpha = fade * 0.95;
      overlayCtx.strokeStyle = '#c98bff';
      overlayCtx.shadowColor = '#a55cff';
      overlayCtx.shadowBlur = 30;
      overlayCtx.lineWidth = 7 * (1 - prog * 0.55);
      overlayCtx.beginPath();
      overlayCtx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
      overlayCtx.stroke();

      overlayCtx.globalAlpha = fade * 0.75;
      overlayCtx.strokeStyle = '#f1e8ff';
      overlayCtx.shadowColor = '#e3b6ff';
      overlayCtx.shadowBlur = 16;
      overlayCtx.lineWidth = 2.5;
      overlayCtx.beginPath();
      overlayCtx.arc(fx.x, fx.y, r * 0.62, 0, Math.PI * 2);
      overlayCtx.stroke();

      overlayCtx.globalAlpha = fade * 0.55;
      overlayCtx.fillStyle = 'rgba(15,5,35,0.9)';
      overlayCtx.beginPath();
      overlayCtx.arc(fx.x, fx.y, r * 0.5, 0, Math.PI * 2);
      overlayCtx.fill();

      overlayCtx.globalAlpha = fade * 0.9;
      overlayCtx.strokeStyle = '#e7c8ff';
      overlayCtx.shadowColor = '#b46cff';
      overlayCtx.shadowBlur = 14;
      overlayCtx.lineWidth = 2.6;
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2 + fx.seed;
        const r0 = r * 0.4;
        const r1 = r * (1.15 + (k % 3) * 0.18);
        overlayCtx.beginPath();
        overlayCtx.moveTo(fx.x + Math.cos(a) * r0, fx.y + Math.sin(a) * r0);
        overlayCtx.lineTo(fx.x + Math.cos(a) * r1, fx.y + Math.sin(a) * r1);
        overlayCtx.stroke();
      }
      overlayCtx.restore();
    }

    // 廚神高壓鍋爆裂
    for (const fx of FX.chefPressureBursts) {
      const fade = clamp(fx.life / fx.maxLife, 0, 1);
      if (fx.isParticle) {
        overlayCtx.save();
        overlayCtx.globalAlpha = fade * 0.75;
        overlayCtx.fillStyle = '#ffd9a0';
        overlayCtx.shadowColor = '#ff9f43';
        overlayCtx.shadowBlur = 10;
        overlayCtx.beginPath();
        overlayCtx.arc(fx.x, fx.y, fx.radius * (0.6 + fade * 0.6), 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.restore();
      } else {
        const prog = 1 - fade;
        const r = fx.radius * (0.3 + prog * 1.2);
        overlayCtx.save();
        overlayCtx.globalCompositeOperation = 'lighter';

        overlayCtx.globalAlpha = fade * 0.95;
        overlayCtx.strokeStyle = '#ff9f43';
        overlayCtx.shadowColor = '#ff7b39';
        overlayCtx.shadowBlur = 28;
        overlayCtx.lineWidth = 8 * fade;
        overlayCtx.beginPath();
        overlayCtx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
        overlayCtx.stroke();

        overlayCtx.globalAlpha = fade * 0.7;
        overlayCtx.strokeStyle = '#fff1c1';
        overlayCtx.shadowColor = '#ffd9a0';
        overlayCtx.shadowBlur = 16;
        overlayCtx.lineWidth = 3;
        overlayCtx.beginPath();
        overlayCtx.arc(fx.x, fx.y, r * 0.68, 0, Math.PI * 2);
        overlayCtx.stroke();

        overlayCtx.globalAlpha = fade * 0.85;
        overlayCtx.strokeStyle = '#ffd9a0';
        overlayCtx.lineWidth = 2.4;
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI * 2 + fx.seed;
          overlayCtx.beginPath();
          overlayCtx.moveTo(fx.x + Math.cos(a) * r * 0.5, fx.y + Math.sin(a) * r * 0.5);
          overlayCtx.lineTo(fx.x + Math.cos(a) * r * 1.4, fx.y + Math.sin(a) * r * 1.4);
          overlayCtx.stroke();
        }
        overlayCtx.restore();
      }
    }

    drawChefHexAuras();
  }

  function drawChefHexAuras() {
    if (!state || !state.balls) return;
    for (const b of state.balls) {
      if (!b || b.hp <= 0 || !b.char || b.char.type !== 'chef') continue;
      const hex = Array.isArray(b.char._variantIds) ? b.char._variantIds[0] : null;
      const cx = b.x, cy = b.y, r = b.r || 25;

      if (hex === 'pressure_cooker') {
        const pressure = Math.min(CHEF_PRESSURE_MAX, Math.max(0, Number(b.chefPressure) || 0));
        const ratio = pressure / CHEF_PRESSURE_MAX;
        const ready = !!b.chefPressureReady;
        const pulse = ready ? 0.6 + 0.4 * Math.abs(Math.sin((state.elapsed || 0) * 14)) : 1;
        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.arc(cx, cy, r + 13, -Math.PI / 2, Math.PI * 1.5);
        overlayCtx.strokeStyle = 'rgba(255,255,255,0.15)';
        overlayCtx.lineWidth = 5;
        overlayCtx.stroke();
        overlayCtx.beginPath();
        overlayCtx.arc(cx, cy, r + 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
        overlayCtx.strokeStyle = ready ? '#ff9f43' : (ratio > 0.6 ? '#ffcc5c' : '#ffd9a0');
        overlayCtx.shadowColor = overlayCtx.strokeStyle;
        overlayCtx.shadowBlur = 14 * pulse;
        overlayCtx.lineWidth = 5;
        overlayCtx.lineCap = 'round';
        overlayCtx.globalAlpha = 0.92 * pulse;
        overlayCtx.stroke();
        if (ready) {
          overlayCtx.globalAlpha = 0.85 * pulse;
          overlayCtx.font = 'bold 12px sans-serif';
          overlayCtx.fillStyle = '#ffb347';
          overlayCtx.textAlign = 'center';
          overlayCtx.textBaseline = 'middle';
          overlayCtx.fillText('⚠️ 滿壓', cx, cy - r - 22);
        }
        overlayCtx.restore();
      }

      if (hex === 'charred' && b.chefSearTargets) {
        let maxSear = 0;
        for (const data of b.chefSearTargets.values()) {
          maxSear = Math.max(maxSear, Math.min(CHEF_SEAR_MAX_STACKS, Number(data?.stacks) || 0));
        }
        if (maxSear > 0) {
          const ratio = maxSear / CHEF_SEAR_MAX_STACKS;
          const pulse = 0.7 + 0.3 * Math.abs(Math.sin((state.elapsed || 0) * 6));
          overlayCtx.save();
          overlayCtx.beginPath();
          overlayCtx.arc(cx, cy, r + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
          overlayCtx.strokeStyle = ratio >= 1 ? '#ff5b2e' : '#ff9f43';
          overlayCtx.shadowColor = overlayCtx.strokeStyle;
          overlayCtx.shadowBlur = 12 * pulse;
          overlayCtx.lineWidth = 3.5;
          overlayCtx.lineCap = 'round';
          overlayCtx.stroke();
          overlayCtx.font = 'bold 11px sans-serif';
          overlayCtx.fillStyle = '#ffcc5c';
          overlayCtx.textAlign = 'center';
          overlayCtx.textBaseline = 'middle';
          overlayCtx.fillText('🔥' + maxSear + '/' + CHEF_SEAR_MAX_STACKS, cx, cy - r - 18);
          overlayCtx.restore();
        }
      }

      if (hex === 'extra_salt') {
        const buffs = [];
        if (b.chefSaltDamageBuffTimer > 0) buffs.push({ icon: '🧂', t: b.chefSaltDamageBuffTimer, color: '#e8edf2' });
        if (b.chefItemAttackSpeedBuffTimer > 0) buffs.push({ icon: '🌶️', t: b.chefItemAttackSpeedBuffTimer, color: '#ff5a4f' });
        if (buffs.length) {
          overlayCtx.save();
          overlayCtx.font = 'bold 12px sans-serif';
          overlayCtx.textAlign = 'left';
          overlayCtx.textBaseline = 'middle';
          buffs.forEach((buff, i) => {
            overlayCtx.fillStyle = buff.color;
            overlayCtx.shadowColor = buff.color;
            overlayCtx.shadowBlur = 8;
            overlayCtx.fillText(buff.icon + buff.t.toFixed(1) + 's', cx + r + 8, cy - 10 + i * 16);
          });
          overlayCtx.restore();
        }
      }
    }
  }

  function updateEffects(dt) {
    if (state && state.dioWorldGlobalActive) return;
    for (let i = FX.warpTrails.length - 1; i >= 0; i--) {
      FX.warpTrails[i].life -= dt;
      if (FX.warpTrails[i].life <= 0) FX.warpTrails.splice(i, 1);
    }
    for (let i = FX.blackHoleBursts.length - 1; i >= 0; i--) {
      FX.blackHoleBursts[i].life -= dt;
      if (FX.blackHoleBursts[i].life <= 0) FX.blackHoleBursts.splice(i, 1);
    }
    for (let i = FX.chefPressureBursts.length - 1; i >= 0; i--) {
      const fx = FX.chefPressureBursts[i];
      if (fx.isParticle) {
        fx.x += (fx.vx || 0) * dt;
        fx.y += (fx.vy || 0) * dt;
        fx.vx *= 0.94;
        fx.vy *= 0.94;
      }
      fx.life -= dt;
      if (fx.life <= 0) FX.chefPressureBursts.splice(i, 1);
    }
  }

  function loop() {
    const t = performance.now();
    const dt = Math.min(0.05, Math.max(0, (t - (FX.lastTime || t)) / 1000));
    FX.lastTime = t;
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

  console.log('[ultrafix] 超界者 / 廚神海克斯修補已載入');
})();