/* EMBEDDED kinji_extension.js */
/*
 * 秤金次「坐殺博徒」擴充模組
 * 以現有遊戲的 state / dealDamage / applyStatus 為介面，避免改動其他角色邏輯。
 */
(() => {
  'use strict';

  const KINJI_TYPE = 'kinji';
  const kinjiVisual = {
    gates: [],
    punches: [],
    sparks: [],
    impactBursts: [],
    comboTexts: [],
    beamFx: [],
    balls: [],
    dragonComets: [],
    dragonRings: [],
    dragonWaves: [],
    dragonBursts: [],
    jackpotFx: [],
    simulatedReelFx: [],
    domainFlash: 0.75,
    carDoors: [],
    pachinkoPins: [],
    decorativeHoles: [],
    starterHole: null,
    sceneWidth: 0,
    sceneHeight: 0,
    root: null,
    overlay: null,
    overlayCtx: null,
    hud: null,
    last: 0,
    active: false,
  };

  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const getStateSafe = () => {
    try { return (typeof state !== 'undefined') ? state : null; } catch (_) { return null; }
  };
  const getCanvasSafe = () => {
    try { return (typeof canvas !== 'undefined' && canvas) ? canvas : document.getElementById('arena'); } catch (_) { return null; }
  };
  const aliveKinji = (root) => (root?.balls || []).filter(b => b && b.hp > 0 && b.char?.type === KINJI_TYPE);
  const enemyOf = (b) => {
    try {
      if (typeof getNearestEnemyTo === 'function') {
        const target = getNearestEnemyTo(b.x, b.y, b.player);
        if (target && target.hp > 0) return target;
      }
    } catch (_) {}
    const root = getStateSafe();
    return (root?.balls || [])
      .filter(t => t && t.hp > 0 && t !== b && t.player !== b.player)
      .sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y))[0] || null;
  };
  const radiusOf = (b) => Number.isFinite(b?.r) ? b.r : 25;
  const randomSwing = (base) => {
    const max = Number.isFinite(window.KINJI_DAMAGE_SWING_MAX) ? window.KINJI_DAMAGE_SWING_MAX : 20;
    const swing = 1 + Math.floor(Math.random() * Math.max(1, max));
    return Math.max(1, Math.round(base + (Math.random() < 0.5 ? -swing : swing)));
  };
  const isCooldownFrozen = (b) => {
    try {
      return !!(b?.cooldownFreezeTimer > 0 || b?.arenaFrozen > 0 || b?.pucciDiscFrozen ||
        (typeof hasStatusEffect === 'function' && hasStatusEffect(b, 'cooldownFreeze')));
    } catch (_) { return !!(b?.cooldownFreezeTimer > 0 || b?.arenaFrozen > 0); }
  };
  const isDioWorldFrozen = (b) => {
    const root = getStateSafe();
    return !!(root?.dioWorldGlobalActive && (!root.dioWorldCaster || b !== root.dioWorldCaster));
  };
  const isParalyzed = (b) => !!(b?.thunderParalyzed > 0 || b?.thunderStunTimer > 0 || b?.itachiPinnedTimer > 0);
  const addDamageNumber = (root, target, value, color = '#ffd166') => {
    if (!root) return;
    root.damageNumbers = root.damageNumbers || [];
    root.damageNumbers.push({ x: target.x, y: target.y - 30, value, color, life: 0.78, maxLife: 0.78, scale: 0.9 });
  };
  const flash = (root, x, y, r = 24, color = '#ffd166') => {
    if (!root) return;
    root.hitFlashes = root.hitFlashes || [];
    root.hitFlashes.push({ x, y, r, alpha: 0.9, color, t: 0.28 });
  };
  const hitSound = (type = 'opm') => {
    try { if (typeof playHitSound === 'function') playHitSound(type); } catch (_) {}
  };
  const shake = (root, intensity = 4, life = 0.12) => {
    try {
      if (root?.opmFX && Array.isArray(root.opmFX)) root.opmFX.push({ type: 'shake', intensity, life, maxLife: life });
    } catch (_) {}
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const deal = (attacker, target, base, label, color = '#ffd166') => {
    if (!attacker || !target || target.hp <= 0) return 0;
    const damage = randomSwing(base);
    try {
      if (typeof dealDamage === 'function') dealDamage(target, damage, { attackerPlayer: attacker.player, attackerBall: attacker });
      else target.hp = Math.max(0, target.hp - damage);
    } catch (_) { target.hp = Math.max(0, target.hp - damage); }
    addDamageNumber(getStateSafe(), target, `${label} ${damage}`, color);
    flash(getStateSafe(), target.x, target.y, 24, color);
    return damage;
  };
  const passionGainMultiplier = (k) => k?.domainFastNext ? KINJI_TIME_SHORT_PASSION_MULT : 1;
  const addPassion = (b, amount) => {
    if (!b?.kinji) return;
    const gain = amount * passionGainMultiplier(b.kinji);
    b.kinji.passion = Math.min(KINJI_PASSION_MAX, Math.max(0, b.kinji.passion + gain));
  };
  const lockTarget = (target, duration, freezeCooldown = false) => {
    if (!target || target.hp <= 0) return;
    target.mageFreezeTimer = Math.max(target.mageFreezeTimer || 0, duration);
    target.itachiPinnedTimer = Math.max(target.itachiPinnedTimer || 0, duration);
    target.vx = 0; target.vy = 0;
    // 冷卻凍結必須走統一狀態容器，讓主迴圈 tickStatusEffects 正確倒數；
    // 直接寫入 legacy cooldownFreezeTimer 不會自行遞減，會讓廚神等角色永久打不出普攻。
    try {
      if (typeof applyStatus === 'function') {
        applyStatus(target, {
          id: freezeCooldown ? 'cooldownFreeze' : 'immobilize',
          duration,
          source: 'kinji',
          stackMode: 'refreshMax',
        });
      }
    } catch (_) {}
  };
  const isJackpot = (b) => !!(b?.kinji?.jackpotTimer > 0);
  const basicCooldown = (b) => isJackpot(b) ? KINJI_GATE_JACKPOT_COOLDOWN : KINJI_GATE_COOLDOWN;
  const skillCooldown = (b) => isJackpot(b) ? KINJI_COMBO_JACKPOT_COOLDOWN : KINJI_COMBO_COOLDOWN;
  const drawPoolFor = (k) => k?.domainNarrowPool ? KINJI_DOMAIN_GUARANTEED_POOL : KINJI_DOMAIN_DRAW_POOL;

  function ensureBallState(b) {
    if (!b || b.char?.type !== KINJI_TYPE) return null;
    if (b.kinji) {
      // 兼容熱更新或舊存檔：新旗標不存在時，視為尚未使用首次領域控制。
      if (typeof b.kinji.domainControlUsed !== 'boolean') b.kinji.domainControlUsed = false;
      return b.kinji;
    }
    b.kinji = {
      passion: 0,
      gateTimer: KINJI_GATE_COOLDOWN * 0.55,
      comboTimer: 0, // 進場時咒力連擊立即可用；使用後仍依正常冷卻倒數
      comboTarget: null,
      comboIndex: 0,
      comboPunchTimer: 0,
      comboHits: 0,
      domainActive: false,
      domainElapsed: 0,
      domainOpening: false,
      domainOpenElapsed: 0,
      domainResultHold: 0,
      domainThirdPending: false,
      reelActive: false,
      reelPulse: 0,
      domainNumberTimer: KINJI_DOMAIN_NUMBER_INTERVAL,
      domainNumbers: [],
      domainInterval: KINJI_DOMAIN_NUMBER_INTERVAL,
      domainFastNext: false,
      domainGuaranteedNext: false,
      domainNarrowPool: false,
      domainMissHold: 0,
      simulatedReelRepeat: false,
      simulatedReelRevives: 0,
      simulatedReelFlash: 0,
      jackpotBlocksNextEffects: false,
      domainControlUsed: false,
      jackpotTimer: 0,
      starterHoleFlash: 0,
      pachinkoTimer: KINJI_PACHINKO_BALL_COOLDOWN,
      jackpotHealTick: 1,
      lastX: b.x,
      lastY: b.y,
      trailPositions: [],
    };
    return b.kinji;
  }

  function emitSpark(x, y, color = KINJI_DOMAIN_COLOR, count = 5) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 100;
      kinjiVisual.sparks.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.35 + Math.random() * 0.35, maxLife: 0.7, color, size: 1.5 + Math.random() * 2.5 });
    }
    if (kinjiVisual.sparks.length > 180) kinjiVisual.sparks.splice(0, kinjiVisual.sparks.length - 180);
  }

  function trimDragonParticles() {
    const cap = Number.isFinite(window.KINJI_DRAGON_PARTICLE_CAP) ? window.KINJI_DRAGON_PARTICLE_CAP : 100;
    if (kinjiVisual.dragonComets.length > cap) kinjiVisual.dragonComets.splice(0, kinjiVisual.dragonComets.length - cap);
  }

  function spawnDragonDomainFX(b, jackpot = false) {
    if (!b) return;
    const count = jackpot ? KINJI_DRAGON_COMET_COUNT + 18 : KINJI_DRAGON_COMET_COUNT;
    const life = jackpot ? KINJI_DRAGON_BURST_LIFE + 0.35 : KINJI_DRAGON_COMET_LIFE;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.18;
      const speed = (jackpot ? 150 : 105) + Math.random() * (jackpot ? 250 : 190);
      const r = 8 + Math.random() * 22;
      kinjiVisual.dragonComets.push({
        x: b.x + Math.cos(a) * r, y: b.y + Math.sin(a) * r,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life: life * (0.62 + Math.random() * 0.45), maxLife: life,
        size: 1.4 + Math.random() * (jackpot ? 3.4 : 2.4),
        color: i % 5 === 0 ? '#fff8d6' : (i % 2 ? '#ffbd38' : '#ff6b35'),
        twist: Math.random() * Math.PI * 2,
      });
    }
    const ringCount = jackpot ? KINJI_DRAGON_RING_COUNT + 2 : KINJI_DRAGON_RING_COUNT;
    for (let i = 0; i < ringCount; i++) {
      kinjiVisual.dragonRings.push({
        x: b.x, y: b.y, r: 20 + i * 8, speed: 105 + i * 25,
        life: life * (0.8 + i * 0.04), maxLife: life * (0.8 + i * 0.04),
        rotation: Math.random() * Math.PI * 2, width: jackpot ? 4.5 : 2.6,
        color: i % 2 ? '#ff7a39' : '#ffe49a',
      });
    }
    for (let i = 0; i < (jackpot ? KINJI_DRAGON_WAVE_COUNT + 2 : KINJI_DRAGON_WAVE_COUNT); i++) {
      kinjiVisual.dragonWaves.push({
        x: b.x, y: b.y, r: 18 + i * 14, speed: jackpot ? 260 : 190,
        life: (jackpot ? 1.15 : 0.86) + i * 0.06, maxLife: (jackpot ? 1.15 : 0.86) + i * 0.06,
        width: jackpot ? 7 : 4, color: i % 2 ? '#fff0a8' : '#ff8a42',
      });
    }
    kinjiVisual.dragonBursts.push({ x: b.x, y: b.y, life: life, maxLife: life, jackpot });
    trimDragonParticles();
  }

  function spawnDragonImpactFX(x, y, scale = 1) {
    const count = Math.max(6, Math.round(12 * scale));
    for (let i = 0; i < count; i++) {
      const a = i * Math.PI * 2 / count + Math.random() * 0.25;
      const speed = 80 + Math.random() * 160 * scale;
      kinjiVisual.dragonComets.push({
        x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life: 0.42 + Math.random() * 0.24, maxLife: 0.66,
        size: 1.2 + Math.random() * 2.2, color: i % 3 ? '#ff9b3d' : '#fff3b0', twist: a,
      });
    }
    kinjiVisual.dragonWaves.push({ x, y, r: 14, speed: 150 * scale, life: 0.42, maxLife: 0.42, width: 2.5 + scale, color: '#ffe28b' });
    trimDragonParticles();
  }

  function updateDragonFX(dt) {
    for (const list of [kinjiVisual.dragonComets, kinjiVisual.dragonRings, kinjiVisual.dragonWaves, kinjiVisual.dragonBursts]) {
      for (let i = list.length - 1; i >= 0; i--) {
        const fx = list[i];
        fx.life -= dt;
        if (fx.vx != null) { fx.x += fx.vx * dt; fx.y += fx.vy * dt; fx.vx *= 0.992; fx.vy *= 0.992; }
        if (fx.r != null && fx.speed != null) fx.r += fx.speed * dt;
        if (fx.rotation != null) fx.rotation += dt * 2.6;
        if (fx.life <= 0) list.splice(i, 1);
      }
    }
  }

  function drawDragonFX(c, width, height, domainKinji) {
    const now = nowMs() / 1000;
    c.save();
    c.globalCompositeOperation = 'lighter';
    // 領域只在列車門進場瞬間留下六道開門光線；常駐期間不再畫滿屏旋轉光環。
    if (domainKinji?.kinji?.domainOpening) {
      const k = domainKinji.kinji;
      const p = easeOut((k.domainOpenElapsed || 0) / KINJI_DOMAIN_OPEN_DURATION);
      c.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI * 2 / 6 + now * 0.16;
        const r0 = 18 + p * 10;
        const r1 = r0 + p * (54 + i * 5);
        c.globalAlpha = (1 - p) * 0.30;
        c.strokeStyle = i % 2 ? '#ffe9a5' : '#f3b34c';
        c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(domainKinji.x + Math.cos(a) * r0, domainKinji.y + Math.sin(a) * r0); c.lineTo(domainKinji.x + Math.cos(a) * r1, domainKinji.y + Math.sin(a) * r1); c.stroke();
      }
    }
    // 領域常駐期間不再繪製龍系粒子；只保留列車門、角色球與數字，避免遮擋敵方。
    if (domainKinji?.kinji?.domainActive) { c.restore(); return; }
    for (const fx of kinjiVisual.dragonComets) {
      const alpha = Math.max(0, fx.life / fx.maxLife);
      const speed = Math.hypot(fx.vx, fx.vy) || 1;
      const ux = fx.vx / speed, uy = fx.vy / speed;
      const tail = 14 + fx.size * 7;
      c.globalAlpha = alpha * 0.82; c.strokeStyle = fx.color; c.shadowBlur = 0; c.lineWidth = fx.size;
      c.beginPath(); c.moveTo(fx.x - ux * tail, fx.y - uy * tail); c.lineTo(fx.x, fx.y); c.stroke();
      c.globalAlpha = alpha; c.fillStyle = '#fff6c7'; c.beginPath(); c.arc(fx.x, fx.y, fx.size * 1.35, 0, Math.PI * 2); c.fill();
    }
    for (const fx of kinjiVisual.dragonRings) {
      const alpha = Math.max(0, fx.life / fx.maxLife);
      c.globalAlpha = alpha * 0.72; c.strokeStyle = fx.color; c.shadowBlur = 0; c.lineWidth = fx.width;
      c.beginPath(); c.arc(fx.x, fx.y, fx.r, fx.rotation, fx.rotation + Math.PI * 1.45); c.stroke();
    }
    for (const fx of kinjiVisual.dragonWaves) {
      const alpha = Math.max(0, fx.life / fx.maxLife);
      c.globalAlpha = alpha * 0.66; c.strokeStyle = fx.color; c.shadowBlur = 0; c.lineWidth = fx.width;
      c.beginPath(); c.arc(fx.x, fx.y, fx.r, 0, Math.PI * 2); c.stroke();
    }
    for (const fx of kinjiVisual.dragonBursts) {
      const p = 1 - Math.max(0, fx.life / fx.maxLife);
      const rays = fx.jackpot ? 32 : 22;
      c.globalAlpha = (1 - p) * 0.78; c.strokeStyle = fx.jackpot ? '#fff8b0' : '#ffb14a'; c.shadowBlur = 0; c.lineWidth = fx.jackpot ? 3.5 : 2;
      for (let i = 0; i < rays; i++) {
        const a = i * Math.PI * 2 / rays + p * 0.35;
        const r0 = 18 + p * 22, r1 = 42 + p * (fx.jackpot ? 160 : 110) + (i % 3) * 8;
        c.beginPath(); c.moveTo(fx.x + Math.cos(a) * r0, fx.y + Math.sin(a) * r0); c.lineTo(fx.x + Math.cos(a) * r1, fx.y + Math.sin(a) * r1); c.stroke();
      }
    }
    c.restore();
  }

  function gateAttack(b, target) {
    const k = b?.kinji;
    if (!k || !target || target.hp <= 0 || k.domainActive || isParalyzed(b)) return;
    const range = radiusOf(b) + radiusOf(target) + KINJI_GATE_RANGE_PADDING;
    if (Math.hypot(target.x - b.x, target.y - b.y) > range) return;
    // 有效近身範圍內閘門必中；咒力充涌期間也沿用同一必中規則。
    const damage = deal(b, target, KINJI_GATE_DAMAGE, '閘門', '#ffd166');
    if (!damage) return;
    addPassion(b, KINJI_PASSION_PER_BASIC_HIT);
    lockTarget(target, KINJI_GATE_IMMOBILIZE, false);
    const angle = Math.atan2(target.y - b.y, target.x - b.x);
    kinjiVisual.gates.push({
      x: target.x, y: target.y, angle, owner: b.player,
      phase: 'closing', elapsed: 0,
      closeDuration: 0.18, holdDuration: 0.30, openDuration: 0.20,
      impacted: false,
    });
    emitSpark(target.x, target.y, '#ffe8a3', 8);
    spawnDragonImpactFX(target.x, target.y, 1.0);
    shake(getStateSafe(), 5, 0.14);
    hitSound('knife');
    b.kinji.gateTimer = basicCooldown(b);
  }

  function beginCombo(b, target) {
    if (!target || target.hp <= 0 || b.kinji.domainActive || isParalyzed(b)) return;
    b.kinji.comboTarget = target;
    b.kinji.comboIndex = 0;
    b.kinji.comboPunchTimer = 0;
    b.kinji.comboTimer = skillCooldown(b);
    b.mageFreezeTimer = Math.max(b.mageFreezeTimer || 0, 0.22);
    b.vx = 0; b.vy = 0;
  }

  function comboTick(b, dt) {
    const k = b.kinji;
    if (!k.comboTarget || k.comboTarget.hp <= 0 || k.comboIndex >= KINJI_COMBO_HITS) {
      k.comboTarget = null; k.comboIndex = 0; return;
    }
    k.comboPunchTimer -= dt;
    b.mageFreezeTimer = Math.max(b.mageFreezeTimer || 0, 0.12);
    b.vx = 0; b.vy = 0;
    if (k.comboPunchTimer > 0 || isParalyzed(b)) return;
    const target = k.comboTarget;
    const hitNo = k.comboIndex + 1;
    const damage = deal(b, target, KINJI_COMBO_DAMAGE, `${hitNo} HIT`, '#ff9f43');
    if (damage) {
      addPassion(b, KINJI_PASSION_PER_SKILL_HIT);
      k.comboHits = hitNo;
      lockTarget(target, 0.16, false);
      const angle = Math.atan2(target.y - b.y, target.x - b.x) + (Math.random() - 0.5) * 0.34;
      const finisher = hitNo === KINJI_COMBO_HITS;
      for (let ghost = 0; ghost < (finisher ? 7 : 5); ghost++) {
        kinjiVisual.punches.push({
          x: target.x - Math.cos(angle) * (8 + ghost * 9),
          y: target.y - Math.sin(angle) * (8 + ghost * 9),
          life: (finisher ? 0.38 : 0.28) - ghost * 0.035, maxLife: finisher ? 0.38 : 0.28,
          angle, length: finisher ? 54 + ghost * 8 : 36 + ghost * 6,
          width: finisher ? 11 : 7, finisher, slam: hitNo >= 3,
        });
      }
      const burstLife = finisher ? 0.52 : KINJI_COMBO_HIT_FLASH + 0.05;
      kinjiVisual.impactBursts.push({ x: target.x, y: target.y, life: burstLife, maxLife: burstLife, radius: finisher ? 48 : 28, rays: finisher ? 36 : 20, lowCost: true, color: finisher ? '#ffe08a' : hitNo >= 4 ? '#ffd166' : '#fff7dc' });
      // 命中數字縮小並貼近目標球，只作為輕量回饋，不蓋住戰場。
      kinjiVisual.comboTexts.push({ x: target.x + radiusOf(target) + 5, y: target.y - radiusOf(target) - 4, text: `HIT ×${hitNo}`, life: finisher ? 0.60 : 0.34, maxLife: finisher ? 0.60 : 0.34, scale: finisher ? 0.88 : 0.68, color: finisher ? '#ffcf66' : hitNo >= 3 ? '#ffd166' : '#ffffff' });
      emitSpark(target.x, target.y, finisher ? '#fff0a4' : '#ff9f43', finisher ? 22 : 10);
      spawnDragonImpactFX(target.x, target.y, finisher ? 2.8 : 1.2);
      flash(getStateSafe(), target.x, target.y, finisher ? 68 : 32, finisher ? '#fff1a8' : '#ffd27a');
      shake(getStateSafe(), finisher ? 13 : 5.5, finisher ? 0.28 : 0.14);
      hitSound(finisher ? 'opm' : 'knife');
    }
    k.comboIndex++;
    k.comboPunchTimer = hitNo === KINJI_COMBO_HITS ? 0.28 : 0.20;
  }

  function beginDomain(b) {
    const k = b.kinji;
    if (!k || k.domainActive || k.jackpotTimer > 0 || k.passion < KINJI_DOMAIN_PASSION_COST || isParalyzed(b)) return;
    k.passion = 0;
    k.domainActive = true;
    k.domainElapsed = 0;
    k.domainOpening = true;
    k.domainOpenElapsed = 0;
    k.domainResultHold = 0;
    k.domainThirdPending = false;
    k.domainNumbers = [];
    k.reelActive = false;
    k.reelPulse = 0;
    // 每次新的領域從一般四選項開始；確變／時短只影響領域內的下一組抽獎。
    k.domainNarrowPool = false;
    k.domainFastNext = false;
    k.domainGuaranteedNext = false;
    k.domainMissHold = 0;
    k.simulatedReelRepeat = false;
    k.domainInterval = KINJI_DOMAIN_NUMBER_INTERVAL;
    // 先讓多重列車門完成進場，再開始第一碼抽選。
    k.domainNumberTimer = KINJI_DOMAIN_OPEN_DURATION;
    k.pachinkoTimer = 0.05;
    // 領域開場改由多重列車門動畫承擔，不再生成高密度龍系粒子。
    kinjiVisual.domainFlash = 0.75;
    const root = getStateSafe();
    // 領域控制只在秤金次本局第一次開領域時觸發；後續領域保留演出與抽獎，但不再重複定身／凍結冷卻。
    if (!k.domainControlUsed) {
      k.domainControlUsed = true;
      for (const target of (root?.balls || [])) {
        if (target && target.hp > 0 && target.player !== b.player) lockTarget(target, KINJI_DOMAIN_FREEZE_DURATION, true);
      }
    }
    emitSpark(b.x, b.y, '#fff0a6', 20);
    flash(root, b.x, b.y, 86, '#fff0a6');
    hitSound('opm');
  }

  function drawNumber(b) {
    const k = b.kinji;
    const pool = drawPoolFor(k);
    if (k.domainNumbers.length === 0) {
      k.domainNumbers.push(pool[Math.floor(Math.random() * pool.length)]);
    } else if (k.domainNumbers.length === 1) {
      // 坐殺博徒：前兩個數字必定相同。
      k.domainNumbers.push(k.domainNumbers[0]);
    } else if (k.domainNumbers.length === 2 && !k.domainThirdPending) {
      // 第二碼出現後先停一下，第三碼只在懸念結束時揭曉。
      k.domainThirdPending = true;
      k.domainNumberTimer = KINJI_DOMAIN_FINAL_DELAY;
      k.reelActive = true;
      k.reelPulse = 1;
      emitSpark(b.x, b.y, '#fff4b0', 5);
      return;
    } else {
      k.domainNumbers.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    k.domainThirdPending = false;
    k.domainNumberTimer = Math.max(0.12, k.domainInterval);
    k.reelActive = true;
    k.reelPulse = 1;
    emitSpark(b.x, b.y, '#fff4b0', 6);
    const root = getStateSafe();
    flash(root, b.x, b.y, 26, '#ffe27d');
    if (k.domainNumbers.length >= KINJI_DOMAIN_MAX_NUMBERS) {
      // 保留三碼結果一小段時間；非大獎會在 resolveDomain 後持續下一組抽獎。
      k.domainResultHold = KINJI_DOMAIN_RESULT_HOLD;
      k.domainNumberTimer = Number.POSITIVE_INFINITY;
    }
  }

  function clearPachinkoBalls(owner) {
    for (let i = kinjiVisual.balls.length - 1; i >= 0; i--) {
      if (!owner || kinjiVisual.balls[i].owner === owner) kinjiVisual.balls.splice(i, 1);
    }
  }

  function resolveDomain(b) {
    const k = b.kinji;
    const nums = k.domainNumbers.slice(0, KINJI_DOMAIN_MAX_NUMBERS);
    clearPachinkoBalls(b);
    k.domainResultHold = 0;
    k.domainThirdPending = false;
    k.reelActive = false;
    k.reelPulse = 0;
    if (nums.length === 3 && nums[0] === nums[1] && nums[1] === nums[2]) {
      // 中獎後只保留一段固定咒力充涌時間，不能與下一次大獎疊加。
      k.jackpotTimer = KINJI_JACKPOT_DURATION;
      k.domainActive = false;
      k.domainOpening = false;
      k.domainOpenElapsed = 0;
      k.domainElapsed = 0;
      k.domainNumberTimer = KINJI_DOMAIN_NUMBER_INTERVAL;
      k.domainMissHold = 0;
      k.domainNarrowPool = false;
      k.domainFastNext = false;
      k.domainGuaranteedNext = false;
      kinjiVisual.domainFlash = 0.5;
      kinjiVisual.jackpotFx.push({
        x: b.x, y: b.y,
        life: KINJI_JACKPOT_FX_DURATION,
        maxLife: KINJI_JACKPOT_FX_DURATION,
        owner: b,
        numbers: nums.slice(0, 3),
        spin: Math.random() * Math.PI * 2,
      });
      kinjiVisual.impactBursts.push({ x: b.x, y: b.y, life: 0.62, maxLife: 0.62, radius: 78, rays: 18, lowCost: true, color: '#fff0a2' });
      kinjiVisual.domainFlash = 0.72;
      emitSpark(b.x, b.y, '#fff2a1', 12);
      flash(getStateSafe(), b.x, b.y, 110, '#fff2a1');
      shake(getStateSafe(), 9, 0.22);
      hitSound('opm');
    } else {
      // 未中獎不結束領域：依前兩碼奇偶調整下一組抽獎規則。
      // 偶數 -> 確變：選項縮成 6、7；奇數 -> 時短：下一組間隔變快。
      if (nums.length >= 2 && nums[0] % 2 === 0) {
        k.domainNarrowPool = true;
        k.domainFastNext = false;
        k.domainInterval = KINJI_DOMAIN_NUMBER_INTERVAL;
        flash(getStateSafe(), b.x, b.y, 62, '#83d7ff');
      } else if (nums.length >= 2) {
        k.domainNarrowPool = false;
        k.domainFastNext = true;
        k.domainInterval = KINJI_DOMAIN_NUMBER_INTERVAL_FAST;
        flash(getStateSafe(), b.x, b.y, 62, '#d6a4ff');
      }
      k.domainActive = true;
      k.domainOpening = false;
      k.domainOpenElapsed = 0;
      k.domainElapsed = 0;
      k.domainNumbers = nums;
      k.domainMissHold = Math.random() < KINJI_SIMULATED_REEL_REPEAT_CHANCE
        ? KINJI_SIMULATED_REEL_REPEAT_DURATION
        : KINJI_DOMAIN_MISS_HOLD;
      k.simulatedReelRepeat = k.domainMissHold > KINJI_DOMAIN_MISS_HOLD;
      k.reelActive = true;
      k.reelPulse = 1;
      if (k.simulatedReelRepeat) {
        kinjiVisual.impactBursts.push({ x: b.x, y: b.y, life: 0.55, maxLife: 0.55, radius: 48, rays: 12, lowCost: true, color: '#bce7ff' });
        emitSpark(b.x, b.y, '#bce7ff', 10);
      }
      k.domainNumberTimer = Number.POSITIVE_INFINITY;
      k.pachinkoTimer = KINJI_PACHINKO_BALL_COOLDOWN;
    }
    k.domainNumbers = nums;
  }

  function holePositions(width, height) {
    return [
      { id: 'decor-red', x: width * 0.20, y: height * 0.42, color: '#b33c35' },
      { id: 'decor-teal', x: width * 0.80, y: height * 0.42, color: '#2e8b87' },
    ];
  }

  function starterHolePosition(b, width, height) {
    return {
      id: 'starter',
      x: clamp(b?.x ?? width / 2, 36, width - 36),
      y: clamp((b?.y ?? height * 0.65) + (b?.r ?? 25) + 52, height - 58, height - 22),
    };
  }

  function ensureDomainScene(width, height) {
    if (kinjiVisual.sceneWidth === width && kinjiVisual.sceneHeight === height && kinjiVisual.carDoors.length) return;
    kinjiVisual.sceneWidth = width;
    kinjiVisual.sceneHeight = height;
    const gap = 58;
    kinjiVisual.carDoors = Array.from({ length: 8 }, (_, i) => ({ x: i * gap - 38, width: 38, phase: (i % 3) * 0.17 }));
    // 背景改為行駛中的火車門；不再建立釘板，釘板只會讓領域看起來像另一種遊戲機台。
    kinjiVisual.pachinkoPins = [];
    kinjiVisual.decorativeHoles = holePositions(width, height);
  }

  function updateDomainScene(dt, width, height, active) {
    ensureDomainScene(width, height);
    const root = getStateSafe();
    const speed = active && !root?.dioWorldGlobalActive ? KINJI_TRAIN_DOOR_SPEED : 0;
    const maxX = Math.max(...kinjiVisual.carDoors.map(d => d.x + d.width), width + 40);
    for (const door of kinjiVisual.carDoors) {
      door.x -= speed * dt;
      if (door.x + door.width < -8) door.x = maxX + 6;
    }
  }

  function spawnPachinkoBall(b) {
    const target = enemyOf(b);
    const angle = target ? Math.atan2(target.y - b.y, target.x - b.x) : Math.random() * Math.PI * 2;
    kinjiVisual.balls.push({
      x: b.x, y: b.y, vx: Math.cos(angle) * KINJI_PACHINKO_BALL_SPEED, vy: Math.sin(angle) * KINJI_PACHINKO_BALL_SPEED,
      life: KINJI_PACHINKO_BALL_LIFETIME, owner: b, ownerPlayer: b.player,
      hitTargets: new Set(), hitHoles: new Set(), starterHit: false,
      radius: KINJI_PACHINKO_BALL_RADIUS,
    });
    emitSpark(b.x, b.y, '#ffe79a', 5);
  }

  function updatePachinkoBalls(dt, width, height) {
    ensureDomainScene(width, height);
    for (let i = kinjiVisual.balls.length - 1; i >= 0; i--) {
      const p = kinjiVisual.balls[i];
      // 世界時停期間小鋼珠完全停住：不移動、不倒數、不命中、不觸發中獎洞。
      if (isDioWorldFrozen(p.owner)) continue;
      p.life -= dt;
      if (!p.owner || p.owner.hp <= 0 || p.life <= 0 || !p.owner.kinji?.domainActive) { kinjiVisual.balls.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const pad = 13;
      if (p.x <= pad) { p.x = pad; p.vx = Math.abs(p.vx); }
      if (p.x >= width - pad) { p.x = width - pad; p.vx = -Math.abs(p.vx); }
      if (p.y <= pad) { p.y = pad; p.vy = Math.abs(p.vy); }
      if (p.y >= height - pad) { p.y = height - pad; p.vy = -Math.abs(p.vy); }
      const root = getStateSafe();
      for (const target of (root?.balls || [])) {
        if (!target || target.hp <= 0 || target.player === p.ownerPlayer || p.hitTargets.has(target)) continue;
        if (Math.hypot(target.x - p.x, target.y - p.y) <= p.radius + radiusOf(target)) {
          p.hitTargets.add(target);
          deal(p.owner, target, KINJI_PACHINKO_BALL_DAMAGE, '鋼珠', '#ffe79a');
          emitSpark(p.x, p.y, '#fff6c2', 5);
        }
      }
      const k = p.owner.kinji;
      const starter = starterHolePosition(p.owner, width, height);
      if (!p.starterHit && k?.domainActive && Math.hypot(p.x - starter.x, p.y - starter.y) < 25) {
        p.starterHit = true;
        k.reelActive = true;
        k.reelPulse = 1;
        k.starterHoleFlash = 1;
        k.domainNumberTimer = Math.max(0.12, k.domainNumberTimer - 1);
        k.domainInterval = Math.max(0.35, k.domainInterval - 1);
        p.owner.hp = Math.min(getMaxHp(p.owner), p.owner.hp + KINJI_PACHINKO_BALL_HEAL);
        addDamageNumber(root, p.owner, `始動口 +${KINJI_PACHINKO_BALL_HEAL}`, '#8ff0c8');
        kinjiVisual.beamFx.push({ owner: p.owner, x: starter.x, y: starter.y, life: 0.30, maxLife: 0.30 });
        kinjiVisual.impactBursts.push({ x: starter.x, y: starter.y, life: 0.28, maxLife: 0.28, radius: 22, color: '#ffe89a' });
        emitSpark(starter.x, starter.y, '#fff3ae', 15);
        shake(root, 3, 0.10);
        hitSound('opm');
        kinjiVisual.balls.splice(i, 1);
        continue;
      }
      for (const hole of kinjiVisual.decorativeHoles) {
        if (!p.hitHoles.has(hole.id) && Math.hypot(p.x - hole.x, p.y - hole.y) < 13) {
          p.hitHoles.add(hole.id);
          emitSpark(hole.x, hole.y, hole.color, 4);
          kinjiVisual.impactBursts.push({ x: hole.x, y: hole.y, life: 0.14, maxLife: 0.14, radius: 10, color: hole.color });
        }
      }
    }
  }

  function getMaxHp(b) {
    try {
      if (typeof getMaxHpForBall === 'function') return getMaxHpForBall(b);
    } catch (_) {}
    return b?.maxHp || (typeof MAX_HP !== 'undefined' ? MAX_HP : 1000);
  }

  function trySimulatedReelRevive(target, incomingActual, options = {}) {
    if (!target || target.char?.type !== KINJI_TYPE || !target.kinji?.domainActive) return false;
    if (!(incomingActual > 0) || options.codeKill || options.bypassParry || options.worldSlash) return false;
    const k = target.kinji;
    if ((k.simulatedReelRevives || 0) >= KINJI_SIMULATED_REEL_MAX_REVIVES) return false;
    if (Math.random() >= KINJI_SIMULATED_REEL_REVIVE_CHANCE) return false;
    k.simulatedReelRevives = (k.simulatedReelRevives || 0) + 1;
    const maxHp = getMaxHp(target);
    target.hp = Math.max(1, Math.round(maxHp * KINJI_SIMULATED_REEL_REVIVE_HP_RATIO));
    k.simulatedReelFlash = KINJI_SIMULATED_REEL_FX_DURATION;
    const root = getStateSafe();
    kinjiVisual.simulatedReelFx.push({ owner: target, x: target.x, y: target.y, life: KINJI_SIMULATED_REEL_FX_DURATION, maxLife: KINJI_SIMULATED_REEL_FX_DURATION, count: k.simulatedReelRevives });
    flash(root, target.x, target.y, 118, '#e6f5ff');
    emitSpark(target.x, target.y, '#dceeff', 24);
    shake(root, 11, 0.28);
    addDamageNumber(root, target, `模擬連 ${Math.round(target.hp)}`, '#dceeff');
    hitSound('opm');
    return true;
  }

  function updateKinji(b, dt) {
    const k = ensureBallState(b);
    if (!k || b.hp <= 0) return;
    // DIO 世界時停時，秤金次的被動、領域、技能與連擊計時全部暫停。
    const frozen = isCooldownFrozen(b) || isDioWorldFrozen(b);
    if (!frozen) {
      k.passion = Math.min(
        KINJI_PASSION_MAX,
        k.passion + KINJI_PASSION_PER_SECOND * passionGainMultiplier(k) * dt,
      );
      if (k.jackpotTimer > 0) {
        k.jackpotTimer = Math.max(0, k.jackpotTimer - dt);
        b.hp = Math.min(getMaxHp(b), b.hp + KINJI_JACKPOT_HEAL_PER_SECOND * dt);
      }
      if (k.domainActive) {
        k.domainElapsed += dt;
        if (k.domainMissHold > 0) {
          k.domainMissHold = Math.max(0, k.domainMissHold - dt);
          if (k.simulatedReelRepeat) {
            const replayT = KINJI_SIMULATED_REEL_REPEAT_DURATION - k.domainMissHold;
            k.reelPulse = 0.42 + 0.58 * Math.pow(Math.sin(replayT * 8.0), 2);
          } else {
            k.reelPulse = Math.max(k.reelPulse, 0.35);
          }
          if (k.domainMissHold <= 0) {
            k.domainNumbers = [];
            k.domainThirdPending = false;
            k.domainResultHold = 0;
            k.simulatedReelRepeat = false;
            k.reelActive = false;
            k.domainNumberTimer = k.domainInterval;
            k.pachinkoTimer = KINJI_PACHINKO_BALL_COOLDOWN;
          }
        } else if (k.domainOpening) {
          k.domainOpenElapsed += dt;
          k.domainNumberTimer -= dt;
          if (k.domainOpenElapsed >= KINJI_DOMAIN_OPEN_DURATION) {
            k.domainOpening = false;
            k.domainNumberTimer = k.domainInterval;
          }
        } else if (k.domainResultHold > 0) {
          k.domainResultHold = Math.max(0, k.domainResultHold - dt);
          k.pachinkoTimer = Math.max(k.pachinkoTimer, 0.18);
          if (k.domainResultHold <= 0) resolveDomain(b);
        } else {
          k.domainNumberTimer -= dt;
          k.pachinkoTimer -= dt;
          if (k.domainNumberTimer <= 0 && k.domainNumbers.length < KINJI_DOMAIN_MAX_NUMBERS) drawNumber(b);
          if (k.pachinkoTimer <= 0) {
            spawnPachinkoBall(b);
            k.pachinkoTimer = KINJI_PACHINKO_BALL_COOLDOWN;
          }
        }
        if (KINJI_DOMAIN_DURATION_LIMIT > 0 && k.domainElapsed >= KINJI_DOMAIN_DURATION_LIMIT) resolveDomain(b);
      } else {
        k.gateTimer -= dt;
        k.comboTimer -= dt;
        if (k.passion >= KINJI_PASSION_MAX) beginDomain(b);
        const target = enemyOf(b);
        if (!k.comboTarget && k.comboTimer <= 0 && target && Math.hypot(target.x - b.x, target.y - b.y) <= radiusOf(b) + radiusOf(target) + 18) beginCombo(b, target);
        const gateRange = radiusOf(b) + (target ? radiusOf(target) : 0) + KINJI_GATE_RANGE_PADDING;
        if (!k.comboTarget && k.gateTimer <= 0 && target && Math.hypot(target.x - b.x, target.y - b.y) <= gateRange) gateAttack(b, target);
      }
    }
    comboTick(b, frozen ? 0 : dt);
    const boosted = k.domainActive || k.jackpotTimer > 0;
    if (boosted) {
      k.trailPositions = k.trailPositions || [];
      k.trailPositions.push({ x: b.x, y: b.y });
      const trailCap = Number.isFinite(window.KINJI_SPEED_TRAIL_COUNT) ? window.KINJI_SPEED_TRAIL_COUNT : 6;
      if (k.trailPositions.length > trailCap) k.trailPositions.splice(0, k.trailPositions.length - trailCap);
    } else if (k.trailPositions?.length) {
      k.trailPositions.length = 0;
    }
    k.lastX = b.x; k.lastY = b.y;
  }

  function setupOverlay() {
    if (kinjiVisual.overlay && document.body.contains(kinjiVisual.overlay)) return;
    const arena = getCanvasSafe();
    if (!arena) return;
    const overlay = document.createElement('canvas');
    overlay.id = 'kinji-overlay';
    overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:20;display:none;';
    document.body.appendChild(overlay);
    kinjiVisual.overlay = overlay;
    kinjiVisual.overlayCtx = overlay.getContext('2d');
    const hud = document.createElement('div');
    hud.id = 'kinji-hud';
    hud.style.cssText = 'position:fixed;pointer-events:none;z-index:21;display:none;color:#ffe7a1;font:700 12px/1.35 system-ui,sans-serif;text-shadow:0 1px 3px #000;white-space:nowrap;';
    document.body.appendChild(hud);
    kinjiVisual.hud = hud;
  }

  function syncOverlay(active, width, height) {
    setupOverlay();
    const arena = getCanvasSafe();
    if (!arena || !kinjiVisual.overlay) return;
    const rect = arena.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    kinjiVisual.overlay.width = Math.max(1, Math.round(width * dpr));
    kinjiVisual.overlay.height = Math.max(1, Math.round(height * dpr));
    kinjiVisual.overlay.style.left = `${rect.left}px`;
    kinjiVisual.overlay.style.top = `${rect.top}px`;
    kinjiVisual.overlay.style.width = `${rect.width}px`;
    kinjiVisual.overlay.style.height = `${rect.height}px`;
    kinjiVisual.overlay.style.display = active ? 'block' : 'none';
    if (kinjiVisual.hud) {
      // 狀態改由 canvas 以球體世界座標繪製，避免固定在畫面左上角。
      kinjiVisual.hud.style.display = 'none';
    }
  }

  function drawDomainBackdrop(c, width, height) {
    const now = nowMs() / 1000;
    const openingKinji = aliveKinji(kinjiVisual.root).find(b => b.kinji?.domainActive);
    const k = openingKinji?.kinji;
    const opening = !!k?.domainOpening;
    const openP = opening ? easeOut((k.domainOpenElapsed || 0) / KINJI_DOMAIN_OPEN_DURATION) : 1;
    c.save();
    // 乾淨的列車門底景：只留下深色車廂、少量門片與掠過光帶，避免蓋住角色。
    const base = c.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, 'rgba(10, 19, 29, 0.78)');
    base.addColorStop(0.55, 'rgba(28, 39, 50, 0.62)');
    base.addColorStop(1, 'rgba(5, 10, 17, 0.82)');
    c.fillStyle = base; c.globalAlpha = 0.54; c.fillRect(0, 0, width, height);

    // 只保留四條速度光帶，讀感接近列車行駛而不是滿屏粒子。
    c.globalAlpha = 0.18;
    c.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const y = height * (0.18 + i * 0.19);
      const offset = ((now * (160 + i * 24) + i * 57) % (width + 80)) - 40;
      c.strokeStyle = i % 2 ? '#b6d7e2' : '#ffe8a1';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(offset, y); c.lineTo(offset + 42 + i * 12, y); c.stroke();
    }

    for (let index = 0; index < kinjiVisual.carDoors.length; index++) {
      const door = kinjiVisual.carDoors[index];
      const reveal = opening ? easeOut(clamp((k.domainOpenElapsed - index * 0.075) / (KINJI_DOMAIN_OPEN_DURATION * 0.72), 0, 1)) : 1;
      const w = (door.width || KINJI_TRAIN_DOOR_WIDTH) * (0.58 + reveal * 0.42);
      const x = door.x + ((door.width || KINJI_TRAIN_DOOR_WIDTH) - w) * 0.5;
      const alpha = 0.24 + reveal * 0.34;
      c.globalAlpha = alpha;
      const grad = c.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, 'rgba(22, 35, 49, 0.84)');
      grad.addColorStop(0.47, 'rgba(94, 119, 132, 0.48)');
      grad.addColorStop(0.50, 'rgba(255, 226, 154, 0.72)');
      grad.addColorStop(0.53, 'rgba(94, 119, 132, 0.48)');
      grad.addColorStop(1, 'rgba(22, 35, 49, 0.84)');
      c.fillStyle = grad; c.fillRect(x, 0, w, height);
      c.strokeStyle = 'rgba(255, 239, 177, 0.42)'; c.lineWidth = 1;
      c.strokeRect(x + 2, 2, Math.max(1, w - 4), height - 4);
      c.strokeStyle = 'rgba(12, 22, 32, 0.78)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x + w / 2, 0); c.lineTo(x + w / 2, height); c.stroke();
      c.fillStyle = 'rgba(208, 235, 241, 0.16)'; c.fillRect(x + w * 0.22, 28, Math.max(2, w * 0.56), 52);
      c.fillStyle = 'rgba(255, 228, 161, 0.36)'; c.fillRect(x + w / 2 - 7, 112, 14, 2);
    }
    c.restore();
  }

  function drawCupHole(c, hole, active = false) {
    c.save();
    const pulse = active ? 1 + Math.sin(nowMs() / 70) * 0.08 : 1;
    c.translate(hole.x, hole.y); c.scale(pulse, pulse);
    c.fillStyle = 'rgba(35, 22, 16, 0.72)'; c.beginPath(); c.ellipse(0, 4, 12, 7, 0, 0, Math.PI * 2); c.fill();
    const grad = c.createRadialGradient(-3, -4, 1, 0, 0, 12);
    grad.addColorStop(0, hole.color || '#b33c35'); grad.addColorStop(0.72, hole.color || '#b33c35'); grad.addColorStop(1, '#3b251a');
    c.fillStyle = grad; c.beginPath(); c.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(248, 218, 150, 0.78)'; c.lineWidth = 1; c.stroke();
    if (active) { c.strokeStyle = '#fff2aa'; c.shadowBlur = 8; c.shadowColor = '#fff2aa'; c.stroke(); }
    c.restore();
  }

  function drawStarterHole(c, starter, flashLevel = 0) {
    c.save(); c.translate(starter.x, starter.y);
    c.fillStyle = 'rgba(37, 28, 22, 0.88)'; c.fillRect(-22, -7, 44, 14);
    c.fillStyle = '#17191b'; c.fillRect(-18, -4, 36, 8);
    c.strokeStyle = flashLevel > 0 ? '#ffeaa5' : '#77706a'; c.lineWidth = flashLevel > 0 ? 2.5 : 1.2; c.shadowBlur = flashLevel > 0 ? 12 : 0; c.shadowColor = '#ffeaa5'; c.strokeRect(-22, -7, 44, 14);
    const slide = flashLevel > 0 ? 5 + flashLevel * 8 : 0;
    c.fillStyle = '#4a4a43'; c.fillRect(-19 - slide, -5, 13, 10); c.fillRect(6 + slide, -5, 13, 10);
    c.fillStyle = flashLevel > 0 ? '#fff4b0' : '#77736c'; c.fillRect(-2, -2, 4, 4);
    c.restore();
  }

  function drawReelUI(c, b, k, width, height) {
    const x = clamp(b.x - 39, 5, width - 83);
    const y = clamp(b.y - radiusOf(b) - 42, 8, height - 34);
    const active = !!(k.domainActive || k.reelActive || k.reelPulse > 0);
    const alpha = active ? 0.92 : 0.52;
    const scale = active ? 1 + 0.16 * k.reelPulse : 1;
    const nums = k.domainNumbers || [];
    c.save(); c.globalAlpha = alpha; c.translate(x + 39, y + 12); c.scale(scale, scale);
    c.fillStyle = 'rgba(24, 18, 14, 0.92)'; c.fillRect(-39, -12, 78, 24);
    c.strokeStyle = active ? '#ffe08a' : '#bca56e'; c.lineWidth = active ? 2 : 1; c.strokeRect(-39, -12, 78, 24);
    for (let i = 0; i < 3; i++) {
      const cellX = -34 + i * 23;
      c.fillStyle = active ? 'rgba(101, 65, 28, 0.94)' : 'rgba(63, 49, 35, 0.78)'; c.fillRect(cellX, -8, 19, 16);
      c.strokeStyle = active ? '#f6cc70' : 'rgba(226, 205, 155, 0.65)'; c.strokeRect(cellX, -8, 19, 16);
      c.fillStyle = active ? '#fff0ac' : '#e5d4a2'; c.font = 'bold 13px Georgia,serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const reelText = nums[i] == null ? (i === 2 && k.domainThirdPending ? '…' : '？') : String(nums[i]);
      c.fillText(reelText, cellX + 9.5, 0);
    }
    if (k.simulatedReelRepeat && k.domainMissHold > 0) {
      c.fillStyle = '#bce7ff'; c.font = '800 8px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('↻ REPLAY', 0, -18);
    }
    c.restore();
  }

  function drawBeam(c, beam, width, height) {
    const owner = beam.owner;
    if (!owner || owner.hp <= 0) return;
    const top = { x: owner.x, y: owner.y - radiusOf(owner) - 30 };
    const a = Math.max(0, beam.life / beam.maxLife);
    c.save(); c.globalAlpha = a; c.strokeStyle = '#fff0a2'; c.shadowBlur = 12; c.shadowColor = '#ffe18a'; c.lineWidth = 6;
    c.beginPath(); c.moveTo(beam.x, beam.y); c.lineTo(top.x, top.y); c.stroke();
    c.globalAlpha = a * 0.46; c.strokeStyle = '#fffdf0'; c.lineWidth = 15; c.stroke();
    c.restore();
  }

  function drawJackpotFX(c, fx, width, height) {
    const t = clamp(1 - fx.life / fx.maxLife, 0, 1);
    const x = fx.x, y = fx.y;
    const chargeP = easeOut(clamp(t / 0.22, 0, 1));
    const burstP = easeOut(clamp((t - 0.12) / 0.54, 0, 1));
    const fade = clamp((1 - t) / 0.30, 0, 1);
    const nums = fx.numbers?.length === 3 ? fx.numbers : [7, 7, 7];
    const spin = (fx.spin || 0) + t * 2.6;
    const maxR = Math.max(width, height) * 0.24;
    c.save();
    c.globalCompositeOperation = 'source-over';

    // 第一拍：中心先壓縮成高亮金綠色能量核，製造中獎前的蓄力感。
    if (t < 0.30) {
      const pulse = 1 + Math.sin(t * 95) * 0.12;
      const coreR = (20 + chargeP * 30) * pulse;
      c.globalAlpha = 0.20 + chargeP * 0.42;
      c.fillStyle = '#ffe98a'; c.beginPath(); c.arc(x, y, coreR * 1.8, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.34 + chargeP * 0.28;
      c.fillStyle = '#62f3aa'; c.beginPath(); c.arc(x, y, coreR * 1.16, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#fff8c9'; c.lineWidth = 3.5; c.shadowColor = 'transparent'; c.shadowBlur = 0;
      c.beginPath(); c.arc(x, y, coreR, 0, Math.PI * 2); c.stroke();
    }

    // 第二拍：金色主爆閃與綠金融合的衝擊波，擴散但不長時間遮蔽戰場。
    if (t >= 0.08 && t < 0.78) {
      const detonate = easeOut(clamp((t - 0.08) / 0.28, 0, 1));
      const flashR = 26 + detonate * 70;
      c.globalAlpha = 0.18 * fade;
      c.fillStyle = '#fff7b7'; c.beginPath(); c.arc(x, y, flashR * 1.5, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.12 * fade;
      c.fillStyle = '#4deda0'; c.beginPath(); c.arc(x, y, flashR, 0, Math.PI * 2); c.fill();
    }

    // 三道擴散環分層推出，讓玩家能感覺到「中獎衝出去」的力道。
    for (let i = 0; i < KINJI_JACKPOT_RING_COUNT; i++) {
      const ringP = clamp((t - 0.10 - i * 0.08) / 0.72, 0, 1);
      if (ringP <= 0) continue;
      const ringR = 28 + ringP * (maxR * (0.58 + i * 0.16));
      c.globalAlpha = (1 - ringP) * (0.86 - i * 0.14);
      c.strokeStyle = i === 1 ? '#57f5a0' : '#ffe37b';
      c.shadowColor = 'transparent'; c.shadowBlur = 0;
      c.lineWidth = i === 0 ? 3.2 : 1.8;
      c.beginPath(); c.arc(x, y, ringR, spin * (i % 2 ? -0.5 : 0.7), spin * (i % 2 ? -0.5 : 0.7) + Math.PI * (1.52 + i * 0.22)); c.stroke();
    }

    // 放射光束只在爆發段出現，使用低成本線段而非大量粒子。
    if (t > 0.12 && t < 0.82) {
      c.lineCap = 'round'; c.lineWidth = 1.5;
      for (let i = 0; i < KINJI_JACKPOT_RAY_COUNT; i++) {
        const a = spin + i * Math.PI * 2 / KINJI_JACKPOT_RAY_COUNT;
        const jitter = 0.82 + ((i * 17) % 7) * 0.045;
        const inner = 24 + burstP * 20;
        const outer = inner + burstP * maxR * jitter;
        c.globalAlpha = (1 - clamp((t - 0.58) / 0.24, 0, 1)) * (0.32 + (i % 4) * 0.10);
        c.strokeStyle = i % 5 === 0 ? '#ffffff' : (i % 2 ? '#ffe27a' : '#63f7aa');
        c.beginPath(); c.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner); c.lineTo(x + Math.cos(a) * outer, y + Math.sin(a) * outer); c.stroke();
      }
    }

    // 少量四角星芒，提供「大獎閃爍」而不把整個畫面變成粒子牆。
    if (t > 0.18 && t < 0.95) {
      for (let i = 0; i < KINJI_JACKPOT_SPARK_COUNT; i++) {
        const a = spin * 0.7 + i * Math.PI * 2 / KINJI_JACKPOT_SPARK_COUNT;
        const orbit = 36 + burstP * (maxR * (0.45 + (i % 3) * 0.08));
        const sx = x + Math.cos(a) * orbit;
        const sy = y + Math.sin(a) * orbit;
        const size = 2.2 + (i % 3) * 1.1;
        c.globalAlpha = fade * (0.35 + (i % 4) * 0.12);
        c.fillStyle = i % 2 ? '#fff3a6' : '#b7ffdb';
        c.beginPath(); c.moveTo(sx, sy - size * 2.3); c.lineTo(sx + size * 0.8, sy); c.lineTo(sx, sy + size * 2.3); c.lineTo(sx - size * 0.8, sy); c.closePath(); c.fill();
      }
    }

    // 結果字卡：顯示實際三個數字，搭配大獎文字與金色描邊。
    if (t > 0.16 && t < 0.92) {
      const labelY = Math.max(34, y - 58 - burstP * 18);
      const textAlpha = fade * clamp((t - 0.16) / 0.16, 0, 1);
      c.globalAlpha = textAlpha;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '900 23px Georgia,serif'; c.lineWidth = 5; c.strokeStyle = 'rgba(65,28,5,0.95)'; c.fillStyle = '#fff2a1'; c.shadowColor = 'transparent'; c.shadowBlur = 0;
      c.strokeText(nums.join('  '), x, labelY); c.fillText(nums.join('  '), x, labelY);
      c.font = '900 18px system-ui,sans-serif'; c.lineWidth = 4; c.strokeStyle = 'rgba(75,31,3,0.92)'; c.fillStyle = '#fff8cf'; c.strokeText('大獎！', x, labelY + 25); c.fillText('大獎！', x, labelY + 25);
      c.font = '800 9px system-ui,sans-serif'; c.lineWidth = 2; c.fillStyle = '#ffe27a'; c.strokeStyle = 'rgba(55,27,5,0.85)';
      c.strokeText('JACKPOT', x, labelY + 40); c.fillText('JACKPOT', x, labelY + 40);
    }
    c.restore();
  }

  function drawKinjiChargeAura(c, b, k) {
    if (!k || k.jackpotTimer <= 0) return;
    const r = radiusOf(b);
    const phase = nowMs() / 1000 * KINJI_JACKPOT_AURA_PULSE_SPEED;
    const pulse = 0.62 + 0.38 * Math.sin(phase);
    const reach = r * KINJI_JACKPOT_AURA_RADIUS;
    c.save();
    c.globalCompositeOperation = 'screen';

    // 充涌的綠色咒力核心：只畫在球體外圍，不重繪角色本體。
    const aura = c.createRadialGradient(b.x, b.y, r * 0.72, b.x, b.y, reach);
    aura.addColorStop(0, `rgba(180,255,218,${0.28 + pulse * 0.16})`);
    aura.addColorStop(0.20, `rgba(64,255,157,${0.34 + pulse * 0.14})`);
    aura.addColorStop(0.56, `rgba(20,215,116,${0.16 + pulse * 0.08})`);
    aura.addColorStop(1, 'rgba(20,215,116,0)');
    c.fillStyle = aura; c.beginPath(); c.arc(b.x, b.y, reach, 0, Math.PI * 2); c.fill();

    // 兩圈清楚但低負載的脈動咒力環。
    c.globalAlpha = 0.72 + pulse * 0.20;
    c.strokeStyle = '#8dffd0'; c.shadowColor = '#25f18b'; c.shadowBlur = 10; c.lineWidth = 2.5;
    c.beginPath(); c.arc(b.x, b.y, r + 7 + Math.sin(phase) * 2.2, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 0.42 + pulse * 0.18; c.shadowBlur = 5; c.lineWidth = 1.35;
    c.setLineDash([7, 8]);
    c.beginPath(); c.arc(b.x, b.y, r + 14 + Math.cos(phase * 0.7) * 2, -phase * 0.18, -phase * 0.18 + Math.PI * 1.55); c.stroke();
    c.setLineDash([]);

    // 少量綠色能量節點，讓充涌狀態一眼可辨，但不再堆疊大量粒子。
    c.shadowBlur = 7;
    for (let i = 0; i < KINJI_JACKPOT_AURA_SPARKS; i++) {
      const a = phase * 0.42 + i * Math.PI * 2 / KINJI_JACKPOT_AURA_SPARKS;
      const orbit = r + 10 + (i % 2) * 6 + Math.sin(phase + i) * 2;
      const x = b.x + Math.cos(a) * orbit;
      const y = b.y + Math.sin(a) * orbit;
      c.globalAlpha = 0.48 + pulse * 0.30;
      c.fillStyle = i % 2 ? '#32f59a' : '#d0ffe8';
      c.beginPath(); c.arc(x, y, 1.6 + (i % 2) * 0.7, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }

  function drawVisibleEnemyBall(c, b) {
    const r = radiusOf(b);
    const color = b.char?.color || '#b8c7d1';
    c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.98;
    const grad = c.createRadialGradient(b.x - r * 0.3, b.y - r * 0.35, 1, b.x, b.y, r * 1.2);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.25, color); grad.addColorStop(1, '#20303b');
    c.fillStyle = grad; c.beginPath(); c.arc(b.x, b.y, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#f1f7f4'; c.lineWidth = 2; c.stroke();
    try {
      if (typeof drawCharIcon === 'function') drawCharIcon(c, b.char, b.x, b.y, r * 1.65);
      else { c.font = `${Math.max(12, r * 1.1)}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.char?.emoji || '●', b.x, b.y); }
    } catch (_) {}
    c.restore();
  }

  function drawKinjiMotionTrail(c, b, k) {
    const trail = k?.trailPositions;
    if (!trail || trail.length < 2) return;
    const radius = radiusOf(b);
    const charged = k?.jackpotTimer > 0;
    c.save();
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < trail.length - 1; i++) {
      const p = trail[i];
      const progress = (i + 1) / trail.length;
      c.globalAlpha = 0.045 + progress * 0.15;
      c.fillStyle = charged ? (i % 2 ? '#32f59a' : '#c8ffe3') : (i % 2 ? '#ff9d3d' : '#ffe8a1');
      c.beginPath(); c.arc(p.x, p.y, radius * (0.52 + progress * 0.20), 0, Math.PI * 2); c.fill();
      c.globalAlpha *= 0.65;
      c.strokeStyle = charged ? '#8dffd0' : '#fff0b0'; c.lineWidth = 1.2;
      c.beginPath(); c.arc(p.x, p.y, radius * (0.64 + progress * 0.16), 0, Math.PI * 2); c.stroke();
    }
    c.restore();
  }

  function drawKinjiBallBody(c, b) {
    const r = radiusOf(b);
    const powered = b.kinji?.jackpotTimer > 0;
    const color = powered ? '#43e58e' : (b.char?.color || '#f0a43c');
    c.save();
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 0.98;
    const glow = c.createRadialGradient(b.x - r * 0.32, b.y - r * 0.38, 1, b.x, b.y, r * 1.25);
    glow.addColorStop(0, powered ? '#f1fff7' : '#fffbe1');
    glow.addColorStop(0.20, powered ? '#b7ffdc' : '#ffe89b');
    glow.addColorStop(0.58, color);
    glow.addColorStop(1, powered ? '#126a46' : '#6f2d18');
    c.fillStyle = glow;
    c.beginPath(); c.arc(b.x, b.y, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = powered ? '#d9ffed' : '#fff4bd'; c.lineWidth = 2.2; c.stroke();
    c.globalAlpha = 0.80; c.strokeStyle = powered ? '#39f09a' : '#ff8a36'; c.lineWidth = 1;
    c.beginPath(); c.arc(b.x, b.y, r + 4 + Math.sin(nowMs() / 90) * 1.5, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  function drawKinjiBallStatus(c, b, k, width, height) {
    // 完全對齊鹿紫雲的球旁 HUD：無面板、無說明文字，只留數字／倒數。
    const heat = clamp(Math.round(k.passion), 0, KINJI_PASSION_MAX);
    const jackpot = Math.max(0, k.jackpotTimer || 0);
    const side = b.x > width * 0.68 ? -1 : 1;
    const x = clamp(b.x + side * (radiusOf(b) + 7), 4, width - 4);
    const y = clamp(b.y - radiusOf(b) - 4, 10, height - 8);
    const text = jackpot > 0 ? `${heat}·${Math.ceil(jackpot)}s` : String(heat);
    const color = jackpot > 0 ? '#8ff0c8' : '#ffe6a3';
    c.save(); c.globalAlpha = 0.96;
    c.font = '700 10px "Segoe UI Symbol", system-ui, sans-serif';
    c.textAlign = side > 0 ? 'left' : 'right'; c.textBaseline = 'middle';
    c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.90)'; c.fillStyle = color;
    c.strokeText(text, x, y); c.fillText(text, x, y);
    c.restore();
  }

  function drawSimulatedReelFX(c, fx, width, height) {
    const p = clamp(1 - fx.life / fx.maxLife, 0, 1);
    const fade = p < 0.18 ? p / 0.18 : 1 - clamp((p - 0.52) / 0.48, 0, 1);
    const cx = fx.x ?? width * 0.5;
    const cy = fx.y ?? height * 0.5;
    c.save();
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = 0.62 * fade;
    c.fillStyle = 'rgba(214,238,255,0.08)';
    c.fillRect(0, 0, width, height);
    c.strokeStyle = '#e5f4ff';
    c.shadowColor = '#9ed7ff';
    c.shadowBlur = 8;
    c.lineWidth = 1.8;
    const rays = 9;
    for (let i = 0; i < rays; i++) {
      const a = i * Math.PI * 2 / rays + 0.15;
      const len = Math.max(width, height) * (0.32 + (i % 3) * 0.08);
      const sx = cx + Math.cos(a) * 7;
      const sy = cy + Math.sin(a) * 7;
      const ex = cx + Math.cos(a) * len;
      const ey = cy + Math.sin(a) * len;
      const bend = 9 + (i % 4) * 5;
      c.beginPath(); c.moveTo(sx, sy);
      c.lineTo(cx + Math.cos(a) * len * 0.36 + Math.sin(a) * bend, cy + Math.sin(a) * len * 0.36 - Math.cos(a) * bend);
      c.lineTo(cx + Math.cos(a) * len * 0.68 - Math.sin(a) * bend * 0.6, cy + Math.sin(a) * len * 0.68 + Math.cos(a) * bend * 0.6);
      c.lineTo(ex, ey); c.stroke();
    }
    c.globalAlpha = 0.36 * fade;
    c.lineWidth = 5;
    c.strokeStyle = '#6ebfff';
    c.beginPath(); c.arc(cx, cy, 18 + p * 42, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  function drawOverlay(width, height) {
    const c = kinjiVisual.overlayCtx;
    if (!c || !kinjiVisual.overlay) return;
    const scaleX = kinjiVisual.overlay.width / Math.max(1, width);
    const scaleY = kinjiVisual.overlay.height / Math.max(1, height);
    c.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    c.clearRect(0, 0, width, height);
    const kinjis = aliveKinji(kinjiVisual.root);
    const domainKinji = kinjis.find(b => b.kinji?.domainActive);
    const anyDomain = !!domainKinji;
    ensureDomainScene(width, height);
    if (anyDomain) {
      drawDomainBackdrop(c, width, height);
      c.save();
      c.strokeStyle = 'rgba(255, 224, 160, 0.58)'; c.lineWidth = 1.2;
      c.strokeRect(6, 6, width - 12, height - 12);
      c.fillStyle = 'rgba(18, 13, 12, 0.24)'; c.fillRect(8, 8, width - 16, 18);
      c.fillStyle = 'rgba(255, 241, 184, 0.82)'; c.font = 'bold 10px system-ui,sans-serif'; c.textAlign = 'center';
      c.fillText('坐殺博徒', width / 2, 19);
      for (const hole of kinjiVisual.decorativeHoles) drawCupHole(c, hole, false);
      c.restore();
    }
    drawDragonFX(c, width, height, domainKinji);
    for (const b of kinjis) {
      const k = b.kinji; if (!k) continue;
      if (k.domainActive) {
        const starter = starterHolePosition(b, width, height);
        drawStarterHole(c, starter, k.starterHoleFlash);
        if (!k.domainOpening) drawReelUI(c, b, k, width, height);
        c.save(); c.fillStyle = '#fff0b0'; c.font = 'bold 9px system-ui,sans-serif'; c.textAlign = 'center';
        c.fillText('始動口', starter.x, starter.y + 17); c.restore();
      }
    }
    for (const p of kinjiVisual.balls) {
      c.save();
      const trail = Math.min(30, Math.hypot(p.vx, p.vy) * 0.055);
      const angle = Math.atan2(p.vy, p.vx);
      c.globalAlpha = 0.24; c.strokeStyle = '#ffe69a'; c.lineWidth = 3; c.shadowBlur = 10; c.shadowColor = '#ffe69a';
      c.beginPath(); c.moveTo(p.x - Math.cos(angle) * trail, p.y - Math.sin(angle) * trail); c.lineTo(p.x, p.y); c.stroke();
      c.globalAlpha = 1; c.fillStyle = '#fff4bc'; c.beginPath(); c.arc(p.x, p.y, p.radius, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ff9d3d'; c.beginPath(); c.arc(p.x - 2, p.y - 2, 2.5, 0, Math.PI * 2); c.fill(); c.restore();
    }
    for (const g of kinjiVisual.gates) {
      const closeT = easeOut(g.elapsed / g.closeDuration);
      const openT = g.phase === 'opening' ? easeOut(g.elapsed / g.openDuration) : 0;
      const gap = g.phase === 'closing' ? 42 - 34 * closeT : g.phase === 'hold' ? 8 : 8 + 34 * openT;
      const alpha = g.phase === 'opening' ? 1 - openT : 1;
      c.save(); c.translate(g.x, g.y); c.rotate(g.angle); c.globalAlpha = alpha;
      c.shadowBlur = 15; c.shadowColor = '#ffd166'; c.fillStyle = '#f5bd55';
      c.fillRect(-gap - 13, -25, 13, 50); c.fillRect(gap, -25, 13, 50);
      c.strokeStyle = '#fff2b5'; c.lineWidth = 2; c.strokeRect(-gap - 13, -25, 13, 50); c.strokeRect(gap, -25, 13, 50);
      c.fillStyle = 'rgba(255, 240, 169, 0.45)'; c.fillRect(-gap - 10, -19, 7, 38); c.fillRect(gap + 3, -19, 7, 38);
      c.restore();
    }
    for (const p of kinjiVisual.punches) {
      const alpha = Math.max(0, p.life / p.maxLife);
      const length = p.length || 20;
      const width = p.width || 5;
      c.save(); c.globalAlpha = alpha; c.translate(p.x, p.y); c.rotate(p.angle);
      c.lineCap = 'round';
      c.strokeStyle = p.finisher ? '#ffe08a' : p.slam ? '#ffd166' : '#ffb35c';
      c.lineWidth = width; c.shadowBlur = p.finisher ? 11 : p.slam ? 7 : 5; c.shadowColor = '#ff9f43';
      c.beginPath(); c.moveTo(-length, 0); c.lineTo(length, 0); c.stroke();
      // 第三拳開始加入垂直拳壓線，最後一拳形成短促交叉爆擊。
      if (p.slam) {
        c.globalAlpha = alpha * 0.72; c.lineWidth = Math.max(2, width * 0.42);
        c.beginPath(); c.moveTo(-length * 0.58, -width * 2.8); c.lineTo(length * 0.58, width * 2.8); c.stroke();
        c.beginPath(); c.moveTo(-length * 0.58, width * 2.8); c.lineTo(length * 0.58, -width * 2.8); c.stroke();
      }
      c.strokeStyle = '#fff1bc'; c.lineWidth = Math.max(1.5, width * 0.34); c.shadowBlur = 0;
      c.globalAlpha = alpha * 0.92; c.beginPath(); c.moveTo(-length, 0); c.lineTo(length, 0); c.stroke(); c.restore();
    }
    for (const burst of kinjiVisual.impactBursts) {
      const progress = 1 - Math.max(0, burst.life / burst.maxLife);
      const alpha = 1 - progress;
      c.save(); c.globalAlpha = alpha; c.strokeStyle = burst.color; c.shadowBlur = burst.lowCost ? 0 : 12; c.shadowColor = burst.lowCost ? 'transparent' : burst.color; c.lineWidth = 3;
      const radius = burst.radius * (0.65 + progress * 0.7);
      c.beginPath(); c.arc(burst.x, burst.y, radius, 0, Math.PI * 2); c.stroke();
      if (burst.rays) {
        const rays = burst.rays;
        c.lineWidth = burst.rays >= 24 ? 3.2 : 1.8;
        for (let i = 0; i < rays; i++) {
          const a = i * Math.PI * 2 / rays + progress * 0.18;
          const inner = radius * 0.72;
          const outer = radius + 10 + progress * (burst.rays >= 24 ? 46 : 24);
          c.globalAlpha = alpha * (0.55 + (i % 3) * 0.14);
          c.beginPath();
          c.moveTo(burst.x + Math.cos(a) * inner, burst.y + Math.sin(a) * inner);
          c.lineTo(burst.x + Math.cos(a) * outer, burst.y + Math.sin(a) * outer);
          c.stroke();
        }
        c.globalAlpha = alpha * 0.85;
        c.fillStyle = '#fff9d0'; c.shadowBlur = burst.lowCost ? 0 : 20; c.shadowColor = burst.lowCost ? 'transparent' : burst.color;
        c.beginPath(); c.arc(burst.x, burst.y, burst.rays >= 24 ? 3.5 + progress * 4 : 2 + progress * 2, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    }
    for (const beam of kinjiVisual.beamFx) drawBeam(c, beam, width, height);
    for (const text of kinjiVisual.comboTexts) {
      const alpha = Math.max(0, text.life / text.maxLife);
      const rise = (1 - alpha) * 18;
      c.save(); c.globalAlpha = alpha; c.translate(text.x, text.y - rise); c.scale(text.scale, text.scale);
      c.fillStyle = text.color; c.strokeStyle = 'rgba(41, 19, 8, 0.92)'; c.lineWidth = 2; c.font = '900 8px system-ui,sans-serif'; c.textAlign = 'center';
      c.strokeText(text.text, 0, 0); c.fillText(text.text, 0, 0); c.restore();
    }
    for (const s of kinjiVisual.sparks) {
      const alpha = Math.max(0, s.life / s.maxLife);
      c.save(); c.globalAlpha = alpha; c.fillStyle = s.color; c.shadowBlur = 7; c.shadowColor = s.color;
      c.beginPath(); c.arc(s.x, s.y, s.size, 0, Math.PI * 2); c.fill(); c.restore();
    }
    if (kinjiVisual.domainFlash > 0) {
      c.save(); c.globalAlpha = Math.min(0.18, kinjiVisual.domainFlash * 0.22); c.fillStyle = '#fff0ad'; c.fillRect(0, 0, width, height); c.restore();
    }
    for (const fx of kinjiVisual.jackpotFx) drawJackpotFX(c, fx, width, height);
    for (const fx of kinjiVisual.simulatedReelFx) drawSimulatedReelFX(c, fx, width, height);
    // 最後一層只補畫角色球：敵方球也重新繪製，避免列車門 Overlay 讓敵人消失。
    const visibleBalls = (kinjiVisual.root?.balls || []).filter(b => b && b.hp > 0);
    for (const b of visibleBalls) {
      const k = b.kinji;
      if (b.char?.type === KINJI_TYPE && k && (k.domainActive || k.jackpotTimer > 0)) {
        // 主畫布已繪製角色原始圖像；Overlay 只加殘影與綠色咒力光環，不能再畫通用球體覆蓋角色外觀。
        drawKinjiMotionTrail(c, b, k);
        drawKinjiChargeAura(c, b, k);
      }
      // 領域背景維持半透明，敵方球沿用主畫布原始角色圖像，不在 Overlay 重繪。
    }
    for (const b of kinjis) {
      const k = b.kinji; if (!k) continue;
      drawKinjiBallStatus(c, b, k, width, height);
    }
    if (!anyDomain && kinjiVisual.hud && kinjis.length === 0) kinjiVisual.hud.textContent = '';
  }

  function cleanupVisual(dt) {
    // DIO 世界時停期間保留秤金次現有畫面，避免拳影、閘門、領域閃光與 HUD 計時繼續前進。
    const root = getStateSafe();
    if (root?.dioWorldGlobalActive) return;
    const lists = [kinjiVisual.punches, kinjiVisual.sparks, kinjiVisual.impactBursts, kinjiVisual.comboTexts, kinjiVisual.beamFx, kinjiVisual.dragonComets, kinjiVisual.dragonRings, kinjiVisual.dragonWaves, kinjiVisual.dragonBursts, kinjiVisual.jackpotFx, kinjiVisual.simulatedReelFx];
    for (const list of lists) {
      for (let i = list.length - 1; i >= 0; i--) {
        list[i].life -= dt;
        if (list[i].life <= 0) list.splice(i, 1);
      }
    }
    for (let i = kinjiVisual.gates.length - 1; i >= 0; i--) {
      const g = kinjiVisual.gates[i];
      g.elapsed += dt;
      if (g.phase === 'closing' && g.elapsed >= g.closeDuration) {
        g.phase = 'hold'; g.elapsed = 0;
        if (!g.impacted) {
          g.impacted = true;
          emitSpark(g.x, g.y, '#fff0ae', 14);
          flash(getStateSafe(), g.x, g.y, 32, '#ffe08a');
          shake(getStateSafe(), 6, 0.12);
          hitSound('knife');
        }
      } else if (g.phase === 'hold' && g.elapsed >= g.holdDuration) {
        g.phase = 'opening'; g.elapsed = 0;
      } else if (g.phase === 'opening' && g.elapsed >= g.openDuration) {
        kinjiVisual.gates.splice(i, 1);
      }
    }
    kinjiVisual.domainFlash = Math.max(0, kinjiVisual.domainFlash - dt);
    for (const b of aliveKinji(kinjiVisual.root)) {
      if (!b.kinji) continue;
      b.kinji.reelPulse = Math.max(0, b.kinji.reelPulse - dt * 2.4);
      b.kinji.starterHoleFlash = Math.max(0, b.kinji.starterHoleFlash - dt * 3.6);
    }
  }

  function clearMatchVisuals(root = getStateSafe()) {
    if (root?.balls) {
      for (const b of root.balls) {
        if (!b?.kinji) continue;
        const k = b.kinji;
        k.domainActive = false;
        k.domainOpening = false;
        k.domainOpenElapsed = 0;
        k.domainElapsed = 0;
        k.domainResultHold = 0;
        k.domainThirdPending = false;
        k.reelActive = false;
        k.reelPulse = 0;
        k.domainMissHold = 0;
        k.domainNumbers = [];
        k.domainNumberTimer = 0;
        k.jackpotTimer = 0;
      }
    }
    kinjiVisual.gates = [];
    kinjiVisual.punches = [];
    kinjiVisual.sparks = [];
    kinjiVisual.impactBursts = [];
    kinjiVisual.comboTexts = [];
    kinjiVisual.beamFx = [];
    kinjiVisual.balls = [];
    kinjiVisual.dragonComets = [];
    kinjiVisual.dragonRings = [];
    kinjiVisual.dragonWaves = [];
    kinjiVisual.dragonBursts = [];
    kinjiVisual.jackpotFx = [];
    kinjiVisual.simulatedReelFx = [];
    kinjiVisual.domainFlash = 0;
    kinjiVisual.carDoors = [];
    kinjiVisual.pachinkoPins = [];
    kinjiVisual.decorativeHoles = [];
    kinjiVisual.starterHole = null;
    kinjiVisual.active = false;
    kinjiVisual.last = 0;
    if (kinjiVisual.overlayCtx && kinjiVisual.overlay) {
      kinjiVisual.overlayCtx.clearRect(0, 0, kinjiVisual.overlay.width, kinjiVisual.overlay.height);
    }
    if (kinjiVisual.overlay) kinjiVisual.overlay.style.display = 'none';
    if (kinjiVisual.hud) {
      kinjiVisual.hud.textContent = '';
      kinjiVisual.hud.style.display = 'none';
    }
  }

  if (typeof window !== 'undefined') window.__kinjiEndMatchCleanup = clearMatchVisuals;

  function frame(t) {
    const root = getStateSafe();
    const arena = getCanvasSafe();
    if (!root || !arena || !Array.isArray(root.balls)) {
      syncOverlay(false, 350, 350);
      requestAnimationFrame(frame);
      return;
    }
    if (root.matchEnded) {
      clearMatchVisuals(root);
      requestAnimationFrame(frame);
      return;
    }
    if (root !== kinjiVisual.root) {
      kinjiVisual.root = root;
      kinjiVisual.balls = [];
      kinjiVisual.gates = [];
      kinjiVisual.punches = [];
      kinjiVisual.sparks = [];
      kinjiVisual.impactBursts = [];
      kinjiVisual.comboTexts = [];
      kinjiVisual.beamFx = [];
      kinjiVisual.dragonComets = [];
      kinjiVisual.dragonRings = [];
      kinjiVisual.dragonWaves = [];
      kinjiVisual.dragonBursts = [];
      kinjiVisual.jackpotFx = [];
      kinjiVisual.simulatedReelFx = [];
      kinjiVisual.sceneWidth = 0;
      kinjiVisual.sceneHeight = 0;
      kinjiVisual.carDoors = [];
      kinjiVisual.pachinkoPins = [];
      kinjiVisual.decorativeHoles = [];
    }
    const dt = Math.min(0.05, Math.max(0, (t - (kinjiVisual.last || t)) / 1000));
    kinjiVisual.last = t;
    const kinjis = aliveKinji(root);
    kinjiVisual.active = kinjis.length > 0;
    for (const b of kinjis) updateKinji(b, dt);
    const width = Number.isFinite(window.W) ? window.W : arena.width;
    const height = Number.isFinite(window.H) ? window.H : arena.height;
    updateDomainScene(dt, width, height, kinjis.some(b => b.kinji?.domainActive));
    updatePachinkoBalls(dt, width, height);
    updateDragonFX(dt);
    cleanupVisual(dt);
    syncOverlay(kinjiVisual.active || kinjiVisual.balls.length > 0, width, height);
    drawOverlay(width, height);
    requestAnimationFrame(frame);
  }

  // 主引擎 dealDamage 透過此橋接呼叫秤金次專屬復活，不改動其他角色傷害路徑。
  if (typeof window !== 'undefined') window.__kinjiTrySimulatedReelRevive = trySimulatedReelRevive;

  function start() {
    setupOverlay();
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

