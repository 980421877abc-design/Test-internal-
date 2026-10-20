/* ════════════════════════════════════════════════════════════════
 *  ui_select.js — 選角 / 角色詳情介面（外掛）
 *  接管主程式的 pick()，不需要改 ball_fighter.html 的任何邏輯。
 *
 *  流程：① 選我方 → ② 選敵方 → 開戰。任何時候都能按「查看詳情」看技能、機制、屬性。
 *  角色的介紹文字寫在 ui_info.js（CHAR_INFO）；沒寫的欄位會用 ball_fighter_data.js 的數值自動產生。
 *
 *  介面以 1280×720 的固定版面設計，再整體縮放填滿畫面（直立手機會跟著主程式一起旋轉）。
 *
 *  ┌─ 這個檔案的區塊地圖（要改圖鑑，照這張找）──────────────────────────────┐
 *  │ 【A 設定區】STAT_ROWS     「人物屬性」頁要顯示哪幾列      ← 想增減屬性列改這裡  │
 *  │ 【B 樣式】   style.textContent  所有顏色 / 字級 / 位置 / 大小（CSS）       │
 *  │ 【C 文字轉換】autoSections    沒寫介紹時，技能頁自動產生的說明             │
 *  │ 【D 選角畫面】render()         左邊立繪 + 右邊頭像格 + 底部按鈕            │
 *  │ 【E 詳情畫面】renderDet()      「角色技能」三個分頁（技能效果/機制/屬性）  │
 *  │ 【F 操作】   click 事件         按鈕點擊後做什麼                           │
 *  │ 介紹「文字」不在這個檔案 → js_fighter/ui_info.js                          │
 *  └────────────────────────────────────────────────────────────────────────┘
 * ════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  if (window.__bfSelectUI) return;
  window.__bfSelectUI = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TYPE_ZH = { melee: '近戰', proj: '直線投射物', zone: '範圍技', homing: '追蹤投射物', toggle: '開關型', domain: '領域', channel: '持續施放', throw: '投擲', timestop: '時停' };
  const MECH_ZH = { infinity: '無下限', costMult: '消耗倍率', bf: '黑閃', domDef: '領域防禦', clash: '對撞', rage: '怒氣', stand: '替身' };
  const ids = () => Object.keys(CHARS);
  const info = id => (window.CHAR_INFO && CHAR_INFO[id]) || {};

  /* ═══════════════ 【A 設定區】「人物屬性」頁要顯示哪幾列 ═══════════════
   * 每一列：label = 顯示名稱（字串，或 c => 字串）；value = 取數值的函式 c => 數字；unit = 數字後面的單位（可省略）。
   * 長條的長短 = 這個角色的值 ÷ 所有角色裡最大的值（所以是角色之間的相對比較）。
   * 想增加一列：複製一行改 label / value 即可。想拿掉：整行刪掉。
   * resOf(c) = 這個角色的資源設定（name 名稱、max 上限、regen 每秒回復…；角色沒寫的欄位用預設值）。 */
  const STAT_ROWS = [
    { label: '生命',                     value: c => c.hp },
    { label: '移動速度',                 value: c => c.speed },
    { label: c => resOf(c).name + '上限',     value: c => resOf(c).max },
    { label: c => resOf(c).name + '回復速度', value: c => resOf(c).regen, unit: ' / 秒' },
  ];

  /* ═══════════════ 【B 樣式】所有外觀都在這段 CSS ═══════════════ */
  const style = document.createElement('style');
  style.textContent = `
.bfsel{position:absolute;inset:0;z-index:30;background:#040813;overflow:hidden;display:none;font-family:system-ui,"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;color:#e8f3ff;user-select:none;-webkit-user-select:none}
.bfs{position:absolute;left:0;top:0;width:1280px;height:720px;transform-origin:0 0;overflow:hidden;
 background:radial-gradient(900px 520px at 18% 22%,#173a7a 0,transparent 62%),radial-gradient(700px 520px at 92% 85%,#3b1233 0,transparent 58%),linear-gradient(135deg,#071127,#0a1a3a 55%,#10122c)}
.bfs button,.bfs [data-act]{cursor:pointer}
.bfs .crumb{position:absolute;left:40px;top:26px;font-size:22px;opacity:.8;letter-spacing:1px}
.bfs .crumb b{color:#6fd3ff;font-weight:600}
.bfs .title{position:absolute;left:40px;top:52px;font-size:62px;font-weight:900;letter-spacing:6px;text-shadow:3px 3px 0 #5b4bd6,0 0 26px #4aa8ff99}
.bfs .who{position:absolute;right:40px;top:44px;font-size:22px;opacity:.85;text-align:right;line-height:1.5}
.bfs .who b{color:var(--c,#6fd3ff)}
.pbox{position:absolute;left:40px;top:150px;width:560px;height:450px;border:3px solid var(--c,#4aa8ff);background:#0a1530;overflow:hidden;
 clip-path:polygon(26px 0,100% 0,100% calc(100% - 26px),calc(100% - 26px) 100%,0 100%,0 26px);box-shadow:0 0 30px #0008}
.pfall{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 38%,color-mix(in srgb,var(--c) 55%,#0a1530) 0,#0a1530 72%)}
.pfall b{font-size:300px;font-weight:900;color:#fff;opacity:.22}
.pimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 20%}
.pshade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,#030812e8 100%)}
.pname{position:absolute;left:30px;bottom:62px;font-size:58px;font-weight:900;text-shadow:3px 3px 0 #0a1a4a,0 0 20px #000}
.pquote{position:absolute;left:32px;bottom:24px;right:20px;font-size:21px;opacity:.95;text-shadow:0 1px 6px #000}
.rbox{position:absolute;left:630px;top:140px;width:610px;height:470px;border:2px solid #2c5a96;border-radius:14px;background:rgba(6,16,36,.84)}
.rtop{position:absolute;left:16px;right:16px;top:14px;display:flex;gap:14px}
.btn{flex:1;height:54px;border:2px solid #2f6fb0;border-radius:12px;background:#0d2447;color:#e8f3ff;font-size:23px;font-weight:800;letter-spacing:1px}
.btn.dim{opacity:.45}
.grid{position:absolute;left:16px;right:12px;top:86px;bottom:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;overflow-y:auto;align-content:start;padding-right:4px}
.card{position:relative;height:166px;border:2px solid #1d3f6c;border-radius:8px;background:rgba(8,20,44,.9);display:flex;flex-direction:column;align-items:center;padding-top:10px}
.card .av{position:relative;width:96px;height:96px;border-radius:50%;border:3px solid var(--c);overflow:hidden;background:radial-gradient(circle,color-mix(in srgb,var(--c) 50%,#0a1530),#0a1530)}
.card .av b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:46px;color:#fff;opacity:.85}
.card .av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.card .nm{margin-top:8px;font-size:20px;font-weight:700;text-align:center;line-height:1.2}
.card.on{border-color:#6fd3ff;box-shadow:0 0 14px #4aa8ff88}
.card.on::after{content:"✓";position:absolute;right:8px;top:4px;color:#6fd3ff;font-size:22px;font-weight:900}
.card.on .nm{background:#6fd3ff;color:#05121f;width:100%;margin-top:6px;padding:4px 0;font-weight:900}
.steps{position:absolute;left:40px;top:648px;display:flex;gap:40px;font-size:26px;opacity:.9}
.steps span{opacity:.5}.steps span.on{opacity:1;color:#6fd3ff;font-weight:900}
.bbar{position:absolute;right:40px;top:632px;display:flex;gap:16px}
.bbtn{min-width:150px;height:62px;padding:0 22px;border:2px solid #2f6fb0;border-radius:12px;background:#0d2447;color:#e8f3ff;font-size:25px;font-weight:900}
.bbtn.main{background:#6fd3ff;color:#06121f;border-color:#bfeaff;min-width:230px}
.det{position:absolute;inset:0;background:#06101f;display:none;z-index:2}
.det .dh1{position:absolute;left:44px;top:28px;font-size:46px;font-weight:900}
.det .x{position:absolute;right:44px;top:26px;width:68px;height:68px;border:2px solid #2f6fb0;border-radius:14px;background:#0d2447;color:#fff;font-size:34px;font-weight:900}
.dcard{position:absolute;left:44px;top:112px;width:290px;height:570px;border:2px solid #2c5a96;border-radius:10px;background:#0b1f40;overflow:hidden}
.dcard .dp{position:relative;height:400px;background:#0a1530;overflow:hidden}
.dcard .dn{padding:14px 18px 0;font-size:38px;font-weight:900}
.dcard .dt{padding:8px 18px;font-size:21px;color:#6fd3ff;font-weight:700;line-height:1.35}
.tabs{position:absolute;left:372px;top:112px;display:flex;gap:14px}
.tab{height:62px;padding:0 34px;border:2px solid #2f6fb0;border-radius:12px;background:#0a1d3d;color:#e8f3ff;font-size:26px;font-weight:900}
.tab.on{background:#6fd3ff;color:#04101e;border-color:#bfeaff}
.chips{position:absolute;left:372px;top:190px;right:44px;display:flex;gap:12px;flex-wrap:wrap}
.chip{height:54px;padding:0 24px;display:flex;align-items:center;border:2px solid var(--c,#2f6fb0);border-radius:10px;background:#0a1d3d;color:#e8f3ff;font-size:24px;font-weight:800}
.chip.on{background:#6fd3ff;color:#04101e;border-color:#bfeaff}
.dbody{position:absolute;left:372px;top:262px;right:44px;bottom:112px;border:2px solid #2c5a96;border-radius:12px;background:#050e20;padding:22px 30px;overflow-y:auto}
.dbody.tall{top:200px}
.dtitle{font-size:42px;font-weight:900;color:#6fd3ff;margin-bottom:6px}
.dsec{font-size:23px;color:#4fc3f7;margin-top:16px;font-weight:700}
.dd{font-size:25px;line-height:1.6;margin-top:4px}
.dd.mini{font-size:20px;opacity:.75}
.srow{display:flex;align-items:center;gap:16px;margin:14px 0;font-size:24px}
.srow .k{width:236px;font-weight:800;white-space:nowrap}.srow .v{width:130px;text-align:right;color:#6fd3ff;font-weight:900}
.srow .bar{flex:1;height:16px;background:#0f2a52;border-radius:8px;overflow:hidden}.srow .bar i{display:block;height:100%;background:linear-gradient(90deg,#3a8dff,#6fd3ff)}
.dback{position:absolute;right:44px;bottom:32px;min-width:250px}
`;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.className = 'bfsel';
  root.innerHTML = '<div class="bfs"></div>';
  $('stage').appendChild(root);
  const S = root.firstChild;

  function fit() {
    const st = $('stage'), w = st.clientWidth, h = st.clientHeight, k = Math.min(w / 1280, h / 720);
    S.style.transform = `translate(${(w - 1280 * k) / 2}px,${(h - 720 * k) / 2}px) scale(${k})`;
  }
  new ResizeObserver(fit).observe($('stage'));

  /* ───────────── 狀態 ───────────── */
  const st = { step: 1, me: null, foe: null, det: false, tab: 'skill', skill: null };
  const cur = () => (st.step === 1 ? st.me : st.foe);
  const hasMatch = () => typeof G !== 'undefined' && G && G.p && G.state === 'fight';

  /* ═══════════════ 【C 文字轉換】沒寫介紹時自動產生說明 ═══════════════ */
  const avatar = c => `<div class="pfall" style="--c:${c.color}"><b>${esc(c.glyph || c.name[0])}</b></div>` +
    (c.img ? `<img class="pimg" src="${esc(ASSET_BASE + c.img)}" onerror="this.remove()">` : '');

  function autoSections(s) {
    const nums = [];
    if (s.cost != null) nums.push('消耗 ' + s.cost);
    if (s.cd != null) nums.push('冷卻 ' + s.cd + ' 秒');
    if (s.wind) nums.push('前搖 ' + s.wind + ' 秒');
    if (s.dmg) nums.push('傷害 ' + s.dmg);
    if (s.range) nums.push('距離 ' + s.range);
    else if (s.speed && s.life) nums.push('射程 約 ' + Math.round(s.speed * s.life));
    if (s.rad) nums.push('範圍半徑 ' + s.rad);
    const L = [['類型', TYPE_ZH[s.type] || '特殊技能'], ['數值', nums.join('　·　')]];
    if (s.hold) L.push(['蓄力', '按住可蓄力，蓄滿後放開會發射強化版本。']);
    if (s.modes) L.push(['模式', s.modes.join(' / ')]);
    return L;
  }
  function statRows(id) {
    const c = CHARS[id], all = ids().map(i => CHARS[i]);
    return STAT_ROWS.map(r => {
      const v = r.value(c), mx = Math.max(1, ...all.map(x => r.value(x)));
      const label = typeof r.label === 'function' ? r.label(c) : r.label;
      return `<div class="srow"><span class="k">${esc(label)}</span><div class="bar"><i style="width:${Math.max(4, Math.min(100, v / mx * 100))}%"></i></div><span class="v">${esc(v)}${esc(r.unit || '')}</span></div>`;
    }).join('');
  }

  /* ═══════════════ 【D 選角畫面】左立繪 + 右頭像格 ═══════════════ */
  function render() {
    const id = cur(), c = CHARS[id], I = info(id);
    const gs = S.querySelector('.grid');
    const keep = gs ? gs.scrollTop : 0;
    const title = st.step === 1 ? '選擇我方角色' : '選擇敵方角色';
    const cards = ids().map(k => {
      const x = CHARS[k];
      return `<div class="card ${k === id ? 'on' : ''}" data-act="pick" data-v="${k}" style="--c:${x.color}">
        <div class="av"><b>${esc(x.glyph || x.name[0])}</b>${x.img ? `<img src="${esc(ASSET_BASE + x.img)}" onerror="this.remove()">` : ''}</div>
        <div class="nm">${esc(x.name)}</div></div>`;
    }).join('');
    const back = st.step === 2 || hasMatch();
    S.innerHTML = `
      <div class="crumb">BALL FIGHTER <b>/</b> 角色選擇</div>
      <div class="title">${title}</div>
      ${st.step === 2 ? `<div class="who">我方：<b>${esc(CHARS[st.me].name)}</b></div>` : ''}
      <div class="pbox" style="--c:${c.color}">${avatar(c)}<div class="pshade"></div>
        <div class="pname">${esc(c.name)}</div><div class="pquote">${esc(I.quote || c.work || '')}</div></div>
      <div class="rbox">
        <div class="rtop"><button class="btn dim" disabled>${esc(c.work || '角色')}</button><button class="btn" data-act="detail">查看詳情 ↗</button></div>
        <div class="grid">${cards}</div></div>
      <div class="steps"><span class="${st.step === 1 ? 'on' : ''}">① 選擇我方</span><span class="${st.step === 2 ? 'on' : ''}">② 選擇敵方</span></div>
      <div class="bbar">${back ? '<button class="bbtn" data-act="back">← 返回</button>' : ''}
        <button class="bbtn" data-act="rand">隨機選擇</button>
        <button class="bbtn main" data-act="ok">${st.step === 1 ? '確認選擇 →' : '開始戰鬥 →'}</button></div>
      <div class="det" id="bfdet"></div>`;
    S.querySelector('.grid').scrollTop = keep;
    if (st.det) renderDet();
  }

  /* ═══════════════ 【E 詳情畫面】技能效果 / 角色機制 / 人物屬性 ═══════════════ */
  function renderDet() {
    const id = cur(), c = CHARS[id], I = info(id), D = S.querySelector('#bfdet');
    const keys = Object.keys(c.sk);
    if (!st.skill || !c.sk[st.skill]) st.skill = keys[0];
    let chips = '', body = '';
    if (st.tab === 'skill') {
      chips = `<div class="chips">${keys.map(k => `<div class="chip ${k === st.skill ? 'on' : ''}" data-act="sk" data-v="${k}" style="--c:${c.sk[k].col || c.color}">${esc(c.sk[k].name)}</div>`).join('')}</div>`;
      const s = c.sk[st.skill], sI = (I.skills || {})[st.skill];
      const auto = autoSections(s);
      const secs = sI && sI.sections ? sI.sections.map(x => [x.h, x.d]) : auto.filter(x => x[0] !== '數值');
      body = `<div class="dtitle">${esc((sI && sI.title) || s.name)}</div>` +
        secs.map(([h, d]) => `<div class="dsec">${esc(h)}</div><div class="dd">${esc(d)}</div>`).join('') +
        `<div class="dsec">數值</div><div class="dd mini">${esc(auto.find(x => x[0] === '數值')[1])}</div>`;
    } else if (st.tab === 'mech') {
      const list = I.mechanics || Object.keys(MECH_ZH).filter(k => c[k] != null).map(k => ({ t: MECH_ZH[k], d: '（說明尚未撰寫，可在 js_fighter/ui_info.js 補上）' }));
      body = list.length ? list.map(m => `<div class="dsec" style="margin-top:0;font-size:30px;color:#6fd3ff">${esc(m.t)}</div><div class="dd" style="margin-bottom:18px">${esc(m.d)}</div>`).join('')
        : '<div class="dd">這個角色沒有特殊機制。</div>';
    } else {
      body = `<div class="dtitle">${esc(c.name)}</div><div class="dd mini">${esc(c.work || '')}</div>` + statRows(id);
    }
    D.style.display = 'block';
    D.innerHTML = `
      <div class="dh1">角色技能</div><button class="x" data-act="close">✕</button>
      <div class="dcard" style="--c:${c.color}"><div class="dp" style="--c:${c.color}">${avatar(c)}</div>
        <div class="dn">${esc(c.name)}</div><div class="dt">${esc(I.tags || c.work || '')}</div></div>
      <div class="tabs">${[['skill', '技能效果'], ['mech', '角色機制'], ['stat', '人物屬性']].map(([k, n]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${n}</button>`).join('')}</div>
      ${chips}<div class="dbody ${st.tab === 'skill' ? '' : 'tall'}">${body}</div>
      <button class="bbtn main dback" data-act="close">返回選角</button>`;
  }

  /* ═══════════════ 【F 操作】按鈕點擊後做什麼 ═══════════════ */
  function start() {
    sel.p = st.me; sel.e = st.foe;
    root.style.display = 'none';
    paused = false;
    newMatch();
  }
  S.addEventListener('click', e => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    const a = t.dataset.act, v = t.dataset.v;
    if (a === 'pick') { if (st.step === 1) st.me = v; else st.foe = v; render(); }
    else if (a === 'detail') { st.det = true; st.tab = 'skill'; st.skill = null; renderDet(); }
    else if (a === 'close') { st.det = false; const D = S.querySelector('#bfdet'); if (D) D.style.display = 'none'; }
    else if (a === 'tab') { st.tab = v; renderDet(); }
    else if (a === 'sk') { st.skill = v; renderDet(); }
    else if (a === 'rand') { const k = ids(); const r = k[Math.random() * k.length | 0]; if (st.step === 1) st.me = r; else st.foe = r; render(); }
    else if (a === 'ok') { if (st.step === 1) { st.step = 2; render(); } else start(); }
    else if (a === 'back') {
      if (st.step === 2) { st.step = 1; render(); }
      else { root.style.display = 'none'; paused = false; }   // 比賽進行中從選單進來 → 返回遊戲
    }
  });

  function openSelect() {
    st.step = 1; st.det = false;
    st.me = CHARS[sel.p] ? sel.p : ids()[0];
    st.foe = CHARS[sel.e] ? sel.e : ids()[0];
    root.style.display = 'block';
    paused = true;
    fit(); render();
  }

  /* ───────────── 接管主程式 ───────────── */
  window.pick = openSelect;                 // 主程式所有「選擇角色」入口（開場、回合結束、設定選單）都會走這裡
  $('msg').classList.add('hide');            // 隱藏主程式的舊開場畫面
  openSelect();
})();
