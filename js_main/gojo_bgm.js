/* ============================================================================
 * gojo_bgm.js — 現代最強 Boss 戰 BGM
 *
 * 觸發條件：Boss 模式 + 場上有活著的現代最強
 * 停止條件：戰鬥結束 / Gojo 死亡 / 離開 Boss 模式
 *
 * 替換音樂：把 sound/gojo_boss_bgm.mp3 換成你的檔案即可
 * ============================================================================ */
(() => {
  'use strict';

  const BGM_PATH = 'sound/gojo_boss_bgm.mp3';
  const BGM_VOLUME = 0.5;   // 0.0 ~ 1.0，主音量乘上這個值

  let audioEl = null;
  let audioUnlocked = false;

  // 建立 <audio> 元素
  function ensureAudio() {
    if (audioEl) return audioEl;
    audioEl = new Audio(BGM_PATH);
    audioEl.loop = true;
    audioEl.volume = BGM_VOLUME;
    audioEl.preload = 'auto';
    audioEl.addEventListener('error', () => {
      console.warn('[gojo_bgm] 音樂載入失敗，請確認檔案路徑：' + BGM_PATH);
    });
    return audioEl;
  }

  // 瀏覽器需要「使用者互動」才能播放音訊
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    try {
      const ctx = (typeof getAudioCtx === 'function') ? getAudioCtx() : null;
      if (ctx && ctx.state === 'suspended') ctx.resume();
    } catch (_) {}
    console.log('[gojo_bgm] 音訊已解鎖');
  }
  document.addEventListener('click', unlockAudio, { once: false });
  document.addEventListener('touchstart', unlockAudio, { once: false });

  // 檢查是否該播 BGM
  function shouldPlayBgm() {
    if (typeof state === 'undefined' || !state || !state.balls) return false;
    if (typeof bossMode === 'undefined' || !bossMode) return false;
    return state.balls.some(b =>
      b && b.hp > 0 && b.char && b.char.type === 'gojo'
    );
  }

  // 從主音量滑桿同步
  function getEffectiveVolume() {
    const gv = (typeof gameVolume === 'number') ? gameVolume : 1;
    return BGM_VOLUME * gv;
  }

  // 主循環：每 0.5 秒檢查一次
  let lastCheck = 0;
  function tick(t) {
    if (t - lastCheck > 500) {
      lastCheck = t;
      const shouldPlay = shouldPlayBgm();
      const a = ensureAudio();
      if (shouldPlay) {
        if (a.paused) {
          a.volume = getEffectiveVolume();
          a.play().catch(() => {
            // 瀏覽器還沒解鎖，等使用者點畫面後會自動重試
          });
        } else {
          a.volume = getEffectiveVolume();
        }
      } else {
        if (!a.paused) {
          a.pause();
          a.currentTime = 0;
        }
      }
    }
    requestAnimationFrame(tick);
  }

  // 監聽音量滑桿
  const slider = document.getElementById('volume-slider');
  if (slider) {
    slider.addEventListener('input', () => {
      if (audioEl) audioEl.volume = getEffectiveVolume();
    });
  }

  requestAnimationFrame(tick);
  console.log('[gojo_bgm] 已載入，等待 Boss 戰 + 現代最強');
})();
