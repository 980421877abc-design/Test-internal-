/* js_fighter/ui_settings.js — 全螢幕精美設定介面 + 自訂 BGM
 * 攔截原本的 ⚙️ 選單，替換為帶有分頁與網格音樂選擇的 UI。
 */
(function () {
  'use strict';
  if (window.__bfCustomSettings) return;
  window.__bfCustomSettings = true;

  /* ─── 音樂清單設定 (已精簡為兩首) ─── */
  const BGM_LIST = [
    { name: '雨爱', url: 'sound/gojo_boss_bgm.mp3' },
    { name: 'AIZO', url: 'sound/aizo.mp3' }
  ];
  
  const BGM_KEY = 'bf_bgm_selected';
  // 預設選擇第一首（雨爱），如果玩家之前選過，會從 localStorage 讀取
  let currentBgm = localStorage.getItem(BGM_KEY) || BGM_LIST[0].url;
  
  // 防呆：如果玩家存的音樂已經不在清單裡了，強制退回第一首
  if (!BGM_LIST.some(b => b.url === currentBgm)) currentBgm = BGM_LIST[0].url;

  /* ─── 劫持音樂播放 ─── */
  const oldPlayBgm = window.playBgm;
  let customAudio = null;
  window.playBgm = function () {
    if (typeof Assets === 'undefined' || !Assets.unlocked) return;
    if (!customAudio) { customAudio = new Audio(); customAudio.loop = true; }
    if (customAudio.src !== currentBgm) customAudio.src = currentBgm;
    Assets.bgmEl = customAudio;
    if (typeof Assets.applyVol === 'function') Assets.applyVol();
    if (customAudio.paused) customAudio.play().catch(() => {});
  };
  const oldStopBgm = window.stopBgm;
  window.stopBgm = function () {
    if (customAudio) { customAudio.pause(); customAudio.currentTime = 0; }
    else if (oldStopBgm) oldStopBgm();
  };

  /* ─── CSS 樣式注入 ─── */
  const style = document.createElement('style');
  style.innerHTML = `
    #bf-custom-settings { position: absolute; inset: 0; background: #0b1020; z-index: 9999; display: flex; align-items: center; justify-content: center; font-family: system-ui, sans-serif; color: #e8ecff; }
    .bf-cs-container { display: flex; width: 960px; max-width: 95%; height: 600px; max-height: 90vh; background: #0f1a2c; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6); border: 1px solid #1c3454; position: relative; }
    .bf-cs-sidebar { width: 220px; background: #0a1322; border-right: 1px solid #1c3454; padding: 30px 20px; display: flex; flex-direction: column; gap: 12px; }
    .bf-cs-logo { font-size: 32px; font-weight: 900; color: #fff; text-shadow: 0 0 10px #72d5ff; margin-bottom: 30px; text-align: center; letter-spacing: 2px; }
    .bf-cs-nav { padding: 14px 20px; border-radius: 10px; cursor: pointer; background: transparent; color: #8899b5; transition: 0.2s; font-weight: bold; font-size: 16px; display: flex; align-items: center; gap: 10px; }
    .bf-cs-nav.active { background: #72d5ff; color: #0b1020; box-shadow: 0 0 15px rgba(114,213,255,0.4); }
    .bf-cs-content { flex: 1; padding: 30px 40px; display: flex; flex-direction: column; overflow-y: auto; }
    .bf-cs-title { margin: 0 0 20px 0; font-size: 24px; font-weight: bold; color: #fff; }
    .bf-cs-tabs { display: flex; gap: 15px; margin-bottom: 20px; }
    .bf-cs-tab { flex: 1; padding: 12px; text-align: center; background: #13233b; border: 1px solid #1c3454; border-radius: 8px; cursor: pointer; color: #8899b5; font-weight: bold; transition: 0.2s; }
    .bf-cs-tab.active { background: #72d5ff; color: #0b1020; border-color: #72d5ff; }
    .bf-cs-music-area { flex: 1; display: flex; flex-direction: column; }
    .bf-cs-music-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .bf-cs-current { font-size: 18px; font-weight: bold; }
    .bf-cs-btn-try { background: transparent; border: 1px solid #72d5ff; color: #72d5ff; padding: 6px 16px; border-radius: 20px; cursor: pointer; font-size: 14px; }
    .bf-cs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .bf-cs-item { background: #13233b; border: 1px solid #1c3454; color: #fff; padding: 14px; border-radius: 8px; cursor: pointer; text-align: center; font-weight: bold; position: relative; transition: 0.2s; }
    .bf-cs-item:hover { background: #1a304e; }
    .bf-cs-item.active { background: #72d5ff; color: #0b1020; border-color: #72d5ff; }
    .bf-cs-item.active::before { content: "✓"; margin-right: 8px; }
    .bf-cs-sliders { margin-top: auto; padding-top: 20px; border-top: 1px solid #1c3454; }
    .bf-cs-row { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
    .bf-cs-row span.lbl { width: 100px; font-weight: bold; color: #8899b5; }
    .bf-cs-row input[type="range"] { flex: 1; accent-color: #72d5ff; height: 6px; }
    .bf-cs-val { width: 60px; text-align: right; font-weight: bold; background: #000; padding: 6px 10px; border-radius: 6px; border: 1px solid #1c3454; color: #72d5ff; }
    .bf-cs-footer { position: absolute; bottom: 20px; right: 40px; display: flex; gap: 15px; }
    .bf-cs-btn { padding: 10px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; border: none; font-size: 16px; transition: 0.2s; }
    .bf-cs-btn.back { background: #13233b; color: #fff; border: 1px solid #1c3454; }
    .bf-cs-btn.save { background: #72d5ff; color: #0b1020; box-shadow: 0 0 10px rgba(114,213,255,0.4); }
    .bf-cs-panel { display: none; flex-direction: column; height: 100%; }
    .bf-cs-panel.active { display: flex; }
    .bf-cs-other-btn { padding: 12px; border-radius: 8px; background: #13233b; color: #fff; border: 1px solid #1c3454; cursor: pointer; font-weight: bold; margin-bottom: 10px; text-align: left; }
  `;
  document.head.appendChild(style);

  /* ─── HTML 結構 ─── */
  const wrap = document.createElement('div');
  wrap.id = 'bf-custom-settings';
  wrap.style.display = 'none';
  wrap.innerHTML = `
    <div class="bf-cs-container">
      <div class="bf-cs-sidebar">
        <div class="bf-cs-logo">咒術小球</div>
        <div class="bf-cs-nav active" data-tab="audio">🔊 音频设置</div>
        <div class="bf-cs-nav" data-tab="other">🎮 操作与反馈</div>
      </div>
      <div class="bf-cs-content">
        <h2 class="bf-cs-title" id="bf-cs-title">音频设置</h2>
        
        <!-- 音频分页 -->
        <div class="bf-cs-panel active" id="tab-audio">
          <div class="bf-cs-tabs">
            <div class="bf-cs-tab active" data-sub="bgm">战斗音乐</div>
            <div class="bf-cs-tab" data-sub="bgs">背景音乐</div>
          </div>
          
          <div class="bf-cs-music-area">
            <div class="bf-cs-music-header">
              <span class="bf-cs-current" id="bf-cs-cur-name"></span>
              <button class="bf-cs-btn-try" id="bf-cs-try">试听所选音乐</button>
            </div>
            <div class="bf-cs-grid" id="bf-cs-grid">
              ${BGM_LIST.map(b => `<div class="bf-cs-item ${b.url === currentBgm ? 'active' : ''}" data-url="${b.url}">${b.name}</div>`).join('')}
            </div>
          </div>

          <div class="bf-cs-sliders">
            <div class="bf-cs-row">
              <span class="lbl">音乐音量</span>
              <input type="range" id="bf-cs-sBgm" min="0" max="100">
              <span class="bf-cs-val" id="bf-cs-val-bgm">100%</span>
            </div>
            <div class="bf-cs-row">
              <span class="lbl">音效音量</span>
              <input type="range" id="bf-cs-sSfx" min="0" max="100">
              <span class="bf-cs-val" id="bf-cs-val-sfx">90%</span>
            </div>
          </div>
        </div>

        <!-- 其他设置分页 -->
        <div class="bf-cs-panel" id="tab-other">
          <button class="bf-cs-other-btn" id="bf-cs-btn-edit">📐 調整按鈕位置</button>
          <button class="bf-cs-other-btn" id="bf-cs-btn-reset">🔄 重設按鈕位置</button>
          <button class="bf-cs-other-btn" id="bf-cs-btn-pick" style="color:#ff8a5a;">🎭 重新選角 (返回大廳)</button>
          
          <div class="bf-cs-sliders" style="margin-top:20px;">
            <div class="bf-cs-row">
              <span class="lbl">鏡頭範圍</span>
              <input type="range" id="bf-cs-sView" min="600" max="1100" step="20">
              <span class="bf-cs-val" id="bf-cs-val-view">800</span>
            </div>
            <div class="bf-cs-row">
              <span class="lbl">按鈕透明度</span>
              <input type="range" id="bf-cs-sOp" min="20" max="100">
              <span class="bf-cs-val" id="bf-cs-val-op">65%</span>
            </div>
            <div class="bf-cs-row">
              <span class="lbl">畫面方向</span>
              <select id="bf-cs-sRot" style="flex:1;padding:8px;background:#000;color:#fff;border:1px solid #1c3454;border-radius:6px;">
                <option value="auto">自動</option>
                <option value="on">旋轉 90°</option>
                <option value="off">不旋轉</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bf-cs-footer">
        <button class="bf-cs-btn back" id="bf-cs-back">返回</button>
        <button class="bf-cs-btn save" id="bf-cs-save">完成</button>
      </div>
    </div>
  `;
  document.getElementById('stage').appendChild(wrap);

  /* ─── 事件綁定與邏輯 ─── */
  // 預設顯示當前歌曲名稱
  const initCurName = BGM_LIST.find(b => b.url === currentBgm);
  document.getElementById('bf-cs-cur-name').innerText = initCurName ? initCurName.name : '';

  // 1. 分頁切換
  const navs = wrap.querySelectorAll('.bf-cs-nav');
  navs.forEach(nav => {
    nav.onclick = () => {
      navs.forEach(n => n.classList.remove('active'));
      nav.classList.add('active');
      wrap.querySelectorAll('.bf-cs-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('tab-' + nav.dataset.tab).classList.add('active');
      document.getElementById('bf-cs-title').innerText = nav.dataset.tab === 'audio' ? '音频设置' : '操作与反馈';
    };
  });

  const subTabs = wrap.querySelectorAll('.bf-cs-tab');
  subTabs.forEach(tab => {
    tab.onclick = () => {
      if (tab.dataset.sub === 'bgs') {
        alert('目前尚未提供背景音樂切換。');
        return;
      }
      subTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    };
  });

  // 2. 音樂選擇
  const grid = document.getElementById('bf-cs-grid');
  grid.onclick = (e) => {
    if (!e.target.classList.contains('bf-cs-item')) return;
    const url = e.target.dataset.url;
    if (url === currentBgm) return;

    grid.querySelectorAll('.bf-cs-item').forEach(el => el.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById('bf-cs-cur-name').innerText = e.target.innerText.trim();

    currentBgm = url;
    localStorage.setItem(BGM_KEY, currentBgm);
    
    if (customAudio) { customAudio.pause(); customAudio = null; }
    if (typeof playBgm === 'function') playBgm();
  };

  document.getElementById('bf-cs-try').onclick = () => {
    if (customAudio) {
      customAudio.currentTime = 0;
      if (customAudio.paused) customAudio.play().catch(()=>{});
    }
  };

  // 3. 音量與其他設定
  function syncFromSet() {
    document.getElementById('bf-cs-sBgm').value = SET.bgm;
    document.getElementById('bf-cs-val-bgm').innerText = SET.bgm + '%';
    document.getElementById('bf-cs-sSfx').value = SET.sfx;
    document.getElementById('bf-cs-val-sfx').innerText = SET.sfx + '%';
    document.getElementById('bf-cs-sView').value = SET.view;
    document.getElementById('bf-cs-val-view').innerText = SET.view;
    document.getElementById('bf-cs-sOp').value = SET.bo;
    document.getElementById('bf-cs-val-op').innerText = SET.bo + '%';
    document.getElementById('bf-cs-sRot').value = SET.rot;
  }

  function bindSlider(id, valId, key, isPercent) {
    const el = document.getElementById(id);
    el.oninput = (e) => {
      SET[key] = +e.target.value;
      document.getElementById(valId).innerText = SET[key] + (isPercent ? '%' : '');
      applySettings();
    };
  }
  bindSlider('bf-cs-sBgm', 'bf-cs-val-bgm', 'bgm', true);
  bindSlider('bf-cs-sSfx', 'bf-cs-val-sfx', 'sfx', true);
  bindSlider('bf-cs-sView', 'bf-cs-val-view', 'view', false);
  bindSlider('bf-cs-sOp', 'bf-cs-val-op', 'bo', true);

  document.getElementById('bf-cs-sRot').onchange = (e) => {
    SET.rot = e.target.value;
    applySettings();
  };

  // 4. 按鈕操作
  document.getElementById('bf-cs-btn-edit').onclick = () => {
    closeMenu();
    setEdit(true);
  };
  document.getElementById('bf-cs-btn-reset').onclick = () => {
    if(confirm('確定要重置所有按鈕位置嗎？')) resetPos();
  };
  document.getElementById('bf-cs-btn-pick').onclick = () => {
    closeMenu();
    pick();
  };

  // 5. 返回與完成
  document.getElementById('bf-cs-back').onclick = () => closeMenu();
  document.getElementById('bf-cs-save').onclick = () => closeMenu();

  // ─── 劫持主程式的 openMenu / closeMenu ───
  window.openMenu = function () {
    if (!G.p) return;
    paused = true;
    syncFromSet();
    document.getElementById('menu').classList.add('hide'); // 隱藏原生選單
    wrap.style.display = 'flex';
  };
  
  window.closeMenu = function () {
    paused = false;
    wrap.style.display = 'none';
  };
  
  window.pause = function () {
    if (!G.p) return;
    if (wrap.style.display === 'flex') window.closeMenu();
    else window.openMenu();
  };

  console.log('[ui_settings] 自訂設定介面已載入 (精簡版)');
})();
