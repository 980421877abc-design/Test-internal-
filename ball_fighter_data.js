/* ═══════════════════════════════════════════════════════════════
 * ball_fighter_data.js —— 所有「數值 / 內容」都在這個檔案，戰鬥邏輯在 ball_fighter.html
 * 換作品：只改這個檔（角色、技能、資源名稱、全域平衡）；需要新機制才去動 html 裡的 ST（技能類型註冊表）。
 * 兩個檔案要放同一個資料夾。
 * ═══════════════════════════════════════════════════════════════ */
'use strict';
/* ═══ 1. 全域平衡參數（單位：秒 / 像素 / 倍率） ═══ */
const CFG={
 W:1600,H:900,          // 場地大小
 viewH:850,             // 鏡頭可視高度（設定選單可調）
 r:48,                  // 球體半徑（碰撞 / 命中判定）
 time:180,overtime:10,  // 每回合秒數 / 延長賽秒數
 winRounds:1,           // 先贏幾回合
 res:{name:'能量',max:100,regen:7,color:'#b48cff',dashCost:0,blockDrain:5}, // 預設資源。角色的 res 只需寫要覆蓋的欄位：
                        //   name 顯示名稱（咒力 / 靈力 / 氣…，各作品自訂）· max 上限 · regen 每秒回復 · color 條顏色
                        //   dashCost 閃避消耗 · blockDrain 格擋每秒消耗（上限很小的資源，例如 5 格氣，要把這兩個一起改小）
 dash:{cd:1.3,dist:320,dur:.16,inv:.16},                                   // 閃避：冷卻 / 距離 / 持續 / 無敵時間
 block:{cut:.65,speed:.45,hitCost:.012,breakStun:.8,heavyMul:.7,kbMul:.3}, // 格擋：減傷 / 移速倍率 / 被打耗能係數 / 被破防硬直 / 破防時承傷倍率 / 擊退倍率
 clash:{dmgScale:.03,maxTime:8}, // 領域碰撞：受到的傷害 × 0.03 = 自身領域完整度減少的百分點（100 傷害 = -3%）；maxTime 秒內分不出勝負 → 完整度較高者勝（同分看優先級）（待定）
 maxOrbs:2,             // 場上同時存在的引力球上限（蒼）
 hitStun:.14,kbDecay:8, // 受擊硬直 / 擊退衰減
 ai:{think:.1,dodge:.85,aggr:.9}};  // 電腦：思考間隔 / 閃避機率 / 出招積極度
/* 技能欄位速查：cost 消耗 · cd 冷卻秒 · wind 前搖秒 · dmg 傷害 · kb 擊退 · range 射程 · arc 揮砍弧度 · speed 飛行速度 · r 飛行物半徑 · life 飛行秒數
 * rad 範圍技半徑 · delay 範圍技延遲 · turn 追蹤轉向 · heavy 破防 · ult 大招外觀 · col 光效顏色 */
/* ═══ 2. 角色資料：新增角色只要在這加一筆 ═══
 * 技能槽數量不限：sk 裡有幾個技能就生成幾顆按鈕。鍵名自取。每個角色可自訂資源 res:{name,max,regen,color}（咒力 / 靈力 / 氣…）。
 * 第一個技能 = 普攻（滑鼠左鍵 / 左下第一顆）；依序對應按鍵 J K L I U H N M。
 * ult:1 = 大招外觀（橘框）。內建 type：melee / proj / zone / homing；新類型請加進 ST，或在技能裡直接給 fire() 函式；
 * 命中效果：apply:[{k:'slow',dur:2,v:.5}]、onHit(target,skill) 函式。
 * 蓄力型：hold:{start,full} + full:{覆蓋欄位}（點=小版，按住>start 原地蓄力，>full 放開=強化版）；leaveOrb 命中留下引力球；aka:{rad,dmg,kb} 此投射物碰到己方引力球時引爆
 * 開關型：type:'toggle' + toggleHeal:{rate,drain,boost}（點=開關，長按=加速）；tag:f=>字串 顯示在按鈕上
 * 多模式：modes:[名稱...]、modeCost:[各模式消耗]、fullMode:需蓄力滿的模式索引；fire(f,o,act,s) 內用 act.mode 判斷
 * 按鈕位置：技能加 side:'L' = 放在左側搖桿正上方；modesSide:'L' = 該技能的模式切換鈕也放左側
 * 特效：投射物技能加 fx:'ao'|'aka'|'mu' 可套用專屬光效（拖尾、旋繞、閃光）
 * 領域：type:'domain' + domain:{r,life,burnout,name,col,style:'void'|'shrine',bind:1 範圍內敵人無法行動,tick:{dt,dmg} 範圍內持續傷害}；lockMove:1 施放時不能移動
 * 角色層：domDef:{name,drain,lock} 敵方領域內防禦鍵改為領域防禦（免疫領域效果；drain 每秒耗資源；lock:1 發動時不能移動/用技能）；clash:{priority,decay} 領域優先級 / 碰撞時每秒削減敵方領域完整度（比例）
 * 範圍預示：近戰技能加 showRange:1 → 前搖時畫出扇形範圍（fire 內可再推 {k:'fan'} 特效讓扇形在連擊期間保留）
 * AI：aiDist 偏好距離 · 技能 aiGap 電腦兩次使用的最短間隔 · aiBurst:[連發次數,休息秒數]
 * 技能層：lockAim:1 開始蓄力後瞄準方向鎖定（放開時也不會改向）· noExt:1 領域展延時禁用 · needFull:1 必須蓄滿才能放 · autoAim:1 蓄力時自動瞄準 · autoRelease:1 蓄滿自動發射 · burnOk:1 熔斷中仍可按 · repair:{rate,drain} 熔斷中長按修復（rate=每秒額外縮短的熔斷秒數）
 * type:'channel'：按住期間每 interval 秒發一次斬擊（每次耗 cost）；type:'toggle'+flag:'ext' = 領域展延（drain 每秒耗資源，攻擊無視減傷）
 * 角色層：costMult 消耗倍率（六眼）、infinity:{dmg,drain,hitCost} 長按防禦=無下限、bf:{chance,window,ready,mult,heal} 黑閃（普攻技能標 bf:1） */
const CHARS={
 /* 五條悟（依設計稿；標「待定」的數值是我先填的預設值，之後直接改這裡） */
 gojo:{name:'五條悟',work:'咒術迴戰',color:'#8fd6ff',glyph:'悟',img:'img/gojo.png',res:{name:'咒力',max:1000,regen:30,color:'#b48cff',dashCost:0,blockDrain:30},hp:6000,speed:610,aiDist:320,
  domDef:{name:'簡易領域',drain:80,lock:0},             // 敵方領域內，防禦鍵 = 簡易領域：每秒耗 100 咒力（待定）換取免疫領域效果，可自由移動
  costMult:.5,                                          // 被動·六眼：技能消耗 ×0.5（待定：不套用持續消耗）
  infinity:{dmg:2,drain:60,hitCost:.15},                // 被動·無下限：長按防禦鍵，受傷固定 2；耗 10/秒；被打額外耗 傷害×3%（待定）
  bf:{chance:.3,window:1.2,ready:5,mult:2.5,heal:200,kbMul:2},  // 黑閃（待定）：普攻命中 30% 觸發，1.2 秒內按閃避鍵→5 秒內下一擊 ×2.5 並回 200 血
  sk:{
   a:{name:'蒼拳',type:'melee',cost:0,cd:.5,wind:.1,dmg:100,range:130,arc:1.2,kb:220,bf:1},
   b:{name:'蒼',type:'proj',ai:(e,p,c)=>{const q=e.c.sk.b;return c.d<q.speed*q.life*.8&&!G.orbs.some(o=>o.own===e)?c.lead(c.d/q.speed):null},hold:{start:.2,full:1.1},cost:60,cd:1.6,wind:.08,dmg:220,speed:650,r:18,life:1.4,kb:150,col:'#4aa8ff',fx:'ao',
      leaveOrb:{life:3,range:240,pull:2400,r:34},
      full:{dmg:520,speed:520,r:40,kb:300,leaveOrb:{life:4,range:320,pull:3200,r:60}}},
   c:{name:'赫',type:'proj',ai:(e,p,c)=>{const q=e.c.sk.c,ob=G.orbs.find(o=>o.own===e),R=q.speed*q.life;   // 電腦：場上有蒼 → 把赫打向蒼（引爆茈 A）；否則直接預判
        if(ob&&Math.hypot(ob.x-e.x,ob.y-e.y)<R*.8&&Math.hypot(p.x-ob.x,p.y-ob.y)<240)return{x:ob.x,y:ob.y};return !ob&&c.d<R*.8?c.lead(c.d/q.speed):null},hold:{start:.2,full:1.3},cost:90,cd:2.2,wind:.08,dmg:330,speed:700,r:18,life:1.4,kb:450,col:'#ff4a5a',fx:'aka',
      aka:{rad:230,dmg:1400,kb:800},                    // 茈 A（蒼赫組合）：赫碰到場上的蒼 → 在蒼的位置引爆
      full:{dmg:800,speed:560,r:40,kb:700}},
   d:{name:'茈',modesSide:'L',modes:['詠唱','無限制'],modeCost:[240,300],fullMode:0,hold:{start:.2,full:1.5},cost:240,cd:8,wind:.15,
      fire(f,o,a,s){if(a.mode===0)ST.proj.fire(f,{speed:800,r:55,life:1.4,dmg:1500,kb:900,heavy:1,col:'#b04aff',fx:'mu',type:'proj'},a,o); // 詠唱茈：需蓄力滿
                    else blast(f,f.x,f.y,260,1100,700,'#b04aff',.25)},                                                          // 無限制茈：以自身為中心，敵我皆傷（自傷 25%）
      pv:(f,full)=>f.mode.d===1?{k:'circle',r:260}:{k:'line',len:1120,w:110},   // 預示：無限制＝自身圓；詠唱＝直線（滿蓄力時變亮）
      ai:(e,p,c)=>{e.mode.d=c.d<260?1:0;return c.d<700?p:null}},
   e:{name:'反轉術式',side:'L',type:'toggle',burnOk:1,repair:{rate:2,drain:80},hold:{start:.4,full:99},cost:0,cd:0,wind:.05,toggleHeal:{rate:150,drain:50,boost:3},tag:f=>f.rct?'● 開啟':'○ 關閉',
      ai:(e,p,c)=>(e.rct?(e.hp>e.c.hp*.95||e.en<80):(e.hp<e.c.hp*.65&&e.en>300))?p:null},
   f:{name:'無量空處',ult:1,type:'domain',cost:600,cd:20,wind:1.0,lockMove:1,domain:{r:430,life:5,burnout:6,bind:1,name:'無量空處',col:'#c9a3ff',style:'void'},   // 領域 5 秒；結束後術式熔斷 6 秒（待定）
      ai:(e,p,c)=>(inEnemyDom(e)?Math.random()<.5:c.d<500&&!c.p.blocking)?p:null}}},
 /* 兩面宿儺（依設計稿；標「待定」的數值是我先填的預設值，之後直接改這裡） */
 sukuna:{name:'兩面宿儺',work:'咒術迴戰',color:'#d4453a',glyph:'宿',img:'img/sukuna.png',res:{name:'咒力',max:2000,regen:60,color:'#b48cff',dashCost:0,blockDrain:60},hp:8000,speed:570,
  domDef:{name:'彌虛葛籠',drain:0,lock:1},                // 敵方領域內，防禦鍵 = 彌虛葛籠：不耗咒力，但不能移動 / 用技能；免疫領域效果
  clash:{priority:2,decay:.05},
  aiDist:115,                                            // 電腦偏好的戰鬥距離（近戰型）；沒寫 = 280
                          // 領域優先級較高；領域碰撞時，敵方領域完整度每秒 -5%
  bf:{chance:.3,window:1.2,ready:5,mult:2.5,heal:200,kbMul:2},   // 黑閃（咒術角色共通，數值待定）
  sk:{
   a:{name:'連打',type:'melee',cost:0,cd:.22,wind:.05,dmg:65,range:120,arc:1.3,kb:90,bf:1},
   x:{name:'領域展延',side:'L',type:'toggle',flag:'ext',cost:0,cd:0,wind:.05,drain:100,tag:f=>f.ext?'● 展延中':'○ 關閉',   // 開啟：攻擊無視任何減傷（含無下限）；持續耗咒力（待定）；期間不能用 解 / 捌 / 領域展開
      ai:(e,p,c)=>(e.ext?(c.d>520||e.en<200):(c.d<300&&e.en>600&&(p.blocking||p.c.infinity)))?p:null},
   e:{name:'反轉術式',side:'L',type:'toggle',hold:{start:.4,full:99},cost:0,cd:0,wind:.05,toggleHeal:{rate:200,drain:50,boost:3},tag:f=>f.rct?'● 開啟':'○ 關閉',   // 治療量 / 消耗 / 施放方式未定 → 先沿用五條的「點=開關、長按=加速」
      ai:(e,p,c)=>(e.rct?(e.hp>e.c.hp*.95||e.en<150):(e.hp<e.c.hp*.65&&e.en>500))?p:null},
   b:{name:'解',type:'channel',noExt:1,hold:{start:.05,full:99},interval:.3,cost:30,cd:0,wind:.05,dmg:120,speed:1500,r:40,life:99,kb:110,col:'#ff5a4a',fx:'slash',noMuzzle:1,aiGap:.3,aiBurst:[5,1.4],   // 劍氣：按住每 0.3 秒一道、持續耗咒力；射程無上限（飛出場外才消失）；拖曳決定方向；領域內自動瞄準
      pv:()=>({k:'line',len:3000,w:80})},
   c:{name:'捌',noExt:1,type:'melee',showRange:1,cost:100,cd:7,wind:.25,dmg:110,range:330,arc:2,kb:120,kbEnd:700,hits:8,gap:.06,       // 前方扇形 8 段米字斬；領域內必中（碰撞期間失效）
      fire(f,o,a,s){const x0=f.x,y0=f.y,T=s.hits*s.gap+.2;G.fx.push({k:'fan',x:x0,y:y0,a:a.ang,w:s.arc,r:s.range+CFG.r,t:T,m:T,col:'#ff5a4a'});if(sureHit(f))pop(f,'必中','#ffd77a');   // 畫出攻擊範圍（扇形）
       for(let i=0;i<s.hits;i++)later(i*s.gap,()=>{if(G.state!=='fight')return;
        const dd=Math.hypot(o.x-x0,o.y-y0);let da=Math.abs(Math.atan2(o.y-y0,o.x-x0)-a.ang);da=Math.min(da,Math.PI*2-da);
        const inn=sureHit(f)||(dd<=s.range+CFG.r&&da<=s.arc/2),an=a.ang+(i%4)*Math.PI/4,px=inn?o.x:x0+Math.cos(a.ang)*s.range*.55,py=inn?o.y:y0+Math.sin(a.ang)*s.range*.55;
        G.fx.push({k:'sl',x:px,y:py,a:an,L:s.range*.9,t:.22,m:.22,col:'#ff5a4a'});
        if(inn)hit(o,s.dmg,x0,y0,i===s.hits-1?s.kbEnd:s.kb,0,s,f)})}},
   d:{name:'開',type:'proj',hold:{start:.2,full:3},needFull:1,autoAim:1,autoRelease:1,cost:150,cd:8,wind:.15,dmg:1200,speed:950,r:30,life:1.6,kb:350,col:'#ff7a2a',fx:'fire',   // 蓄力 3 秒自動發射火焰箭；蓄力期間自動瞄準；命中附帶灼燒
      apply:[{k:'dot',dur:4,v:60}],ai:(e,p,c)=>c.d<850?p:null},
   f:{name:'領域展開',ult:1,noExt:1,type:'domain',cost:800,cd:20,wind:1.5,lockMove:1,
      domain:{r:430,life:6,burnout:7,name:'伏魔御廚子',col:'#e8453a',style:'shrine',tick:{dt:.05,dmg:15}},   // 範圍內持續傷害（每 0.05 秒 15 = 每秒 300，待定）
      ai:(e,p,c)=>(inEnemyDom(e)?Math.random()<.5:c.d<420)?p:null}}}};
/* ═══ 3. 資源檔案路徑（圖片 / 音效） ═══ */
const ASSET_BASE='assets/';
const SFX={hit:'sfx/hit.mp3',block:'sfx/block.mp3',dash:'sfx/dash.mp3',win:'sfx/win.mp3',lose:'sfx/lose.mp3'};
const BGM='bgm/battle.mp3';
CFG.audio={master:.8,sfx:.9,bgm:.45,muted:false};
