/* js_fighter/char_kira.js
 * 吉良吉影：第一炸彈／空氣彈／枯萎穿心攻擊／敗者食塵
 * 請在 ball_fighter.html 的主程式之後、ui_select.js 之前載入。
 */
(function () {
  'use strict';
  if (typeof CHARS === 'undefined' || !CHARS.kira) {
    console.warn('[char_kira] 找不到 CHARS.kira，請先載入 ball_fighter_data.js');
    return;
  }

  const C = CHARS.kira;
  const PINK = '#ff7eb6', LIGHT = '#ffc2dc', DEEP = '#ff4a8a', GOLD = '#ffd77a';
  const behaviors = typeof BEHAVIORS !== 'undefined' ? BEHAVIORS : null;
  if (!behaviors) {
    console.warn('[char_kira] 找不到主程式 BEHAVIORS；請把本檔放在主程式 script 之後');
    return;
  }

  function ensure(f) {
    if (!f.kira) f.kira = {
      bomb: null, bombCd: 0, air: null, airTurn: 0,
      despair: 0, snaps: [], snapClock: 0, markCd: 0,
      dirAngle: null,
    };
    if (!Object.prototype.hasOwnProperty.call(f.kira, 'dirAngle')) f.kira.dirAngle = null;
    return f.kira;
  }
  const enemyOf = f => f === G.p ? G.e : G.p;
  const alive = f => !!f && f.hp > 0;
  const fx = (o) => G.fx.push(o);
  const ring = (x, y, r, col, t = .4) => fx({ k:'ring', x, y, r, col, t, m:t });
  const burst = (x, y, col = PINK, n = 16, speed = 500) => {
    if (typeof spark === 'function') spark(x, y, col, n, speed, .4, 3);
  };
  function bombFx(x, y, s, strong = true) {
    ring(x, y, s.bombRad, PINK, .65); ring(x, y, s.bombRad * .62, '#fff', .4);
    ring(x, y, s.bombRad * 1.3, DEEP, .8);
    fx({ k:'flash', t:.25, m:.25, col:PINK, a:strong ? .8 : .45 });
    burst(x, y, PINK, strong ? 28 : 14, strong ? 720 : 420);
    burst(x, y, LIGHT, 12, 500);
    if (typeof shake === 'function') shake(strong ? 14 : 6);
  }

  /* 第一炸彈：第一次衝刺命中或撞牆埋彈；再次施放引爆。 */
  function kiraBomb(f, o, a, s) {
    const k = ensure(f);
    if (k.bomb) {
      const b = k.bomb; k.bomb = null;
      const x = b.type === 'enemy' && alive(b.target) ? b.target.x : b.x;
      const y = b.type === 'enemy' && alive(b.target) ? b.target.y : b.y;
      bombFx(x, y, s, true);
      if (typeof blast === 'function') blast(f, x, y, Number(s.bombRad) || 200, Number(s.bombDmg) || 500, Number(s.bombKb) || 400, PINK, 0);
      if (b.type === 'enemy' && alive(b.target)) b.target.stun = Math.max(b.target.stun, s.bombStun || 1);
      k.bombCd = s.bombCd || 6;
      f.cd.b = k.bombCd;
      if (typeof playSfx === 'function') playSfx(typeof SFX !== 'undefined' ? SFX.hit : null);
      return;
    }
    if (typeof lunge !== 'function') return;
        f.cd.b = 0;   // 埋彈階段不進 CD（cd:0 已讓 cast 不設，這行防禦性覆蓋）
    const launchAng = Number.isFinite(f.kiraDir) ? f.kiraDir : a.ang;
    lunge(f, launchAng, {
      dist: s.dashDist || 380, dur: s.dashDur || .18,
      sk: s, dmg: 0, kb: 0, reach: Math.max(20, s.reach || 12),
      onHit: target => {
        if (!alive(target) || k.bomb) return;
        if (typeof hit === 'function' && alive(target)) hit(target, Math.max(1, Number(s.dashDmg) || 90), f.x, f.y, 80, 0, s, f);
        k.bomb = { type:'enemy', target, x:target.x, y:target.y, t:0, life:s.bombLife || 8 };
        f.cd.b = 0; k.bombCd = 0;
        if (typeof pop === 'function') pop(target, 'KILLER QUEEN', PINK);
        ring(target.x, target.y, 100, PINK, .5); ring(target.x, target.y, 140, LIGHT, .7);
        burst(target.x, target.y, PINK, 18, 500);
      },
      done: () => {
        const wall = f.x <= CFG.r + 1 || f.x >= CFG.W - CFG.r - 1 || f.y <= CFG.r + 1 || f.y >= CFG.H - CFG.r - 1;
        if (wall && !k.bomb) {
          k.bomb = { type:'wall', x:f.x, y:f.y, t:0, life:s.bombLife || 8 };
          f.cd.b = 0;
          if (typeof pop === 'function') pop(f, '牆壁炸彈', PINK);
          ring(f.x, f.y, 110, PINK, .5); burst(f.x, f.y, PINK, 14, 450);
        }
              if (!k.bomb) { k.bombCd = s.missCd || 2; f.cd.b = k.bombCd; }
      },
    });
  }

  /* 空氣彈：施放後飛行，手機左右滑動控制轉向，放開或撞牆引爆。 */
  function launchAir(f, o, s, angle) {
    const k = ensure(f);
    if (k.air) return;
    const a = angle == null ? Math.atan2(o.y - f.y, o.x - f.x) : angle;
    k.dirAngle = a;
    k.air = { x:f.x + Math.cos(a) * (CFG.r + 14), y:f.y + Math.sin(a) * (CFG.r + 14),
      vx:Math.cos(a) * s.speed, vy:Math.sin(a) * s.speed, t:0, s, trail:[] };
    setAirRoot(f, true);
    k.airTurn = 0;
    ring(k.air.x, k.air.y, 48, PINK, .3); burst(k.air.x, k.air.y, LIGHT, 8, 300);
  }
  function setAirRoot(f, on) {
    if (!f || !Array.isArray(f.sts)) return;
    const own = f.sts.find(x => x.k === 'root' && x._kiraAir);
    if (on) {
      if (own) own.t = .2;
      else f.sts.push({ k:'root', t:.2, v:0, _kiraAir:true });
    } else {
      for (let i=f.sts.length-1;i>=0;i--) if (f.sts[i]._kiraAir) f.sts.splice(i,1);
    }
  }
  function explodeAir(f) {
    const k = ensure(f), a = k.air;
    if (!a) return;
    k.air = null;
    setAirRoot(f, false);
    const s = a.s;
    if (typeof blast === 'function') blast(f, a.x, a.y, s.rad, s.dmg, 300, PINK, 0);
    bombFx(a.x, a.y, Object.assign({}, s, { bombRad:s.rad }), false);
    for (const t of [G.p, G.e]) if (t !== f && Math.hypot(t.x - a.x, t.y - a.y) < s.rad + CFG.r && typeof addStatus === 'function')
      addStatus(t, { k:'slow', dur:s.slowDur || 2, v:s.slowV || .5 });
  }
  function kiraAir(f, o, a, s) { launchAir(f, o, s, a.ang); }

  /* 枯萎穿心攻擊：發射小車，進入偵測圈後鎖定敵人。 */
  function kiraCar(f, o, a, s) {
    if (!G.kiraCars) G.kiraCars = [];
    const ang = Number.isFinite(f.kiraDir) ? f.kiraDir : a.ang;
    G.kiraCars.push({ x:f.x + Math.cos(ang) * (CFG.r + 12), y:f.y + Math.sin(ang) * (CFG.r + 12),
      vx:Math.cos(ang) * s.speed, vy:Math.sin(ang) * s.speed, t:0, life:s.life, stage:1, s, own:f, locked:false });
    ring(f.x, f.y, 60, DEEP, .35); burst(f.x, f.y, PINK, 8, 350);
  }

  function rewind(f, o, seconds) {
    const k = ensure(f), snap = k.snaps[0];
    if (!snap) return false;
    G.kiraRewind = { t:0, T:1.4, snaps:k.snaps.slice(), col:PINK, light:LIGHT };
    f.x=snap.x; f.y=snap.y; f.hp=snap.hp; f.en=snap.en;
    o.x=snap.ox; o.y=snap.oy; o.hp=snap.ohp; o.en=snap.oen;
    if (G.t !== Infinity) G.t += seconds || 10;
    k.snaps=[];
    return true;
  }
  function kiraBites(f, o, a, s) {
    const k = ensure(f), max=s.despairMax || 100;
    if (k.despair < max) { if (typeof say === 'function') say('絕望值不足', .7); return; }
    k.despair=0; rewind(f, o, s.rewind || 10);
    if (typeof hit === 'function') hit(o, s.dmg || 2000, f.x, f.y, 600, 1, null, f);
    if (typeof say === 'function') say('敗者食塵！', 1.5);
  }

  /* 將四個技能直接掛到資料物件，不依賴 window.BEHAVIORS。 */
  const defs = {
    kiraBomb: { fire:kiraBomb, ai:(e,p,c,q) => c.d < (q.dashDist || 380) + 120 ? c.p : null },
    kiraAir: { fire:kiraAir, ai:(e,p,c,q) => c.d < (q.speed || 620) * 1.5 ? c.p : null },
    kiraCar: { fire:kiraCar, ai:(e,p,c,q) => c.d < 700 ? c.p : null },
    kiraBites: { fire:kiraBites, ai:(e,p,c,q) => e.kira && e.kira.despair >= (q.despairMax || 100) && c.d < 650 ? c.p : null },
  };
  for (const [name, b] of Object.entries(defs)) {
    behaviors[name] = Object.assign(behaviors[name] || {}, b);
    for (const q of Object.values(C.sk)) if (q.use === name) Object.assign(q, b);
  }
  C.sk.b.fire = kiraBomb; C.sk.c.fire = kiraAir; C.sk.d.fire = kiraCar; C.sk.e.fire = kiraBites;
  C.sk.b.ai = defs.kiraBomb.ai; C.sk.c.ai = defs.kiraAir.ai; C.sk.d.ai = defs.kiraCar.ai; C.sk.e.ai = defs.kiraBites.ai;

  /* 普攻標記與延遲爆炸。 */
  C.sk.a.onHit = function (target) {
    const attacker = target === G.e ? G.p : target === G.p ? G.e : null;
    if (!attacker || attacker.c !== C) return;
    const k=ensure(attacker), now=performance.now()/1000;
    if (k.markCd > now) return;
    k.markCd=now+(C.sk.a.markCd || 5);
    const delay=C.sk.a.markDelay || 2, damage=C.sk.a.markDmg || 300;
    target._kiraMark={ t:delay, total:delay };
    ring(target.x,target.y,CFG.r*1.6,PINK,.35); burst(target.x,target.y,PINK,12,380);
    if (typeof later === 'function') later(delay, () => {
      if (!alive(target) || G.state !== 'fight') return;
      if (typeof hit === 'function') hit(target,damage,target.x,target.y,120,0,null,attacker);
      bombFx(target.x,target.y,Object.assign({},C.sk.b,{bombRad:130}),false);
    }, attacker);
    fx({k:'txt',x:target.x,y:target.y-40,s:'KILLER QUEEN',col:PINK,t:.8,m:.8});
  };

  const oldCanCast = window.canCast;
  if (typeof oldCanCast === 'function' && !oldCanCast._kiraWrapped) {
    const canCast = function (f, k) {
      if (!oldCanCast(f, k)) return false;
      if (f && f.c === C && k === 'e' && ensure(f).despair < (C.sk.e.despairMax || 100)) {
        if (f === G.p && typeof say === 'function') say('絕望值不足', .7);
        return false;
      }
      return true;
    };
    canCast._kiraWrapped = true;
    window.canCast = canCast;
  }

  /* 初始化新角色與每幀更新。 */
  const oldMk = window.mk;
  if (typeof oldMk === 'function' && !oldMk._kiraWrapped) {
    const mk = function(id,x,side,isAI) { const f=oldMk(id,x,side,isAI); if (id==='kira') ensure(f); return f; };
    mk._kiraWrapped=true; window.mk=mk;
  }
  function updateKira(f, dt) {
    const k=ensure(f), o=enemyOf(f), now=performance.now()/1000;
    if (now-k.snapClock>.1) { k.snapClock=now; k.snaps.push({x:f.x,y:f.y,hp:f.hp,en:f.en,ox:o.x,oy:o.y,ohp:o.hp,oen:o.en}); if(k.snaps.length>110)k.snaps.shift(); }
    if(k.bomb){ k.bomb.t+=dt; if(k.bomb.type==='enemy' && alive(k.bomb.target)){k.bomb.x=k.bomb.target.x;k.bomb.y=k.bomb.target.y} if(k.bomb.t>(k.bomb.life||8)){k.bomb=null;k.bombCd=C.sk.b.bombCd||6} }
    if(k.bombCd>0){k.bombCd=Math.max(0,k.bombCd-dt);f.cd.b=Math.max(f.cd.b,k.bombCd)}
    if(f._kiraMark){f._kiraMark.t-=dt;if(f._kiraMark.t<=0)delete f._kiraMark}
    if(k.air){setAirRoot(f,true);const a=k.air,s=a.s;a.t+=dt;const jx=(typeof joy!=='undefined'?joy.x:0)+(typeof keys!=='undefined'&&((keys.d||keys.ArrowRight)?1:0))-((typeof keys!=='undefined'&&((keys.a||keys.ArrowLeft)?1:0)));const jy=(typeof joy!=='undefined'?joy.y:0)+(typeof keys!=='undefined'&&((keys.s||keys.ArrowDown)?1:0))-((typeof keys!=='undefined'&&((keys.w||keys.ArrowUp)?1:0)));if(Math.hypot(jx,jy)>.18)k.dirAngle=Math.atan2(jy,jx);let turn=0;if(Number.isFinite(k.dirAngle)){let cur=Math.atan2(a.vy,a.vx),df=k.dirAngle-cur;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;turn=Math.max(-1,Math.min(1,df/(s.turnMax*.18||.5)))}if(turn){const ang=Math.atan2(a.vy,a.vx)+s.turnMax*turn*dt,sp=Math.hypot(a.vx,a.vy);a.vx=Math.cos(ang)*sp;a.vy=Math.sin(ang)*sp}a.x+=a.vx*dt;a.y+=a.vy*dt;a.trail.push({x:a.x,y:a.y});if(a.trail.length>18)a.trail.shift();if(Math.random()<.7)fx({k:'dt',x:a.x,y:a.y,vx:-a.vx*.08,vy:-a.vy*.08,t:.35,m:.35,col:Math.random()<.5?PINK:LIGHT,r:3,dr:4});if(a.x<CFG.r||a.x>CFG.W-CFG.r||a.y<CFG.r||a.y>CFG.H-CFG.r||a.t>(s.maxHold||4)||f.stun>0||stat(f,'root',0))explodeAir(f)}
    k.despair=Math.min(100,k.despair);
  }
  function updateCars(dt) {
    if (!G.kiraCars) return;
    for (let i=G.kiraCars.length-1;i>=0;i--) {
      const c=G.kiraCars[i], o=enemyOf(c.own);
      if (!alive(c.own) || !alive(o)) { G.kiraCars.splice(i,1); continue; }

      // 第一次爆炸後：原地待機，等候第二次追捕。
      if (c.stage === 2) {
        c.wait -= dt;
        if (c.wait <= 0) {
          c.stage = 3;
          c.t = 0;
          c.locked = false;
          c.life = c.s.secondLife || c.s.life;
          const aa = Math.atan2(o.y-c.y, o.x-c.x);
          c.vx = Math.cos(aa) * (c.s.secondSpeed || c.s.dashSpeed || c.s.speed);
          c.vy = Math.sin(aa) * (c.s.secondSpeed || c.s.dashSpeed || c.s.speed);
        }
        continue;
      }

      c.t += dt;
      if (!c.locked && Math.hypot(o.x-c.x,o.y-c.y) < c.s.detectRad) {
        c.locked = true;
        const aa = Math.atan2(o.y-c.y,o.x-c.x);
        c.vx = Math.cos(aa) * c.s.dashSpeed;
        c.vy = Math.sin(aa) * c.s.dashSpeed;
      }
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (Math.random()<.5) fx({k:'sp',x:c.x,y:c.y,vx:-c.vx*.05,vy:-c.vy*.05,t:.3,m:.3,col:c.locked?DEEP:PINK,w:3,dr:4});

      const hitTarget = Math.hypot(o.x-c.x,o.y-c.y) < (c.s.r||24)+CFG.r;
      const wall = c.x<CFG.r || c.x>CFG.W-CFG.r || c.y<CFG.r || c.y>CFG.H-CFG.r;
      if (hitTarget || wall) {
        const dmg = c.stage === 3 ? (c.s.secondDmg || c.s.dmg) : c.s.dmg;
        const rad = c.s.rad;
        if (typeof blast==='function') blast(c.own,c.x,c.y,rad,dmg,c.s.kb,PINK,0);
        bombFx(c.x,c.y,Object.assign({},c.s,{bombRad:rad}),false);

        if (c.stage === 1) {
          // 第一次爆炸後不刪除小車，改為待機並準備第二次追捕。
          c.stage = 2;
          c.wait = c.s.secondWait == null ? .8 : c.s.secondWait;
          c.t = 0;
          c.locked = false;
          c.vx = c.vy = 0;
          ring(c.x,c.y,rad*1.15,GOLD,.45);
          continue;
        }
        G.kiraCars.splice(i,1);
        continue;
      }
      if (c.t > c.life) G.kiraCars.splice(i,1);
    }
  }

  const oldUpdate=window.update, oldDraw=window.draw, oldHit=window.hit, oldEnd=window.endRound;
  if(typeof oldHit==='function'&&!oldHit._kiraWrapped){const hitWrap=function(t,d,fxx,fyy,kb,heavy,sk,att){const before=t.hp;oldHit(t,d,fxx,fyy,kb,heavy,sk,att);const dealt=Math.max(0,before-t.hp);if(dealt&&att&&att.c===C)ensure(att).despair=Math.min(100,ensure(att).despair+dealt/100);if(dealt&&t.c===C)ensure(t).despair=Math.min(100,ensure(t).despair+dealt/100)};hitWrap._kiraWrapped=true;window.hit=hitWrap}
  if(typeof oldEnd==='function'&&!oldEnd._kiraWrapped){const endWrap=function(loser){const isActualKiraLoser=!!loser&&loser.hp<=0&&(loser===G.p||loser===G.e)&&loser.c===C;if(isActualKiraLoser&&ensure(loser).despair>=100&&!G.ts){const o=enemyOf(loser);ensure(loser).despair=0;rewind(loser,o,C.sk.e.rewind||10);loser.hp=Math.min(loser.c.hp,loser.hp+(C.sk.e.heal||2500));G.state='fight';if(typeof say==='function')say('敗者食塵·被動觸發！',1.5);return}return oldEnd(loser)};endWrap._kiraWrapped=true;window.endRound=endWrap}
  if(typeof oldUpdate==='function'&&!oldUpdate._kiraWrapped){const updateWrap=function(dt){oldUpdate(dt);if(G.state!=='fight')return;for(const f of [G.p,G.e])if(f&&f.c===C)updateKira(f,dt);updateCars(dt);if(G.kiraRewind){G.kiraRewind.t+=dt;if(G.kiraRewind.t>=G.kiraRewind.T)G.kiraRewind=null}};updateWrap._kiraWrapped=true;window.update=updateWrap}

  /* 空氣彈按鈕：捕獲階段攔截主程式的普通 toggle 行為。 */
  function bindAir(){for(const el of document.querySelectorAll('#stage .b')){if(el.dataset.k!=='c'||el._kiraAirBound)continue;el._kiraAirBound=true;let active=false;el.addEventListener('pointerdown',e=>{const f=G.p;if(!f||f.c!==C||ensure(f).air||!canCast(f,'c'))return;e.stopPropagation();e.preventDefault();el.setPointerCapture(e.pointerId);active=true;const s=C.sk.c;f.en-=s.cost;f.cd.c=s.cd;launchAir(f,enemyOf(f),s);},true);const up=e=>{if(!active)return;active=false;e.stopPropagation();e.preventDefault();const f=G.p;if(f)explodeAir(f)};el.addEventListener('pointerup',up,true);el.addEventListener('pointercancel',up,true)}}
  if(typeof MutationObserver!=='undefined'&&document.getElementById('stage'))new MutationObserver(bindAir).observe(document.getElementById('stage'),{childList:true,subtree:true});bindAir();

  /* 第一炸彈按鈕：沿用主程式的 holdStart/holdRelease，但把拖曳座標明確寫回 hold.aim。 */
  function bindBombAim(){
    for(const el of document.querySelectorAll('#stage .b')){
      if((el.dataset.k!=='b'&&el.dataset.k!=='d')||el._kiraBombAimBound)continue;
      el._kiraBombAimBound=true;
      let pid=null,sx=0,sy=0;
      const aimOf=e=>{const f=G.p,[dx,dy]=d2s(e.clientX-sx,e.clientY-sy);return Math.hypot(dx,dy)>12?{x:f.x+dx*8,y:f.y+dy*8}:{x:enemyOf(f).x,y:enemyOf(f).y}};
      el.addEventListener('pointerdown',e=>{pid=e.pointerId;sx=e.clientX;sy=e.clientY;el.setPointerCapture(pid)},true);
      el.addEventListener('pointermove',e=>{if(e.pointerId!==pid||!G.p||!G.p.hold||G.p.hold.k!==el.dataset.k)return;const aim=aimOf(e);G.p.hold.aim=aim;G.p.kiraDir=Math.atan2(aim.y-G.p.y,aim.x-G.p.x);ensure(G.p).dirAngle=G.p.kiraDir},true);
      el.addEventListener('pointerup',()=>{pid=null},true);
      el.addEventListener('pointercancel',()=>{pid=null},true);
    }
  }
  if(typeof MutationObserver!=='undefined'&&document.getElementById('stage'))new MutationObserver(bindBombAim).observe(document.getElementById('stage'),{childList:true,subtree:true});
  bindBombAim();

  function drawKiraWorld(){const T=performance.now()/1000;cx.save();cx.scale(view.s,view.s);cx.translate(-cam.x,-cam.y);for(const f of [G.p,G.e]){if(f&&f.c===C&&f._kiraMark){const p=f._kiraMark,k=p.t/p.total;cx.save();cx.translate(f.x,f.y);cx.globalCompositeOperation='lighter';cx.strokeStyle=PINK;cx.lineWidth=4;cx.beginPath();cx.arc(0,0,CFG.r+16,-Math.PI/2,-Math.PI/2+Math.PI*2*k);cx.stroke();cx.strokeStyle=LIGHT;cx.lineWidth=2;cx.beginPath();cx.arc(0,0,CFG.r+23,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-k));cx.stroke();cx.fillStyle=PINK;cx.font='bold 16px system-ui';cx.textAlign='center';cx.fillText(k.toFixed(1),0,-CFG.r-30);cx.restore()}const k= f&&f.c===C&&f.kira;if(!k)continue;if(k.bomb){const x=k.bomb.type==='enemy'&&alive(k.bomb.target)?k.bomb.target.x:k.bomb.x,y=k.bomb.type==='enemy'&&alive(k.bomb.target)?k.bomb.target.y:k.bomb.y;cx.save();cx.translate(x,y);cx.globalCompositeOperation='lighter';cx.fillStyle=PINK;cx.beginPath();cx.arc(0,0,18+4*Math.sin(T*12),0,7);cx.fill();cx.strokeStyle='#fff';cx.lineWidth=3;cx.stroke();cx.fillStyle=GOLD;cx.beginPath();cx.arc(5,-30,5,0,7);cx.fill();cx.fillStyle='#fff';cx.font='bold 12px system-ui';cx.textAlign='center';cx.fillText(Math.max(0,(k.bomb.life||8)-k.bomb.t).toFixed(1),0,-42);cx.restore()}}if(G.kiraCars)for(const c of G.kiraCars){const o=enemyOf(c.own);cx.save();cx.globalAlpha=.35;cx.strokeStyle=c.locked?DEEP:PINK;cx.setLineDash(c.locked?[10,6]:[8,8]);cx.beginPath();cx.arc(c.x,c.y,c.locked?c.s.r*1.5:c.s.detectRad,0,7);cx.stroke();if(c.locked){cx.globalAlpha=.65;cx.beginPath();cx.moveTo(c.x,c.y);cx.lineTo(o.x,o.y);cx.stroke()}cx.restore()}for(const f of [G.p,G.e]){const k=f&&f.c===C&&f.kira;if(!k||!k.air)continue;const a=k.air;cx.save();cx.globalCompositeOperation='lighter';for(let i=0;i<a.trail.length;i++){const q=a.trail[i],v=i/a.trail.length;cx.globalAlpha=v*.45;cx.fillStyle=v>.7?LIGHT:PINK;cx.beginPath();cx.arc(q.x,q.y,5+v*12,0,7);cx.fill()}const g=cx.createRadialGradient(a.x,a.y,2,a.x,a.y,42);g.addColorStop(0,'#fff');g.addColorStop(.35,PINK);g.addColorStop(1,'rgba(255,126,182,0)');cx.globalAlpha=1;cx.fillStyle=g;cx.beginPath();cx.arc(a.x,a.y,42,0,7);cx.fill();cx.restore()}cx.restore()}

  function drawBombAimAndCars(){
    cx.save(); cx.scale(view.s,view.s); cx.translate(-cam.x,-cam.y);
    for(const f of [G.p,G.e]){
      if(!f||f.c!==C)continue;
      const q=f.hold&&f.hold.k==='b'?f.hold:f.act&&f.act.k==='b'?f.act:null;
      if(q&&!ensure(f).bomb){const ang=q.ang??Math.atan2((q.aim||{}).y-f.y,(q.aim||{}).x-f.x),dist=C.sk.b.dashDist||380;
        cx.save();cx.translate(f.x,f.y);cx.rotate(ang);cx.globalCompositeOperation='lighter';
        cx.globalAlpha=.18;cx.fillStyle=PINK;cx.beginPath();cx.moveTo(CFG.r,0);cx.arc(0,0,dist,-.16,.16);cx.closePath();cx.fill();
        cx.globalAlpha=.9;cx.strokeStyle=LIGHT;cx.lineWidth=3;cx.setLineDash([14,8]);cx.beginPath();cx.moveTo(CFG.r+8,0);cx.lineTo(dist,0);cx.stroke();cx.setLineDash([]);
        cx.fillStyle='#fff';cx.font='bold 14px system-ui';cx.textAlign='center';cx.fillText('第一炸彈  '+Math.round(dist),dist*.55,-16);cx.restore();
      }
    }
    if(G.kiraCars)for(const c of G.kiraCars){const ang=Math.atan2(c.vy,c.vx),r=c.s.r||24;cx.save();cx.translate(c.x,c.y);cx.rotate(ang);cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(255,126,182,.35)';cx.beginPath();cx.arc(0,0,r*2.3,0,7);cx.fill();cx.globalCompositeOperation='source-over';cx.fillStyle=PINK;cx.fillRect(-r*1.35,-r*.65,r*2.1,r*1.3);cx.fillStyle=DEEP;cx.beginPath();cx.moveTo(r*.75,-r*.65);cx.lineTo(r*1.5,0);cx.lineTo(r*.75,r*.65);cx.closePath();cx.fill();cx.fillStyle='#222';for(const yy of [-1,1]){cx.beginPath();cx.arc(-r*.55,yy*r*.72,r*.18,0,7);cx.fill();cx.beginPath();cx.arc(r*.55,yy*r*.72,r*.18,0,7);cx.fill()}cx.strokeStyle='#fff';cx.lineWidth=2;cx.strokeRect(-r*1.35,-r*.65,r*2.1,r*1.3);cx.restore()}
    cx.restore();
  }

  function drawRewind(){const r=G.kiraRewind;if(!r)return;const w=view.w,h=view.h,k=Math.min(1,r.t/r.T),T=performance.now()/1000;cx.save();cx.globalAlpha=(1-k)*.3;cx.fillStyle=PINK;cx.fillRect(0,0,w,h);cx.translate(w/2,h/2);const R=Math.min(w,h)*.15;cx.globalAlpha=(1-k)*1.4;cx.strokeStyle=PINK;cx.lineWidth=4;cx.beginPath();cx.arc(0,0,R,0,7);cx.stroke();cx.lineWidth=5;cx.beginPath();cx.moveTo(0,0);cx.lineTo(Math.cos(-Math.PI/2-k*Math.PI*6)*R*.72,Math.sin(-Math.PI/2-k*Math.PI*6)*R*.72);cx.stroke();cx.fillStyle='#fff';cx.font='bold 22px system-ui';cx.textAlign='center';cx.fillText('BITES THE DUST',0,R+42);cx.restore()}
  function drawBar(){const f=G.p&&G.p.c===C?G.p:G.e&&G.e.c===C?G.e:null;if(!f)return;const w=Math.min(view.w*.36,360),x=10,y=62,v=Math.min(1,ensure(f).despair/100);cx.save();cx.fillStyle='#0008';cx.fillRect(x,y,w,8);const g=cx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,DEEP);g.addColorStop(.5,PINK);g.addColorStop(1,LIGHT);cx.fillStyle=g;cx.fillRect(x,y,w*v,8);cx.fillStyle='#fff';cx.font='bold 10px system-ui';cx.textAlign='left';cx.fillText('絕望 '+Math.round(ensure(f).despair)+' / 100',x+4,y+22);cx.restore()}
  if(typeof oldDraw==='function'&&!oldDraw._kiraWrapped){const drawWrap=function(){oldDraw();drawKiraWorld();drawBombAimAndCars();drawRewind();drawBar()};drawWrap._kiraWrapped=true;window.draw=drawWrap}
  console.log('[char_kira] 吉良吉影完整模組已載入');
})();
