/* js_fighter/char_sasuke.js
 * 宇智波佐助｜雙形態完整模組（防 NaN 崩潰終極版）
 */
(function () {
  'use strict';
  if (typeof CHARS === 'undefined' || typeof CFG === 'undefined' || CHARS.sasuke) return;

  const C = CHARS.sasuke = {
    name: '宇智波佐助', work: '火影忍者', color: '#7046a8', glyph: '助', img: 'image/sasuke.png',
    hp: 8000, 
    speed: 600,
    res: { name: '查克拉', max: 1500, regen: 40, color: '#765cff', blockDrain: 25 },
    aiDist: 260,
    
    passive: {
      max: 10, upTime: 3, downTime: 2, regen: 20, cdAdd: 0.05, hitSub: 2
    },

    sk: {
      a: { name: '體術', type: 'melee', cost: 0, cd: .3, wind: .06, dmg: 60, range: 140, arc: 1.2, kb: 140,
           shurikenDmg: 80, shurikenSpeed: 1200, shurikenDot: 40, shurikenRange: 400 },
           
      b: { name: '豪火球／白蛇', type: 'proj', cost: 100, cd: 4, wind: .1, range: 650, speed: 760, r: 50, col: '#ff6338',
           hold: { start: .05, full: 99 }, noCharge: 1, aimMove: 1,
           fireDmg: 400, fireDot: 55,
           snakeInv: 2, snakeAmp: 1.2, snakeDmg: 200, snakePush: 600, snakeGroundDmg: 80, snakeGroundLife: 2,
           pv: (f) => f.sasukeState && f.sasukeState.curse ? { k:'line', len:430, w:CFG.r*1.4 } : { k:'line', len:650, w:CFG.r*2 } },

      c: { name: '風魔手裡劍／黑色千鳥', type: 'proj', cost: 150, cd: 6, wind: .1, range: 360, speed: 900, r: 30, col: '#9bd7ff',
           hold: { start: .05, full: 99 }, noCharge: 1, aimMove: 1,
           windBladeDmg: 120, windBladeSpeed: 400, windRad: 50,
           chidoriDist: 520, chidoriDur: 0.25, chidoriTick: 50, chidoriEnd: 800,
           pv: (f) => f.sasukeState && f.sasukeState.curse ? { k:'line', len:520, w:CFG.r*1.45 } : { k:'line', len:360, w:CFG.r*1.8 } },

      d: { name: '麒麟', type: 'melee', cost: 200, cd: 15, wind: .15, hold: { start: .05, full: 1.5 }, lockMove: 1,
           dCd: [6, 9, 15], dDmg: [300, 800, 2200], dRad: [90, 145, 220], dHits: [1, 4, 8],
           pv: () => ({ k: 'none' }) },

      e: { name: '替身術', type: 'melee', cost: 50, cd: 15, wind: .05, 
           inv: 2.0,
           pv: () => ({ k:'circle', r: CFG.r*1.7 }) },

      x: { name: '咒印模式', type: 'toggle', flag: 'curse', side: 'L', cost: 0, cd: .1, wind: .03,
           tag: f => f.sasukeState && f.sasukeState.curse ? '咒印｜負荷 '+(f.sasukeState.load||0)+'/'+C.passive.max : '普通模式' }
    }
  };
  for (const k of Object.keys(C.sk)) C.sk[k].key = k;

  const P = { purple:'#765cff', dark:'#171022', black:'#080611', white:'#f7fbff', fire:'#ff6338', blue:'#9bd7ff', gold:'#ffd77a', green:'#8ff0a0', red:'#ff5968' };
  const enemyOf = f => f === G.p ? G.e : G.p;
  const alive = f => !!f && f.hp > 0;
  const fx = o => G.fx.push(o);
  const wrapAngle = a => { while(a>Math.PI)a-=Math.PI*2; while(a<-Math.PI)a+=Math.PI*2; return a; };

  function ensure(f) {
    if (!f.sasukeState) f.sasukeState = {
      curse:false, load:0, loadTimer:0, modeNotice:0,
      combo:0, comboT:0, snake:null, chidori:null,
      kirinCd:[0,0,0], kirin:null, kirinPending:null,
      projectiles:[], grounds:[], substitution:0, bolts:[],
      chidoriTarget: null, chidoriTick: 0
    };
    return f.sasukeState;
  }
  
  function modeSync(f) {
    const s = ensure(f), next = !!f.curse;
    if (next === s.curse) return;
    s.curse = next; s.load = 0; s.loadTimer = 0; s.combo = 0;
    pop(f, next ? '咒印模式' : '普通模式', next ? P.purple : P.white);
    fx({k:'flash',t:.2,m:.2,col:next?P.purple:P.white, a:.6});
    fx({k:'ring',x:f.x,y:f.y,t:.5,m:.5,r:CFG.r*2.5,col:next?P.purple:P.white});
    spark(f.x,f.y,next?P.purple:P.white,30,600,.4,4);
  }

  function fanHit(f,o,ang,range,arc,sk,dmg,kb) {
    if (!alive(o)) return false;
    const dx=o.x-f.x,dy=o.y-f.y,d=Math.hypot(dx,dy),da=Math.abs(wrapAngle(Math.atan2(dy,dx)-ang));
    if (d<=range+CFG.r && da<=arc/2) { hit(o,dmg,f.x,f.y,kb||0,0,sk,f); return true; }
    return false;
  }

  function updateLoad(f,dt) {
    const s=ensure(f);
    if (s.curse) {
      f.hp = Math.min(f.c.hp, f.hp + C.passive.regen * dt);
      s.loadTimer+=dt;
      while(s.loadTimer>=C.passive.upTime){s.loadTimer-=C.passive.upTime;if(s.load<C.passive.max){s.load++;pop(f,'咒印負荷 +1',s.load>=7?P.red:s.load>=4?P.gold:P.green);}}
    } else if (s.load>0) {
      s.loadTimer+=dt;
      while(s.loadTimer>=C.passive.downTime){s.loadTimer-=C.passive.downTime;s.load=Math.max(0,s.load-1);}
    }
  }

  /* 普攻 */
  C.sk.a.fire = function (f,o,a,s) {
    const st=ensure(f), now=performance.now()/1000;
    const ang = (a && Number.isFinite(a.ang)) ? a.ang : Math.atan2(o.y-f.y, o.x-f.x);
    if (now-st.comboT>1.1) st.combo=0;
    st.comboT=now;
    
    if (st.curse && st.combo===2) {
      st.combo=0;
      const q={kind:'shuriken',x:f.x+Math.cos(ang)*(CFG.r+15),y:f.y+Math.sin(ang)*(CFG.r+15),vx:Math.cos(ang)*s.shurikenSpeed,vy:Math.sin(ang)*s.shurikenSpeed,ang,travel:0,maxDist:s.shurikenRange,life:1.8,own:f,stopped:false,stay:0,tick:0,hit:false,sk:s,col:P.dark};
      st.projectiles.push(q); 
      fx({k:'ring',x:q.x,y:q.y,t:.2,m:.2,r:60,col:P.purple}); 
      spark(q.x,q.y,P.dark,20,600,.3,4);
      return;
    }
    st.combo=(st.combo+1)%3;
    fx({k:'arc',x:f.x,y:f.y,a:ang,w:s.arc+(st.curse?.25:0),r:s.range+(st.curse?24:0),t:.13,m:.13,col:st.curse?P.purple:'#d7e9ff'});
    spark(f.x+Math.cos(ang)*70,f.y+Math.sin(ang)*70,st.curse?P.purple:P.white,10,500,.2,3);
    fanHit(f,o,ang,s.range+(st.curse?35:0),s.arc+(st.curse?.25:0),s,s.dmg,s.kb);
  };

  /* 豪火球／白蛇 */
  C.sk.b.fire = function (f,o,a,s) {
    const st=ensure(f);
    const ang = (a && Number.isFinite(a.ang)) ? a.ang : Math.atan2(o.y-f.y, o.x-f.x);
    if (!st.curse) {
      st.projectiles.push({kind:'fireball',x:f.x+Math.cos(ang)*(CFG.r+18),y:f.y+Math.sin(ang)*(CFG.r+18),vx:Math.cos(ang)*s.speed,vy:Math.sin(ang)*s.speed,life:2,travel:0,maxDist:s.range,own:f,sk:s,col:P.fire});
      fx({k:'flash',t:.2,m:.2,col:P.fire,a:.8}); spark(f.x,f.y,P.fire,25,600,.3,4);
      return;
    }
    if (!st.snake) {
      st.snake={phase:'guard',t:0,ang,travel:0,hit:new Set(),sx:f.x,sy:f.y}; 
      f.inv=Math.max(f.inv,s.snakeInv); f.cd.b=0; st.load=Math.min(C.passive.max,st.load+1);
      pop(f,'白蛇盤踞 (無敵)',P.white); fx({k:'ring',x:f.x,y:f.y,t:.6,m:.6,r:CFG.r*2,col:P.white});
      fx({k:'ring',x:f.x,y:f.y,t:.8,m:.8,r:CFG.r*2.5,col:P.purple}); spark(f.x,f.y,P.white,30,600,.6,5);
      return;
    }
    releaseSnake(f,ang,s);
  };
  function releaseSnake(f,ang,s) {
    const st=ensure(f); if(!st.snake)return;
    st.snake.phase='crawl'; st.snake.t=0; st.snake.ang=ang; st.snake.hit=new Set(); f.inv=0; f.cd.b=cdOf(f,s);
    st.snake.sx=f.x;st.snake.sy=f.y;st.snake.tx=f.x+Math.cos(ang)*430;st.snake.ty=f.y+Math.sin(ang)*430;
    st.snake.amp=CFG.r*s.snakeAmp; st.snake.T=.65; 
    fx({k:'flash',t:.22,m:.22,col:P.purple,a:1});
  }
  function snakePoint(sn,p) {
    const ux=Math.cos(sn.ang),uy=Math.sin(sn.ang),nx=-uy,ny=ux;
    return {x:sn.sx+(sn.tx-sn.sx)*p+nx*Math.sin(p*Math.PI*4)*sn.amp,y:sn.sy+(sn.ty-sn.sy)*p+ny*Math.sin(p*Math.PI*4)*sn.amp};
  }

  /* 風魔手裡劍／黑色千鳥 */
  C.sk.c.fire = function (f,o,a,s) {
    const st=ensure(f);
    const ang = (a && Number.isFinite(a.ang)) ? a.ang : Math.atan2(o.y-f.y, o.x-f.x);
    if (!st.curse) {
      st.projectiles.push({kind:'wind',x:f.x+Math.cos(ang)*(CFG.r+16),y:f.y+Math.sin(ang)*(CFG.r+16),vx:Math.cos(ang)*s.speed,vy:Math.sin(ang)*s.speed,ang,travel:0,maxDist:s.range,life:1.5,own:f,sk:s,col:P.blue,split:false});
      spark(f.x,f.y,P.blue,18,600,.3,4); return;
    }
    
    f.inv=Math.max(f.inv,.6); st.load=Math.min(C.passive.max,st.load+1); 
    st.chidori={ sx: f.x, sy: f.y, ang: ang, t: 0, T: s.chidoriDur, dist: s.chidoriDist, hitTarget: null, tick: 0 };
    fx({k:'flash',t:.16,m:.16,col:P.purple,a:1.2}); spark(f.x,f.y,P.black,30,800,.35,5);
  };
  function explodeWind(f,q) {
    if (q.split) return;
    q.split=true; 
    fx({k:'ring',x:q.x,y:q.y,t:.35,m:.35,r:140,col:P.blue}); 
    spark(q.x,q.y,P.white,30,700,.4,5);
    for(let i=0;i<4;i++){
      const aa=q.ang+i*(Math.PI/2); 
      ensure(f).projectiles.push({
        kind:'blade',x:q.x,y:q.y,
        vx:Math.cos(aa)*q.sk.windBladeSpeed,vy:Math.sin(aa)*q.sk.windBladeSpeed,
        life:.4,own:f,sk:q.sk,col:P.blue
      });
    }
  }

  /* 麒麟 */
  const oldHoldStart=window.holdStart, oldHoldRelease=window.holdRelease;
  if (typeof oldHoldStart==='function' && !oldHoldStart._sasukeWrapped) {
    window.holdStart=function(f,k,aim){
      if(f&&f.c===C&&k==='d'){const st=ensure(f);if(st.kirin){return;} if(st.kirinCd.every(x=>x>0)){if(f===G.p)say('麒麟冷卻中',.7);return;} }
      return oldHoldStart(f,k,aim);
    }; window.holdStart._sasukeWrapped=true;
  }
  if (typeof oldHoldRelease==='function' && !oldHoldRelease._sasukeWrapped) {
    window.holdRelease=function(f,k,aim){
      if(!f||f.c!==C||k!=='d')return oldHoldRelease(f,k,aim);
      const h=f.hold;if(!h||h.k!=='d')return;
      const st=ensure(f),tier=h.t>=1.5?2:(h.t>=.5?1:0); f.hold=null;
      if(st.kirinCd[tier]>0){if(f===G.p)say('該段冷卻中',.7);return;}
      st.kirinPending=tier; 
      const oldCd = f.cd.d; f.cd.d = 0; 
      cast(f,'d',aim||h.aim);
      f.cd.d = oldCd;
    }; window.holdRelease._sasukeWrapped=true;
  }
  C.sk.d.fire=function(f,o,a,s){
    const st=ensure(f),tier=st.kirinPending==null?0:st.kirinPending; st.kirinPending=null;
    if(st.curse) st.load=Math.min(C.passive.max,st.load+1);
    st.kirinCd[tier]=s.dCd[tier]; 
    
    const foe = enemyOf(f);
    const ang = (a && Number.isFinite(a.ang)) ? a.ang : Math.atan2(o.y-f.y, o.x-f.x);
    
    // 防呆：如果找不到敵人就以自己前方為準
    const tx = (foe && alive(foe)) ? foe.x : f.x + Math.cos(ang)*300;
    const ty = (foe && alive(foe)) ? foe.y : f.y + Math.sin(ang)*300;

    st.kirin={tier,t:0,next:.12,hits:0,max:s.dHits[tier],x:tx,y:ty,ang:ang,dmg:s.dDmg[tier],rad:s.dRad[tier],sk:s};
    st.bolts.push({ x: st.kirin.x, y: st.kirin.y, t:0, max:0.6, tier });
    
    fx({k:'ring',x:st.kirin.x,y:st.kirin.y,t:tier===2?.75:.4,m:tier===2?.75:.4,r:st.kirin.rad,col:P.purple});
    if(tier===2){shake(25);fx({k:'flash',t:.5,m:.5,col:P.white,a:1.5});pop(f,'麒麟・三段',P.purple)} else pop(f,'麒麟・'+(tier+1)+'段',P.blue);
  };

  /* 替身術 */
  C.sk.e.fire=function(f,o,a,s){
    const ox=f.x,oy=f.y; f.inv=Math.max(f.inv,.25); 
    fx({k:'ring',x:ox,y:oy,t:.35,m:.35,r:CFG.r*1.7,col:P.white});spark(ox,oy,P.white,30,800,.4,5);
    f.x=CFG.r+Math.random()*(CFG.W-CFG.r*2);f.y=CFG.r+Math.random()*(CFG.H-CFG.r*2);f.kx=f.ky=0;f.inv=Math.max(f.inv,s.inv);ensure(f).substitution=2;
    fx({k:'ring',x:f.x,y:f.y,t:.55,m:.55,r:CFG.r*2.5,col:P.purple});spark(f.x,f.y,P.purple,35,700,.5,4);pop(f,'替身術',P.white);
  };

  C.sk.x.fire=function(f){f.curse=!f.curse; modeSync(f); f.cd.x=.1;};

  const oldHit=window.hit;
  if(typeof oldHit==='function'&&!oldHit._sasukeWrapped){
    const w=function(t,d,fx_,fy_,kb,heavy,sk,att){
      if (!Number.isFinite(d)) d = 0; // 防呆：避免 NaN 汙染血量導致統計失效
      const before=t&&t.hp;
      oldHit(t,d,fx_,fy_,kb,heavy,sk,att);
      if(t&&before>t.hp&&att&&att.c===C&&ensure(att).curse&&sk&&['b','c','d'].includes(sk.key)){
        const st=ensure(att),old=st.load;st.load=Math.max(0,st.load-C.passive.hitSub);
        if(old!==st.load)pop(att,'咒印命中 負荷 -'+C.passive.hitSub,P.green);
      }
    };
    w._sasukeWrapped=true;window.hit=w;
  }

  function updateProjectiles(f,dt) {
    const st=ensure(f),o=enemyOf(f);
    for(let i=st.projectiles.length-1;i>=0;i--){
      const q=st.projectiles[i]; q.life-=dt;
      
      // 防呆：檢查座標是否為 NaN，若是則直接移除
      if (!Number.isFinite(q.x) || !Number.isFinite(q.y) || !Number.isFinite(q.vx) || !Number.isFinite(q.vy)) {
        st.projectiles.splice(i, 1);
        continue;
      }

      if(q.kind==='shuriken'){
        if(!q.stopped){
          q.x+=q.vx*dt; q.y+=q.vy*dt; q.travel+=Math.hypot(q.vx,q.vy)*dt;
          const hitTarget = alive(o) && Math.hypot(o.x-q.x, o.y-q.y) < 40 + CFG.r; 
          const wall = q.x<CFG.r || q.x>CFG.W-CFG.r || q.y<CFG.r || q.y>CFG.H-CFG.r;
          if(hitTarget){
            q.stopped=true; q.vx=q.vy=0; q.stay=1; q.tick=0;
            hit(o, q.sk.shurikenDmg, q.x, q.y, 100, 0, q.sk, f);
            if (G.state !== 'fight') break;
            fx({k:'ring',x:q.x,y:q.y,t:.3,m:.3,r:70,col:P.purple});
            spark(q.x, q.y, P.purple, 20, 600, .3, 4);
          }
          else if(wall||q.travel>=q.maxDist)q.life=0;
        } else {
          q.stay-=dt;q.tick-=dt;
          if(q.tick<=0&&q.stay>0){
            q.tick=.2;
            if(alive(o)&&Math.hypot(o.x-q.x,o.y-q.y)<CFG.r*2.0){
              hit(o,q.sk.shurikenDot,q.x,q.y,0,0,q.sk,f); 
              if (G.state !== 'fight') break;
              spark(q.x,q.y,P.purple,5,300,.2,3);
            }
          }
        }
      } 
      else if(q.kind==='fireball'||q.kind==='wind'||q.kind==='blade'){
        q.x+=q.vx*dt;q.y+=q.vy*dt;q.travel+=(Math.hypot(q.vx,q.vy)*dt);
        const wall=q.x<CFG.r||q.x>CFG.W-CFG.r||q.y<CFG.r||q.y>CFG.H-CFG.r;
        let hitRad = 24;
        if(q.kind==='fireball') hitRad = q.sk.r; 
        else if(q.kind==='wind') hitRad = q.sk.windRad; 
        
        const hitTarget=alive(o)&&Math.hypot(o.x-q.x,o.y-q.y)<hitRad+CFG.r;
        
        if(q.kind==='fireball'&&hitTarget){
          hit(o,q.sk.fireDmg,q.x,q.y,q.sk.kb,0,q.sk,f);
          if (G.state !== 'fight') break; 
          addStatus(o,{k:'dot',dur:1.1,v:q.sk.fireDot});
          fx({k:'ring',x:q.x,y:q.y,t:.35,m:.35,r:100,col:P.fire});
          spark(q.x,q.y,P.fire,30,500,.4,4);
          q.life=0;
        }
        else if(q.kind==='wind'&&(hitTarget||wall||q.travel>=q.maxDist)){explodeWind(f,q);q.life=0;}
        else if(q.kind==='blade'&&hitTarget){hit(o,q.sk.windBladeDmg,q.x,q.y,100,0,q.sk,f);if (G.state !== 'fight') break; q.life=0;}
        else if(q.kind==='fireball'&&(wall||q.travel>=q.maxDist))q.life=0;
        else if(q.kind==='blade'&&(wall||q.life<=0))q.life=0;
      }
      
      if(q.life<=0)st.projectiles.splice(i,1);
    }
  }
  
  function updateSnake(f,dt){
    const st=ensure(f),sn=st.snake;if(!sn)return;
    if(sn.phase==='guard'){
      sn.t+=dt;
      if(sn.t>=C.sk.b.snakeInv)releaseSnake(f,sn.ang,C.sk.b);
      return;
    }
    sn.t+=dt;const p=Math.min(1,sn.t/sn.T),pt=snakePoint(sn,p),o=enemyOf(f);
    if(alive(o)&&Math.hypot(o.x-pt.x,o.y-pt.y)<CFG.r*1.2&&!sn.hit.has(o)){
      sn.hit.add(o);hit(o,C.sk.b.snakeDmg,pt.x,pt.y,0,0,C.sk.b,f);
      if (G.state !== 'fight') return;
      o.kx+=Math.cos(sn.ang)*C.sk.b.snakePush;o.ky+=Math.sin(sn.ang)*C.sk.b.snakePush;
    }
    if(p>=1){st.grounds.push({x:sn.tx,y:sn.ty,t:0,tick:0,life:C.sk.b.snakeGroundLife,rad:CFG.r*1.5,own:f});fx({k:'ring',x:sn.tx,y:sn.ty,t:.5,m:.5,r:CFG.r*1.5,col:P.purple});st.snake=null;}
  }
  
  function updateGrounds(f,dt){
    const st=ensure(f),o=enemyOf(f);
    for(let i=st.grounds.length-1;i>=0;i--){const z=st.grounds[i];z.t+=dt;z.tick-=dt;if(z.tick<=0){z.tick=.2;if(alive(o)&&Math.hypot(o.x-z.x,o.y-z.y)<z.rad+CFG.r){hit(o,C.sk.b.snakeGroundDmg,z.x,z.y,0,0,C.sk.b,z.own);if(G.state!=='fight')break;}}if(z.t>=z.life)st.grounds.splice(i,1);}
  }
  
  function updateChidori(f,dt){
    const st=ensure(f),c=st.chidori;if(!c)return;
    c.t+=dt;
    const u=Math.min(1,c.t/c.T);
    
    f.x = c.sx + Math.cos(c.ang) * c.dist * u;
    f.y = c.sy + Math.sin(c.ang) * c.dist * u;
    f.x = clamp(f.x, CFG.r, CFG.W-CFG.r);
    f.y = clamp(f.y, CFG.r, CFG.H-CFG.r);
    
    if(Math.random() < 0.9) {
        spark(f.x, f.y, P.purple, 8, 800, .2, 4);
        spark(f.x, f.y, P.black, 5, 600, .2, 5);
        fx({k:'gh', x:f.x, y:f.y, t:.2, m:.2, col:P.purple});
    }
    
    const o = enemyOf(f);
    if (!c.hitTarget && alive(o) && Math.hypot(o.x - f.x, o.y - f.y) < CFG.r * 2.5) {
      c.hitTarget = o;
      pop(f, '千鳥 抓取！', P.purple);
    }
    
    if (c.hitTarget && alive(c.hitTarget)) {
      c.hitTarget.x = clamp(f.x + Math.cos(c.ang) * CFG.r * 1.5, CFG.r, CFG.W-CFG.r);
      c.hitTarget.y = clamp(f.y + Math.sin(c.ang) * CFG.r * 1.5, CFG.r, CFG.H-CFG.r);
      c.hitTarget.stun = 0.1;
      
      c.tick += dt;
      if (c.tick >= 0.1) {
        c.tick = 0;
        hit(c.hitTarget, C.sk.c.chidoriTick, f.x, f.y, 0, 0, C.sk.c, f);
        if (G.state !== 'fight') return;
        spark(c.hitTarget.x, c.hitTarget.y, P.purple, 5, 600, .2, 3);
      }
    }
    
    if (u >= 1) {
      if (c.hitTarget && alive(c.hitTarget)) {
        hit(c.hitTarget, C.sk.c.chidoriEnd, f.x, f.y, 400, 1, C.sk.c, f);
        if (G.state !== 'fight') return;
        fx({k:'flash',t:.4,m:.4,col:P.purple,a:1.2});
        fx({k:'ring',x:c.hitTarget.x,y:c.hitTarget.y,t:.6,m:.6,r:150,col:P.purple});
        shake(15);
      }
      st.chidori = null;
    }
  }
  
  function updateKirin(f,dt){
    const st=ensure(f);for(let i=0;i<3;i++)st.kirinCd[i]=Math.max(0,st.kirinCd[i]-dt);
    if(f.hold&&f.hold.k==='d'&&f.stun>0){const tier=f.hold.t>=1.5?2:(f.hold.t>=.5?1:0);f.hold=null;st.kirinCd[tier]=C.sk.d.dCd[tier];pop(f,'麒麟被打斷',P.red);}
    const k=st.kirin;if(!k)return;k.t+=dt;
    while(k.hits<k.max&&k.t>=k.next){k.next+=.1;k.hits++;const aa=k.x+(Math.random()-.5)*k.rad,bb=k.y+(Math.random()-.5)*k.rad;blast(f,aa,bb,k.tier===2?100:80,C.sk.d.dDmg[k.tier]/k.max,220,P.purple,0);fx({k:'ring',x:aa,y:bb,t:.25,m:.25,r:80,col:P.white});spark(aa,bb,P.purple,k.tier===2?20:10,900,.3,4);if(k.tier===2)shake(4);}
    if(k.hits>=k.max&&k.t>k.next+.15)st.kirin=null;
  }

  const oldMk=window.mk;
  if(typeof oldMk==='function'&&!oldMk._sasukeWrapped){const w=function(id,x,side,isAI){const f=oldMk(id,x,side,isAI);if(id==='sasuke')ensure(f);return f;};w._sasukeWrapped=true;window.mk=w;}
  
  const oldUpdate=window.update;
  if(typeof oldUpdate==='function'&&!oldUpdate._sasukeWrapped){
    const w=function(dt){
      const hpBefore = {};
      if (G.p) hpBefore['p'] = G.p.hp;
      if (G.e) hpBefore['e'] = G.e.hp;

      oldUpdate(dt);
      
      if(G.state === 'fight'){
        for(const f of [G.p,G.e]){
          if(!f || f.c !== C) continue;
          const st = ensure(f);
          const id = f === G.p ? 'p' : 'e';
          
          if(st.snake && st.snake.phase === 'guard') {
            f.x = st.snake.sx;
            f.y = st.snake.sy;
            f.mx = 0; f.my = 0;
          }
          
          // 只有玩家 (G.p) 的無敵回溯才生效，避免木樁或敵人的血量被意外補滿
          if(id === 'p' && f.inv > 0 && hpBefore[id] !== undefined) {
            f.hp = hpBefore[id];
            f.sts = f.sts.filter(s => s.k !== 'bind');
          }
        }
      }

      if(G.state!=='fight')return;
      for(const f of [G.p,G.e]){
        if(!f||f.c!==C)continue;const st=ensure(f);
        modeSync(f);updateLoad(f,dt);
        if(st.substitution>0)st.substitution=Math.max(0,st.substitution-dt);
        updateProjectiles(f,dt);updateSnake(f,dt);updateGrounds(f,dt);updateChidori(f,dt);updateKirin(f,dt);
        if(st.comboT>0)st.comboT-=dt;
        
        const maxKirinCd = Math.max(...st.kirinCd);
        f.cd.d = maxKirinCd;

        if(st.bolts){for(let i=st.bolts.length-1;i>=0;i--){st.bolts[i].t+=dt;if(st.bolts[i].t>=st.bolts[i].max)st.bolts.splice(i,1);}}
      }
    };
    w._sasukeWrapped=true;window.update=w;
  }

  const oldDraw=window.draw;
  if(typeof oldDraw==='function'&&!oldDraw._sasukeWrapped){
    const w=function(){
      if(G.p && G.p.c===C){
        const st=ensure(G.p);
        C.sk.b.name = st.curse ? '白蛇' : '豪火球';
        C.sk.c.name = st.curse ? '黑色千鳥' : '風魔手裡劍';
      }
      
      oldDraw();
      if(!G.p)return;
      cx.save();cx.scale(view.s,view.s);cx.translate(-cam.x,-cam.y);const T=performance.now()/1000;
      
      for(const f of [G.p,G.e]){
        if(!f||f.c!==C)continue;const st=ensure(f),col=st.load>=7?P.red:st.load>=4?P.gold:P.green,bw=78,bh=9,bx=f.x-bw/2,by=f.y-CFG.r-38;
        
        if (f === G.p && f.hold && f.hold.k === 'd') {
          const t = f.hold.t;
          const k = Math.min(1, t / 1.5);
          cx.save();
          cx.translate(f.x, f.y);
          cx.globalCompositeOperation = 'lighter';
          cx.strokeStyle = P.purple;
          cx.lineWidth = 4;
          cx.beginPath();
          cx.arc(0, 0, 40 + k * 60, 0, Math.PI * 2);
          cx.stroke();
          cx.lineWidth = 2;
          cx.setLineDash([10, 15]);
          cx.lineDashOffset = -T * 100;
          cx.beginPath();
          cx.arc(0, 0, 60 + k * 80, 0, Math.PI * 2);
          cx.stroke();
          cx.setLineDash([]);
          
          if (Math.random() < 0.4 + k * 0.6) {
            const a = Math.random() * Math.PI * 2;
            const dist = 100 + Math.random() * 200;
            cx.strokeStyle = '#fff';
            cx.lineWidth = 2;
            cx.beginPath();
            cx.moveTo(Math.cos(a) * dist, Math.sin(a) * dist);
            cx.lineTo(Math.cos(a+0.1) * dist * 0.6, Math.sin(a+0.1) * dist * 0.6);
            cx.lineTo(Math.cos(a) * dist * 0.3, Math.sin(a) * dist * 0.3);
            cx.lineTo(0, 0);
            cx.stroke();
          }
          cx.restore();
        }

        if(st.curse||st.load>0){
          cx.fillStyle='#080611cc';cx.fillRect(bx,by,bw,bh);
          cx.fillStyle=col;cx.fillRect(bx,by,bw*st.load/C.passive.max,bh);
          cx.strokeStyle='#fff';cx.lineWidth=1.5;cx.strokeRect(bx,by,bw,bh);
          cx.fillStyle='#fff';cx.font='bold 12px system-ui';cx.textAlign='center';cx.fillText('咒印負荷 '+st.load+'/'+C.passive.max,f.x,by-5);
          if(st.curse){cx.font='11px system-ui';cx.fillText('冷卻 +'+(st.load*(C.passive.cdAdd*100))+'%',f.x,by-19);}
        }
        
        if(st.curse){
          cx.globalCompositeOperation='lighter';
          for(let i=0;i<3;i++){
             const a = T*2 + i*2.1;
             cx.globalAlpha = .3 + .1*Math.sin(T*5+i);
             cx.strokeStyle=P.purple; cx.lineWidth=2;
             cx.beginPath(); cx.arc(f.x,f.y, CFG.r+10 + i*10 + Math.sin(T*4+i)*4, a, a+2); cx.stroke();
          }
          cx.globalAlpha=1;
        }
        
        if(st.snake){
          cx.globalCompositeOperation='lighter';
          if(st.snake.phase==='guard'){
            cx.strokeStyle=P.white;cx.lineWidth=8;cx.beginPath();cx.arc(f.x,f.y,CFG.r+20+Math.sin(T*15)*6,0,Math.PI*2);cx.stroke();
            cx.strokeStyle=P.purple;cx.lineWidth=3;cx.setLineDash([15,15]);cx.lineDashOffset=-T*150;cx.beginPath();cx.arc(f.x,f.y,CFG.r+35,0,Math.PI*2);cx.stroke();cx.setLineDash([]);
          } else {
            const p = Math.min(1, st.snake.t / st.snake.T);
            cx.strokeStyle='#fff';cx.lineWidth=14;cx.lineCap='round';cx.lineJoin='round';
            cx.shadowColor = P.purple;cx.shadowBlur = 25;
            cx.beginPath();
            for(let i=0; i<=p; i+=0.05){
              const pt = snakePoint(st.snake, i);
              if(i===0) cx.moveTo(pt.x, pt.y); else cx.lineTo(pt.x, pt.y);
            }
            cx.stroke();
            cx.shadowBlur = 0;
            if(Math.random() < 0.6) {
              const pt = snakePoint(st.snake, p);
              spark(pt.x, pt.y, P.purple, 3, 400, .2, 2);
            }
          }
        }
        
        if(st.chidori){
          cx.globalCompositeOperation='lighter';
          cx.fillStyle = 'rgba(118, 92, 255, 0.3)';
          cx.beginPath(); cx.arc(f.x, f.y, CFG.r, 0, Math.PI * 2); cx.fill();
          for(let j=0;j<8;j++){
            const aa=T*40+j*Math.PI/4;
            cx.strokeStyle=j%2?P.black:P.purple;
            cx.lineWidth=j%2?5:3;
            cx.beginPath();cx.moveTo(f.x,f.y);
            cx.lineTo(f.x+Math.cos(aa)*100+(Math.random()-.5)*30, f.y+Math.sin(aa)*100+(Math.random()-.5)*30);
            cx.stroke();
          }
        }
        
        for(const z of st.grounds){
          cx.globalCompositeOperation='lighter';cx.globalAlpha=.6+.2*Math.sin(T*15);
          cx.fillStyle=P.purple;cx.beginPath();cx.arc(z.x,z.y,z.rad,0,Math.PI*2);cx.fill();cx.globalAlpha=1;
          for(let j=0;j<6;j++){const aa=T*8+j*1.1;cx.strokeStyle=j%2?P.white:P.purple;cx.beginPath();cx.moveTo(z.x+Math.cos(aa)*20,z.y+Math.sin(aa)*20);cx.lineTo(z.x+Math.cos(aa+.5)*z.rad,z.y+Math.sin(aa+.5)*z.rad);cx.stroke();}
        }
        
        if(st.bolts){
          cx.globalCompositeOperation='lighter';
          for(const b of st.bolts){
            const k=1-(b.t/b.max);
            const layers=b.tier===2?3:1;
            for(let l=0;l<layers;l++){
              cx.strokeStyle=l===0?'#fff':l===1?P.purple:'#e0f';
              cx.lineWidth=l===0?8:24;
              cx.globalAlpha=k*(l===0?1:0.6);
              cx.beginPath();
              let px=b.x+(Math.random()-.5)*60, py=b.y;
              cx.moveTo(px,py);
              for(let j=0;j<15;j++){px+=(Math.random()-.5)*50;py-=80;cx.lineTo(px,py);}
              cx.stroke();
            }
          }
        }
        
        for(const q of st.projectiles){
          if (!Number.isFinite(q.x) || !Number.isFinite(q.y)) continue; // 防呆：跳過無效座標的投射物
          cx.save();cx.translate(q.x,q.y);cx.rotate(q.ang||Math.atan2(q.vy||0,q.vx||1));cx.globalCompositeOperation='lighter';
          if(q.kind==='fireball'){
             const g=cx.createRadialGradient(0,0,0,0,0,80);
             g.addColorStop(0,'#fff');g.addColorStop(.25,'#ffd36b');g.addColorStop(.7,P.fire);g.addColorStop(1,'#ff250000');
             cx.fillStyle=g;cx.beginPath();cx.arc(0,0,80+Math.sin(T*24)*10,0,Math.PI*2);cx.fill();
             if(Math.random()<0.9) fx({k:'dt',x:q.x,y:q.y,vx:-q.vx*.15,vy:-q.vy*.15,t:.5,m:.5,col:P.fire,r:10,dr:4});
          } else {
             cx.rotate(T * 30);
             const isWind = q.kind==='wind';
             const isShuriken = q.kind==='shuriken';
             cx.fillStyle = isWind ? P.blue : isShuriken ? P.dark : P.blue;
             cx.shadowColor = cx.fillStyle;
             cx.shadowBlur = 30;
             cx.beginPath();
             const r = isWind? 70 : isShuriken ? 40 : 24; 
             for(let j=0;j<4;j++){
               cx.rotate(Math.PI/2);
               cx.moveTo(0,0);
               cx.lineTo(-12, r);
               cx.lineTo(12, r);
               cx.closePath();
             }
             cx.fill();
             cx.fillStyle='#fff'; cx.beginPath(); cx.arc(0,0,12,0,7); cx.fill();
          }
          cx.restore();
        }
      }
      cx.restore();
    };
    w._sasukeWrapped=true;window.draw=w;
  }
  console.log('[char_sasuke] 宇智波佐助完整模組已載入 (防 NaN 崩潰終極版)');
})();
