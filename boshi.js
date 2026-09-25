/**
 * boshi.js — 博士📡（粉為主 / 即時雷射版 v4）
 *
 * v4 修正：電球雷射從投射物改為「即時光束」
 *   - 發射瞬間判定，不經過空間
 *   - 不會被反投射物機制攔截
 *   - 光束僅作視覺呈現，持續 0.18 秒
 */
(function () {
  'use strict';
  const TYPE = 'boshi';

  // ── 配色（粉為主、紫為輔）──
  const PINK        = '#ff9fd6';
  const PINK_LIGHT  = '#ffd6ec';
  const PINK_GLOW   = '#ffb8e0';
  const PURPLE      = '#c77dff';
  const PURPLE_DEEP = '#8a3fb0';
  const CRIT        = '#ffb8e0';
  const CRIT_CORE   = '#fff0f8';

  // ══════════════════════════════════════════════════════════
  // 常數讀取
  // ══════════════════════════════════════════════════════════
  const RC = ['BOSHI_CRIT_CHANCE','BOSHI_CRIT_MULT','BOSHI_CRIT_LIGHTNING_DMG','BOSHI_CRIT_LIGHTNING_PARA',
    'BOSHI_ORB_COUNT','BOSHI_ORB_RADIUS','BOSHI_ORB_LASER_INTERVAL','BOSHI_ORB_LASER_DAMAGE',
    'BOSHI_ORB_LASER_SPEED','BOSHI_ORB_LASER_LIFE','BOSHI_ORB_ROTATE_SPEED',
    'BOSHI_SHIELD_MAX','BOSHI_SHIELD_REDUCE',
    'BOSHI_EM_FIELD_RADIUS','BOSHI_EM_FIELD_DURATION','BOSHI_EM_FIELD_CD',
    'BOSHI_EM_FIELD_THROW_SPEED','BOSHI_EM_FIELD_MAX_DIST','BOSHI_EM_FIELD_DPS','BOSHI_EM_FIELD_RING_TOL',
    'BOSHI_QUANTUM_CD','BOSHI_QUANTUM_STUN','BOSHI_QUANTUM_DURATION','BOSHI_QUANTUM_HALF_WIDTH',
    'BOSHI_QUANTUM_PULSE_CD','BOSHI_QUANTUM_PULSE_RATIO','BOSHI_QUANTUM_PULSE_DMG_CAP'];
  const miss = RC.filter(n => { try { return (0,eval)(`typeof ${n}`)==='undefined'; } catch(_){ return true; } });
  if (miss.length) { console.error('[boshi] 缺少常數：\n  '+miss.join('\n  ')); return; }

  const CRIT_CHANCE=BOSHI_CRIT_CHANCE, CRIT_MULT=BOSHI_CRIT_MULT,
        CRIT_L_DMG=BOSHI_CRIT_LIGHTNING_DMG, CRIT_L_PARA=BOSHI_CRIT_LIGHTNING_PARA,
        ORB_COUNT=BOSHI_ORB_COUNT, ORB_RADIUS=BOSHI_ORB_RADIUS,
        ORB_CD=BOSHI_ORB_LASER_INTERVAL, ORB_DMG=BOSHI_ORB_LASER_DAMAGE,
        ORB_ROT=BOSHI_ORB_ROTATE_SPEED,
        SH_MAX=BOSHI_SHIELD_MAX, SH_RED=BOSHI_SHIELD_REDUCE,
        EM_R=BOSHI_EM_FIELD_RADIUS, EM_DUR=BOSHI_EM_FIELD_DURATION, EM_CD=BOSHI_EM_FIELD_CD,
        EM_MAX=BOSHI_EM_FIELD_MAX_DIST, EM_DPS=BOSHI_EM_FIELD_DPS, EM_TOL=BOSHI_EM_FIELD_RING_TOL,
        Q_CD=BOSHI_QUANTUM_CD, Q_STUN=BOSHI_QUANTUM_STUN, Q_DUR=BOSHI_QUANTUM_DURATION,
        Q_HW=BOSHI_QUANTUM_HALF_WIDTH, Q_PCD=BOSHI_QUANTUM_PULSE_CD,
        Q_RATIO=BOSHI_QUANTUM_PULSE_RATIO, Q_CAP=BOSHI_QUANTUM_PULSE_DMG_CAP;

  // 雷射視覺持續時間（不影響判定，因為判定是瞬時的）
  const BEAM_VISUAL_LIFE = 0.18;

  // ══════════════════════════════════════════════════════════
  // 工具
  // ══════════════════════════════════════════════════════════
  const $S = () => (typeof state!=='undefined' && state) ? state : null;
  const $C = () => (typeof canvas!=='undefined' && canvas) ? canvas : document.getElementById('arena');
  const $W = () => (typeof W!=='undefined' && W>0) ? W : ($C()?.width || 350);
  const $H = () => (typeof H!=='undefined' && H>0) ? H : ($C()?.height || 350);
  const $R = b => { const r = Number(b?.r); return Number.isFinite(r)&&r>0 ? r : (typeof RADIUS!=='undefined'?RADIUS:25); };
  const targets = () => { try { return typeof getAllCombatTargets==='function' ? getAllCombatTargets() : ($S()?.balls||[]); } catch(_){ return $S()?.balls||[]; } };
  const nearest = (x,y,ep) => {
    let best=null, bd=Infinity;
    for (const t of targets()) {
      if (!t || t.hp<=0) continue;
      if ((t.player??t.ownerPlayer??t.owner)===ep) continue;
      if (t.ewCamouflaged) continue;
      const d=(t.x-x)**2+(t.y-y)**2;
      if (d<bd) { bd=d; best=t; }
    }
    return best;
  };
  const inDry = b => { try { return typeof isBallInBossDryPowderZone==='function' && isBallInBossDryPowderZone(b); } catch(_){ return false; } };
  const snd = t => { try { if (typeof playHitSound==='function') playHitSound(t); } catch(_){} };
  const flash = (x,y,r,c,t) => { const s=$S(); if (s?.hitFlashes) s.hitFlashes.push({x,y,r,alpha:1,color:c,t}); };
  const deal = (t,d,o) => { try { if (typeof dealDamage==='function') dealDamage(t,d,o||{}); else if (t && Number.isFinite(t.hp)) t.hp=Math.max(0,t.hp-d); } catch(_){ if (t && Number.isFinite(t.hp)) t.hp=Math.max(0,t.hp-d); } };

  // ══════════════════════════════════════════════════════════
  // 反投射物清單
  // ══════════════════════════════════════════════════════════
  function projArrays() {
    const s=$S(); if (!s) return [];
    const L=[], push=a=>{ if(Array.isArray(a)) L.push(a); };
    push(s.projectiles); push(s.otisMagicBullets); push(s.getoUltimateProjectiles);
    push(s.tigerNovaNeedles); push(s.oniichanSpikes); push(s.fisherOceanWaves);
    push(s.starSmallStars); push(s.curseSlashFX); push(s.curseFireFX);
    push(s.obitoFireballs); push(s.starBigStars); push(s.starMeteors);
    push(s.kashimoDeerOrbs); push(s.bossDryPowderExtinguishers);
    for (const b of (s.balls||[])) {
      if (!b) continue;
      push(b.sansBones); push(b.emBullets); push(b.cannonBalls);
      push(b.oniichanTrackBalls); push(b.gojoBalls); push(b.johnnyAct4Projectiles);
    }
    return L;
  }
  const pOwner = p => p?.owner ?? p?.ownerBall?.player ?? null;
  function clearProj(fn) {
    let n=0;
    for (const a of projArrays()) {
      if (!Array.isArray(a)) continue;
      for (let i=a.length-1; i>=0; i--) {
        const p=a[i]; if (!p) continue;
        if (fn(p, pOwner(p))) { if (typeof p.active==='boolean') p.active=false; a.splice(i,1); n++; }
      }
    }
    return n;
  }

  // ══════════════════════════════════════════════════════════
  // 狀態
  // ══════════════════════════════════════════════════════════
  function ensure(b) {
    if (b._boshiInit) return;
    b._boshiInit = true;
    b.boshiShield=SH_MAX;
    b.boshiOrbAngle=0;
    b.boshiOrbLaserTimer=ORB_CD;
    b.boshiEmCd=EM_CD*0.4;
    b.boshiQuantumCd=Q_CD;
    b.boshiCritFlashTimer=0;
  }

  // ══════════════════════════════════════════════════════════
  // 護盾 hook
  // ══════════════════════════════════════════════════════════
  let _hookDmg=null;
  function hookShield() {
    if (_hookDmg) return;
    if (typeof window.dealDamage!=='function') return;
    _hookDmg = window.dealDamage;
    window.dealDamage = function (target, dmg, options) {
      const o = options||{};
      if (target?.char?.type===TYPE) {
        const bypass = o.bypassParry||o.codeKill||o.worldSlash||o.otisSureHit;
        const safe = target.invincible||target.opmExecuted;
        if (!bypass && !safe && (target.boshiShield||0)>0 && Number.isFinite(dmg) && dmg>0) {
          target.boshiShield--;
          dmg *= (1-SH_RED);
          flash(target.x, target.y, 32, PINK_LIGHT, 0.3);
        }
      }
      return _hookDmg.call(this, target, dmg, options);
    };
  }

  // ══════════════════════════════════════════════════════════
  // 傷害池 hook
  // ══════════════════════════════════════════════════════════
  let _hookPool=null;
  function hookPool() {
    if (_hookPool) return;
    if (typeof window.dealDamage!=='function') return;
    _hookPool = window.dealDamage;
    window.dealDamage = function (target, dmg, options) {
      const o = options||{};
      const s = $S();
      if (s?._boshiQuanta && o.attackerBall && !o.boshiPulse && Number.isFinite(dmg) && dmg>0) {
        const a = o.attackerBall;
        for (const z of s._boshiQuanta) {
          if (a.player!==z.owner) continue;
          if (inZone(a.x, a.y, z, $R(a))) z.pool += dmg;
        }
      }
      return _hookPool.call(this, target, dmg, options);
    };
  }

  // ══════════════════════════════════════════════════════════
  // 爆擊閃電
  // ══════════════════════════════════════════════════════════
  function critStrike(b, target) {
    if (!target || target.hp<=0) return;
    deal(target, CRIT_L_DMG, { attackerPlayer:b.player, attackerBall:b, boshiCritLightning:true });
    if (!(target.char?.type==='baie' && target.baieLoveActive)) {
      target.thunderParalyzed = Math.max(target.thunderParalyzed||0, CRIT_L_PARA);
    }
    const s = $S();
    if (s?.thunderStunFX) s.thunderStunFX.push({x:target.x,y:target.y,life:0.3,maxLife:0.3});
    if (!s._boshiBolts) s._boshiBolts=[];
    s._boshiBolts.push({x:target.x,y:target.y,life:0.5,maxLife:0.5,seed:Math.random()*1000});
    flash(target.x, target.y, 36, CRIT, 0.3);
    if (b) b.boshiCritFlashTimer = 0.3;
  }

  // ══════════════════════════════════════════════════════════
  // 電球雷射：即時光束
  //   發射瞬間對鎖定目標造成傷害，光束僅作視覺
  // ══════════════════════════════════════════════════════════
  function fireLasers(b, s) {
    const enemies = targets().filter(t => t && t.hp>0 && (t.player??t.ownerPlayer??t.owner)!==b.player && !t.ewCamouflaged);
    if (!enemies.length) return;
    enemies.sort((a,c) => ((a.x-b.x)**2+(a.y-b.y)**2) - ((c.x-b.x)**2+(c.y-b.y)**2));

    if (!s._boshiBeams) s._boshiBeams = [];

    for (let i = 0; i < ORB_COUNT; i++) {
      const t = enemies[i % enemies.length];
      if (!t) continue;

      const oa = b.boshiOrbAngle + (i / ORB_COUNT) * Math.PI * 2;
      const ox = b.x + Math.cos(oa) * ORB_RADIUS;
      const oy = b.y + Math.sin(oa) * ORB_RADIUS;

      // 判定：瞬時對鎖定目標造成傷害
      const isCrit = Math.random() < CRIT_CHANCE;
      const dmg = isCrit ? ORB_DMG * CRIT_MULT : ORB_DMG;
      deal(t, dmg, { attackerPlayer: b.player, attackerBall: b });
      if (isCrit) critStrike(b, t);
      flash(t.x, t.y, isCrit ? 32 : 22, isCrit ? CRIT : PINK, 0.22);

      // 記錄光束視覺
      s._boshiBeams.push({
        x1: ox, y1: oy,
        x2: t.x, y2: t.y,
        life: BEAM_VISUAL_LIFE,
        maxLife: BEAM_VISUAL_LIFE,
        isCrit,
        seed: Math.random() * 1000,
      });
    }
    snd('knife');
  }

  function updateBeams(dt, s) {
    if (!s._boshiBeams) s._boshiBeams = [];
    for (let i = s._boshiBeams.length - 1; i >= 0; i--) {
      s._boshiBeams[i].life -= dt;
      if (s._boshiBeams[i].life <= 0) s._boshiBeams.splice(i, 1);
    }
  }

  // ══════════════════════════════════════════════════════════
  // 電磁場
  // ══════════════════════════════════════════════════════════
  function castEM(b, s) {
    if (!s._boshiEM) s._boshiEM=[];
    const e = nearest(b.x, b.y, b.player); if (!e) return;
    const ang = Math.atan2(e.y-b.y, e.x-b.x);
    const d = Math.min(EM_MAX, Math.hypot(e.x-b.x, e.y-b.y));
    const tx=b.x+Math.cos(ang)*d, ty=b.y+Math.sin(ang)*d;
    s._boshiEM.push({
      owner:b.player, ownerBall:b, x:tx, y:ty,
      radius:EM_R, life:EM_DUR, maxLife:EM_DUR,
      tick:0, enterFlags:Object.create(null), born:performance.now()/1000
    });
    flash(tx, ty, EM_R, PINK, 0.4);
    snd('knife');
  }

  function updateEM(dt, s) {
    if (!s._boshiEM) s._boshiEM=[];
    const a=s._boshiEM;
    for (let i=a.length-1; i>=0; i--) {
      const f=a[i]; if (!f) { a.splice(i,1); continue; }
      if (s.dioWorldGlobalActive && (!s.dioWorldCaster || f.owner!==s.dioWorldCaster.player)) continue;
      f.life-=dt;
      if (f.life<=0) { a.splice(i,1); continue; }

      clearProj((p,o) => {
        if (o===f.owner) return false;
        const d=Math.hypot(p.x-f.x, p.y-f.y);
        return d>=f.radius-EM_TOL && d<=f.radius+EM_TOL;
      });

      for (const foe of targets()) {
        if (!foe || foe.hp<=0) continue;
        if ((foe.player??foe.ownerPlayer??foe.owner)===f.owner) continue;
        if (Math.hypot(foe.x-f.x, foe.y-f.y) <= f.radius+$R(foe)) {
          f.tick-=dt;
          if (f.tick<=0) {
            f.tick += 1.0;
            deal(foe, EM_DPS, { attackerPlayer:f.owner, attackerBall:f.ownerBall, continuousDamage:true });
            flash(foe.x, foe.y, 16, PINK, 0.22);
          }
        }
      }

      const o=f.ownerBall;
      if (o && o.hp>0 && !f.enterFlags.owner) {
        if (Math.hypot(o.x-f.x, o.y-f.y) <= f.radius+$R(o)) {
          f.enterFlags.owner=true;
          o.boshiShield = Math.min(SH_MAX, (o.boshiShield||0)+1);
          flash(o.x, o.y, 30, PINK_LIGHT, 0.4);
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 量子領域
  // ══════════════════════════════════════════════════════════
  function inZone(px, py, z, r=0) {
    const dx=px-z.sx, dy=py-z.sy;
    const along = dx*z.ux + dy*z.uy;
    const perp = dx*(-z.uy) + dy*z.ux;
    const len = Math.hypot(z.ex-z.sx, z.ey-z.sy);
    return along>=-r && along<=len+r && Math.abs(perp)<=z.hw+r;
  }

  function castQuantum(b, s) {
    if (!s._boshiQ) s._boshiQ=[];
    const e = nearest(b.x, b.y, b.player); if (!e) return;
    const ang = Math.atan2(e.y-b.y, e.x-b.x);
    // 瞬移穿過敵人
    const over = $R(b)+$R(e)+20;
    const tx = e.x + Math.cos(ang)*over;
    const ty = e.y + Math.sin(ang)*over;
    b.x=tx; b.y=ty; b.vx=0; b.vy=0;
    flash(tx, ty, 42, PINK, 0.4);

    // 構造貫穿場地的長條
    const W=$W(), H=$H();
    const ux=Math.cos(ang), uy=Math.sin(ang);
    let bT=Infinity, fT=Infinity;
    if (ux>1e-6) { bT=Math.min(bT,(0-tx)/ux); fT=Math.min(fT,(W-tx)/ux); }
    else if (ux<-1e-6) { bT=Math.min(bT,(W-tx)/ux); fT=Math.min(fT,(0-tx)/ux); }
    if (uy>1e-6) { bT=Math.min(bT,(0-ty)/uy); fT=Math.min(fT,(H-ty)/uy); }
    else if (uy<-1e-6) { bT=Math.min(bT,(H-ty)/uy); fT=Math.min(fT,(0-ty)/uy); }
    if (!isFinite(bT)) bT = -Math.hypot(W,H);
    if (!isFinite(fT)) fT = Math.hypot(W,H);

    const z = {
      owner:b.player, ownerBall:b, angle:ang, ux, uy,
      sx: tx+ux*bT, sy: ty+uy*bT,
      ex: tx+ux*fT, ey: ty+uy*fT,
      hw: Q_HW, life:Q_DUR, maxLife:Q_DUR,
      pulseT:0, pool:0, pulses:[]
    };
    s._boshiQ.push(z);

    for (const foe of targets()) {
      if (!foe || foe.hp<=0) continue;
      if ((foe.player??foe.ownerPlayer??foe.owner)===b.player) continue;
      if (inZone(foe.x, foe.y, z, $R(foe))) {
        if (!(foe.char?.type==='baie' && foe.baieLoveActive)) {
          foe.thunderParalyzed = Math.max(foe.thunderParalyzed||0, Q_STUN);
          foe.vx=0; foe.vy=0;
        }
      }
    }
    clearProj((p,o) => o!==b.player);
    flash(tx, ty, 42, PINK, 0.5);
    snd('opm');
  }

  function updateQ(dt, s) {
    if (!s._boshiQ) s._boshiQ=[];
    const a=s._boshiQ;
    for (let i=a.length-1; i>=0; i--) {
      const z=a[i]; if (!z) { a.splice(i,1); continue; }
      if (s.dioWorldGlobalActive && (!s.dioWorldCaster || z.owner!==s.dioWorldCaster.player)) continue;
      z.life-=dt;
      if (z.life<=0) { a.splice(i,1); continue; }
      z.pulseT-=dt;
      if (z.pulseT<=0) {
        z.pulseT += Q_PCD;
        const dmg = Math.min(Q_CAP, z.pool*Q_RATIO);
        if (dmg>0) {
          for (const foe of targets()) {
            if (!foe || foe.hp<=0) continue;
            if ((foe.player??foe.ownerPlayer??foe.owner)===z.owner) continue;
            if (inZone(foe.x, foe.y, z, $R(foe))) {
              deal(foe, dmg, { attackerPlayer:z.owner, attackerBall:z.ownerBall, boshiPulse:true });
              flash(foe.x, foe.y, 24, PINK_LIGHT, 0.3);
            }
          }
        }
        z.pool = 0;
        z.pulses.push({ t:0, life:Q_PCD*0.9, maxLife:Q_PCD*0.9 });
      }
      for (let pi=z.pulses.length-1; pi>=0; pi--) {
        const pl=z.pulses[pi];
        pl.t += dt/pl.life;
        if (pl.t>=1) z.pulses.splice(pi,1);
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 主邏輯
  // ══════════════════════════════════════════════════════════
  function frozen(b, s) {
    if (!b) return true;
    if (s?.dioWorldGlobalActive && s.dioWorldCaster!==b) return true;
    if (b.obitoInSpace) return true;
    if (b.pucciDiscFrozen) return true;
    if (b.cooldownFreezeTimer>0) return true;
    if (b.arenaFrozen>0) return true;
    if (inDry(b)) return true;
    try { return typeof hasStatusEffect==='function' && hasStatusEffect(b,'cooldownFreeze'); } catch(_){ return false; }
  }

  function tick(b, dt, s) {
    if (frozen(b,s)) return;
    b.boshiOrbAngle += dt*ORB_ROT;
    b.boshiOrbLaserTimer -= dt;
    if (b.boshiOrbLaserTimer<=0) { b.boshiOrbLaserTimer += ORB_CD; fireLasers(b,s); }
    if (b.boshiEmCd>0) b.boshiEmCd-=dt;
    if (b.boshiEmCd<=0 && nearest(b.x,b.y,b.player)) { castEM(b,s); b.boshiEmCd=EM_CD; }
    if (b.boshiQuantumCd>0) b.boshiQuantumCd-=dt;
    if (b.boshiQuantumCd<=0 && nearest(b.x,b.y,b.player)) { castQuantum(b,s); b.boshiQuantumCd=Q_CD; }
    if (b.boshiCritFlashTimer>0) b.boshiCritFlashTimer-=dt;
  }

  // ══════════════════════════════════════════════════════════
  // Overlay
  // ══════════════════════════════════════════════════════════
  const ov = { c:null, ctx:null, lastRoot:null, lastT:0 };

  function setup() {
    if (ov.c && document.body.contains(ov.c)) return;
    const c = document.createElement('canvas');
    c.id='boshi-overlay';
    c.style.cssText='position:fixed;pointer-events:none;z-index:19;display:none;';
    document.body.appendChild(c);
    ov.c = c; ov.ctx = c.getContext('2d');
  }

  function sync(active) {
    setup();
    const ar=$C(); if (!ar || !ov.c) return;
    const r=ar.getBoundingClientRect();
    const dpr=Math.min(2, window.devicePixelRatio||1);
    const W=$W(), H=$H();
    ov.c.width=Math.max(1,Math.round(W*dpr));
    ov.c.height=Math.max(1,Math.round(H*dpr));
    ov.c.style.left=r.left+'px'; ov.c.style.top=r.top+'px';
    ov.c.style.width=r.width+'px'; ov.c.style.height=r.height+'px';
    ov.c.style.display=active?'block':'none';
  }

  // ── 繪製輔助 ──
  function glow(x, y, r, col, a=1) {
    const c=ov.ctx;
    const g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0, col+'ff');
    g.addColorStop(0.4, col+'88');
    g.addColorStop(1, col+'00');
    c.globalAlpha=a; c.fillStyle=g;
    c.beginPath(); c.arc(x,y,r,0,6.2832); c.fill();
    c.globalAlpha=1;
  }
  function ring(x, y, r, col, w=2, a=1) {
    const c=ov.ctx;
    c.globalAlpha=a; c.strokeStyle=col; c.lineWidth=w;
    c.beginPath(); c.arc(x,y,r,0,6.2832); c.stroke();
    c.globalAlpha=1;
  }
  function hexRing(x, y, r, n, rot, col, w=1.6, a=1) {
    const c=ov.ctx;
    c.save(); c.translate(x,y); c.rotate(rot);
    c.globalAlpha=a; c.strokeStyle=col; c.lineWidth=w;
    c.beginPath();
    for (let i=0;i<=n;i++) {
      const ang=i/n*6.2832;
      const px=Math.cos(ang)*r, py=Math.sin(ang)*r;
      i===0 ? c.moveTo(px,py) : c.lineTo(px,py);
    }
    c.stroke(); c.restore(); c.globalAlpha=1;
  }
  function bolt(x1,y1,x2,y2,seed,w,col,core) {
    const c=ov.ctx;
    const dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy)||1;
    const px=-dy/len, py=dx/len;
    c.beginPath(); c.moveTo(x1,y1);
    for (let i=1;i<7;i++) {
      const t=i/7;
      const j=Math.sin(seed+i*7.13)*8*(1-Math.abs(t-0.5)*1.2);
      c.lineTo(x1+dx*t+px*j, y1+dy*t+py*j);
    }
    c.lineTo(x2,y2);
    c.strokeStyle=col; c.lineWidth=w;
    c.shadowColor=col; c.shadowBlur=18; c.stroke();
    c.shadowBlur=6; c.strokeStyle=core; c.lineWidth=w*0.42; c.stroke();
    c.shadowBlur=0;
  }

  function draw(t, active) {
    const c=ov.ctx; if (!c) return;
    const s=$S(); if (!s) return;
    const W=$W(), H=$H();
    const dpr=ov.c.width/Math.max(1,W);
    c.setTransform(dpr,0,0,dpr,0,0);
    c.clearRect(0,0,W,H);
    if (!active) return;

    const balls = s.balls||[];

    // ── 電磁場 ──
    if (s._boshiEM) for (const f of s._boshiEM) {
      const fade = Math.min(1, f.life/f.maxLife);
      const age = t - (f.born||t);

      glow(f.x, f.y, f.radius*1.15, PINK, 0.22*fade);
      glow(f.x, f.y, f.radius*0.7, PURPLE, 0.28*fade);

      // 螺旋電場線
      c.save(); c.translate(f.x,f.y);
      c.globalCompositeOperation='lighter';
      for (let k=0;k<3;k++) {
        c.rotate(t*0.8*(k%2?1:-1)+k*2.1);
        c.strokeStyle=PINK_LIGHT;
        c.globalAlpha=0.35*fade;
        c.lineWidth=1.4;
        c.beginPath();
        for (let i=0;i<=20;i++) {
          const rr = f.radius*0.15 + (f.radius*0.75)*(i/20);
          const ang = i*0.4 + k*1.2;
          const px=Math.cos(ang)*rr, py=Math.sin(ang)*rr;
          i===0 ? c.moveTo(px,py) : c.lineTo(px,py);
        }
        c.stroke();
      }
      c.restore(); c.globalAlpha=1; c.globalCompositeOperation='source-over';

      // 上升粒子
      for (let i=0;i<10;i++) {
        const a = (i/10)*6.2832 + t*0.5;
        const rr = f.radius*(0.4 + 0.55*((Math.sin(t*1.6+i*3.1)+1)*0.5));
        const px = f.x+Math.cos(a)*rr;
        const py = f.y+Math.sin(a)*rr*0.6 - ((t*0.3+i*0.7)%1)*f.radius*0.9;
        c.globalAlpha = 0.7*fade;
        c.fillStyle = i%2 ? PINK_LIGHT : PINK_GLOW;
        c.beginPath(); c.arc(px,py,1.6,0,6.2832); c.fill();
      }
      c.globalAlpha=1;

      // 邊緣雙層
      ring(f.x, f.y, f.radius, PINK, 3, 0.9*fade);
      c.save();
      c.setLineDash([12,6]); c.lineDashOffset = -t*40;
      ring(f.x, f.y, f.radius*0.92, PINK_LIGHT, 1.4, 0.6*fade);
      c.setLineDash([]);
      c.restore();

      // 邊緣電弧
      c.globalCompositeOperation='lighter';
      for (let k=0;k<4;k++) {
        const a0 = t*2 + k*1.57;
        const a1 = a0 + 0.9;
        const x1 = f.x+Math.cos(a0)*f.radius;
        const y1 = f.y+Math.sin(a0)*f.radius;
        const x2 = f.x+Math.cos(a1)*f.radius;
        const y2 = f.y+Math.sin(a1)*f.radius;
        bolt(x1,y1,x2,y2, t*7+k*13, 1.6, PINK, CRIT_CORE);
      }
      c.globalCompositeOperation='source-over';

      // 擴散環
      const burst = ((age % 0.6) / 0.6);
      if (burst < 1) {
        const br = f.radius + burst*f.radius*0.5;
        c.globalAlpha = (1-burst)*0.55*fade;
        c.strokeStyle = PINK_LIGHT; c.lineWidth = 2;
        c.beginPath(); c.arc(f.x, f.y, br, 0, 6.2832); c.stroke();
        c.globalAlpha=1;
      }
    }

    // ── 量子領域 ──
    if (s._boshiQ) for (const z of s._boshiQ) {
      const fade = Math.min(1, z.life/z.maxLife);
      const len = Math.hypot(z.ex-z.sx, z.ey-z.sy);
      const cx = (z.sx+z.ex)/2, cy = (z.sy+z.ey)/2;

      c.save();
      c.translate(cx,cy); c.rotate(z.angle);

      const bg = c.createLinearGradient(-len/2,0,len/2,0);
      bg.addColorStop(0, `rgba(255,159,214,${0.06*fade})`);
      bg.addColorStop(0.5, `rgba(255,184,224,${0.18*fade})`);
      bg.addColorStop(1, `rgba(199,125,255,${0.06*fade})`);
      c.fillStyle=bg;
      c.fillRect(-len/2, -z.hw, len, z.hw*2);

      // 內部網格
      c.globalAlpha=0.22*fade;
      c.strokeStyle=PINK_LIGHT; c.lineWidth=0.8;
      const step = z.hw*0.66;
      for (let yy=-z.hw+step; yy<z.hw; yy+=step) {
        c.beginPath(); c.moveTo(-len/2, yy); c.lineTo(len/2, yy); c.stroke();
      }
      for (let xx=-len/2+step*2; xx<len/2; xx+=step*2) {
        c.beginPath(); c.moveTo(xx, -z.hw); c.lineTo(xx, z.hw); c.stroke();
      }
      c.globalAlpha=1;

      // 漂移光帶
      c.globalCompositeOperation='lighter';
      for (let k=0;k<3;k++) {
        const shift = ((t*0.8 + k*0.33) % 1);
        const py = -z.hw + shift * z.hw*2;
        const grad2 = c.createLinearGradient(-len/2, py, len/2, py);
        grad2.addColorStop(0, 'rgba(255,184,224,0)');
        grad2.addColorStop(0.5, `rgba(255,214,236,${0.5*fade})`);
        grad2.addColorStop(1, 'rgba(255,184,224,0)');
        c.strokeStyle=grad2; c.lineWidth=1.8;
        c.beginPath(); c.moveTo(-len/2, py); c.lineTo(len/2, py); c.stroke();
      }
      c.globalCompositeOperation='source-over';

      // 邊界
      c.strokeStyle=PINK; c.lineWidth=2.4; c.shadowColor=PINK; c.shadowBlur=14;
      c.strokeRect(-len/2, -z.hw, len, z.hw*2);
      c.shadowBlur=0;
      c.strokeStyle=PINK_LIGHT; c.lineWidth=1;
      c.strokeRect(-len/2+3, -z.hw+3, len-6, z.hw*2-6);

      // 脈衝掃描
      for (const pl of z.pulses) {
        const px = -len/2 + len*pl.t;
        const a = Math.sin(pl.t*Math.PI);
        const sg = c.createLinearGradient(px-40, 0, px+8, 0);
        sg.addColorStop(0, 'rgba(255,184,224,0)');
        sg.addColorStop(0.7, `rgba(255,214,236,${a*0.7})`);
        sg.addColorStop(1, `rgba(255,240,248,${a*0.95})`);
        c.fillStyle=sg;
        c.fillRect(px-40, -z.hw, 48, z.hw*2);
        c.globalCompositeOperation='lighter';
        c.strokeStyle=CRIT_CORE; c.lineWidth=2.5; c.shadowColor=CRIT_CORE; c.shadowBlur=22;
        c.beginPath(); c.moveTo(px, -z.hw); c.lineTo(px, z.hw); c.stroke();
        c.shadowBlur=0; c.globalCompositeOperation='source-over';
        for (let k=0;k<3;k++) {
          const yy = -z.hw + ((k+0.5)/3)*z.hw*2;
          bolt(px-16, yy, px+16, yy, pl.t*100+k*13, 1.2, PINK_LIGHT, CRIT_CORE);
        }
      }

      // 漂浮粒子
      c.globalAlpha=0.75*fade;
      for (let i=0;i<14;i++) {
        const px = -len/2 + ((i*0.137+t*0.15) % 1)*len;
        const py = Math.sin(t*1.7 + i*2.1)*z.hw*0.75;
        c.fillStyle = i%2 ? PINK_LIGHT : PINK_GLOW;
        c.beginPath(); c.arc(px, py, 1.4, 0, 6.2832); c.fill();
      }
      c.globalAlpha=1;

      c.globalAlpha=fade*0.9;
      c.fillStyle=PINK_LIGHT;
      c.font='bold 11px sans-serif';
      c.textAlign='center'; c.textBaseline='middle';
      c.fillText('量 子 領 域', 0, -z.hw-12);
      c.globalAlpha=1;

      c.restore();
    }

    // ── 每顆博士（電球 / 護盾 / 爆擊閃光）──
    for (const b of balls) {
      if (!b || b.hp<=0 || b.char?.type!==TYPE) continue;
      const bR = $R(b);

      // 電球
      for (let i=0;i<ORB_COUNT;i++) {
        const a = b.boshiOrbAngle + (i/ORB_COUNT)*6.2832;
        const ox = b.x+Math.cos(a)*ORB_RADIUS;
        const oy = b.y+Math.sin(a)*ORB_RADIUS;

        const localT = ((t*1.5 + i*0.5) % 1);
        c.globalAlpha = (1-localT)*0.6;
        c.strokeStyle = PINK_LIGHT; c.lineWidth = 1.5;
        c.beginPath(); c.arc(ox, oy, 8 + localT*14, 0, 6.2832); c.stroke();
        c.globalAlpha=1;

        glow(ox, oy, 18, PINK, 0.9);

        // 環繞衛星
        for (let k=0;k<3;k++) {
          const sa = t*3 + k*2.1 + i;
          const sr = 10;
          const sx = ox+Math.cos(sa)*sr;
          const sy = oy+Math.sin(sa)*sr;
          c.fillStyle = k%2 ? PINK_LIGHT : PINK_GLOW;
          c.globalAlpha = 0.85;
          c.beginPath(); c.arc(sx, sy, 1.6, 0, 6.2832); c.fill();
        }
        c.globalAlpha=1;

        const g = c.createRadialGradient(ox-1,oy-1,0,ox,oy,6);
        g.addColorStop(0,'#ffffff');
        g.addColorStop(0.4,PINK_LIGHT);
        g.addColorStop(1,PINK);
        c.fillStyle=g; c.shadowColor=PINK; c.shadowBlur=18;
        c.beginPath(); c.arc(ox,oy,5.5,0,6.2832); c.fill();
        c.shadowBlur=0;

        c.strokeStyle = `rgba(255,184,224,${0.35+0.25*Math.sin(t*6+i)})`;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(b.x+Math.cos(a)*bR, b.y+Math.sin(a)*bR);
        c.lineTo(ox, oy);
        c.stroke();
      }

      // 護盾
      const sh = Math.min(SH_MAX, b.boshiShield||0);
      if (sh>0) {
        c.save(); c.translate(b.x,b.y);
        for (let k=0;k<sh;k++) {
          const rr = bR + 8 + k*5;
          const rot = t*0.8*(k%2?-1:1) + k*0.7;
          hexRing(0,0, rr, 6, rot, PINK_LIGHT, 1.8, 0.85 - k*0.15);
          c.globalAlpha=0.35 - k*0.08;
          c.strokeStyle=PINK_GLOW; c.lineWidth=1;
          for (let i=0;i<6;i++) {
            const a1 = rot + i*1.047;
            const a2 = rot + i*1.047 + 1.047;
            c.beginPath();
            c.moveTo(Math.cos(a1)*rr*0.4, Math.sin(a1)*rr*0.4);
            c.lineTo(Math.cos(a2)*rr, Math.sin(a2)*rr);
            c.stroke();
          }
          c.globalAlpha=0.3 + 0.15*Math.sin(t*4+k);
          c.strokeStyle=PINK; c.lineWidth=2;
          c.beginPath(); c.arc(0,0, rr, 0, 6.2832); c.stroke();
        }
        c.globalAlpha=1;
        c.restore();
      }

      // 爆擊閃光（本體）
      if ((b.boshiCritFlashTimer||0)>0) {
        const f = b.boshiCritFlashTimer/0.3;
        glow(b.x, b.y, bR+42, CRIT, f*0.7);
        ring(b.x, b.y, bR+20+f*20, CRIT_CORE, 2.5, f*0.9);
      }
    }

    // ── 即時雷射光束 ──
    if (s._boshiBeams) for (const beam of s._boshiBeams) {
      const fade = Math.max(0, beam.life / beam.maxLife);
      const col = beam.isCrit ? CRIT : PINK;
      const core = beam.isCrit ? CRIT_CORE : '#ffffff';

      c.save();
      c.globalCompositeOperation = 'lighter';

      // 外層光暈（粗）
      c.globalAlpha = fade * 0.55;
      c.strokeStyle = col;
      c.lineWidth = beam.isCrit ? 14 : 10;
      c.shadowColor = col;
      c.shadowBlur = beam.isCrit ? 28 : 18;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(beam.x1, beam.y1);
      c.lineTo(beam.x2, beam.y2);
      c.stroke();

      // 主體
      c.globalAlpha = fade * 0.95;
      c.strokeStyle = col;
      c.lineWidth = beam.isCrit ? 5.5 : 4;
      c.shadowBlur = beam.isCrit ? 22 : 14;
      c.beginPath();
      c.moveTo(beam.x1, beam.y1);
      c.lineTo(beam.x2, beam.y2);
      c.stroke();

      // 白熱芯線
      c.globalAlpha = fade;
      c.strokeStyle = core;
      c.lineWidth = beam.isCrit ? 2 : 1.4;
      c.shadowColor = core;
      c.shadowBlur = beam.isCrit ? 16 : 10;
      c.beginPath();
      c.moveTo(beam.x1, beam.y1);
      c.lineTo(beam.x2, beam.y2);
      c.stroke();

      // 電球側發射閃光
      glow(beam.x1, beam.y1, beam.isCrit ? 20 : 14, core, fade * 0.9);

      // 目標側命中爆點
      glow(beam.x2, beam.y2, beam.isCrit ? 26 : 18, col, fade * 0.9);
      c.strokeStyle = core;
      c.lineWidth = 2;
      c.shadowBlur = 0;
      c.beginPath();
      c.arc(beam.x2, beam.y2, (beam.isCrit ? 10 : 7) + (1-fade) * 14, 0, 6.2832);
      c.stroke();

      // 沿光束的能量脈衝亮點
      const segs = 4;
      for (let k = 1; k <= segs; k++) {
        const tt = ((t * 3 + k * 0.25 + beam.seed * 0.001) % 1);
        const px = beam.x1 + (beam.x2 - beam.x1) * tt;
        const py = beam.y1 + (beam.y2 - beam.y1) * tt;
        c.globalAlpha = fade * Math.sin(tt * Math.PI) * 0.85;
        c.fillStyle = core;
        c.beginPath();
        c.arc(px, py, 2 + (beam.isCrit ? 1 : 0), 0, 6.2832);
        c.fill();
      }

      c.shadowBlur = 0;
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      c.restore();
    }

    // ── 爆擊閃電 ──
    if (s._boshiBolts) for (const b of s._boshiBolts) {
      const prog = 1 - Math.max(0, b.life/b.maxLife);
      const fade = Math.max(0, b.life/b.maxLife);
      c.save(); c.globalAlpha = fade;
      for (let k=0;k<3;k++) {
        const seed = b.seed + k*19.7;
        const sx = b.x + (k-1)*10;
        bolt(sx, b.y-95, b.x+(k-1)*4, b.y, seed, 2.6-k*0.5, CRIT, CRIT_CORE);
      }
      for (let k=0;k<4;k++) {
        const a = Math.random()*6.2832;
        const r1 = 8+k*6;
        const r2 = r1 + 14;
        bolt(b.x+Math.cos(a)*r1, b.y+Math.sin(a)*r1, b.x+Math.cos(a+0.4)*r2, b.y+Math.sin(a+0.4)*r2, b.seed+k*7, 1.3, CRIT, CRIT_CORE);
      }
      glow(b.x, b.y, 22, CRIT_CORE, fade*0.9);
      c.strokeStyle=CRIT; c.lineWidth=2.2;
      c.shadowColor=CRIT; c.shadowBlur=22;
      c.beginPath(); c.arc(b.x, b.y, 12+prog*32, 0, 6.2832); c.stroke();
      c.shadowBlur=0;
      c.restore();
    }
  }

  // ══════════════════════════════════════════════════════════
  // 主迴圈
  // ══════════════════════════════════════════════════════════
  function cleanRoot(r) {
    if (!r) return;
    delete r._boshiBeams; delete r._boshiEM; delete r._boshiQ; delete r._boshiBolts;
  }
  function active() {
    const g = document.getElementById('game-screen');
    if (!g || window.getComputedStyle(g).display==='none') return false;
    const ovl = document.getElementById('overlay');
    if (ovl && ovl.classList.contains('show')) return false;
    return true;
  }

  function frame(t) {
    const s = $S();
    if (s !== ov.lastRoot) { cleanRoot(ov.lastRoot); ov.lastRoot = s; }
    if (!s || !Array.isArray(s.balls)) { sync(false); requestAnimationFrame(frame); return; }
    if (!active()) { sync(false); ov.lastT = t; requestAnimationFrame(frame); return; }

    hookShield(); hookPool();

    const dt = Math.min(0.05, Math.max(0, (t - (ov.lastT||t))/1000));
    ov.lastT = t;
    const et = s.elapsed || (t/1000);

    const bodies = s.balls.filter(b => b && b.hp>0 && b.char?.type===TYPE);
    for (const b of bodies) { ensure(b); tick(b, dt, s); }

    updateBeams(dt, s);
    updateEM(dt, s);
    updateQ(dt, s);

    if (s._boshiBolts) {
      for (let i=s._boshiBolts.length-1;i>=0;i--) {
        s._boshiBolts[i].life -= dt;
        if (s._boshiBolts[i].life<=0) s._boshiBolts.splice(i,1);
      }
    }

    // 死亡清理
    const dead = new Set();
    for (const b of s.balls) if (b?.char?.type===TYPE && b.hp<=0) dead.add(b.player);
    if (dead.size) {
      if (s._boshiBeams) s._boshiBeams = s._boshiBeams.filter(b => !dead.has(b.owner));
      if (s._boshiEM) s._boshiEM = s._boshiEM.filter(f => !dead.has(f.owner));
      if (s._boshiQ) s._boshiQ = s._boshiQ.filter(z => !dead.has(z.owner));
    }

    const on = bodies.length>0
      || (s._boshiBeams?.length>0)
      || (s._boshiEM?.length>0)
      || (s._boshiQ?.length>0)
      || (s._boshiBolts?.length>0);

    sync(on);
    draw(et, on);
    requestAnimationFrame(frame);
  }

  function start() { setup(); hookShield(); hookPool(); requestAnimationFrame(frame); }

  document.readyState==='loading' ? document.addEventListener('DOMContentLoaded', start, {once:true}) : start();
  console.log('[boshi] v4 已載入（即時雷射）');
})();
