/* js_fighter/char_load.js — 角色載入器
 * 以後新增角色，只要在 CHAR_SCRIPTS 陣列裡加上檔名即可。
 * 注意：這個檔案必須放在 ui_select.js 之前載入。
 */
(function () {
  'use strict';

  // ─── 角色註冊清單 ───
  // 按照你希望載入的順序排列（通常不影響，但會影響外掛包裝的先後）
  const CHAR_SCRIPTS = [
    'js_fighter/char_kira.js',
    'js_fighter/char_yelan.js',
    'js_fighter/char_nanami.js',
    'js_fighter/char_sasuke.js'
    
    // 👉 以後有新角色，直接在這裡加一行，例如：
    // 'js_fighter/char_gojo_chant.js',
    // 'js_fighter/char_toji.js',
  ];

  // 使用 document.write 同步載入，確保在解析下一行 script 前，所有角色都已載入完畢
  for (let i = 0; i < CHAR_SCRIPTS.length; i++) {
    document.write('<script src="' + CHAR_SCRIPTS[i] + '"><\/script>');
  }
})();
