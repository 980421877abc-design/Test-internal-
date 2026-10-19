/* ============================================================================
 * projectile_registry.js — 投射物統一註冊表（全遊戲唯一標準）
 *
 * 以前：Gojo 無下限 / 蒼、博士、槍手、神父 各自維護一份「哪些算投射物」的清單，
 *       而且各自處理廚神的刀 → 清單不一致、博士清除時刀直接蒸發。
 * 現在：全部改呼叫這裡。之後新增投射物陣列，只需要改 GLOBAL_KEYS / BALL_KEYS 一處。
 *
 * 對外 API（window.ProjectileRegistry）：
 *   arrays(opts?)                     取得所有投射物陣列（opts.only = ['projectiles', ...] 可限縮）
 *   ownerOf(p)                        投射物所屬玩家編號
 *   forEachHostile(player, fn, opts?) 巡覽所有「非 player 方」的投射物，fn(p, arr, i, key)
 *   clear(pred, opts?)                清除符合條件的投射物，自動處理廚神的刀（opts.mode）
 *   remove(arr, i, mode?)             移除單一投射物，自動處理廚神的刀
 *   recycle(p, mode)                  只處理資源歸還（不動陣列）。mode: 'drop'(預設) | 'refund'
 *   isChefKnife(p)                    是否為「存活廚神的回收制刀」
 *
 * 廚神的刀「守恆」規則：手上 + 飛行中 + 插在地上 = 刀數上限。
 *   - 'drop'   ：刀掉在原地變成 wallKnives，之後由廚神回收（被清除/攔截類技能用）
 *   - 'refund' ：刀直接回到廚神手上（被吸收/消耗類技能用，如蒼、無下限、帶土）
 *   - 看門狗  ：萬一有任何未知路徑讓刀憑空消失，0.4 秒內自動補回，廚神不會永久空手
 * ============================================================================ */
(() => {
  'use strict';
  if (window.ProjectileRegistry) return;

  // ── 唯一標準：這 9 項才是「投射物」 ──
  // 已排除（使用者定義為「不算投射物」）：otisMagicBullets、getoUltimateProjectiles、fisherOceanWaves
  const GLOBAL_KEYS = [
    'projectiles',
    'tigerNovaNeedles', 'oniichanSpikes', 'starSmallStars'
  ];
  const BALL_KEYS = ['sansBones', 'emBullets'];   // 掛在球身上的陣列

  const root = () => { try { return (typeof state !== 'undefined' && state) ? state : null; } catch (_) { return null; } };
  const knifeDefaultMax = () => (typeof KNIFE_MAX_COUNT !== 'undefined' ? KNIFE_MAX_COUNT : 2);

  // ───────── 取陣列 ─────────
  function arrays(opts) {
    const s = root(); if (!s) return [];
    const only = opts && opts.only ? new Set(opts.only) : null;
    const out = [];
    for (const k of GLOBAL_KEYS) {
      if ((!only || only.has(k)) && Array.isArray(s[k])) out.push({ arr: s[k], key: k });
    }
    for (const b of (s.balls || [])) {
      if (!b) continue;
      for (const k of BALL_KEYS) {
        if ((!only || only.has(k)) && Array.isArray(b[k])) out.push({ arr: b[k], key: k });
      }
    }
    return out;
  }

  function ownerOf(p) {
    if (!p) return null;
    if (p.owner != null) return p.owner;
    if (p.ownerPlayer != null) return p.ownerPlayer;
    if (p.ownerBall && p.ownerBall.player != null) return p.ownerBall.player;
    return null;
  }

  function forEachHostile(player, fn, opts) {
    for (const { arr, key } of arrays(opts)) {
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        if (!p || ownerOf(p) === player) continue;
        fn(p, arr, i, key);
      }
    }
  }

  // ───────── 廚神的刀 ─────────
  function isChefKnife(p) {
    const ob = p && p.ownerBall;
    return !!(p && p.type === 'knife' && ob && ob.char && ob.char.type === 'chef' && ob.hp > 0);
  }
  const embeddedOf = (s, chef) =>
    (s.wallKnives || []).filter(k => k.ownerBall ? k.ownerBall === chef : k.owner === chef.player).length;

  function refundChefKnife(p) {
    const s = root(); const c = p.ownerBall;
    const max = c.knifeMax || knifeDefaultMax();
    c.knives = Math.min((c.knives || 0) + 1, max);
    if (c.knives >= max && s && embeddedOf(s, c) === 0) {
      c.knifeRecalling = false;
      c.attackTimer = c.attackInterval;
    }
  }
  function dropChefKnife(p) {
    const s = root(); if (!s) return;
    if (!Array.isArray(s.wallKnives)) s.wallKnives = [];
    s.wallKnives.push({
      x: p.x, y: p.y, angle: p.angle || 0,
      owner: p.owner, ownerBall: p.ownerBall, color: p.color
    });
  }

  // mode: 'drop'（預設，掉地上等回收）| 'refund'（直接回手）
  function recycle(p, mode) {
    if (!isChefKnife(p)) return false;
    if (mode === 'refund') refundChefKnife(p); else dropChefKnife(p);
    return true;
  }

  function remove(arr, i, mode) {
    const p = arr[i];
    if (p) {
      recycle(p, mode || 'drop');
      if (typeof p.active === 'boolean') p.active = false;
    }
    arr.splice(i, 1);
    return p;
  }

  function clear(pred, opts) {
    let n = 0;
    const mode = opts && opts.mode;
    for (const { arr } of arrays(opts)) {
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i]; if (!p) continue;
        if (pred(p, ownerOf(p))) { remove(arr, i, mode); n++; }
      }
    }
    return n;
  }

  // ───────── 看門狗：刀的守恆檢查 ─────────
  // 不管是哪個技能、哪條路徑把刀弄丟，最多 0.4 秒內補回，廚神不會變成永久空手。
  const HEAL_DELAY_MS = 400;
  let lastT = 0;
  function watchChefKnives(t) {
    const s = root();
    if (s && Array.isArray(s.balls)) {
      const dtMs = lastT ? Math.min(100, t - lastT) : 0;
      for (const c of s.balls) {
        if (!c || !c.char || c.char.type !== 'chef' || c.hp <= 0 || c.knives == null) continue;
        const max = c.knifeMax || knifeDefaultMax();
        const wall = embeddedOf(s, c);
        let flying = 0;
        if (Array.isArray(s.projectiles)) {
          for (const p of s.projectiles) if (p && p.type === 'knife' && p.ownerBall === c) flying++;
        }
        const total = (c.knives || 0) + flying + wall;
        if (total < max) {
          c.__knifeDeficitMs = (c.__knifeDeficitMs || 0) + dtMs;
          if (c.__knifeDeficitMs >= HEAL_DELAY_MS) {
            c.knives = Math.min(max, (c.knives || 0) + (max - total));
            c.__knifeDeficitMs = 0;
            console.warn('[projectile_registry] 廚神的刀憑空消失，已自動補回');
          }
        } else {
          c.__knifeDeficitMs = 0;
        }
        // 卡死狀態修正：有刀可丟卻還在「回收中」但地上沒刀 / 手上沒刀但沒人回收
        if (c.knives > 0 && wall === 0 && c.knifeRecalling) c.knifeRecalling = false;
        if (c.knives === 0 && wall > 0 && !c.knifeRecalling) c.knifeRecalling = true;
      }
    }
    lastT = t;
    requestAnimationFrame(watchChefKnives);
  }
  requestAnimationFrame(watchChefKnives);

  window.ProjectileRegistry = {
    GLOBAL_KEYS, BALL_KEYS,
    arrays, ownerOf, forEachHostile, clear, remove, recycle,
    isChefKnife, refundChefKnife, dropChefKnife
  };
  console.log('[projectile_registry] 已載入：9 類投射物統一管理 + 廚神刀守恆看門狗');
})();
