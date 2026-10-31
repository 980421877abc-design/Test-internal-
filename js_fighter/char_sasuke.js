/* js_fighter/char_sasuke.js
 * 宇智波佐助｜雙形態完整模組（特效強化版）
 */
(function () {
  'use strict';
  if (typeof CHARS === 'undefined' || typeof CFG === 'undefined' || CHARS.sasuke) return;

  const C = CHARS.sasuke = {
    name: '宇智波佐助', work: '火影忍者', color: '#7046a8', glyph: '助', img: 'image/sasuke.png',
    hp: 8000, speed: 600,
    res: { name: '查克拉', max: 1500, regen: 40, color: '#765cff', blockDrain: 25 },
    aiDist: 260,
    sk: {
      a: { name: '體術', type: 'melee', cost: 0, cd: .3, wind: .06, dmg: 60, range: 140, arc: 1.2, kb: 140 },
      
      // 補上 hold 讓 PV 可以觸發
      b: { name: '豪火球／白蛇', type: 'proj', cost: 100, cd: 4, wind: .1, range: 650, speed: 760, r: 28, col: '#ff6338',
           hold: { start: .05, full: 99 }, noCharge: 1, aimMove: 1,
           pv: (f) => f.sasukeState && f.sasukeState.curse ? { k:'line', len:430, w:CFG.r*1.4 } : { k:'line', len:650, w:CFG.r*.9 },
           ai: (e,p,c,q) => c.d < (e.sasukeState && e.sasukeState.curse ? 520 : 720) ? c.p : null },
           
      c: { name: '風魔手裡劍／黑色千鳥', type: 'proj', cost: 150, cd: 6, wind: .1, range: 360, speed: 900, r: 22, col: '#9bd7ff',
           hold: { start: .05, full: 99 }, noCharge: 1, aimMove: 1,
           pv: (f) => f.sasukeState && f.sasukeState.curse ? { k:'line', len:CFG.r*4.5, w:CFG.r*1.45 } : { k:'line', len:CFG.r*5, w:CFG.r*.8 },
           ai: (e,p,c,q) => c.d < 760 ? c.p : null },
           
      d: { name: '麒麟', type: 'melee', cost: 200, cd: 0, wind: .15, hold: { start: .05, full: 1.5 }, lockMove: 1,
           pv: (f,full,q) => ({ k:'zone', range: q.range || 300, r: full ? 170 : 110 }),
           ai: (e,p,c,q) => c.d < 760 ? c.p : null },
           
      e: { name: '替身術', type: 'melee', cost: 50, cd: 15, wind: .05,
           pv: () => ({ k:'circle', r: CFG.r*1.7 }) },
           
      x: { name: '咒印模式', type: 'toggle', side: 'L', cost: 0, cd: .1, wind: .03, hold: { start: .35, full: 99 },
           modes: ['普通', '咒印'], modesSide: 'L', tag: f => f.sasukeState && f.sasukeState.curse ? '咒印｜負荷 '+(f.sasukeState.load||0)+'/10' : '普通模式' }
    }
  };
  for (const k of Object.keys(C.sk)) C.sk[k].key = k;

  const P = { purple:'#765cff', dark:'#171022', black:'#080611', white:'#f7fbff', fire:'#ff6338', blue:'#9bd7ff', gold:'#ffd77a', green:'#8ff0a0', red:'#ff5968' };
  const enemyOf = f => f === G.p ? G.e : G.p;
  const alive = f => !!f && f.hp > 0;
  const fx = o => G.fx.push(o);
  const angleTo = (f,o) => Math.atan2(o.y-f.y,o.x-f.x);
  const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const wrapAngle = a => { while(a>Math.PI)a-=Math.PI*2; while(a<-Math.PI)a+=Math.PI*2; return a; };

  function ensure(f) {
    if (!f.sasukeState) f.sasukeState = {
      curse:false, load:0, loadTimer:0, modeNotice:0,
      combo:0, comboT:0, snake:null, chidori:null,
      kirinCd:[0,0,0], kirin:null, kirinPending:null,
      projectiles:[], grounds:[], substitution:0, bolts:[] // 新增 bolts 用於畫天降雷柱
    };
    return f.sasukeState;
  }
  function modeSync(f) {
    const s = ensure(f), next = !!(f.mode && f.mode.x);
    if (next === s.curse) return;
    s.curse = next; s.load = 0; s.loadTimer = 0; s.combo = 0;
    s.modeNotice = .8;
    pop(f, next ? '咒印模式' : '普通模式', next ? P.purple : P.white);
    fx({k:'ring',x:f.x,y:f.y,t:.5,m:.5,r:CFG.r*2.2,col:next?P.purple:P.white});
    spark(f.x,f.y,next?P.purple:P.white,22,520,.35,3.5);
  }
  function fanHit(f,o,ang,range,arc,sk,dmg,kb) {
    if (!alive(o)) return false;
    const dx=o.x-f.x,dy=o.y-f.y,d=Math.hypot(dx,dy),da=Math.abs(wrapAngle(Math.atan2(dy,dx)-ang));
    if (d<=range+CFG.r && da<=arc/2) { hit(o,dmg,f.x,f.y,kb||0,0,sk,f); return true; }
    return false;
  }

  /* 咒印負荷 */
  function updateLoad(f,dt) {
    const s=ensure(f); s.modeNotice=Math.max(0,s.modeNotice-dt);
    if (s.curse) {
      s.loadTimer+=dt;
      while(s.loadTimer>=3){s.loadTimer-=3;if(s.load<10){s.load++;pop(f,'咒印負荷 +1',s.load>=7?P.red:s.load>=4?P.gold:P.green);}}
    } else if (s.load>0) {
      s.loadTimer+=dt;
      while(s.loadTimer>=2){s.loadTimer-=2;s.load=Math.max(0,s.load-1);}
    }
  }

  /* 普攻 */
  C.sk.a.fire = function (f,o,a,s) {
    const st=ensure(f),ang=a.ang, now=performance.now()/1000;
    if (now-st.comboT>1.1) st.combo=0;
    st.comboT=now;
    
    if (st.curse && st.combo===2) {
      st.combo=0;
      // 修復判定：設定固定半徑 24 取代 undefined 的 range
      const q={kind:'shuriken',x:f.x+Math.cos(ang)*(CFG.r+12),y:f.y+Math.sin(ang)*(CFG.r+12),vx:Math.cos(ang)*1050,vy:Math.sin(ang)*1050,ang,travel:0,maxDist:CFG.r*6,life:1.8,own:f,stopped:false,stay:0,tick:0,hit:false,sk:s,col:P.dark};
      st.projectiles.push(q); 
      fx({k:'ring',x:q.x,y:q.y,t:.2,m:.2,r:38,col:P.purple}); 
      spark(q.x,q.y,P.dark,15,500,.25,3);
      return;
    }
    st.combo=(st.combo+1)%3;
    fx({k:'arc',x:f.x,y:f.y,a:ang,w:s.arc+(st.curse?.25:0),r:s.range+(st.curse?24:0),t:.13,m:.13,col:st.curse?P.purple:'#d7e9ff'});
    spark(f.x+Math.cos(ang)*70,f.y+Math.sin(ang)*70,st.curse?P.purple:P.white,8,460,.2,3);
    fanHit(f,o,ang,s.range+(st.curse?35:0),s.arc+(st.curse?.25:0),s,s.dmg,s.kb);
  };

  /* 豪火球／白蛇 */
  C.sk.b.fire = function (f,o,a,s) {
    const st=ensure(f),ang=a.ang;
    if (!st.curse) {
      st.projectiles.push({kind:'fireball',x:f.x+Math.cos(ang)*(CFG.r+18),y:f.y+Math.sin(ang)*(CFG.r+18),vx:Math.cos(ang)*s.speed,vy:Math.sin(ang)*s.speed,life:2,travel:0,maxDist:s.range,own:f,sk:s,col:P.fire});
      fx({k:'flash',t:.18,m:.18,col:P.fire,a:.8}); spark(f.x,f.y,P.fire,18,520,.3,3);
      return;
    }
    if (!st.snake) {
      st.snake={phase:'guard',t:0,ang,travel:0,hit:new Set()};
      f.inv=Math.max(f.inv,2); f.cd.b=0; st.load=Math.min(10,st.load+1);
      pop(f,'白蛇盤踞',P.white); fx({k:'ring',x:f.x,y:f.y,t:.6,m:.6,r:CFG.r*1.7,col:P.white});
      fx({k:'ring',x:f.x,y:f.y,t:.8,m:.8,r:CFG.r*2.2,col:P.purple}); spark(f.x,f.y,P.white,28,500,.55,4);
      return;
    }
    releaseSnake(f,a.ang,s);
  };
  function releaseSnake(f,ang,s) {
    const st=ensure(f); if(!st.snake)return;
    st.snake.phase='crawl'; st.snake.t=0; st.snake.ang=ang; st.snake.hit=new Set(); f.inv=0; f.cd.b=cdOf(f,s);
    st.snake.sx=f.x;st.snake.sy=f.y;st.snake.tx=f.x+Math.cos(ang)*430;st.snake.ty=f.y+Math.sin(ang)*430;
    st.snake.amp=CFG.r*3; st.snake.T=.85;
    fx({k:'flash',t:.22,m:.22,col:P.purple,a:1});
  }
  function snakePoint(sn,p) {
    const ux=Math.cos(sn.ang),uy=Math.sin(sn.ang),nx=-uy,ny=ux;
    return {x:sn.sx+(sn.tx-sn.sx)*p+nx*Math.sin(p*Math.PI*4)*sn.amp,y:sn.sy+(sn.ty-sn.sy)*p+ny*Math.sin(p*Math.PI*4)*sn.amp};
  }

  /* 風魔手裡劍／黑色千鳥 */
  C.sk.c.fire = function (f,o,a,s) {
    const st=ensure(f),ang=a.ang;
    if (!st.curse) {
      st.projectiles.push({kind:'wind',x:f.x+Math.cos(ang)*(CFG.r+14),y:f.y+Math.sin(ang)*(CFG.r+14),vx:Math.cos(ang)*s.speed,vy:Math.sin(ang)*s.speed,ang,travel:0,maxDist:CFG.r*5,life:1.5,own:f,sk:s,col:P.blue,split:false});
      spark(f.x,f.y,P.blue,14,520,.3,3); return;
    }
    f.inv=Math.max(f.inv,.48); st.load=Math.min(10,st.load+1); st.chidori={target:null,t:0,tick:0,done:false};
    lunge(f,ang,{dist:CFG.r*3,dur:.42,sk:s,dmg:0,kb:0,reach:CFG.r*.7,through:true,onHit:target=>{if(!st.chidori.target)st.chidori.target=target;},done:()=>{if(st.chidori)st.chidori.finish=.16;}});
    fx({k:'flash',t:.16,m:.16,col:P.purple,a:1.2}); spark(f.x,f.y,P.black,20,700,.35,4);
  };
  function explodeWind(f,q) {
    if (q.split) return;
    q.split=true; 
    fx({k:'ring',x:q.x,y:q.y,t:.35,m:.35,r:90,col:P.blue}); 
    spark(q.x,q.y,P.white,18,600,.35,3);
    // 修正：精準四方向 (十字) 炸開
    for(let i=0;i<4;i++){
      const aa=q.ang+i*(Math.PI/2);
      ensure(f).projectiles.push({
        kind:'blade',x:q.x,y:q.y,
        vx:Math.cos(aa)*sSpeed(f,330),vy:Math.sin(aa)*sSpeed(f,330),
        life:.38,own:f,sk:q.sk,col:P.blue
      });
    }
  }
  function sSpeed(f,v){return v*(ensure(f).curse?1.05:1);}

  /* 麒麟 */
  const oldHoldStart=window.holdStart, oldHoldRelease=window.holdRelease;
  if (typeof oldHoldStart==='function' && !oldHoldStart._sasukeWrapped) {
    window.holdStart=function(f,k,aim){
      if(f&&f.c===C&&k==='d'){const st=ensure(f);if(st.kirin){return;} if(st.kirinCd.every(x=>x>0)){if(f===G.p)say('麒麟三段皆在冷卻',.7);return;} }
      return oldHoldStart(f,k,aim);
    }; window.holdStart._sasukeWrapped=true;
  }
  if (typeof oldHoldRelease==='function' && !oldHoldRelease._sasukeWrapped) {
    window.holdRelease=function(f,k,aim){
      if(!f||f.c!==C||k!=='d')return oldHoldRelease(f,k,aim);
      const h=f.hold;if(!h||h.k!=='d')return;
      const st=ensure(f),tier=h.t>=1.5?2:(h.t>=.5?1:0); f.hold=null;
      if(st.kirinCd[tier]>0){if(f===G.p)say('該段麒麟冷卻中',.7);return;}
      st.kirinPending=tier; cast(f,'d',aim||h.aim);
    }; window.holdRelease._sasukeWrapped=true;
  }
  C.sk.d.fire=function(f,o,a,s){
    const st=ensure(f),tier=st.kirinPending==null?0:st.kirinPending; st.kirinPending=null;
    if(st.curse) st.load=Math.min(10,st.load+1);
    const cd=[6,9,15][tier],dmg=[300,800,2200][tier],rad=[90,145,220][tier],hits=[1,4,8][tier];
    st.kirinCd[tier]=cd; f.cd.d=0;
    st.kirin={tier,t:0,next:.12,hits:0,max:hits,x:f.x+Math.cos(a.ang)*320,y:f.y+Math.sin(a.ang)*320,ang:a.ang,dmg,rad,sk:s};
    
    // 加入落雷柱特效
    st.bolts.push({ x: st.kirin.x, y: st.kirin.y, t:0, max:0.4, tier });
    
    fx({k:'ring',x:st.kirin.x,y:st.kirin.y,t:tier===2?.75:.4,m:tier===2?.75:.4,r:rad,col:P.purple});
    if(tier===2){shake(18);fx({k:'flash',t:.45,m:.45,col:P.white,a:1.4});pop(f,'麒麟・三段',P.purple)} else pop(f,'麒麟・'+(tier+1)+'段',P.blue);
  };

  /* 替身術 */
  C.sk.e.fire=function(f,o,a,s){
    const ox=f.x,oy=f.y; f.inv=Math.max(f.inv,.25); fx({k:'ring',x:ox,y:oy,t:.35,m:.35,r:CFG.r*1.7,col:P.white});spark(ox,oy,P.white,25,680,.4,4);
    f.x=CFG.r+Math.random()*(CFG.W-CFG.r*2);f.y=CFG.r+Math.random()*(CFG.H-CFG.r*2);f.kx=f.ky=0;f.inv=Math.max(f.inv,2);ensure(f).substitution=2;
    fx({k:'ring',x:f.x,y:f.y,t:.55,m:.55,r:CFG.r*2.2,col:P.purple});spark(f.x,f.y,P.purple,30,620,.5,4);pop(f,'替身術',P.white);
  };

  C.sk.x.fire=function(f){const st=ensure(f);f.mode.x=st.curse?0:1;modeSync(f);f.cd.x=.1;};

  const oldHit=window.hit;
  if(typeof oldHit==='function'&&!oldHit._sasukeWrapped){
    const w=function(t,d,fx_,fy_,kb,heavy,sk,att){
      const before=t&&t.hp;
      oldHit(t,d,fx_,fy_,kb,heavy,sk,att);
      if(t&&before>t.hp&&att&&att.c===C&&ensure(att).curse&&sk&&['b','c','d'].includes(sk.key)){
        const st=ensure(att),old=st.load;st.load=Math.max(0,st.load-2);
        if(old!==st.load)pop(att,'咒印命中 負荷 -2',P.green);
      }
    };
    w._sasukeWrapped=true;window.hit=w;
  }

  function updateProjectiles(f,dt) {
    const st=ensure(f),o=enemyOf(f);
    for(let i=st.projectiles.length-1;i>=0;i--){
      const q=st.projectiles[i]; q.life-=dt;
      
      // 手裡劍修復
      if(q.kind==='shuriken'){
        if(!q.stopped){
          q.x+=q.vx*dt; q.y+=q.vy*dt; q.travel+=Math.hypot(q.vx,q.vy)*dt;
          const hitTarget = alive(o) && Math.hypot(o.x-q.x, o.y-q.y) < 24 + CFG.r; // 改用固定 24
          const wall = q.x<CFG.r || q.x>CFG.W-CFG.r || q.y<CFG.r || q.y>CFG.H-CFG.r;
          if(hitTarget){
            q.stopped=true; q.vx=q.vy=0; q.stay=1; q.tick=0;
            hit(o, 80, q.x, q.y, 100, 0, q.sk, f);
            fx({k:'ring',x:q.x,y:q.y,t:.3,m:.3,r:50,col:P.purple});
            spark(q.x, q.y, P.purple, 15, 500, .3, 3);
          }
          else if(wall||q.travel>=q.maxDist)q.life=0;
        } else {q.stay-=dt;q.tick-=dt;if(q.tick<=0&&q.stay>0){q.tick=.2;if(alive(o)&&Math.hypot(o.x-q.x,o.y-q.y)<CFG.r*1.5){hit(o,35,q.x,q.y,0,0,q.sk,f); spark(q.x,q.y,P.purple,3,200,.2,2);}}}
      } 
      else if(q.kind==='fireball'||q.kind==='wind'||q.kind==='blade'){
        q.x+=q.vx*dt;q.y+=q.vy*dt;q.travel+=(Math.hypot(q.vx,q.vy)*dt);
        const wall=q.x<CFG.r||q.x>CFG.W-CFG.r||q.y<CFG.r||q.y>CFG.H-CFG.r;
        let hitRad = 24;
        if(q.kind==='fireball') hitRad = q.sk.r || 28;
        else if(q.kind==='wind') hitRad = q.sk.r || 22;
        
        const hitTarget=alive(o)&&Math.hypot(o.x-q.x,o.y-q.y)<hitRad+CFG.r;
        
        if(q.kind==='fireball'&&hitTarget){
          hit(o,q.sk.dmg,q.x,q.y,q.sk.kb,0,q.sk,f);
          addStatus(o,{k:'dot',dur:1.1,v:55});
          fx({k:'ring',x:q.x,y:q.y,t:.35,m:.35,r:70,col:P.fire});
          spark(q.x,q.y,P.fire,15,400,.3,3);
          q.life=0;
        }
        else if(q.kind==='wind'&&(hitTarget||wall||q.travel>=q.maxDist)){explodeWind(f,q);q.life=0;}
        else if(q.kind==='blade'&&hitTarget){hit(o,110,q.x,q.y,80,0,q.sk,f);q.life=0;}
        else if(q.kind==='fireball'&&(wall||q.travel>=q.maxDist))q.life=0;
        else if(q.kind==='blade'&&(wall||q.life<=0))q.life=0;
      }
      
      if(q.life<=0)st.projectiles.splice(i,1);
    }
  }
  function updateSnake(f,dt){
    const st=ensure(f),sn=st.snake;if(!sn)return;
    if(sn.phase==='guard'){sn.t+=dt;if(sn.t>=2)releaseSnake(f,sn.ang,C.sk.b);return;}
    sn.t+=dt;const p=Math.min(1,sn.t/sn.T),pt=snakePoint(sn,p),o=enemyOf(f);
    if(alive(o)&&Math.hypot(o.x-pt.x,o.y-pt.y)<CFG.r*1.15&&!sn.hit.has(o)){
      sn.hit.add(o);hit(o,200,pt.x,pt.y,0,0,C.sk.b,f);o.kx+=Math.cos(sn.ang)*520;o.ky+=Math.sin(sn.ang)*520;
    }
    if(p>=1){st.grounds.push({x:sn.tx,y:sn.ty,t:0,tick:0,life:2,rad:CFG.r*1.5,own:f});fx({k:'ring',x:sn.tx,y:sn.ty,t:.5,m:.5,r:CFG.r*1.5,col:P.purple});st.snake=null;}
  }
  function updateGrounds(f,dt){
    const st=ensure(f),o=enemyOf(f);
    for(let i=st.grounds.length-1;i>=0;i--){const z=st.grounds[i];z.t+=dt;z.tick-=dt;if(z.tick<=0){z.tick=.25;if(alive(o)&&Math.hypot(o.x-z.x,o.y-z.y)<z.rad+CFG.r)hit(o,70,z.x,z.y,0,0,C.sk.b,z.own);}if(z.t>=z.life)st.grounds.splice(i,1);}
  }
  function updateChidori(f,dt){
    const st=ensure(f),c=st.chidori;if(!c)return;
    c.t+=dt;const o=c.target;
    if(o&&alive(o)){o.x=clamp(f.x+Math.cos(f.face)*CFG.r*1.35,CFG.r,CFG.W-CFG.r);o.y=clamp(f.y+Math.sin(f.face)*CFG.r*1.35,CFG.r,CFG.H-CFG.r);c.tick-=dt;if(c.tick<=0){c.tick=.1;hit(o,80,f.x,f.y,0,0,C.sk.c,f);}}
    if(c.finish!==undefined){c.finish-=dt;if(c.finish<=0)st.chidori=null;}
  }
  function updateKirin(f,dt){
    const st=ensure(f);for(let i=0;i<3;i++)st.kirinCd[i]=Math.max(0,st.kirinCd[i]-dt);
    if(f.hold&&f.hold.k==='d'&&f.stun>0){const tier=f.hold.t>=1.5?2:(f.hold.t>=.5?1:0);f.hold=null;st.kirinCd[tier]=[6,9,15][tier];pop(f,'麒麟被打斷',P.red);}
    const k=st.kirin;if(!k)return;k.t+=dt;
    while(k.hits<k.max&&k.t>=k.next){k.next+=.1;k.hits++;const aa=k.x+(Math.random()-.5)*k.rad,bb=k.y+(Math.random()-.5)*k.rad;blast(f,aa,bb,k.tier===2?95:75,k.dmg/k.max,220,P.purple,0);fx({k:'ring',x:aa,y:bb,t:.25,m:.25,r:70,col:P.white});spark(aa,bb,P.purple,k.tier===2?16:8,800,.3,3);if(k.tier===2)shake(3);}
    if(k.hits>=k.max&&k.t>k.next+.15)st.kirin=null;
  }

  const oldCdOf=window.cdOf;
  if(typeof oldCdOf==='function'&&!oldCdOf._sasukeWrapped){const w=function(f,s){const base=oldCdOf(f,s);if(f&&f.c===C&&ensure(f).curse&&base>0)return base*(1+ensure(f).load*.05);return base;};w._sasukeWrapped=true;window.cdOf=w;}
  const oldMk=window.mk;
  if(typeof oldMk==='function'&&!oldMk._sasukeWrapped){const w=function(id,x,side,isAI){const f=oldMk(id,x,side,isAI);if(id==='sasuke')ensure(f);return f;};w._sasukeWrapped=true;window.mk=w;}
  
  const oldUpdate=window.update;
  if(typeof oldUpdate==='function'&&!oldUpdate._sasukeWrapped){
    const w=function(dt){
      oldUpdate(dt);if(G.state!=='fight')return;
      for(const f of [G.p,G.e]){
        if(!f||f.c!==C)continue;const st=ensure(f);
        modeSync(f);updateLoad(f,dt);
        if(st.substitution>0)st.substitution=Math.max(0,st.substitution-dt);
        updateProjectiles(f,dt);updateSnake(f,dt);updateGrounds(f,dt);updateChidori(f,dt);updateKirin(f,dt);
        if(st.comboT>0)st.comboT-=dt;
        // 更新雷柱時間
        if(st.bolts){for(let i=st.bolts.length-1;i>=0;i--){st.bolts[i].t+=dt;if(st.bolts[i].t>=st.bolts[i].max)st.bolts.splice(i,1);}}
      }
    };
    w._sasukeWrapped=true;window.update=w;
  }

  const oldDraw=window.draw;
  if(typeof oldDraw==='function'&&!oldDraw._sasukeWrapped){
    const w=function(){
      // 1. 動態更新技能按鈕名稱
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
        
        // 負荷條
        if(st.curse||st.load>0){
          cx.fillStyle='#080611cc';cx.fillRect(bx,by,bw,bh);
          cx.fillStyle=col;cx.fillRect(bx,by,bw*st.load/10,bh);
          cx.strokeStyle='#fff';cx.lineWidth=1.5;cx.strokeRect(bx,by,bw,bh);
          cx.fillStyle='#fff';cx.font='bold 12px system-ui';cx.textAlign='center';cx.fillText('咒印負荷 '+st.load+'/10',f.x,by-5);
          if(st.curse){cx.font='11px system-ui';cx.fillText('冷卻 +'+(st.load*5)+'%',f.x,by-19);}
        }
        
        // 咒印氣場
        if(st.curse){cx.globalCompositeOperation='lighter';cx.strokeStyle=P.purple;cx.globalAlpha=.45+.15*Math.sin(T*8);cx.lineWidth=3;cx.beginPath();cx.arc(f.x,f.y,CFG.r+10+Math.sin(T*6)*4,0,Math.PI*2);cx.stroke();cx.globalAlpha=1;}
        
        // 白蛇盤踞
        if(st.snake){
          cx.globalCompositeOperation='lighter';
          if(st.snake.phase==='guard'){
            cx.strokeStyle=P.white;cx.lineWidth=7;cx.beginPath();cx.arc(f.x,f.y,CFG.r+18+Math.sin(T*15)*5,0,Math.PI*2);cx.stroke();
            cx.strokeStyle=P.purple;cx.lineWidth=3;cx.setLineDash([12,14]);cx.lineDashOffset=-T*100;cx.beginPath();cx.arc(f.x,f.y,CFG.r+31,0,Math.PI*2);cx.stroke();cx.setLineDash([]);
          } else {
            // 白蛇實體爬行
            const p = Math.min(1, st.snake.t / st.snake.T);
            cx.strokeStyle='#fff';
            cx.lineWidth=10;
            cx.lineCap='round';
            cx.lineJoin='round';
            cx.shadowColor = P.purple;
            cx.shadowBlur = 20;
            cx.beginPath();
            for(let i=0; i<=p; i+=0.05){
              const pt = snakePoint(st.snake, i);
              if(i===0) cx.moveTo(pt.x, pt.y); else cx.lineTo(pt.x, pt.y);
            }
            cx.stroke();
            cx.shadowBlur = 0;
            if(Math.random() < 0.5) {
              const pt = snakePoint(st.snake, p);
              spark(pt.x, pt.y, P.purple, 2, 300, .2, 2);
            }
          }
        }
        
        // 千鳥黑雷
        if(st.chidori){
          cx.globalCompositeOperation='lighter';
          for(let j=0;j<8;j++){
            const aa=T*30+j*Math.PI/4;
            cx.strokeStyle=j%2?P.black:P.purple;
            cx.lineWidth=j%2?4:2;
            cx.beginPath();
            cx.moveTo(f.x,f.y);
            cx.lineTo(f.x+Math.cos(aa)*80+(Math.random()-.5)*20, f.y+Math.sin(aa)*80+(Math.random()-.5)*20);
            cx.stroke();
          }
        }
        
        // 雷電地面
        for(const z of st.grounds){
          cx.globalCompositeOperation='lighter';cx.globalAlpha=.55+.2*Math.sin(T*12);
          cx.fillStyle=P.purple;cx.beginPath();cx.arc(z.x,z.y,z.rad,0,Math.PI*2);cx.fill();cx.globalAlpha=1;
          for(let j=0;j<5;j++){const aa=T*5+j*1.3;cx.strokeStyle=j%2?P.white:P.purple;cx.beginPath();cx.moveTo(z.x+Math.cos(aa)*20,z.y+Math.sin(aa)*20);cx.lineTo(z.x+Math.cos(aa+.4)*z.rad,z.y+Math.sin(aa+.4)*z.rad);cx.stroke();}
        }
        
        // 麒麟雷柱
        if(st.bolts){
          cx.globalCompositeOperation='lighter';
          for(const b of st.bolts){
            const k=1-(b.t/b.max);
            const layers=b.tier===2?3:1;
            for(let l=0;l<layers;l++){
              cx.strokeStyle=l===0?'#fff':l===1?P.purple:'#e0f';
              cx.lineWidth=l===0?4:12;
              cx.globalAlpha=k*(l===0?1:0.5);
              cx.beginPath();
              let px=b.x+(Math.random()-.5)*40, py=b.y;
              cx.moveTo(px,py);
              for(let j=0;j<15;j++){px+=(Math.random()-.5)*30;py-=60;cx.lineTo(px,py);}
              cx.stroke();
            }
          }
        }
        
        // 投射物
        for(const q of st.projectiles){
          cx.save();cx.translate(q.x,q.y);cx.rotate(q.ang||Math.atan2(q.vy||0,q.vx||1));cx.globalCompositeOperation='lighter';
          if(q.kind==='fireball'){
             const g=cx.createRadialGradient(0,0,0,0,0,45);
             g.addColorStop(0,'#fff');g.addColorStop(.25,'#ffd36b');g.addColorStop(.7,P.fire);g.addColorStop(1,'#ff250000');
             cx.fillStyle=g;cx.beginPath();cx.arc(0,0,45+Math.sin(T*24)*5,0,Math.PI*2);cx.fill();
             if(Math.random()<0.8) fx({k:'dt',x:q.x,y:q.y,vx:-q.vx*.1,vy:-q.vy*.1,t:.4,m:.4,col:P.fire,r:6,dr:3});
          } else {
             cx.rotate(T * 25);
             const isWind = q.kind==='wind';
             const isShuriken = q.kind==='shuriken';
             cx.fillStyle = isWind ? P.blue : isShuriken ? P.dark : P.blue;
             cx.shadowColor = cx.fillStyle;
             cx.shadowBlur = 20;
             cx.beginPath();
             const r = isWind? 30 : isShuriken ? 16 : 24;
             for(let j=0;j<4;j++){
               cx.rotate(Math.PI/2);
               cx.moveTo(0,0);
               cx.lineTo(-6, r);
               cx.lineTo(6, r);
               cx.closePath();
             }
             cx.fill();
          }
          cx.restore();
        }
      }
      cx.restore();
    };
    w._sasukeWrapped=true;window.draw=w;
  }
  console.log('[char_sasuke] 宇智波佐助完整模組已載入 (特效強化版)');
})();
