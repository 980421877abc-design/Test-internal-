/* ============================================================================
 * sandbox.js v5 — 沙盒擴充（致命傷攔截重生 + 傷害倍率）
 * - 齒輪面板：每個角色旁 ⚙️，點開可調傷害倍率、重生次數
 * - 傷害倍率：在 dealDamage 前乘算
 * - 重生：致命傷發生時直接攔截、原地滿血復活，不觸發死亡
 * ============================================================================ */
(() => {
  'use strict';

  // ───────── 從 chip 反查角色 id ─────────
  function getChipCharId(chip) {
    if (chip.dataset.charId) return chip.dataset.charId;
    if (typeof CHARACTERS !== 'undefined') {
      const img = chip.querySelector('img');
      if (img && img.src) {
        for (const c of CHARACTERS) {
          if (c.image && img.src.indexOf(c.image) >= 0) {
            chip.dataset.charId = c.id;
            return c.id;
          }
        }
      }
      const text = chip.textContent || '';
      let best = null;
      for (const c of CHARACTERS) {
        if (c.name && text.indexOf(c.name) >= 0) {
          if (!best || c.name.length > best.name.length) best = c;
        }
      }
      if (best) {
        chip.dataset.charId = best.id;
        return best.id;
      }
    }
    return null;
  }

  // ───────── 讀寫 chip 配置 ─────────
  function readChipCfg(chip) {
    return {
      dmgMult: parseFloat(chip.dataset.dmgMult) || 1.0,
      revives: parseInt(chip.dataset.revives, 10) || 0
    };
  }
  function ensureChipCfg(chip) {
    if (!chip.dataset.dmgMult) chip.dataset.dmgMult = '1.0';
    if (!chip.dataset.revives) chip.dataset.revives = '0';
  }

  // ───────── 面板開關 ─────────
  let activePanel = null;
  function closePanel() {
    if (activePanel) {
      activePanel.el.remove();
      if (activePanel.gear) activePanel.gear.style.background = 'rgba(143,214,255,0.15)';
      activePanel = null;
    }
  }
  function openPanel(chip, gear) {
    const cfg = readChipCfg(chip);
    const panel = document.createElement('div');
    panel.className = 'sandbox-adjust-panel';
    panel.style.cssText = `
      position: absolute; z-index: 9999;
      background: rgba(15,22,32,0.98);
      border: 1px solid rgba(143,214,255,0.4);
      border-radius: 10px;
      padding: 10px 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      color: #eee; font-family: sans-serif; font-size: 0.72rem;
      min-width: 200px; top: 100%; left: 0; margin-top: 6px;
      line-height: 1.4;
    `;
    panel.innerHTML = `
      <div style="font-weight:700;color:#8fd6ff;margin-bottom:8px;font-size:0.78rem">⚙️ 調整數值</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px">
        <label style="color:#ffd27a">傷害倍率</label>
        <input type="number" class="sbx-dmg" min="0" step="0.1" value="${cfg.dmgMult}"
          style="width:52px;background:rgba(255,220,120,0.15);border:1px solid rgba(255,220,120,0.4);border-radius:6px;color:#ffd27a;font-size:0.75rem;padding:3px 5px;text-align:right">
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px">
        <label style="color:#9ef09e">重生次數</label>
        <input type="number" class="sbx-rev" min="0" step="1" value="${cfg.revives}"
          style="width:52px;background:rgba(160,240,160,0.15);border:1px solid rgba(160,240,160,0.4);border-radius:6px;color:#9ef09e;font-size:0.75rem;padding:3px 5px;text-align:right">
      </div>
      <div style="display:flex;gap:6px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1)">
        <button class="sbx-reset" style="flex:1;background:rgba(255,120,120,0.15);border:1px solid rgba(255,120,120,0.4);border-radius:6px;color:#ff9f9f;padding:4px 8px;cursor:pointer;font-size:0.68rem">重設</button>
        <button class="sbx-close" style="flex:1;background:rgba(143,214,255,0.12);border:1px solid rgba(143,214,255,0.35);border-radius:6px;color:#8fd6ff;padding:4px 8px;cursor:pointer;font-size:0.68rem">關閉</button>
      </div>
    `;
    if (getComputedStyle(chip).position === 'static') chip.style.position = 'relative';
    chip.appendChild(panel);
    activePanel = { chip, gear, el: panel };
    gear.style.background = 'rgba(143,214,255,0.35)';

    const dmgEl = panel.querySelector('.sbx-dmg');
    const revEl = panel.querySelector('.sbx-rev');
    dmgEl.oninput = () => { chip.dataset.dmgMult = String(parseFloat(dmgEl.value) || 1.0); };
    revEl.oninput = () => { chip.dataset.revives = String(parseInt(revEl.value, 10) || 0); };
    panel.querySelector('.sbx-reset').onclick = () => {
      chip.dataset.dmgMult = '1.0';
      chip.dataset.revives = '0';
      dmgEl.value = '1';
      revEl.value = '0';
    };
    panel.querySelector('.sbx-close').onclick = closePanel;
  }

  // ───────── 事件委託：任何齒輪點擊都走這裡 ─────────
  document.addEventListener('click', (e) => {
    const gear = e.target.closest('.sandbox-gear-btn');
    if (gear) {
      e.stopPropagation();
      const chip = gear.closest('.sb-chip');
      if (!chip) return;
      if (activePanel && activePanel.chip === chip) {
        closePanel();
      } else {
        closePanel();
        openPanel(chip, gear);
      }
      return;
    }
    if (!e.target.closest('.sandbox-adjust-panel')) closePanel();
  }, true);

  // ───────── 掃描 chip 加齒輪 ─────────
  function scanAndAddGears() {
    const container = document.getElementById('sandbox-teams');
    if (!container) return;
    const chips = container.querySelectorAll('.sb-chip');
    chips.forEach(chip => {
      ensureChipCfg(chip);
      if (chip.querySelector('.sandbox-gear-btn')) return;
      const gear = document.createElement('button');
      gear.className = 'sandbox-gear-btn';
      gear.type = 'button';
      gear.textContent = '⚙️';
      gear.title = '調整此角色';
      gear.style.cssText = 'background:rgba(143,214,255,0.15);border:1px solid rgba(143,214,255,0.4);border-radius:6px;cursor:pointer;padding:1px 5px;font-size:0.7rem;margin-left:2px;color:#cde;';
      chip.appendChild(gear);
    });
  }

  // ───────── 開戰時收集 chip 配置 ─────────
  function collectBattleConfigs() {
    const map = new Map();
    const container = document.getElementById('sandbox-teams');
    if (!container) return map;
    const teamEls = container.querySelectorAll('.sb-team');
    teamEls.forEach((teamEl, ti) => {
      const player = ti + 1;
      const chips = teamEl.querySelectorAll('.sb-chip');
      chips.forEach(chip => {
        const charId = getChipCharId(chip);
        if (!charId) return;
        const cfg = readChipCfg(chip);
        const baseKey = player + ':' + charId;
        if (map.has(baseKey)) {
          let idx = 2;
          while (map.has(baseKey + ':' + idx)) idx++;
          map.set(baseKey + ':' + idx, cfg);
        } else {
          map.set(baseKey, cfg);
        }
      });
    });
    return map;
  }

  function applyConfigsToBalls(cfgMap) {
    if (typeof state === 'undefined' || !state || !state.balls) return;
    const seen = new Map();
    for (const ball of state.balls) {
      if (!ball || !ball.char) continue;
      const player = ball.player || 1;
      const charId = ball.char.id;
      const baseKey = player + ':' + charId;
      const count = (seen.get(baseKey) || 0) + 1;
      seen.set(baseKey, count);
      let cfg = cfgMap.get(baseKey + (count > 1 ? ':' + count : ''));
      if (!cfg) cfg = cfgMap.get(baseKey);
      if (!cfg) continue;
      ball.sandboxDamageMult = cfg.dmgMult || 1.0;
      if (cfg.revives > 0) ball.sandboxRevivesLeft = cfg.revives;
    }
  }

  function tryHookStartBattle() {
    if (typeof window.sandboxStartBattle !== 'function') return;
    if (tryHookStartBattle._hooked) return;
    tryHookStartBattle._hooked = true;
    const orig = window.sandboxStartBattle;
    window.sandboxStartBattle = function () {
      const cfgMap = collectBattleConfigs();
      orig.apply(this, arguments);
      setTimeout(() => applyConfigsToBalls(cfgMap), 80);
    };
    console.log('[sandbox_extras] sandboxStartBattle hooked');
  }

  // ───────── 傷害倍率 + 致命傷攔截（重生） ─────────
  function tryHookDealDamage() {
    if (typeof window.dealDamage !== 'function') return;
    if (tryHookDealDamage._hooked) return;
    tryHookDealDamage._hooked = true;
    const orig = window.dealDamage;
    window.dealDamage = function (target, dmg, options) {
      const opts = options || {};

      // 1. 傷害倍率
      let attacker = opts.attackerBall;
      if (!attacker && opts.attackerPlayer != null && typeof state !== 'undefined' && state && state.balls) {
        attacker = state.balls.find(b => b && b.player === opts.attackerPlayer && b.hp > 0);
      }
      if (attacker && attacker.sandboxDamageMult && attacker.sandboxDamageMult !== 1.0) {
        dmg = dmg * attacker.sandboxDamageMult;
      }

      // 2. 致命傷攔截：若這一擊會殺死目標且還有重生次數，先復活
      if (target && target.char && !opts.codeKill && !opts.bypassParry && !opts.otisSureHit) {
        const revives = target.sandboxRevivesLeft || 0;
        if (revives > 0 && target.hp > 0 && target.hp - dmg <= 0) {
          target.sandboxRevivesLeft = revives - 1;
          const effMax = (typeof getBallMaxHp === 'function') ? getBallMaxHp(target) : 1000;
          target.hp = effMax;
          const Wv = (typeof W !== 'undefined') ? W : 350;
          const Hv = (typeof H !== 'undefined') ? H : 350;
          target.vx = (Math.random() - 0.5) * 200;
          target.vy = (Math.random() - 0.5) * 200;
          target.x = 40 + Math.random() * (Wv - 80);
          target.y = 40 + Math.random() * (Hv - 80);
          if (state.hitFlashes) {
            state.hitFlashes.push({ x: target.x, y: target.y, r: 60, alpha: 1.2, color: '#9ef09e', t: 0.6 });
          }
          if (state.damageNumbers) {
            state.damageNumbers.push({ x: target.x, y: target.y - 40, value: '重生（剩 ' + target.sandboxRevivesLeft + '）', color: '#9ef09e', life: 1.2, maxLife: 1.2, scale: 1.1 });
          }
          if (typeof playHitSound === 'function') playHitSound('vampire_dash');
          return 0;
        }
      }

      return orig.call(this, target, dmg, options);
    };
    console.log('[sandbox_extras] dealDamage hooked');
  }

  // ───────── 主循環 ─────────
  function init() {
    function observeContainer() {
      const c = document.getElementById('sandbox-teams');
      if (c) {
        const obs = new MutationObserver(() => scanAndAddGears());
        obs.observe(c, { childList: true, subtree: true });
        scanAndAddGears();
      } else {
        requestAnimationFrame(observeContainer);
      }
    }
    observeContainer();

    let lastScan = 0;
    function loop(t) {
      tryHookStartBattle();
      tryHookDealDamage();
      if (t - lastScan > 400) {
        lastScan = t;
        scanAndAddGears();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    console.log('[sandbox_extras] v5 已載入');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
