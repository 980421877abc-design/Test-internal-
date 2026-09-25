// ============================================================================
// CHARACTER CONSTANTS：角色常數（可直接修改數值；主程式會讀取本檔）
// ============================================================================

// USER CONFIG 3/3：角色數值
const STANDARD_DOT_TICK_INTERVAL = 1.0; // DPS／每秒傷害效果的離散結算間隔（秒）
// 目前依角色順序排列；只需修改各角色區段內的傷害、CD、速度、範圍與持續時間。
// 帶有 FX／VFX／PARTICLE／TRAIL／GLOW 字樣的項目屬於視覺特效，平時不要修改。
// ============================================================================
//廚師常數
const CHEF_ATTACK_INTERVAL = 2.0; //攻擊CD

const KNIFE_SPEED          = 350; //刀子移動速度
const KNIFE_DAMAGE         = 130; //刀子傷害
const KNIFE_MAX_COUNT      = 2; //刀子上限
const KNIFE_RECALL_SPEED = 350; // 回收速度（px/s）
//酒鬼常數
const DRUNK_ATTACK_INTERVAL   = 1.75; //攻擊CD
const DRUNK_DIR_CHANGE_MIN    = 1.5; //最小喝茫間隔
const DRUNK_DIR_CHANGE_MAX    = 2.0; //最大喝茫間隔
const BOTTLE_SPEED            = 350; //酒瓶移動速度
const BOTTLE_DAMAGE           = 150; //酒瓶傷害

// 暗夜領主常數
const VAMPIRE_BITE_DAMAGE     = 22;   // 每次咬擊傷害，避免四段連咬過痛
const VAMPIRE_BITE_HEAL       = 22;   // 每次咬擊回血
const VAMPIRE_BITE_COUNT      = 4;    // 咬擊次數
const VAMPIRE_BITE_INTERVAL   = 0.20; // 每次咬擊間隔（秒）
const VAMPIRE_DASH_INTERVAL   = 9;   // 蝙蝠狂襲CD（秒）
const VAMPIRE_DASH_SPEED      = 700;  // 衝刺速度
const VAMPIRE_DASH_DURATION   = 0.45; // 衝刺最長持續時間（秒）

// 暗夜領主「領主眷屬」
const VAMPIRE_BAT_COUNT = 2;
const VAMPIRE_BAT_DAMAGE = 10;
const VAMPIRE_BAT_HEAL = 10;
const VAMPIRE_BAT_COOLDOWN = 5;
const VAMPIRE_BAT_SPEED = 180;

//一拳超人常數
const OPM_COUNTDOWN_START    = 50;   // 怒氣值上限
const OPM_COLLISION_COOLDOWN = 0.3;  // 每次碰撞的內置CD（秒），防連觸
const OPM_COLLISION_REDUCE   = 1.0;    // 每次碰撞時增加的怒氣值
const OPM_RAGE_PARTICLE_THRESHOLD = 0.3; // 怒氣超過此比例才出現粒子
const OPM_DMG_REDUCE          = 0.3;  // 全局減傷比例（受到的所有傷害降低）
const OPM_WALL_REDUCE          = 0.5; // 撞牆時減少的怒氣值倒數秒數
// ══════════════ 現代最強（Gojo 重做版）══════════════

// ── 被動「無下限」 ──
const GOJO_INFINITY_MAX          = 8;    // 無下限量條上限
const GOJO_INFINITY_RADIUS       = 70;    // 偵測投射物半徑（px）
const GOJO_INFINITY_REGEN_TIME   = 10.0;   // 每 8 秒補滿一次
const GOJO_INFINITY_SLOW_TIME    = 0.3;   // 投射物從原速減到 0 的時間（秒）
const GOJO_INFINITY_LINGER       = 0.1;   // 停止後多久消失（秒）

// ── 蒼／赫交替發射 ──
const GOJO_COOLDOWN              = 2.0;   // 基礎發射間隔（秒）
const GOJO_HP_THRESHOLD          = 700;   // 六眼覺醒血量門檻
const GOJO_UNLOCK_CD_BONUS       = 0.5;   // 覺醒後技能 CD -0.5 秒

// ── 蒼（引力球）──
const GOJO_BLUE_FRAMEDMG         = 4;     // 每幀傷害
const GOJO_BLUE_SPEED            = 4.5;     // 飛行速度（*60 → 300px/s）
const GOJO_BLUE_RADIUS           = 13;
const GOJO_BLUE_RING_R           = 32;
const GOJO_BLUE_RAY_RANGE        = 100;
const GOJO_BLUE_RAY_FORCE        = 10;
const GOJO_BLUE_LIFESPAN         = 2.5;
const GOJO_BLUE_PROJECTILE_PULL_RANGE = 250;
const GOJO_BLUE_PROJECTILE_PULL_FORCE = 8;
const GOJO_BLUE_PROJECTILE_CAPTURE_MAX = 8;

// ── 赫（斥力球）──
const GOJO_RED_DAMAGE            = 120;
const GOJO_RED_KNOCKBACK         = 320;
const GOJO_RED_SPEED             = 8;
const GOJO_RED_STORED_HOMING_TURN = 7;
const GOJO_RED_STORED_HOMING_DURATION = 4.0;

// ── 紫（穿透高傷球）──
const GOJO_PURPLE_DAMAGE         = 250;   // 命中單一敵人傷害
const GOJO_PURPLE_SPEED          = 20.0;  // 極快（*60 → 720px/s）
const GOJO_PURPLE_RADIUS         = 25;
const GOJO_PURPLE_LIFESPAN       = 1.2;   // 存在時間（秒）
// 紫不再反彈、不再吸附、不再反射，穿透路徑上所有敵人（同一敵人只打一次）
const GOJO_PURPLE_EVERY_N        = 6;     // 每發射 6 發蒼/赫後，下一發為紫（僅六眼覺醒後）
const GOJO_DOMAIN_HOMING_TURN    = 5.0;   // 領域展開期間，蒼/赫球的追蹤轉向速率（rad/s）

// ── 無限制虛式紫（蒼+赫碰撞）──
const GOJO_CLASH_RADIUS          = 50;    // 蒼赫距離 < 此值 → 觸發爆炸
const GOJO_CLASH_DAMAGE          = 200;   // 爆炸傷害
const GOJO_CLASH_AOE_RADIUS      = 200;   // 爆炸範圍半徑（px）—— 想更大就調大這個
const GOJO_CLASH_SELF_REDUCE     = 0.8;   // 對 Gojo 自己的減傷比例（減 70%）

// ── 蒼拳（近戰）──
const GOJO_FIST_RANGE            = 60;    // 觸發距離（px）
const GOJO_FIST_DAMAGE           = 25;
const GOJO_FIST_COOLDOWN         = 0.8;
const GOJO_FIST_PULL_FORCE       = 250;   // 引力（拉向 Gojo）

// ── 領域展開・無量空處 ──
const GOJO_DOMAIN_HP_REQ         = 700;   // 血量 >= 此值才能展開
const GOJO_DOMAIN_DURATION       = 3.0;   // 持續秒數
const GOJO_DOMAIN_CD             = 10.0;  // 冷卻秒數
const GOJO_DOMAIN_SAFE_RADIUS    = 50;   // 展開時站在 Gojo 此範圍內免疫
const GOJO_DOMAIN_DPS            = 30;    // 每秒傷害（只對「不安全」的敵人）
const GOJO_DOMAIN_PARALYZE       = 3.0;   // 展開瞬間麻痺持續時間

// ── 舊常數保留（避免其他程式碼引用時報錯）──
const GOJO_PURPLE_FRAMEDMG       = 8;
const GOJO_PURPLE_CHANCE         = 0;
const GOJO_CHARGE_TIME           = 1.0;
const GOJO_FORCE                 = 10;
const GOJO_FORCE_RANGE           = 100;

// 詛咒之王常數
const CURSE_SLASH_INTERVAL    = 3.5;   // 解：斬痕發動間隔（秒）
const CURSE_SLASH_DAMAGE      = 150;   // 解：斬痕傷害
const CURSE_SLASH_SLOW_FACTOR = 0.4;   // 解：緩速倍率（剩幾成速度）
const CURSE_SLASH_SLOW_DUR    = 2.0;   // 解：緩速持續時間（秒）
const CURSE_SLASH_WARN_DUR    = 0.5;   // 解：預警箭頭持續時間（秒）
const CURSE_SLASH_PROJECTILE_SPEED = 2000; // 解：飛斬速度（px/s）
const CURSE_SLASH_PROJECTILE_WIDTH = 30;   // 解：飛斬判定寬度（px）
const CURSE_HACHI_HITS         = 5;    // 捌：連續小斬次數
const CURSE_HACHI_HIT_DAMAGE   = 15;   // 捌：每小斬傷害
const CURSE_HACHI_HIT_INTERVAL = 0.11; // 捌：每小斬間隔（秒）
const CURSE_HACHI_KNOCKBACK    = 260;  // 捌：總擊退力道（分攤到每次小斬）
const CURSE_HACHI_COOLDOWN     = 1.0;  // 捌：整段combo觸發後的冷卻
const CURSE_DOMAIN_HP         = 600;   // 伏魔御廚子：觸發血量
const CURSE_DOMAIN_RADIUS     = 150;   // 伏魔御廚子：範圍半徑（px）
const CURSE_DOMAIN_FRAMEDMG   = 4;     // 伏魔御廚子：每幀傷害
const CURSE_DOMAIN_FREEZE_DUR = 2.0;   // 伏魔御廚子：原地持續時間（秒）
const CURSE_KAMADO_SEASON_WINDOW = 10;  // 竈：「解」與「捌」需在此秒數內都命中同一敵人，才算完成料理
const CURSE_KAMADO_CHARGE_DUR    = 1.2;  // 竈：雙手凝聚火焰化為弓的蓄力時間（角色定身，速度極慢）
const CURSE_KAMADO_COOLDOWN      = 5.0;  // 竈：發動後的內建冷卻（主要仍受限於料理前提，此為保底防連發）
const CURSE_KAMADO_RANGE         = 190;  // 竈：射程極短
const CURSE_KAMADO_WIDTH         = 60;   // 竈：範圍極窄
const CURSE_KAMADO_DAMAGE        = 340;  // 竈：萬死之炎，單發近乎斬殺
const CURSE_KAMADO_BLAST_R       = 55;   // 竈：命中處爆炸半徑（波及爆心周圍角色）
const CURSE_KAMADO_BLAST_LIFE    = 0.5;  // 竈：爆炸視覺持續時間
const CURSE_KAMADO_ZONE_DUR      = 4.5;  // 竈：留下的燃燒地面持續時間（秒）
const CURSE_KAMADO_ZONE_DPS      = 30;   // 竈：燃燒地面每秒灼燒傷害



// 詛咒之王／詛咒之王・真祖 共用招式邏輯的取值輔助：依角色是否為Boss（ch.isBoss）
// 回傳對應的一份常數集合，讓戰鬥邏輯自動套用正確版本，兩邊互不影響。
const CURSE_STATS = {
  SLASH_INTERVAL: CURSE_SLASH_INTERVAL, SLASH_DAMAGE: CURSE_SLASH_DAMAGE,
  SLASH_SLOW_FACTOR: CURSE_SLASH_SLOW_FACTOR, SLASH_SLOW_DUR: CURSE_SLASH_SLOW_DUR,
  SLASH_WARN_DUR: CURSE_SLASH_WARN_DUR, SLASH_PROJECTILE_SPEED: CURSE_SLASH_PROJECTILE_SPEED,
  SLASH_PROJECTILE_WIDTH: CURSE_SLASH_PROJECTILE_WIDTH,
  HACHI_HITS: CURSE_HACHI_HITS, HACHI_HIT_DAMAGE: CURSE_HACHI_HIT_DAMAGE,
  HACHI_HIT_INTERVAL: CURSE_HACHI_HIT_INTERVAL, HACHI_KNOCKBACK: CURSE_HACHI_KNOCKBACK,
  HACHI_COOLDOWN: CURSE_HACHI_COOLDOWN,
  DOMAIN_HP: CURSE_DOMAIN_HP, DOMAIN_RADIUS: CURSE_DOMAIN_RADIUS,
  DOMAIN_FRAMEDMG: CURSE_DOMAIN_FRAMEDMG, DOMAIN_FREEZE_DUR: CURSE_DOMAIN_FREEZE_DUR,
  KAMADO_SEASON_WINDOW: CURSE_KAMADO_SEASON_WINDOW, KAMADO_CHARGE_DUR: CURSE_KAMADO_CHARGE_DUR,
  KAMADO_COOLDOWN: CURSE_KAMADO_COOLDOWN, KAMADO_RANGE: CURSE_KAMADO_RANGE,
  KAMADO_WIDTH: CURSE_KAMADO_WIDTH, KAMADO_DAMAGE: CURSE_KAMADO_DAMAGE,
  KAMADO_BLAST_R: CURSE_KAMADO_BLAST_R, KAMADO_BLAST_LIFE: CURSE_KAMADO_BLAST_LIFE,
  KAMADO_ZONE_DUR: CURSE_KAMADO_ZONE_DUR, KAMADO_ZONE_DPS: CURSE_KAMADO_ZONE_DPS
};

// 陷阱大師常數
const TRAP_DAMAGE          = 60;     // 尖刺碰撞傷害
const TRAP_DOT_DPS         = 40;     // 尖刺 dot 每秒傷害
const TRAP_DOT_DURATION    = 1.0;    // 尖刺 dot 持續時間（秒）
const TRAP_MAX_COUNT       = 8;      // 最多同時存在幾個尖刺
const TRAP_CHAIN_INTERVAL  = 3.0;    // 鎖鏈間隔（秒）
const TRAP_CHAIN_PULL_SPD  = 250;    // 鎖鏈拉扯速度（px/s）
const TRAP_CHAIN_PULL_DUR  = 0.7;    // 拉扯最長持續（秒）
const TRAP_HIT_COOLDOWN    = 1.2;    // 同一個尖刺再次傷害的CD（秒）

// 奕常數：棋盤型重做
const YI_BLACK_DAMAGE       = 0;     // 普通棋子本身不造成傷害
const YI_BLACK_INTERVAL     = 2.2;   // 每 2 秒落下一對棋子
const YI_BLACK_MAX          = 0;     // 舊白旗計數保留相容，不再使用
const YI_BLACK_RADIUS       = 7;     // 棋子顯示半徑（px）：縮小棋子，避免遮住放大的格線
const YI_GRID_LINE_COUNT    = 9;     // 9×9 交叉點棋盤
const YI_GRID_SPACING       = 42;    // 350px 標準場地的基準交叉點間距
const YI_GRID_REFERENCE_FIELD = 350; // 棋盤自適應的基準場地短邊
const YI_GRID_MIN_SPACING  = 20;     // 小場地仍可容納 9×9 棋盤的最低格距
const YI_GRID_MAX_SPACING  = 96;     // 大場地的格距上限，避免畫面過度疏散
const YI_GRID_BOARD_MARGIN = 6;      // 棋盤距離場地邊界的最小保留邊距
const YI_GRID_LINE_CELLS   = 4;      // 連星攻擊沿線延伸的格數
const YI_GRID_TRIGGER_RADIUS = 20;   // 敵人碰到棋子的觸發半徑（px）
const YI_GRID_LINE_TOLERANCE = 28;   // 舊版固定容許距離（動態幾何會優先使用格距比例）
const YI_GRID_LINE_RANGE    = 168;   // 舊版像素 fallback；實戰以動態格距×格數為準
const YI_MINE_DAMAGE        = 80;   // 連星每次引爆傷害
const YI_LINK_DAMAGE_BONUS  = 0.10; // 料敵先機：每個連線棋子 +10%
const YI_LINK_MAX_STACKS    = 3;     // 料敵先機最多三層
const YI_ADVANTAGE_SLOW_FACTOR = 0.5; // 取勢：敵人速度降至50%
const YI_ADVANTAGE_SLOW_DURATION = 2.0;
const YI_HEAVEN_COUNT        = 5;    // 天下劫每次五枚神之一手
const YI_HEAVEN_DAMAGE       = 60...;   // 神之一手範圍爆炸傷害
const YI_HEAVEN_RADIUS       = 55;   // 神之一手引爆範圍
const YI_HEAVEN_ARM_OFFSET   = 2;    // 中心到四方附棋的棋盤步數；中間保留一格空交叉點
const YI_HEAVEN_STONE_INTERVAL = 0.18; // 同一組內，中心棋與四方附棋的逐顆落子間隔
const YI_STONE_ACTIVATION_DELAY = 0.5; // 棋子落下後需等待 1 秒才可激活
const YI_HEAVEN_PLACE_INTERVAL = 2.0; // 天下劫每組神之一手的逐組落子間隔
const YI_HEAVEN_COOLDOWN     = 18.0; // 天下劫使用間隔
const YI_HEAVEN_FORCE_TIME   = 20.0; // 20 秒未觸發則立即施放
const YI_HEAVEN_VFX_INTRO    = 1.35; // 天下劫啟動時的威嚴展開脈衝（秒）
const YI_HEAVEN_VFX_AFTERGLOW = 1.80; // 五組棋子落完後保留的王座餘光（秒）
const YI_HEAVEN_VFX_RADIUS   = 108;  // 奕身周圍的棋局王座光場半徑（px）
// 舊常數保留，避免舊 HUD／存檔讀取時出現未定義；新奕流程不再使用小競技場。
const YI_WHITE_DAMAGE       = 200;
const YI_WHITE_PULL_SPEED   = 650;
const YI_WHITE_PULL_DUR     = 0.5;
const YI_WHITE_EXPLODE_RAD  = 60;
const YI_ARENA_HP           = 600;
const YI_ARENA_SIZE         = 100;
const YI_ARENA_DURATION     = 10.0;

// 無名槍手常數
const GUNNER_MAG_SIZE          = 6;     // 彈夾上限（撞牆幾次後開始連射）
const GUNNER_MAG_count          = 2;    //撞牆裝彈數

const GUNNER_BULLET_DAMAGE     = 45;    // 每顆子彈傷害
const GUNNER_BULLET_SPEED      = 700;   // 子彈飛行速度（px/s）
const GUNNER_BULLET_INTERVAL   = 0.09;   // 連射間隔（秒）
const GUNNER_BULLET_KNOCKBACK  = 100;   // 子彈擊退力道（px/s）
const GUNNER_FLASH_INTERVAL    = 8.0;   // 閃光彈CD（秒）
const GUNNER_FLASH_DAMAGE      = 80;   // 閃光彈傷害
const GUNNER_FLASH_RADIUS      = 110;   // 閃光彈命中角色時的爆炸半徑（px）
const GUNNER_FLASH_WALL_DAMAGE = 80;   // 閃光彈撞牆時的範圍傷害
const GUNNER_FLASH_WALL_RADIUS = 160;  // 閃光彈撞牆時的爆炸半徑（px）
const GUNNER_FLASH_COOLDOWN_FREEZE_DUR = 2.5;   // 閃光彈冷卻凍結持續時間（秒）
const GUNNER_FLASH_SLOW_FACTOR = 0.5;   // 閃光彈額外緩速：速度降至50%
const GUNNER_FLASH_SLOW_DURATION = 2.0; // 閃光彈額外緩速持續時間（秒）
const GUNNER_EXTRA_RELOAD_INTERVAL = 2.5; // 額外裝填週期（秒）
const GUNNER_EXTRA_RELOAD_COUNT = 2;       // 每次額外裝填子彈數
const GUNNER_FLASH_SPEED       = 480;   // 閃光彈飛行速度（px/s）
// ══════════════ 無名槍手本體技能：轉槍 ══════════════
const GUNNER_SPIN_DURATION       = 0.6;   // 轉槍持續時間（秒）
const GUNNER_SPIN_RADIUS_MULT    = 2.0;   // 消除投射物半徑 = 球半徑 × 此值
const GUNNER_SPIN_ROTATE_SPEED   = 26;    // 視覺旋轉速度（弧度/秒）
const GUNNER_SPIN_FLASH_INTERVAL = 0.08;  // 轉槍期間粒子噴射間隔
const GUNNER_SPIN_CLEAR_PARTICLE = 5;     // 每次消除投射物噴出的火花數
//武士常數

const SAMURAI_PARRY_INTERVAL   = 2.0;  // 招架CD（秒）
const SAMURAI_PARRY_DURATION   = 1.5;   // 招架持續時間（秒）
const SAMURAI_PARRY_REFLECT_MUL = 1.5;  // 反彈傷害倍率
const SAMURAI_PARRY_BUMP_DMG   = 100;   // 招架中碰到敵人球的傷害
const SAMURAI_PARRY_DMG_REDUCE = 0.7;   // 招架期間減傷比例（減少70%，只受到30%傷害）
const SAMURAI_IAIDO_DAMAGE     = 150;   // 居合傷害
const SAMURAI_IAIDO_SPEED      = 1200;   // 居合衝刺速度
const SAMURAI_IAIDO_DURATION   = 0.18;  // 居合衝刺持續時間（秒）
const SAMURAI_SHIMETSU_DAMAGE  = 150;   // 識滅斬每道傷害
const SAMURAI_SHIMETSU_COUNT   = 4;     // 識滅斬道數
const SAMURAI_IAIDO_MAX        = 4;     // 累積幾次居合觸發識滅斬
const SAMURAI_ACTION_FAILSAFE  = 2.75;  // 技能狀態最多持續秒數，避免旗標異常導致永久定身

// 末代武士 VFX 升級參數（只影響畫面，不改變傷害／判定／冷卻）
const SAMURAI_VFX_PARTICLE_CAP       = 220;  // 場上同時存在的武士粒子上限
const SAMURAI_VFX_PARRY_SPARKS       = 14;   // 招架啟動／反彈時的火花數
const SAMURAI_VFX_IAIDO_SPARKS       = 10;   // 居合啟動／命中時的刀氣數
const SAMURAI_VFX_SHIMETSU_SPARKS    = 18;   // 識滅斬每道斬波的噴濺數
const SAMURAI_VFX_IAIDO_TRAIL_GAP    = 0.032; // 居合殘影取樣間隔（秒）
const SAMURAI_VFX_SHIMETSU_TRAIL_GAP = 0.045; // 識滅斬拖尾取樣間隔（秒）
const SAMURAI_VFX_PARRY_RING_LIFE    = 0.62;  // 招架環展開時間（秒）
const SAMURAI_VFX_HIT_STOP_FLASH     = 0.16;  // 命中白芯閃光時間（秒）

// 魔術師常數
const MAGE_DOVE_INTERVAL       = 1.6;   // 丟鴿子CD（秒）
const MAGE_DOVE_DAMAGE         = 80;    // 鴿子傷害
const MAGE_DOVE_SPEED          = 350;   // 鴿子飛行速度（px/s）
const MAGE_CONJURE_PROJECTILES = ['curseword', 'amaterasu', 'dove', 'knife', 'bottle', 'ew_dawn', 'johnny_act2']; // 無中生有：沿用既有角色投射物
const MAGE_TELEPORT_DELAY      = 0.15;  // 丟鴿子後瞬移延遲（秒）
const MAGE_TRICK_HIT_COUNT     = 3;     // 命中幾次後觸發魔術技巧
const MAGE_TRICK_HEAL          = 120;   // 技巧1：回血量
const MAGE_TRICK_HOMING_TURN   = 300;   // 技巧3：追蹤轉向強度（px/s²，越大轉越快）
const MAGE_TRICK_FREEZE_DUR    = 1.5;   // 技巧4：定身持續秒數

// 雷電法王常數
const THUNDER_PILLAR_MAX          = 8;        // 最多同時存在幾個閃電柱
const THUNDER_PILLAR_RADIUS       = 14;       // 閃電柱半圓半徑（顯示用）
const THUNDER_STRIKE_INTERVAL     = 1.8;      // 閃電連線發射間隔（秒）
const THUNDER_STRIKE_DAMAGE       = 20;       // 每條閃電連線傷害（每條獨立計算）
const THUNDER_PARALYZE_CHANCE     = 0.15;     // 麻痺機率
const THUNDER_PILLAR_LIFETIME     = 17; // 閃電柱存在時間（Infinity = 永久）
const THUNDER_STRIKE_HIT_RADIUS   = 55;       // 閃電線命中判定額外半徑（px，需夠大才能跨牆命中）
const THUNDER_STRIKE_FX_DURATION  = 0.35;     // 閃電特效持續時間（秒）
const THUNDER_PILLAR_MIN_DIST     = 20;       // 同牆放置柱子的最小間距（px）
const THUNDER_PILLAR_FADE_IN      = 1.5;      // 有限壽命時，最後幾秒開始淡出（秒）
const THUNDER_HIT_FX_R1           = 35;       // 命中大閃光半徑
const THUNDER_HIT_FX_R2           = 18;       // 命中小閃光半徑
const THUNDER_SPAWN_FX_R          = 24;       // 放置柱子閃光半徑


// 鍛造師常數
const SMITH_FORGE_INTERVAL_BASE   = 1.2;   // 初始鍛造間隔（秒）
const SMITH_FORGE_INTERVAL_MIN    = 0.3;   // 最快鍛造間隔（秒）
const SMITH_FORGE_ACCEL           = 0.15;  // 每次鍛造後間隔縮短比率（越鍛越快）
const SMITH_FORGE_DMG_PER_STACK   = 10;     // 每層鍛造加傷（永久疊加，不重置）
const SMITH_FORGE_MAX_STACKS      = 40;    // 最大鍛造層數上限
const SMITH_SWORD_BASE_DAMAGE     = 20;    // 劍擊基礎傷害（初期很低，靠鍛造層數疊加變強）
const SMITH_SWORD_RANGE           = 100;   // 劍擊判定距離（px）
const SMITH_SWORD_COOLDOWN        = 1.0;   // 劍擊CD（秒）
const SMITH_SWORD_KNOCKBACK       = 250;   // 劍擊擊退力道（px/s）

// 禪院直哉常數
const NAOBITO_PATH_INTERVAL       = 2.5;   // 重新規劃路徑間隔（秒）
const NAOBITO_DASH_SPEED          = 600;   // 衝刺速度（px/s）
const NAOBITO_WAYPOINT_COUNT      = 6;     // 每次路徑中繼點數量
const NAOBITO_SHADOW_LIFETIME     = 3;   // 殘影存活時間（秒）
const NAOBITO_SHADOW_MAX          = 6;     // 最多同時存在殘影數
const NAOBITO_SHADOW_DAMAGE       = 20;    // 殘影接觸傷害
const NAOBITO_SHADOW_HIT_RADIUS   = 20;    // 殘影命中判定半徑（px）
const NAOBITO_SHADOW_HIT_COOLDOWN = 0.5;   // 同一殘影再次傷害CD（秒）
const NAOBITO_KYOUSEI_THRESHOLD   = 4;     // 凶星軌跡觸發所需殘影數
const NAOBITO_KYOUSEI_PIERCE_DMG  = 60;    // 凶星軌跡本體穿刺傷害
const NAOBITO_KYOUSEI_SHADOW_DMG  = 30;    // 凶星軌跡每殘影傷害
const NAOBITO_KYOUSEI_SPEED       = 650;   // 凶星軌跡衝刺速度（px/s）
const NAOBITO_KYOUSEI_COOLDOWN    = 5.0;   // 凶星軌跡觸發後CD（秒）
const NAOBITO_PATH_DEVIATION      = 80;   // 路徑中繼點偏移量（px）
const NAOBITO_RETREAT_DISTANCE    = 20;   // 接近敵人後，遠離的距離（px）
const NAOBITO_DASH_MAX_DURATION   = 2.0;   // 單次衝刺最大持續時間（秒），超時強制結束避免卡住
const NAOBITO_CONTACT_IMMOBILIZE_DURATION = 1.0; // 投射法術移動碰撞：命中對手後定身秒數
const NAOBITO_CONTACT_COOLDOWN   = 0.75;  // 同一次接觸的防重複觸發間隔（秒）


// 宇治波鼬常數
const ITACHI_AMATERASU_INTERVAL = 2.0;   // 天照CD（秒）
const ITACHI_AMATERASU_SPEED    = 600;   // 黑炎飛行速度（px/s）
const ITACHI_AMATERASU_DAMAGE   = 70;    // 天照命中傷害
const ITACHI_AMATERASU_NEXT_DAMAGE_BONUS = 50; // 天照：目標下次受到傷害固定增加50點
const ITACHI_TSUKUYOMI_INTERVAL = 6.0;   // 月讀CD（秒）
const ITACHI_TSUKUYOMI_PIN_DUR  = 2.0;   // 定身持續時間（秒）
const ITACHI_CROW_HEAL          = 200;   // 烏鴉替身恢復血量
const ITACHI_SUSANOO_HP_THRESHOLD = 500; // 須佐能乎觸發血量
const ITACHI_SUSANOO_DURATION   = 9.0;   // 須佐能乎持續時間（秒）
const ITACHI_SUSANOO_DMG_REDUCE = 0.5;   // 須佐能乎減傷比例
const ITACHI_SUSANOO_BITE_DAMAGE = 50;   // 須佐能乎近戰每擊傷害
const ITACHI_SUSANOO_BITE_HEAL   = 30;   // 須佐能乎近戰每擊吸血
const ITACHI_SUSANOO_BITE_INTERVAL = 0.3; // 刺擊CD（秒），避免擦身連續觸發過密
const ITACHI_TSUKUYOMI_STAB_DAMAGE = ITACHI_SUSANOO_BITE_DAMAGE; // 月讀雙側刺擊沿用須佐每擊傷害
const ITACHI_TSUKUYOMI_STAB_INTERVAL = ITACHI_SUSANOO_BITE_INTERVAL; // 月讀定身期間刺擊節奏
const ITACHI_SUSANOO_BITE_COOLDOWN = 0.8;  // 近戰結束CD（秒）
const ITACHI_SUSANOO_BITE_RANGE  = RADIUS * 2 + 50; // 須佐能乎近戰判定距離（px）

// 乙骨憂太常數
const YUTA_CURSEWORD_INTERVAL    = 2.5;   // 咒言發射CD（秒）
const YUTA_CURSEWORD_DAMAGE      = 50;    // 咒言命中傷害
const YUTA_CURSEWORD_SPEED       = 420;   // 咒言子彈飛行速度（px/s）
const YUTA_BIND_DURATION         = 1.5;   // 咒言命中後的禁錮時間（秒）
const YUTA_BIND_COOLDOWN         = 4.5;   // 禁錮效果自身CD（秒，避免無限連續禁錮）
const YUTA_SLASH_RANGE           = 100;   // 咒力斬判定距離（px，佔位數值）
const YUTA_SLASH_COOLDOWN        = 1.0;   // 咒力斬CD（秒，佔位數值）
const YUTA_SLASH_DAMAGE          = 40;    // 咒力斬固定傷害（無蓄力疊層）
const YUTA_SLASH_HIT_THRESHOLD   = 3;     // 咒力斬累積命中幾次後永久召喚里香
const YUTA_RIKA_FOLLOW_RADIUS    = 40;    // 里香跟隨乙骨的距離（px）
const YUTA_RIKA_CLAW_INTERVAL    = 3.0;   // 里香揮爪CD（秒）
const YUTA_RIKA_CLAW_WARN_DUR    = 0.3;   // 揮爪預警時間（秒，預警結束才造成傷害）
const YUTA_RIKA_CLAW_DAMAGE      = 180;   // 里香揮爪傷害
const YUTA_RIKA_CLAW_RANGE       = 120;   // 里香揮爪判定距離（px）
const YUTA_RIKA_CANNON_INTERVAL  = 8.0;  // 純愛大砲CD（秒）
const YUTA_RIKA_CANNON_WARN_DUR  = 0.5;   // 大砲預警時間（秒，預警結束才開始造成傷害）
const YUTA_RIKA_CANNON_DURATION  = 6.0;  // 純愛大砲持續時間（秒）
const YUTA_RIKA_CANNON_DPS       = 60;    // 純愛大砲每秒傷害
const YUTA_RIKA_CANNON_RANGE     = 110;   // 純愛大砲判定距離（px，光柱寬度的判定半徑）
const YUTA_RIKA_PASSIVE_DMG_MULT = 1.5;   // 里香在場時，乙骨非里香攻擊的傷害倍率（+50%）
const YUTA_RIKA_PASSIVE_CD_CUT   = 0.5;   // 里香在場時，乙骨非里香攻擊的CD縮減（秒）

// 工程師常數
const ENGINEER_TURRET_INTERVAL    = 2.6;   // 召喚炮台間隔（秒）
const ENGINEER_TURRET_LIFETIME    = 9.0;  // 炮台存在時間（秒）
const ENGINEER_TURRET_FIRE_INTERVAL = 1.1; // 炮台開火間隔（秒）
const ENGINEER_TURRET_BULLET_DAMAGE = 30;  // 炮台子彈傷害
const ENGINEER_TURRET_BULLET_SPEED  = 480; // 炮台子彈飛行速度（px/s）
const ENGINEER_MECH_TURRET_THRESHOLD = 6; // 累積幾個炮台後觸發機甲模式
const ENGINEER_MECH_DURATION      = 15.0;  // 機甲模式持續時間（秒）
const ENGINEER_MECH_DMG_REDUCE    = 0.20;  // 機甲模式減傷比例
const ENGINEER_LASER_INTERVAL     = 1.0;   // 機甲模式雷射發射間隔（秒）
const ENGINEER_LASER_DAMAGE       = 50;    // 雷射傷害
const ENGINEER_LASER_WIDTH        = 26;    // 雷射光束寬度（px）
const ENGINEER_LASER_RANGE        = 900;   // 雷射長度（px，足以橫跨場地）
const ENGINEER_LASER_TRAVEL_TIME  = 0.18;  // 雷射判定持續時間（視覺＋判定，秒）
const ENGINEER_GRID_INTERVAL      = 7;   // 電網部署間隔（秒）
const ENGINEER_GRID_HALF          = 70;    // 電網半邊長（px，略小於奕的100px）
const ENGINEER_GRID_LIFETIME      = 2.5;   // 電網存在時間（秒）
const ENGINEER_GRID_DPS           = 20;    // 電網每秒傷害
const ENGINEER_GRID_STUN_BUFFER   = 0.15;  // 每次重新施加暈眩的緩衝（秒，避免每幀重置造成卡頓視覺）


// 砲爹常數
const CANNON_MELEE_DAMAGE        = 30;    // 近戰拳頭傷害
const CANNON_MELEE_COOLDOWN      = 0.6;   // 近戰拳頭CD（秒）
// 追蹤光球
const CANNON_TRACK_COUNT         = 3;     // 追蹤光球數量
const CANNON_TRACK_DAMAGE        = 30;    // 每顆追蹤光球傷害
const CANNON_TRACK_COOLDOWN      = 1.0;   // 使用完追蹤後的CD（秒）
const CANNON_TRACK_SPEED         = 280;   // 追蹤光球飛行速度（px/s）
const CANNON_TRACK_RADIUS        = 7;     // 追蹤光球半徑
const CANNON_TRACK_TURN_RATE     = 1.6;   // 追蹤轉向速率（弧度/秒）
const CANNON_TRACK_SPREAD        = 0.45;  // 初始散射角度（弧度）
const CANNON_TRACK_LIFESPAN      = 4.0;   // 追蹤光球存在時間（秒）
// 光柱
const CANNON_BEAM_DAMAGE         = 90;    // 光柱傷害
const CANNON_BEAM_COOLDOWN       = 1.0;   // 光柱CD（秒）
const CANNON_BEAM_WIDTH          = 22;    // 光柱寬度（px）
const CANNON_BEAM_RANGE          = 900;   // 光柱長度（px）
const CANNON_BEAM_TRAVEL_TIME    = 0.18;  // 光柱視覺＋判定持續時間（秒）
// 光砲
const CANNON_BLAST_CHARGE_TIME   = 0.3;   // 光砲蓄力時間（秒）
const CANNON_BLAST_SHOT_TIME     = 0.2;   // 每次發射持續時間（秒）
const CANNON_BLAST_SHOTS         = 3;     // 連射次數
const CANNON_BLAST_DAMAGE        = 90;   // 每次發射傷害
const CANNON_BLAST_HALFWIDTH     = 55;    // 光砲半寬（約乙骨純愛大砲的一半）
const CANNON_BLAST_COOLDOWN      = 2.4;   // 光砲CD（秒）
// 砲爹 vs 乙骨 專屬決鬥終結
const CANNON_DUEL_HP_THRESHOLD   = 300;   // 雙方血量都低於此值時觸發
const CANNON_DUEL_CHARGE_TIME    = 2.5;   // 決鬥蓄力時間（秒）
const CANNON_DUEL_BEAM_TIME      = 1;   // 雙方光砲對射時間（秒）
const CANNON_DUEL_EXPLODE_TIME   = 0.6;   // 中間爆炸膨脹時間（秒）

// DIO 常數
const DIO_STAND_RADIUS        = 50;    // 替身環繞半徑
const DIO_STAND_HIT_RANGE     = RADIUS + 16; // 替身觸碰判定距離
const DIO_STAND_PUNCH_INTERVAL = 0.2;  // 替身連打間隔（秒）
const DIO_STAND_PUNCH_DAMAGE  = 10;    // 替身每拳傷害
const DIO_WORLD_COOLDOWN      = 10;    // 世界CD（秒）
const DIO_WORLD_DURATION      = 3;     // 世界時停持續（秒）
const DIO_WORLD_HIGH_DURATION = 5;     // HIGH狀態時停持續（秒）
const DIO_WORLD_KNIFE_INTERVAL = 0.5;  // 時停中布刀間隔（秒）
const DIO_STAND_SIZE          = 1.5;   // 替身大小倍率（相對於 RADIUS）
const DIO_KNIFE_DAMAGE        = 25;    // 飛刀傷害
const DIO_KNIFE_SPEED         = 700;   // 飛刀飛行速度
const DIO_BREAD_SPAWN_MIN     = 2;     // 麵包生成間隔下限（秒）
const DIO_BREAD_SPAWN_MAX     = 5;     // 麵包生成間隔上限（秒）
const DIO_BREAD_RADIUS        = 16;    // 麵包判定半徑
const DIO_BREAD_HEAL          = 40;    // 吃麵包回血量
const DIO_BREAD_HIGH_THRESHOLD = 6;    // 吃幾個麵包進入HIGH狀態
const DIO_STEAMROLLER_SPEED   = 400;   // 壓路機衝刺速度
const DIO_STEAMROLLER_DAMAGE  = 80;    // 壓路機命中傷害
const DIO_STEAMROLLER_RADIUS  = 40;    // 壓路機碰撞半徑
const DIO_RUSH_SPEED          = 260;   // HIGH結束後衝刺速度
const DIO_RUSH_DURATION       = 2.2;   // 衝刺連打持續時間（秒）
const DIO_RUSH_PUNCH_INTERVAL = 0.15;  // 衝刺連打間隔（秒）
const DIO_RUSH_PUNCH_DAMAGE   = 15;    // 衝刺連打每拳傷害
// 虎天帝常數
const TIGER_PUNCH_INTERVAL      = 2.6;   // 徑庭拳CD（秒）
const TIGER_PUNCH_CHARGE_TIME   = 0.4;   // 蓄力時間（秒）
const TIGER_PUNCH_RANGE         = 130;   // 徑庭拳判定範圍（px）
const TIGER_PUNCH_DMG1          = 80;    // 徑庭拳第一段傷害
const TIGER_PUNCH_DMG2          = 50;    // 徑庭拳第二段傷害（延遲追加）
const TIGER_PUNCH_DELAY2        = 1;  // 第二段傷害延遲（秒）
const TIGER_PUNCH_KNOCKBACK     = 280;   // 徑庭拳擊退力道
const TIGER_BLACK_FLASH_CHANCE  = 0.20;  // 黑閃機率
const TIGER_BLACK_FLASH_MUL1    = 1.5;   // 黑閃第一段倍率
const TIGER_BLACK_FLASH_MUL2    = 1.5;   // 黑閃第二段倍率
const TIGER_BLOODSHOT_COST      = 50;    // 穿血自耗血量
const TIGER_BLOODSHOT_DMG       = 60;    // 穿血傷害
const TIGER_BLOODSHOT_SPEED     = 600;   // 穿血速度
const TIGER_BLOODSHOT_COOLDOWN  = 2.2;   // 穿血CD（秒）
const TIGER_BLOOD_ORB_RADIUS    = 10;    // 血球半徑
const TIGER_BLOOD_ORB_LIFETIME  = 12.0;  // 血球存活時間（秒）
const TIGER_NOVA_THRESHOLD      = 3;     // 超新星觸發所需血球數
const TIGER_NOVA_COOLDOWN       = 4.0;   // 超新星最少CD（秒）：兩次引爆間至少間隔這麼久
const TIGER_NOVA_CHARGE_TIME    = 0.7;   // 超新星發動前在原地蓄力的時間（秒）
const TIGER_NOVA_NEEDLE_COUNT   = 14;    // 超新星血流針數量
const TIGER_NOVA_NEEDLE_SPEED   = 400;   // 血流針飛行速度
const TIGER_NOVA_NEEDLE_DMG     = 30;    // 每根血流針傷害
const TIGER_NOVA_NEEDLE_RANGE   = 140;   // 血流針有效射程
const TIGER_BLEED_RATIO         = 0.65;  // 受傷有多少比例轉為流血
const TIGER_BLEED_DPS           = 18;    // 流血每秒傷害
const TIGER_BLEED_MAX_POOL      = 600;   // 流血最大累積量（血條未扣部分上限）

// 星星女孩常數
const STAR_BIG_COOLDOWN         = 6.0;   // 大星星CD（秒）
const STAR_BIG_SPEED            = 250;   // 大星星飛行速度（px/s）
const STAR_BIG_DAMAGE           = 60;    // 大星星碰到敵人傷害
const STAR_BIG_RADIUS           = 14;    // 大星星半徑（px）
const STAR_BIG_MAX              = 3;     // 場上最多大星星數量
const STAR_BIG_LIFETIME         = 12.0;  // 大星星存活時間（秒）
const STAR_SMALL_COUNT          = 5;     // 星散爆出小星星數
const STAR_SMALL_SPEED          = 300;   // 小星星速度（px/s）
const STAR_SMALL_DAMAGE         = 20;    // 小星星碰敵人傷害
const STAR_SMALL_RADIUS         = 8;     // 小星星半徑（px）
const STAR_SMALL_LIFETIME       = 10.0;  // 小星星存活時間（秒）
const STAR_EXPLODE_DAMAGE       = 80;    // 小星星接觸爆炸傷害（碰小星星/大星星/女孩）
const STAR_METEOR_DURATION      = 3.0;   // 星隕持續時間（秒）
const STAR_METEOR_COOLDOWN      = 12.0;  // 星隕CD時間（秒）
const STAR_METEOR_INTERVAL      = 0.25;  // 星隕每次生成間隔（秒）
const STAR_METEOR_DAMAGE        = 40;    // 星隕每顆傷害
const STAR_METEOR_RADIUS        = 10;    // 星隕彈半徑（px）
const STAR_METEOR_SPEED         = 420;   // 星隕飛行速度（px/s）
const STAR_METEOR_WARNING_TIME  = 0.4;   // 落點預警時間（秒）

// 帶土（宇智波帶土）常數
const OBITO_FIREBALL_COOLDOWN    = 10.0;  // 火球CD（秒）
const OBITO_FIREBALL_SPEED       = 300;   // 火球速度（px/s）
const OBITO_FIREBALL_DAMAGE      = 80;    // 火球傷害
const OBITO_FIREBALL_RADIUS      = 14;    // 火球半徑
const OBITO_DASH_SPEED           = 700;   // 衝刺速度（px/s）
const OBITO_DASH_DURATION        = 0.5;   // 衝刺持續時間（秒）
const OBITO_DASH_DELAY           = 0.6;   // 丟火球後延遲多久才衝刺（秒）
const OBITO_SPACE_ENTRY_DAMAGE   = 60;    // 進出神威空間傷害
const OBITO_KAMUI_COOLDOWN       = 7.0;   // 神威CD（秒）
const OBITO_KAMUI_GHOST_TIME     = 1.2;   // 虛影存在時間（秒，等待攻擊判定）
const OBITO_KAMUI_CHAIN_DAMAGE   = 6;    // 鐵鏈揮舞每幀傷害（主場轉移版）
const OBITO_KAMUI_CHAIN_RADIUS   = 60;    // 鐵鏈範圍半徑
const OBITO_KAMUI_BOMB_DAMAGE    = 40;    // 起爆符傷害
const OBITO_KAMUI_BOMB_RADIUS    = 80;    // 起爆符爆炸半徑
const OBITO_KAMUI_CHAIN_DURATION = 0.5;   // 鐵鏈揮舞持續時間（秒）
const OBITO_SPACE_W              = 160;   // 神威空間寬度（px，顯示用）
const OBITO_SPACE_H              = 160;   // 神威空間高度（px，顯示用）
const OBITO_KAMUI_GRAB_SPEED     = 600;   // 空間內衝刺速度
const OBITO_KAMUI_GRAB_DURATION  = 0.5;   // 空間內衝刺持續時間
const OBITO_KAMUI_THROW_DAMAGE   = 40;    // 抓敵人甩飛傷害
const OBITO_ABSORB_MAX_STORED    = 6;    // 最多儲存幾顆投射物（虛化態吸收上限）
const OBITO_PHASE_INTERVAL       = 3.0;  // 虛化態間隔（秒）
const OBITO_PHASE_DURATION       = 0.5;  // 虛化態持續時間（秒）
const OBITO_PHANTOM_DAMAGE       = 40;   // 假想子彈碰到對手傷害



// 釣魚佬
const FISHER_CAST_COOLDOWN   = 1.0;   // 基礎釣魚CD
const FISHER_AIRFORCE_CD_REDUCTION = 0.2; // 每次空軍後永久減少的釣魚CD
const FISHER_MIN_CAST_COOLDOWN = 0.1; // 防止空軍疊層後變成零間隔
const FISHER_CAST_TIME       = 0.2;   // 拋竿到邊緣耗時
const FISHER_BITE_TIME       = 0.2;  // 咬鉤停頓
const FISHER_REEL_TIME       = 0.2;   // 收線耗時
const FISHER_RESULT_WEIGHTS  = { fish: 30, shark: 8, airforce: 6, bossfish:4 , ocean: 2 };
// 魚
const FISHER_FISH_DMG        = 30;
const FISHER_FISH_SPEED      = 480;
const FISHER_FISH_RED_DELAY  = 1.0;
const FISHER_FISH_RED_DMG    = 50;
// 鯊魚
const FISHER_SHARK_DMG       = 70;
const FISHER_SHARK_SPEED     = 620;
const FISHER_SHARK_BLEED_DUR = 3.0;
const FISHER_SHARK_BLEED_DPS = 70;    // 每0.1秒7傷害 = 70/s
// 首領魚
const FISHER_BOSSFISH_COUNT  = 10;
const FISHER_BOSSFISH_TOTAL  = 240;
const FISHER_BOSSFISH_DMG    = FISHER_BOSSFISH_TOTAL / FISHER_BOSSFISH_COUNT;
const FISHER_BOSSFISH_GAP    = 0.05;  // 每尾魚間隔
const FISHER_BOSSFISH_SPEED  = 480;
// 大海
const FISHER_OCEAN_WAVE_COUNT   = 8;
const FISHER_OCEAN_WAVE_DMG     = 70;
const FISHER_OCEAN_WAVE_GAP     = 0.25;
const FISHER_OCEAN_WAVE_SPEED   = 900;
const FISHER_OCEAN_WAVE_WIDTH   = 46;
const FISHER_OCEAN_HOOK_DMG     = 10;
const FISHER_OCEAN_SLAM_DMG     = 130;
const FISHER_OCEAN_DASH_SPEED   = 780;
const FISHER_OCEAN_GRAB_HOLD    = 0.3;  // 勾住後揮甩停頓時間

// 夏油條（咒靈操術）專屬常數 ────────────────
const GETO_MAX_STOCK          = 200;   // 咒靈庫存上限
const GETO_SPAWN_INTERVAL     = 1.0;   // 每隔幾秒消耗一隻庫存召喚小型咒靈
const GETO_SPIRIT_HP          = 27;    // 小型咒靈血量
const GETO_SPIRIT_DAMAGE      = 30;    // 小型咒靈碰觸傷害
const GETO_SPIRIT_SPEED       = 105;   // 小型咒靈追擊速度
const GETO_SPIRIT_RADIUS      = 13;
const GETO_SPIRIT_CONTACT_CD  = 1.0;   // 咒靈碰觸傷害的間隔
const GETO_SPIRIT_RETALIATE   = 27;     // 每次咬到敵人後承受少量反震，避免剛接觸就快速消失
const GETO_SPIRIT_LIFESPAN    = 14;    // 咒靈最長存活時間（避免場面爆滿）

const GETO_SPECIAL_TRIGGER_RATIO = 0.5;   // 血量剩餘比例：觸發召喚特級咒靈
const GETO_SPECIAL_HP            = 400;   // 特級咒靈血量
const GETO_SPECIAL_SHIELD_RATIO  = 0.3;   // 護身：承擔夏油條所受傷害的比例
const GETO_SPECIAL_FOLLOW_RADIUS = 55;    // 特級咒靈繞著夏油條的跟隨半徑
const GETO_SPECIAL_RADIUS        = 27;

const GETO_ENTANGLE_INTERVAL     = 5.0;   // 糾纏：枝條發射間隔
const GETO_ENTANGLE_RANGE        = 340;   // 糾纏：命中判定範圍
const GETO_ENTANGLE_TICKS        = 4;     // 糾纏：持續傷害跳動次數
const GETO_ENTANGLE_TICK_TIME    = 0.5;   // 糾纏：每跳間隔
const GETO_ENTANGLE_TICK_DMG     = 22;    // 糾纏：每跳傷害
const GETO_ENTANGLE_HEAL_RATIO   = 0.6;   // 糾纏：造成傷害轉換為夏油條回復的比例
const GETO_ENTANGLE_BRANCH_MAX   = 6;     // 糾纏：身上最多同時存在的枝條數
const GETO_ENTANGLE_BRANCH_GROW  = 0.3;   // 糾纏：單根枝條長成所需時間
const GETO_ENTANGLE_BRANCH_FADE  = 1.2;   // 糾纏：DoT結束後枝條凋零所需時間

const GETO_BIND_COOLDOWN         = 5.0;   // 定身：CD（雙方解除硬直後才開始計算）
const GETO_BIND_RANGE            = 440;   // 定身：發動距離
const GETO_BIND_DURATION         = 2.0;   // 定身：硬直時間

const GETO_SURGE_COOLDOWN        = 6.0;   // 咒力奔流：CD
const GETO_SURGE_RANGE           = 480;   // 咒力奔流：發動距離
const GETO_SURGE_CHARGE_TIME     = 1.4;   // 咒力奔流：蓄力時間
const GETO_SURGE_DAMAGE          = 95;    // 咒力奔流：傷害
const GETO_SURGE_VULN_MULT       = 1.5;   // 咒力奔流：蓄力中特級咒靈承受傷害倍率（破綻）

const GETO_ULTIMATE_TRIGGER_RATIO = 0.25; // 極之番•漩渦：觸發血量比例
const GETO_ULTIMATE_CHARGE_TIME   = 2;  // 極之番•漩渦：蓄力時間
const GETO_ULTIMATE_BASE_DMG      = 250;  // 極之番•漩渦：基礎傷害
const GETO_ULTIMATE_STOCK_MULT    = 0.6;  // 極之番•漩渦：庫存咒靈加成係數
const GETO_ULTIMATE_SPEED         = 700;  // 極之番•漩渦：光球飛行速度
const GETO_ULTIMATE_RADIUS        = 50;

const GETO_CANE_DAMAGE           = 40;    // 游雲（被動）：貼身棍擊傷害
const GETO_CANE_COOLDOWN         = 2.0;   // 游雲：CD
const GETO_CANE_KNOCKBACK        = 200;   // 游雲：擊退速度

// ── Oblivionis（豐川祥子）專屬常數 ──
const SAKIKO_NOTE_MAX_STACK      = 12;    // 場上音符（含Nova）上限層數
const SAKIKO_NOTE_DMG_PER_STACK  = 0.04;  // 場上每多1顆音符，傷害加成比例（滿層+40%）
const SAKIKO_PIANO_DAMAGE        = 25;    // 🎹鋼琴模式：音符基礎傷害
const SAKIKO_PIANO_INTERVAL      = 0.9;   // 🎹鋼琴模式：發射間隔（攻速較慢）
const SAKIKO_PIANO_SPEED         = 180;   // 🎹鋼琴模式：音符移動速度（較慢）
const SAKIKO_ORGAN_DAMAGE        = 13;    // 🎺管風琴模式：音符基礎傷害（較低）
const SAKIKO_ORGAN_INTERVAL      = 0.45;  // 管風琴模式：發射間隔（攻速大幅提升）
const SAKIKO_ORGAN_SPEED         = 290;   // 管風琴模式：音符移動速度（較快）
const SAKIKO_NOTE_RADIUS         = 7;     // 音符判定半徑
const SAKIKO_NOTE_TURN_RATE      = 5.0;   // 音符追蹤轉向速率（弧度/秒）
const SAKIKO_NOTE_LIFESPAN       = 6.0;   // 音符最長存在時間（秒）

const SAKIKO_FEVER_MAX           = 450;   // Fever值上限
const SAKIKO_FEVER_PER_HIT       = 15;     // 音符命中敵人時，Fever增加量

const SAKIKO_NOVA_COOLDOWN       = 10.0;   // 新月甦醒：CD
const SAKIKO_NOVA_COUNT          = 8;     // 新月甦醒：連續釋放音符數
const SAKIKO_NOVA_GAP            = 0.09;  // 新月甦醒：每發間隔
const SAKIKO_NOVA_SPEED          = 340;   // 新月甦醒：音符飛行速度
const SAKIKO_NOVA_BASE_DAMAGE    = 60;    // 新月甦醒：單發滿額（80%）時的參考傷害
const SAKIKO_NOVA_DECAY_START    = 0.8;   // 新月甦醒：第一發傷害倍率（80%）
const SAKIKO_NOVA_DECAY_END      = 0.04;  // 新月甦醒：最後一發傷害倍率（4%）

const SAKIKO_DUAL_DURATION       = 4.0;   // 殘月的餘韻：雙音色齊發＋不死持續時間
const SAKIKO_DUAL_FIRE_INTERVAL  = 0.25;  // 殘月的餘韻：期間每個音色的發射間隔（比平時快，但不過度誇張）
const SAKIKO_DUAL_SPAWN_BURST    = 1;     // 殘月的餘韻：每次觸發噴出的音符數
const SAKIKO_DUAL_NOTE_CAP       = 30;    // 殘月的餘韻：期間場上音符數量上限
const SAKIKO_DUAL_SPREAD         = 0.35;  // 殘月的餘韻：音符噴發散射角度（弧度）

// 大喬（波紋使者）
const JOSEPH_CHARGE_TIME         = 1;   // 波紋呼吸法蓄力時間
const JOSEPH_RETRY_DELAY         = 5.0;   // 蓄力中斷後，再次嘗試的等待時間
const JOSEPH_ATTEMPT_DEADLINE    = 60.0;  // 開局後嘗試進入波紋呼吸法的總時限（超過則放棄，維持素體狀態）
const JOSEPH_CONTACT_DMG_RIPPLE  = 25;    // 波紋呼吸法期間，碰觸傷害
const JOSEPH_CONTACT_DMG_BASE    = 5;     // 未開啟波紋呼吸法，碰觸傷害
const JOSEPH_CONTACT_CD          = 0.45;  // 碰觸觸發CD（避免同一次貼身重複計算）
const JOSEPH_HP_REGEN_INTERVAL   = 1.0;   // 波紋呼吸法：定時回血間隔
const JOSEPH_HP_REGEN_AMOUNT     = 10;     // 定時回血量
const JOSEPH_HP_REGEN_ON_HIT     = 30;     // 每次造成傷害，額外回血量
const JOSEPH_DASH_COOLDOWN       = 4.0;   // 波紋疾走CD
const JOSEPH_DASH_RANGE          = 170;   // 波紋疾走觸發距離
const JOSEPH_DASH_DAMAGE         = 50;    // 波紋疾走傷害
const JOSEPH_DASH_STACK          = 1;     // 波紋疾走附加波紋層數
const JOSEPH_SPRING_COOLDOWN     = 7.0;   // 彈簧拳CD
const JOSEPH_SPRING_RANGE        = 350;   // 彈簧拳觸發距離（中距離，大於波紋疾走）
const JOSEPH_SPRING_DAMAGE       = 80;    // 彈簧拳傷害
const JOSEPH_SPRING_STACK        = 2;     // 彈簧拳附加波紋層數
const JOSEPH_ULTIMATE_UNLOCK     = 25.0;  // 進入波紋呼吸法後，經過多久解鎖SYO
const JOSEPH_ULTIMATE_RANGE      = 140;   // SYO 第一拳觸發距離
const JOSEPH_ULTIMATE_COOLDOWN   = 14.0;  // SYO 每次發動（不論命中與否）後的CD
const JOSEPH_ULTIMATE_FIRST_DMG  = 20;    // SYO 第一拳傷害
const JOSEPH_ULTIMATE_COMBO_HITS = 8;     // SYO 連續痛擊次數（共100傷害，均分）
const JOSEPH_ULTIMATE_COMBO_DMG  = 160;   // SYO 連續痛擊總傷害
const JOSEPH_ULTIMATE_COMBO_INTERVAL = 0.12; // SYO 連續痛擊每下間隔
const JOSEPH_ULTIMATE_FINAL_DMG  = 15;    // SYO 最後一拳（擊退）額外傷害
const JOSEPH_ULTIMATE_FINAL_STACK = 3;    // SYO 最後一拳附加波紋層數（一般情況）
const JOSEPH_ULTIMATE_FINAL_KNOCKBACK = 320; // SYO 最後一拳擊退力道
const JOSEPH_ULTIMATE_DIO_PIERCE = 10;    // 面對DIO：最後一拳額外貫穿傷害
const JOSEPH_ULTIMATE_DIO_STACK  = 28;    // 面對DIO：最後一拳附加波紋層數
const JOSEPH_DIO_START_HP_COST   = 50;    // 面對DIO：開局直接進入波紋呼吸法所付出的血量代價
const RIPPLE_TICK_INTERVAL       = 1.0;   // 波紋層數：每秒結算一次
const RIPPLE_TICK_DMG_PER_STACK  = 2;   // 波紋層數：每層每秒傷害
const RIPPLE_BURST_THRESHOLD     = 7;     // 波紋層數：達到此層數觸發爆裂
const RIPPLE_BURST_CONSUME       = 7;     // 波紋層數：爆裂消耗層數
const RIPPLE_BURST_DAMAGE        = 30;    // 波紋層數：爆裂傷害

// 史蒂夫常數
const STEVE_MAX_PHASE        = 4;     // 最高裝備階段
const STEVE_GATHER_DURATION  = 0.5;   // 資源收集持續時間（秒）
const STEVE_GATHER_COOLDOWN  = 3;   // 升級後，下次可再收集的CD（秒）
const STEVE_SWORD_DMG   = [10, 15, 20, 25, 30];      // 各階段「劍」碰撞傷害（索引=階段）
const STEVE_AXE_DMG     = [0, 100, 125, 150, 175];      // 各階段「斧」主動劈砍傷害
const STEVE_AXE_CHARGE  = [0, 0.2, 0.2, 0.2, 0.1];  // 斧蓄力時間（秒）
const STEVE_AXE_COOLDOWN= [0, 2.0, 1.7, 1.5, 1.0];  // 斧攻擊CD（秒）
const STEVE_AXE_RANGE   = [0, 140, 140, 140, 100];      // 斧觸發距離（px，四階段雙金斧範圍縮小）
const STEVE_AXE_KNOCKBACK = 200;
const STEVE_BOW_DMG     = [0, 0, 50, 50, 100];       // 各階段弓/弩/煙花弩傷害
const STEVE_BOW_CHARGE  = [0, 0, 0.3, 0, 1.0];      // 弓蓄力／瞄準時間（秒）
const STEVE_BOW_COOLDOWN = 1.5;                     // 弓/弩/煙花弩共用CD
const STEVE_BOW_SPEED   = 620;
const STEVE_FIREWORK_SPLASH_RADIUS = 65;            // 煙花弩爆炸範圍半徑（px）
const STEVE_HAMMER_COOLDOWN_BASE  = 7;  // 重錘基礎CD（秒）
const STEVE_HAMMER_COOLDOWN_COMBO = 7;  // 觸發鞘翅連擊後的重錘CD（秒）
const STEVE_HAMMER_DMG        = 60;
const STEVE_HAMMER_KNOCKBACK  = 260;
const STEVE_HAMMER_DASH_SPEED = 600;
const STEVE_HAMMER_DASH_DURATION = 0.45;
const STEVE_ELYTRA_BOW_COOLDOWN = 5;   // 觸發鞘翅連擊時，煙花弩改進入的CD
const STEVE_ELYTRA_STEP_DURATION = 0.32; // 鞘翅每個步驟(衝刺/後退)的持續時間
const STEVE_ELYTRA_DASH_DMG   = 20;      // 鞘翅前兩次衝刺攻擊傷害
const STEVE_ELYTRA_THRUST_DMG = 100; // 鞘翅第三擊：茅穿刺傷害

// 妲己（九尾妖狐）
const DAJI_TAIL_MAX          = 9;      // 尾巴上限，集滿觸發被動
const DAJI_FIRE_INTERVAL     = 3.0;    // 鬼火（普攻）發射間隔
const DAJI_FIRE_DAMAGE       = 50;     // 鬼火傷害
const DAJI_FIRE_SPEED        = 250;    // 鬼火飛行速度
const DAJI_FIRE_RADIUS       = 8;      // 鬼火判定半徑
const DAJI_FIRE_TURN_RATE    = 2.4;    // 鬼火追蹤轉向速率（弧度/秒）
const DAJI_FIRE_LIFESPAN     = 5.0;    // 鬼火存在時間（秒）
const DAJI_BURN_DURATION     = 3.0;    // 灼燒持續時間（秒）
const DAJI_BURN_PCT          = 0.01;   // 灼燒每秒造成目標最大生命值的百分比
const DAJI_SKILL1_CD         = 6.0;    // 技能一CD
const DAJI_CHARM_DURATION    = 2.0;    // 魅惑持續時間
const DAJI_CHARM_PULL_SPEED  = 160;    // 魅惑拉近速度（px/s）
const DAJI_MELEE_DMG         = 60;    // 強化普攻（一般）傷害
const DAJI_MELEE_DMG_ENH     = 100;    // 強化普攻（被動強化後）傷害
const DAJI_MELEE_STUN_ENH    = 1.0;    // 被動強化後的暈眩時間（秒）
const DAJI_MELEE_KNOCKBACK   = 240;    // 強化普攻擊退力道
const DAJI_MELEE_RANGE       = RADIUS * 2 + 10; // 魅惑近戰可攻擊距離（需大於球球碰撞分離距離 RADIUS*2，否則永遠碰不到）
const DAJI_TAILSWING_DUR     = 0.35;   // 揮尾巴特效持續時間
const DAJI_SKILL2_CD         = 8.0;    // 技能二CD
const DAJI_BALL_BASE_DMG     = 90;     // 法術球基礎傷害
const DAJI_BALL_DMG_PER_TAIL = 10;     // 每條尾巴額外傷害
const DAJI_BALL_MAX_DMG      = 180;    // 法術球最高傷害
const DAJI_BALL_BASE_RADIUS  = 8;      // 法術球基礎半徑
const DAJI_BALL_MAX_RADIUS   = 20;     // 法術球最大半徑（強化/滿尾巴）
const DAJI_BALL_SPEED        = 360;    // 法術球飛行速度
const DAJI_ENH_CHANNEL_TIME  = 1.5;    // 強化技能二：原地蓄力時間
const DAJI_ENH_HEAL          = 100;    // 釋放強化技能時恢復生命值

// 九十九由基 專屬常數
const YUKI_PHOENIX_DELAY          = 0.2;   // 碰撞後延遲觸發「鳳輪」秒數
const YUKI_PHOENIX_DAMAGE         = 100;   // 鳳輪基礎傷害
const YUKI_PHOENIX_RADIUS         = 90;    // 鳳輪環繞由基身旁的掃蕩範圍
const YUKI_COLLISION_COOLDOWN     = 0.6;   // 碰撞觸發鳳輪的內置CD（避免重疊瞬間重複觸發）
const YUKI_GRAVITY_MAX_STACK      = 5;     // 重力最大層數
const YUKI_GRAVITY_DMG_PER_STACK  = 0.10;  // 每層重力增加的傷害比例
const YUKI_PLASMA_DURATION        = 15;    // 星漿體持續時間（秒）
const YUKI_PLASMA_HP_DPS          = 20;    // 星漿體：每秒扣血
const YUKI_STARWRATH_INTERVAL     = 2.5;   // 星之怒：拉近＋雙鳳輪間隔
const YUKI_STARWRATH_PULL_DIST    = 240;   // 星之怒：單次拉近距離上限
const YUKI_BLACKHOLE_HP_THRESHOLD = 500;   // 假想黑洞：任一方血量低於此值時可發動
const YUKI_BLACKHOLE_DURATION     = 2.5;     // 假想黑洞持續時間（秒）
const YUKI_BLACKHOLE_DPS          = 150;   // 假想黑洞：每秒傷害
const YUKI_BLACKHOLE_PULL_SPEED   = 150;   // 假想黑洞：吸入速度（px/s）
const YUKI_BLACKHOLE_SELF_COST    = 400;   // 假想黑洞結束後，由基自身扣血
const YUKI_GRAVITY_AURA_RADIUS    = 500;   // 被動引力場：作用範圍
const YUKI_GRAVITY_AURA_PULL      = 70;    // 被動引力場：基礎拉力（px/s）

//無形
const WUXING_TRANSFORM_INTERVAL = 9; // 無形：每隔幾秒重新變身一次
const WUXING_TRANSFORM_HEAL     = 120; // 無形：每次變身回血量

// ── Sans🦴 專屬常數 ──
const SANS_MAX_HP             = 23;    // 被動：次數血條，固定血量23
const SANS_BONE_INTERVAL      = 1.0;   // 普攻「骨頭」冷卻
const SANS_BONE_DAMAGE        = 15;     // 骨頭每次觸發傷害
const SANS_BONE_TICK          = 0.1;   // 骨頭每0.1秒觸發一次
const SANS_BONE_SPEED         = 300;   // 骨頭飛行速度
const SANS_BONE_LIFESPAN      = 2.5;   // 骨頭存在秒數
const SANS_WALL_INTERVAL      = 5.0;   // 技能一「骨牆」冷卻
const SANS_WALL_DAMAGE        = 25;    // 骨牆每0.1秒傷害
const SANS_WALL_TICK          = 0.1;
const SANS_WALL_LEN_RATIO     = 1 / 3; // 骨牆長度佔邊長比例
const SANS_WALL_SPEED         = 220;   // 骨牆平移速度(px/s)
const SANS_GRAVITY_DMG_PER_PX = 0.6;   // 重力甩牆：每移動1px的傷害
const SANS_GRAVITY_PULL_SPEED = 500;   // 重力牽引最高速度(px/s)
const SANS_GRAVITY_RAMP_TIME  = 0.6;   // 重力牽引「加速拉起」所需秒數（從0慢慢拉到最高速度，而非瞬間拉走）
const SANS_GRAVITY_DURATION   = 1.6;   // 重力牽引最長持續秒數（保險用，正常會提早撞牆結束）
const SANS_LASER_INTERVAL     = 8.0;  // 技能二「龍骨砲」冷卻
const SANS_LASER_DAMAGE       = 35;    // 龍骨砲傷害
const SANS_LASER_WIDTH        = 50;    // 龍骨砲光束寬度
const SANS_LASER_TRAVEL_TIME  = 0.35;  // 龍骨砲光束存在秒數
const SANS_ULT_HITS           = 20;    // 大招「大風車」攻擊次數
const SANS_ULT_INTERVAL       = 0.2;  // 大招攻擊間隔
const SANS_ULT_DAMAGE         = 25;    // 大招每次命中傷害
const SANS_ULT_WIDTH_START    = 34;    // 大招起始光束寬度
const SANS_ULT_WIDTH_SHRINK   = 1.2;   // 大招每次縮小的寬度量
const SANS_ULT_WARN_DUR       = 0.2;  // 大招光束預警時間（先顯示細線警示，結束後才真正發射並判定傷害，讓對手有時間躲）
const SANS_LASER_WARN_DUR     = 0.35;  // 技能二「龍骨砲」預警時間（砲台先蓄力，結束後才真正發射）
const SANS_HIT_IFRAME_DUR     = 0.2;  // 受傷無敵：每次受傷後短暫無敵秒數，避免同一瞬間被多重攻擊疊加扣光格數
const SANS_CONTINUOUS_TICK_INTERVAL = 0.35;  // 持續傷害對Sans的最短命中間隔（DPS數值是照一般血量設計的，需要限頻避免瞬間燒光）

// ── 普奇神父 專屬常數 ──
const PUCCI_SNAKE_RADIUS        = 30;   // 白蛇環繞半徑（同DIO替身）
const PUCCI_SNAKE_DETECT_RANGE  = 140;  // 白蛇偵測敵人並出擊的範圍
const PUCCI_SNAKE_DASH_SPEED    = 900;  // 白蛇衝刺／歸位速度(px/s)
const PUCCI_SNAKE_STAB_DAMAGE   = 60;   // 白蛇刺擊傷害
const PUCCI_SNAKE_ATTACK_CD     = 2.5;    // 白蛇出擊冷卻
const PUCCI_SNAKE_HIT_RANGE     = RADIUS + 14; // 白蛇刺擊命中判定距離
const PUCCI_CHANT_IDLE_DELAY    = 1.5;    // 白蛇多久沒出擊，普奇才開始唸密語
const PUCCI_CHANT_LINE_TIME     = 0.2;  // 密語每句所需時間
const PUCCI_CHANT_LINES = ['螺旋階梯','獨角仙','廢棄街道','無花果塔','獨角仙','苦傷道','獨角仙','特異點','喬托','天使','繡球花','獨角仙','特異點','秘密皇帝'];
const PUCCI_BABY_SPEED          = 90;   // 綠色嬰兒爬行速度
const PUCCI_BABY_CATCH_RANGE    = RADIUS + 20; // 嬰兒觸碰普奇判定距離
const PUCCI_MOON_RADIUS         = 110;  // 新月重力圈半徑
const PUCCI_MOON_GRAVITY_CD     = 0.7;    // 新月重力甩動冷卻
const PUCCI_MOON_WALLCLING_DUR  = 2.5;  // 新月甩飛落地後，貼牆限制移動的持續秒數
const PUCCI_MOON_WALLCLING_SLOW = 0.1; // 貼牆限制移動期間的速度倍率
const PUCCI_GRAVITY_DMG_PER_PX  = 0.6;  // 新月重力甩牆：每移動1px的傷害（獨立於Sans的骨牆重力，不會觸發骨牆）
const PUCCI_GRAVITY_PULL_SPEED  = 600;  // 新月重力牽引最高速度(px/s)
const PUCCI_GRAVITY_RAMP_TIME   = 0.5;  // 新月重力牽引「加速拉起」所需秒數
const PUCCI_GRAVITY_DURATION    = 1.5;  // 新月重力牽引最長持續秒數（保險用，正常會提早撞牆結束）
const PUCCI_MOON_ROCKET_DELAY   = 8;    // 新月開始後多久場中生成🚀
const PUCCI_ROCKET_HIT_RANGE    = RADIUS + 16; // 觸碰🚀判定
const PUCCI_HEAVEN_CHARGE_TIME  = 1.5;    // 觸碰🚀後蓄力進化天堂製造所需秒數
const PUCCI_HEAVEN_TRANSFORM_IFRAME = 1.5; // 天堂製造：蓄力期間＋變身完成後的無敵持續秒數
const PUCCI_HEAVEN_SPEED_BASE     = 1.5; // 天堂製造初始加速倍率
const PUCCI_HEAVEN_SPEED_INTERVAL = 3;   // 天堂製造：每隔幾秒速度倍率再翻倍
const PUCCI_HEAVEN_SPEED_CAP      = 18;  // 速度倍率上限（避免數值失控無法遊玩）
const PUCCI_HEAVEN_COLLIDE_BASE   = 12;  // 天堂製造：碰撞傷害基礎值（隨速度倍率提升）
const PUCCI_HEAVEN_KNOCKBACK_BASE = 60;   // 天堂製造：碰撞擊退基礎值（隨速度倍率提升）
const PUCCI_HEAVEN_DMG_REDUCE     = 0.2;  // 天堂製造：在場全程減傷比例
const PUCCI_HEAVEN_TIMESTOP_CRAWL = 0.12; // 天堂製造期間，他人時停中普奇仍可用此比例速度緩慢移動
const PUCCI_HEAVEN_DIOWORLD_SHORTEN = 0.5; // 天堂製造在場時，DIO世界時停持續時間的縮減倍率
const PUCCI_HEAVEN_CONTACT_CD     = 0.45; // 天堂製造：碰撞傷害觸發CD（避免同一次貼身重複計算）
const PUCCI_HEAVEN_TRAIL_INTERVAL  = 0.07; // 天堂製造速度殘影產生間隔
const PUCCI_HEAVEN_TRAIL_LIFE      = 0.42; // 天堂製造速度殘影持續時間
const PUCCI_HEAVEN_TRAIL_MAX       = 24;   // 同時保留的速度殘影數量
const PUCCI_HEAVEN_TRANSFORM_FX_DURATION = 1.25; // 天堂製造變身脈衝持續時間
const PUCCI_HEAVEN_RING_COUNT      = 3;    // 天堂製造周身旋轉光環層數

// 白厄常數
const BAIE_SLASH_RANGE        = 130;   // 「逐火救世」偵測距離
const BAIE_DASH_RANGE         = 420;   // 「逐火救世」感知敵人並衝刺過去的距離
const BAIE_DASH_SPEED         = 520;   // 衝刺速度（px/s）
const BAIE_SLASH_DMG_BASE     = 60;    // 「逐火救世」傷害（一般狀態）
const BAIE_SLASH_DMG_ENHANCED = 120;    // 「逐火救世」傷害（愛上雷神狀態）
const BAIE_SLASH_COOLDOWN     = 1.5;   // 「逐火救世」冷卻
const BAIE_KINDLING_MAX       = 13;    // 火種觸發門檻
const BAIE_KINDLING_ON_HIT_DEAL  = 1;  // 造成傷害＋1火種
const BAIE_KINDLING_ON_HIT_TAKEN = 1;  // 受到傷害＋1火種
const BAIE_KINDLING_ON_COLLIDE   = 2;  // 碰撞到對方＋2火種
const BAIE_KINDLING_ON_EXIT      = 3;  // 退出愛上雷神＋3火種
const BAIE_LOVE_HP_BONUS      = 0.4;   // 愛上雷神：血量上限+
const BAIE_LOVE_DURATION      = 8;     // 愛上雷神持續秒數（原作為回合制，此為即時戰鬥版本自訂時長）
const BAIE_LOVE_MIN_INTERVAL  = 9;    // 愛上雷神最短再次觸發間隔（秒）
const BAIE_ZAIE_DURATION      = 1;     // 灾厄•弑魂焚诏：原地不動秒數
const BAIE_ZAIE_DMG_REDUCE    = 0.75;  // 灾厄期間自身減傷比例
const BAIE_ZAIE_REFLECT_RATIO = 0.3;   // 灾厄反傷比例（以對手原傷害計算）
const BAIE_METEOR_DMG         = 150;   // 支柱•死星天裁固定傷害
const BAIE_METEOR_FALL_DURATION = 2.4; // 隕石從召喚到撞擊的總時長（秒），拉長讓下墜更明顯緩慢
const BAIE_REVIVE_HEAL_RATIO  = 0.2;   // 不滅的英雄：回復生命上限比例
const BAIE_REVIVE_SELFDMG     = 100;   // 不滅的英雄：引爆自身給予對手的傷害
const BAIE_COLLIDE_CD         = 0.5;   // 碰撞火種觸發CD（避免同一次貼身重複計算）

// 白厄視覺特效常數（僅影響繪製，不改傷害、冷卻、判定或控制邏輯）
const BAIE_FX_DASH_AFTERIMAGE_COUNT = 6;
const BAIE_FX_LOVE_RAY_COUNT        = 14;
const BAIE_FX_LOVE_ORBIT_COUNT      = 10;
const BAIE_FX_ZAIE_RING_COUNT       = 3;
const BAIE_FX_SLASH_TRAIL_COUNT     = 7;
const BAIE_FX_METEOR_RAY_COUNT      = 12;
// ══════ 紅石青金石專屬常數 ══════
const RSQJS_MAX_HP           = 750;    // 各自獨立血量
const RSQJS_BOMB_CD          = 3.0;    // 炸藥冷卻
const RSQJS_BOMB_FUSE        = 1.4;    // 炸藥丟出到引爆的時間
const RSQJS_BOMB_THROW_SPD   = 280;    // 炸藥飛出速度
const RSQJS_BOMB_RADIUS      = 120;    // 爆炸最大範圍(px)
const RSQJS_BOMB_MAX_DMG     = 180;    // 爆炸中心最高傷害（受「傷害」附魔加成）
const RSQJS_BOMB_MIN_DMG     = 40;     // 爆炸邊緣最低傷害
const RSQJS_APPLE_CD         = 10.0;   // 附魔金蘋果冷卻
const RSQJS_APPLE_HEAL_PS    = 25;     // 附魔金蘋果每秒回血
const RSQJS_APPLE_DURATION   = 5.0;    // 附魔金蘋果效果持續時間
const RSQJS_BOOK_CD          = 3.0;    // 附魔書丟出冷卻
const RSQJS_BOOK_THROW_SPD   = 280;    // 附魔書飛行速度
const RSQJS_BOOK_LIFE        = 8.0;    // 附魔書落地後存活時間（過期消失）
const RSQJS_BOOK_PICKUP_R    = 60;     // 撿書判定半徑(px)
const RSQJS_WATER_INTERVAL   = 7.0;    // 水攻施放間隔
const RSQJS_WATER_DURATION   = 4.0;    // 水域存在時間
const RSQJS_WATER_RADIUS     = 120;    // 水域半徑(px)
const RSQJS_WATER_DPS        = 30;     // 水域每秒傷害
const RSQJS_WATER_SLOW       = 0.40;   // 水域緩速比例
const RSQJS_ENCHANT_SPLIT_PER_LV   = 1;    // 「分裂」每級：一次多丟幾顆炸藥
const RSQJS_ENCHANT_PROTECT_PER_LV = 0.05; // 「保護」每級：+5%減傷
const RSQJS_ENCHANT_DMG_PER_LV     = 50;   // 「傷害」每級：+50最高傷害
const RSQJS_ENCHANT_MAX_LV         = 5;    // 附魔等級上限（避免無限疊加失控）
const RSQJS_STEALTH_DURATION = 2.0;    // 復仇後「迅捷潛行」無敵時間
const RSQJS_STEALTH_CD       = 6.0;    // 迅捷潛行冷卻
// ══════════════ 四天之龍：次元融合（四球共享血量角色） ══════════════
const DRAGON4_DMG_REDUCE       = 0.1;  // 受到傷害減免
const DRAGON4_ENRAGE_HP        = 600;   // 血量低於此值進入強化狀態
const DRAGON4_ENRAGE_CD_MUL    = 0.5;   // 強化狀態：技能冷卻減半

// 🟨擺弧噴射
const DRAGON4_PENDULUM_CD        = 6;
const DRAGON4_PENDULUM_DURATION  = 2;
const DRAGON4_PENDULUM_DPS       = 80;

// 🟪猛毒控制
const DRAGON4_VENOM_CD           = 6;
const DRAGON4_VENOM_DASH_SPEED   = 820;
const DRAGON4_VENOM_DAMAGE       = 30;
const DRAGON4_VENOM_STUN         = 2;
const DRAGON4_VENOM_POISON_DUR   = 5;
const DRAGON4_VENOM_POISON_DPS   = 20;

// ⬜淨翼白光
const DRAGON4_WING_CD            = 6;
const DRAGON4_WING_BUFF_DURATION = 6;
const DRAGON4_WING_BUFF_MULT     = 0.20;
const DRAGON4_WING_DAMAGE        = 40;
const DRAGON4_WING_PARALYZE_DUR  = 1.5;

// ⬛叛逆吸取
const DRAGON4_REBEL_CD           = 6;
const DRAGON4_REBEL_DAMAGE       = 50;
const DRAGON4_REBEL_WEAKEN_DUR   = 4;
const DRAGON4_REBEL_WEAKEN_MULT  = 0.4;  

// 娜娜明（七海建人）專屬常數 ────────────────
const NANAMI_SLASH_DMG            = 40;   // 「劈砍」基礎傷害
const NANAMI_SLASH_INTERVAL       = 0.8;  // 「劈砍」攻擊間隔（CD）
const NANAMI_SLASH_RANGE          = 150;  // 「劈砍」觸發距離
const NANAMI_SLASH_CHARGE         = 0.10; // 「劈砍」揮刀前搖時間
const NANAMI_ANALYSIS_MAX_STACKS  = 10;   // 「情報解析」最高層數
const NANAMI_ANALYSIS_TICK        = 0.8;  // 每幾秒累積一層
const NANAMI_ANALYSIS_ATK_PER_STK = 0.10; // 每層增傷
const NANAMI_ANALYSIS_DEF_PER_STK = 0.10; // 每層減傷
const NANAMI_MARK_FLASH_DURATION   = 0.45; // 「十劃咒法」觸發瞬間，命中處裂痕特效顯示時間
const NANAMI_MARK_TRIGGER_CHANCE  = 0.30; // 「十劃咒法」攻擊命中時觸發標記的機率
const NANAMI_MARK_DMG_MULT        = 2.0;  // 弱點標記期間「劈砍」傷害倍率
const NANAMI_BLACKFLASH_BASE      = 0.10; // 「黑閃紀錄保持人」基礎觸發機率
const NANAMI_BLACKFLASH_STEP      = 0.10; // 每次連續觸發後機率增幅
const NANAMI_BLACKFLASH_MAX_CHAIN = 4;    // 最多連續觸發次數
const NANAMI_BLACKFLASH_DMG_MULT  = 2.0;  // 黑閃傷害倍率
const NANAMI_WALL_COOLDOWN        = 10.0; // 「十劃咒法・瓦落瓦落」CD
const NANAMI_WALL_ROCK_COUNT      = 5;    // 落石總數（對應持續5秒）
const NANAMI_WALL_ROCK_INTERVAL   = 1.0;  // 落石間隔
const NANAMI_WALL_ROCK_DMG        = 50;   // 每塊落石傷害
const NANAMI_WALL_ROCK_FALL_TIME  = 0.35; // 落石預警到砸落所需時間
const NANAMI_WALL_ROCK_HIT_RADIUS = 30;   // 落石命中判定半徑
const NANAMI_WALL_SHAKE_DUR       = 0.45; // 攻擊牆壁瞬間畫面晃動時間
const NANAMI_WALL_SHAKE_MAG       = 10;   // 攻擊牆壁瞬間畫面晃動幅度
const NANAMI_WALL_ROCK_SHAKE_MAG  = 6;    // 每塊落石砸落時的小幅晃動
const NANAMI_OVERTIME_TRIGGER     = 20.0; // 「加班時間」開戰後幾秒觸發
const NANAMI_OVERTIME_DMG_MULT    = 1.5;  // 加班時間傷害倍率
const NANAMI_OVERTIME_BLACKFLASH  = 0.20; // 加班時間期間黑閃基礎機率下限
const NANAMI_OVERTIME_SPEED_MULT  = 1.3;  // 加班時間移速倍率

// ══════ 桃井／綠 專屬常數══════
const MOMOI_MAX_HP               = 700;   // 桃井／綠 各自的獨立血量上限

const MOMOI_BULLET_DAMAGE        = 15;    // 桃井「獨特創意」普攻每顆子彈傷害
const MOMOI_BULLET_SPEED         = 500;   // 子彈飛行速度
const MOMOI_BURST_INTERVAL       = 1.5;   // 每輪三連發的間隔（秒）
const MOMOI_BURST_GAP            = 0.09;  // 三連發中，每顆子彈之間的出手間隔（前中後依序射出，非霰彈同時發射）
const MOMOI_BURST_SPREAD         = 0.23;  // 左中右三顆子彈的扇形角度（弧度）
const MOMOI_SHOTS_BEFORE_RELOAD  = 8;    // 幾輪三連發後進行換彈
const MOMOI_RELOAD_TIME          = 3;   // 換彈耗時
const MOMOI_SKILL_CD             = 5;     // 「創作的痛苦」冷卻
const MOMOI_SKILL_DAMAGE         = 60;    // 「創作的痛苦」基礎傷害
const MOMOI_SKILL_RANGE          = 200;   // 「創作的痛苦」扇形範圍半徑
const MOMOI_SKILL_ANGLE          = Math.PI / 3; // 「創作的痛苦」扇形範圍半角（±60°）
const MOMOI_SKILL_SYNERGY_BONUS  = 10;    // 綠在場時，「創作的痛苦」額外傷害
const MOMOI_PASSIVE_INTERVAL     = 10;    // 「堅守期限」觸發間隔
const MOMOI_PASSIVE_BUFF_DMG     = 10;    // 「堅守期限」增加的傷害
const MOMOI_PASSIVE_BUFF_DURATION = 5;   // 「堅守期限」增傷持續時間
const MOMOI_SYNERGY_DMG_BONUS    = 5;     // 開發者加成：綠在場時，桃井所有攻擊額外傷害

const MIDORI_BULLET_DAMAGE       = 30;    // 「新鮮靈感」普攻傷害
const MIDORI_BULLET_SPEED        = 680;
const MIDORI_ATTACK_INTERVAL     = 1.5;   // 普攻間隔（基礎）
const MIDORI_SYNERGY_ATTACK_INTERVAL = 1.0; // 開發者加成：桃井還活著時，普攻間隔縮短為1秒
const MIDORI_SHOTS_BEFORE_RELOAD = 5;     // 幾次普攻後進行換彈
const MIDORI_RELOAD_TIME         = 2.5;   // 換彈耗時
const MIDORI_SKILL_CD            = 6;     // 「繪畫藝術」冷卻
const MIDORI_SKILL_SHOTS         = 5;     // 「繪畫藝術」連續射擊次數（可重複命中同一人）
const MIDORI_SKILL_SHOT_GAP      = 0.12;  // 「繪畫藝術」每發間隔
const MIDORI_SKILL_DAMAGE        = 35;    // 「繪畫藝術」每發傷害
const MIDORI_SKILL_SYNERGY_BONUS = 5;     // 桃井在場時，「繪畫藝術」每發額外傷害
const MIDORI_PASSIVE_INTERVAL    = 10;    // 「洗練的品味」觸發間隔
const MIDORI_PASSIVE_HEAL        = 60;   // 「洗練的品味」回復量

// ───── 歐尼醬常數 ───────
const ONIICHAN_POISON_DPS          = 20;   // 被動「咒胎九相圖」：中毒每秒傷害
const ONIICHAN_POISON_DUR          = 3;    // 中毒持續時間（秒）
// 「血刃」：近戰攻擊
const ONIICHAN_BLADE_DAMAGE        = 10;
const ONIICHAN_BLADE_INTERVAL      = 0.6;  // 攻擊間隔（秒），比照砲爹近戰拳頭基準
const ONIICHAN_BLADE_RANGE         = RADIUS * 2 + 6;
// 「赤血操術·苅祓」：追蹤血球 x3
const ONIICHAN_TRACK_COUNT         = 3;
const ONIICHAN_TRACK_DAMAGE        = 30;
const ONIICHAN_TRACK_COOLDOWN      = 5;
const ONIICHAN_TRACK_SPEED         = 260;
const ONIICHAN_TRACK_TURN_RATE     = 3.2;  // 血球每秒最大轉向弧度
const ONIICHAN_TRACK_RADIUS        = 9;
const ONIICHAN_TRACK_SPREAD        = 0.75; // 三顆之間的基礎散開角度
const ONIICHAN_TRACK_LIFESPAN      = 4.5;
// 「超新星」：移動路徑血球地雷
const ONIICHAN_MINE_INTERVAL       = 5;
const ONIICHAN_MINE_DAMAGE         = 50;
const ONIICHAN_MINE_RADIUS         = 14;
const ONIICHAN_MINE_LIFESPAN       = 8;
// 「穿血」：象限旋轉血線
const ONIICHAN_QUAD_COOLDOWN       = 7;
const ONIICHAN_QUAD_WINDUP         = 0.5;
const ONIICHAN_QUAD_SWEEP_DURATION = 1.5;  // 90度掃射花費秒數
const ONIICHAN_QUAD_DPS            = 80;
const ONIICHAN_QUAD_HALFWIDTH      = 15;
const ONIICHAN_QUAD_RANGE          = 620;
// 「血雨」：邊緣尖刺
const ONIICHAN_SPIKE_COOLDOWN      = 8;
const ONIICHAN_SPIKE_COUNT         = 5;
const ONIICHAN_SPIKE_DAMAGE        = 50;
const ONIICHAN_SPIKE_SPEED         = 320;
const ONIICHAN_SPIKE_RADIUS        = 7;
// 「血星磊」：減傷自爆
const ONIICHAN_BLOODSTAR_COOLDOWN    = 5;
const ONIICHAN_BLOODSTAR_DURATION    = 2;
const ONIICHAN_BLOODSTAR_DMG_REDUCE  = 0.3;
const ONIICHAN_BLOODSTAR_CLOT_CHANCE = 0.3;
const ONIICHAN_BLOODSTAR_CLOT_DAMAGE = 50;
// 「赫鱗躍動·載」：低血量爆發
const ONIICHAN_ENRAGE_HP_THRESHOLD = 600;
const ONIICHAN_ENRAGE_BLADE_MULT   = 2;
const ONIICHAN_ENRAGE_SPEED_MULT   = 1.5;
// 「血潮」：瀕死血浪
const ONIICHAN_TIDE_HP_THRESHOLD   = 300;
const ONIICHAN_TIDE_COOLDOWN       = 10;
const ONIICHAN_TIDE_WAVE_COUNT     = 3;
const ONIICHAN_TIDE_WAVE_DAMAGE    = 60;
const ONIICHAN_TIDE_WAVE_SPEED     = 200;
const ONIICHAN_TIDE_WAVE_GAP       = 0.4;
const ONIICHAN_TIDE_WAVE_MAX_R     = 240;

// 波風水門
const MINATO_KUNAI_SPEED           = 2200;  // 苦無飛行速度（飛得很快，近乎瞬間插牆）
const MINATO_SLASH_CHARGE_TIME     = 0.15;  // 丟出苦無後蓄力時間
const MINATO_SLASH_SPEED           = 1800;  // 飛雷神斬衝刺速度
const MINATO_SLASH_DASH_RANGE      = 240;   // 飛雷神斬衝刺最長距離
const MINATO_SLASH_DAMAGE          = 70;    // 飛雷神斬單段傷害
const MINATO_SLASH_MAX_COMBO       = 5;     // 飛雷神斬最大連段次數
const MINATO_SLASH_COOLDOWN        = 3;     // 飛雷神斬CD（連段全部結束後才開始倒數）
const MINATO_STAGE2_KUNAI_REQ      = 12;    // 觸發飛雷神二段所需牆上苦無數
const MINATO_STAGE2_MOVE_SPEED     = 3400;  // 二段位移速度（比飛雷神斬快得多，近乎瞬移感）
const MINATO_KILLFX_HITS           = 8;     // 斬殺動畫：連續發動飛雷神二段的瞬移斬擊次數
const MINATO_KILLFX_HIT_INTERVAL   = 0.20;  // 斬殺動畫：每次瞬移斬擊間隔（秒）
const MINATO_KILLFX_SHATTER_LIFE   = 1.7;   // 斬殺動畫：最終將敵人砍成碎片的演出時長（秒）
const MINATO_STAGE2_HIT_DAMAGE     = 25;    // 二段位移途中每段傷害
const MINATO_PARRY_DURATION        = 5;     // 防反狀態持續時間
const MINATO_PARRY_KICK_DAMAGE     = 40;    // 防反反擊踢擊傷害
const MINATO_RASENGAN_COOLDOWN     = 10;    // 螺旋丸CD
const MINATO_RASENGAN_DASH_DIST    = 160;   // 普通螺旋丸衝刺距離
const MINATO_RASENGAN_DASH_SPEED   = 1400;   // 普通螺旋丸衝刺速度
const MINATO_RASENGAN_DAMAGE       = 60;    // 普通螺旋丸傷害
const MINATO_RASENGAN_GRAB_TIME    = 0.35;  // 防反狀態螺旋丸抓取施法時間
const MINATO_RASENGAN_PARRY_DAMAGE = 80;    // 防反狀態螺旋丸傷害
const MINATO_PASSIVE_COOLDOWN      = 3;     // 被動「黃色閃光」CD
const MINATO_WALL_INSET             = 16;   // 苦無插牆位置與牆面內縮距離，避免視覺卡牆

// ═══════ 元素大師═══════
const EM_BULLET_DAMAGE        = 30;    // 魔法子彈傷害
const EM_BULLET_COOLDOWN      = 1.25;   // 魔法子彈CD
const EM_BULLET_SPEED         = 300;   // 魔法子彈速度
const EM_BULLET_TURN_RATE     = 2.6;   // 魔法子彈追蹤轉向速率（弧度/秒，小追蹤）
const EM_BULLET_RADIUS        = 8;
const EM_BULLET_LIFESPAN      = 3.2;

const EM_TOTEM_COOLDOWN       = 3.0;   // 元素圖騰CD（碰撞觸發）
const EM_TOTEM_COOLDOWN_ULT   = 2.0;   // 奧義後圖騰CD
const EM_TOTEM_MAX_HITS       = 4;     // 圖騰可被經過次數上限
const EM_TOTEM_RADIUS         = 25;    // 圖騰判定半徑
const EM_TOTEM_HIT_COOLDOWN   = 1;   // 同一圖騰的獨立觸發冷卻

const EM_ELEMENTS = ['fire', 'water', 'earth', 'wind', 'elec'];
const EM_ELEMENT_INFO = {
  fire:  { emoji: '🔥', color: '#e8562f', ultName: '業炎・焚身衝' },
  water: { emoji: '💧', color: '#2f9ee8', ultName: '靜水・深淵潛流' },
  earth: { emoji: '🪨', color: '#a97c4f', ultName: '地母・不壞金剛體' },
  wind:  { emoji: '🌪️', color: '#7fd66e', ultName: '烈風・絕地暴渦' },
  elec:  { emoji: '⚡', color: '#f4d13d', ultName: '雷霆・天誅亂舞' },
};

// 火圖騰
const EM_FIRE_ENEMY_BURN_DMG      = 60;   // 敵人經過：灼燒直接傷害
const EM_FIRE_MASTER_BOLT_DMG     = 50;   // 大師經過：火彈傷害
const EM_FIRE_MASTER_BOLT_BURNDPS = 20;   // 火彈附帶灼燒/秒
const EM_FIRE_MASTER_BOLT_BURNDUR = 3;    // 火彈附帶灼燒秒數

// 水圖騰
const EM_WATER_SOAK_DURATION  = 2;    // 浸水持續（可疊加時長）
const EM_WATER_SOAK_MULT      = 0.7;  // 浸水期間輸出倍率（-30%）
const EM_WATER_MASTER_HEAL    = 100;  // 大師經過：回血量

// 土圖騰
const EM_EARTH_ENEMY_VULN_DUR   = 2;    // 敵人經過：易傷持續
const EM_EARTH_ENEMY_VULN_PCT   = 0.5;  // 敵人經過：受到傷害+50%
const EM_EARTH_MASTER_INVUL_DUR = 1;  // 大師經過：無敵持續

// 風圖騰
const EM_WIND_ENEMY_SLOW_DUR  = 3;    // 敵人經過：緩速持續

// 電圖騰
const EM_ELEC_ENEMY_PARALYZE      = 0.4;  // 敵人經過：麻痺秒數
const EM_ELEC_MASTER_BOLT_DMG     = 50;   // 大師經過：十字閃電傷害
const EM_ELEC_MASTER_BOLT_PARALYZE= 0.25; // 大師經過：十字閃電麻痺
const EM_ELEC_MASTER_BOLT_HALFWIDTH = 20; // 十字閃電判定半寬

// 元素奧義（通用）
const EM_ULT_BASE_WAIT   = 25;   // 開局後等待秒數
const EM_ULT_CAST_TIME   = 2;    // 詠唱秒數
const EM_ULT_REDUCE_PER_PASS = 2; // 大師每經過一次圖騰，等待時間-

// 火奧義「業炎・焚身衝」
const EM_FIRE_ULT_CONTACT_DMG   = 150;
const EM_FIRE_ULT_CONTACT_BURNDPS = 20;
const EM_FIRE_ULT_CONTACT_BURNDUR = 3;
const EM_FIRE_ULT_BURST_DMG     = 100;
const EM_FIRE_ULT_BURST_RADIUS  = 300;
const EM_FIRE_ULT_SPEED_BUFF    = 1;
const EM_FIRE_ULT_SPEED_BUFF_DUR= 10;
const EM_FIRE_ULT_LAST_STAND_DUR = 5; // 火奧義：致命前鎖血持續時間

// 水奧義「靜水・深淵潛流」
const EM_WATER_ULT_WAVE_EXTRA_DMG = 70;  // 疊加在原本傷害
const EM_WATER_ULT_WAVE_SPEED     = 520;
const EM_WATER_ULT_WAVE_WIDTH     = 30;  // 判定寬度（半寬）
const EM_WATER_ULT_KNOCKBACK      = 160;
const EM_WATER_ULT_SOAK_DURATION  = 3;
const EM_WATER_ULT_BULLET_COOLDOWN = 2.25; // 水奧義：普攻CD延長

// 土奧義「地母・不壞金剛體」
const EM_EARTH_ULT_GOLEM_DMG     = 50;
const EM_EARTH_ULT_GOLEM_HOP_DIST= 50;
const EM_EARTH_ULT_GOLEM_HOP_TIME= 0.4;
const EM_EARTH_ULT_GOLEM_RADIUS  = 20;
const EM_EARTH_ULT_SHIELD_RATIO  = 0.4;
const EM_EARTH_ULT_CRACK_LIFE    = 1.1;  // 土魔像移動震痕的持續時間
const EM_EARTH_ULT_CRACK_LENGTH  = 30;   // 單條地裂的基礎長度
const EM_EARTH_ULT_CRACK_COUNT   = 5;    // 每次跳躍產生的地裂數量
const EM_EARTH_ULT_DUST_COUNT    = 8;    // 每次落地噴出的碎屑數量
const EM_EARTH_ULT_SHIELD_PLATES  = 8;    // 岩甲護盾外圈岩板數量
const EM_EARTH_ULT_SHIELD_ALPHA   = 0.88; // 岩甲護盾外觀最大透明度

// 風奧義「烈風・絕地暴渦」
const EM_WIND_ULT_DOMAIN_RADIUS  = 200;
const EM_WIND_ULT_SLOW_DUR       = 0.4; // 每幀持續刷新，用短時間避免離開範圍還殘留太久
const EM_WIND_ULT_TICK_DMG       = 150;
const EM_WIND_ULT_MISS_CHANCE     = 0.20; // 風奧義每次傷害 tick 有20%機率 miss
const EM_WIND_ULT_TICK_INTERVAL  = 3;
const EM_WIND_ULT_SPEED_BUFF     = 0.3; // 永久移速30%
const EM_WIND_ULT_PULL_STRENGTH  = 50;
const EM_WIND_ULT_PULL_INTERVAL  = 0.1;   // 定期吸拉的間隔秒數（獨立於傷害tick間隔）

// 電奧義「雷霆・天誅亂舞」
const EM_ELEC_ULT_STRIKE_DMG      = 100;
const EM_ELEC_ULT_STRIKE_PARALYZE = 0.20;
const EM_ELEC_ULT_STRIKE_INTERVAL = 0.4;
const EM_ELEC_ULT_STRIKE_RADIUS   = 50;
const EM_ELEC_ULT_BULLET_PARALYZE = 0.1;
const EM_ELEC_ULT_TELEGRAPH_TIME  = 0.35; // 隨機落雷前的預警秒數（地面警示圈）

// 元素大師升級後的常駐奧術特效（僅視覺，不改技能傷害）
const EM_ARCANE_AURA_RADIUS              = 34;
const EM_ARCANE_ORBIT_RADIUS             = 42;
const EM_ARCANE_ORBIT_SPEED              = 1.8;
const EM_ARCANE_SPARK_COUNT              = 10;

// 喬尼・喬斯達／牙：獨立角色系統
const JOHNNY_MAX_HP = 1500;
const JOHNNY_ACT1_CD = 1.5;
const JOHNNY_ACT2_CD = 3;
const JOHNNY_ACT2_CHARGE = 1;
const JOHNNY_ACT2_DAMAGE = 100;      // 強力爪彈初始傷害
const JOHNNY_ACT2_WOUND_DAMAGE = 50; // 傷口只追加一次真傷
const JOHNNY_ACT3_CD = 10;
const JOHNNY_ACT3_HIDE = 8;
const JOHNNY_ACT4_DPS = 3; // ACT4 每幀傷害；沿用原本黃金迴旋的幀傷設計
const JOHNNY_ACT4_CHARGE = 2.2;
const JOHNNY_ACT4_PROJECTILE_SPEED = 250;
const JOHNNY_ACT4_PROJECTILE_RADIUS = 8;
const JOHNNY_ACT4_TURN_ACCEL = 4000;
const JOHNNY_ACT4_SPIN_SPEED = 12;
const JOHNNY_ACT4_SPAWN_COOLDOWN = 10;
const JOHNNY_ACT4_RELEASE_REMAINING = 0.45;
const JOHNNY_ACT4_HIT_DURATION = 20; // ACT4 命中後持續傷害的持續時間（秒）
const JOHNNY_ACT4_HIT_FLASH_RADIUS = 18;
const JOHNNY_ACT4_HIT_FLASH_LIFE = 0.35;
const JOHNNY_ACT1_SHOT_COUNT = 8;
const JOHNNY_ACT1_DAMAGE = 8;
const JOHNNY_ACT1_PROJECTILE_SPEED = 500;
const JOHNNY_ACT1_SHOT_SPACING = 8;
const JOHNNY_ACT1_PROJECTILE_RADIUS = 4;
const JOHNNY_ACT1_PROJECTILE_LIFE = 2;
const JOHNNY_ACT2_PROJECTILE_SPEED = 280;
const JOHNNY_ACT2_PROJECTILE_RADIUS = 8;
const JOHNNY_ACT2_PROJECTILE_LIFE = 3;
const JOHNNY_ACT3_ATTACK_CD = 1.15;
const JOHNNY_ACT3_PROJECTILE_SPEED = 300;
const JOHNNY_ACT3_PROJECTILE_RADIUS = 9;
const JOHNNY_ACT3_PROJECTILE_LIFE = 2;
const JOHNNY_ACT3_WALL_MIN_SPEED = 110;
const JOHNNY_ACT3_WALL_SPEED_MULTIPLIER = 1.08;
const JOHNNY_ACT3_ENTRY_FLASH_RADIUS = 34;
const JOHNNY_ACT3_ENTRY_FLASH_LIFE = 0.35;
const JOHNNY_WOUND_LIFE = 6;
const JOHNNY_WOUND_HIT_RADIUS = 12;
const JOHNNY_WOUND_CREATE_FLASH_RADIUS = 42;
const JOHNNY_WOUND_CREATE_FLASH_LIFE = 0.45;
const JOHNNY_WOUND_HIT_FLASH_RADIUS = 30;
const JOHNNY_WOUND_HIT_FLASH_LIFE = 0.3;
const JOHNNY_OBSERVE_FX_LIFE = 0.85;
const JOHNNY_WOUND_SEEK_INTERVAL = 0.55;
const JOHNNY_WOUND_SLOW_FACTOR = 0.3;
const JOHNNY_WOUND_SLOW_DURATION = 1.5;
const JOHNNY_HERB_SPAWN_INTERVAL = 3;
const JOHNNY_HERB_LIFE = 18;
const JOHNNY_HERB_SPAWN_MARGIN = 20;
const JOHNNY_HERB_PICKUP_RADIUS = 12;
const JOHNNY_FAMILIARITY_FROM_OBSERVE = 3;
const JOHNNY_FAMILIARITY_FROM_PROJECTILE = 1;
const JOHNNY_FAMILIARITY_FROM_HERB = 1;
const JOHNNY_HERB_HEAL = 40;
const JOHNNY_FAMILIARITY_STEP = 30;
const JOHNNY_OBSERVE_INTERVAL = 1.5;
const JOHNNY_CRAWL_DAMAGE_STEP = 300;

// ══════ 阿梅（Amelia Watson）專屬常數 ══════
const AMELIA_MELEE_DAMAGE         = 40;
const AMELIA_MELEE_RANGE           = 90;
const AMELIA_MELEE_INTERVAL        = 0.9; // 【阿梅冷卻／時間】揮擊間隔（秒）
const AMELIA_PISTOL_DAMAGE         = 25;
const AMELIA_PISTOL_SPEED          = 620;
const AMELIA_PISTOL_INTERVAL       = 0.5; // 【阿梅冷卻／時間】手槍每發間隔（秒）
const AMELIA_PISTOL_MAG_SIZE       = 6;
const AMELIA_PISTOL_RELOAD_TIME    = 2.5; // 【阿梅冷卻／時間】裝彈時間（秒）
const AMELIA_GROUND_POUND_DAMAGE   = 80;
const AMELIA_GROUND_POUND_DELAY    = 1.5; // 【阿梅冷卻／時間】施放後 2 秒落下
const AMELIA_GROUND_POUND_START_COOLDOWN = 8.0; // 【阿梅冷卻／時間】開局冷卻（秒）
const AMELIA_GROUND_POUND_COOLDOWN = 8.0; // 【阿梅冷卻／時間】落地後冷卻（秒）
const AMELIA_TIME_TRAVEL_ENTRY_DELAY = 0.72; // 【阿梅冷卻／時間】時空旅人入場延遲（秒）
const AMELIA_GROUND_POUND_ASCEND_TIME = 0.28; // 【阿梅冷卻／時間】上升階段（秒）
const AMELIA_GROUND_POUND_HOVER_TIME = 0.48; // 【阿梅冷卻／時間】滯空階段（秒）
const AMELIA_GROUND_POUND_ASCEND_HEIGHT = 78;
const AMELIA_MELEE_ANIMATION_TIME = 0.24; // 【阿梅冷卻／時間】揮擊動畫（秒）
const AMELIA_GROUND_POUND_RADIUS   = 60;
const AMELIA_GROUND_POUND_SLOW     = 0.60; // 40% 緩速後的速度倍率
const AMELIA_GROUND_POUND_SLOW_DUR = 2.4; // 【阿梅冷卻／時間】落地緩速持續時間（秒）
const AMELIA_TIME_TRAVEL_MIN_HP    = 100;
const AMELIA_TIME_TRAVEL_MAX_HP    = 500;
const AMELIA_DETECTIVE_MAX_STACKS  = 7;
const AMELIA_DETECTIVE_VULN_PER_STACK = 0.05; // 每層使敵人受到的傷害增加5%
const AMELIA_WATCH_THRESHOLD_EPS   = 0.001;
const AMELIA_WATCH_DEPARTURE_DURATION = 2.0; // 【阿梅冷卻／時間】懷錶離場動畫（秒）
const AMELIA_WATCH_DEPARTURE_NOTICE_DURATION = 3.2; // 【阿梅冷卻／時間】懷錶提示預留時間（秒，提示目前停用）

// 鹿紫雲一正式版電荷、電湧陷阱、電解轟鳴、幻獸琥珀與鹿式電常數
const KASHIMO_ATTACK_INTERVAL        = 2.0;   // 閃電突刺 CD
const KASHIMO_ATTACK_DAMAGE          = 40;
const KASHIMO_DASH_SPEED             = 760;
const KASHIMO_DASH_TIME              = 0.34;
const KASHIMO_DASH_FALLBACK_RANGE    = 90;
const KASHIMO_COLLISION_COOLDOWN     = 0.32;
const KASHIMO_POSITIVE_MAX           = 10;
const KASHIMO_POSITIVE_SPEED_PER     = 0.05;
const KASHIMO_NEGATIVE_MAX           = 5;
const KASHIMO_NEGATIVE_PER_HIT       = 1;
const KASHIMO_RELEASE_DAMAGE         = 120;   // 瞬雷
const KASHIMO_RELEASE_PARALYZE       = 1.5;
const KASHIMO_TRAP_COOLDOWN          = 7.0;   // 電湧陷阱（沿用實驗版原技能 CD）
const KASHIMO_TRAP_LIFETIME          = Infinity; // 電湧陷阱持續存在，直到鹿紫雲下一次重新插棒
const KASHIMO_TRAP_HIT_COOLDOWN      = 0.8;   // 同一條雷電對同一敵人的短暫防重複時間
const KASHIMO_TRAP_DAMAGE            = 26;
const KASHIMO_TRAP_RADIUS            = 20;
const KASHIMO_FIELD_COOLDOWN         = 7.0;   // 電解轟鳴
const KASHIMO_FIELD_DURATION         = 3.0;
const KASHIMO_FIELD_RADIUS           =  150;
const KASHIMO_FIELD_TICK             = 0.5;
const KASHIMO_FIELD_DAMAGE           = 15;
const KASHIMO_FIELD_CHARGE_TICK      = 1.0;
const KASHIMO_AMBER_UNLOCK_TIME      = 15.0;
const KASHIMO_AMBER_DURATION         = 12.0;
const KASHIMO_AMBER_SPEED_MULT       = 2.0;   // 移速 +100%
const KASHIMO_AMBER_CD_MULT          = 0.5;   // 普攻與技能 CD 減半
const KASHIMO_AMBER_NEGATIVE_MULT    = 2;     // 普攻與技能附加雙倍負電荷
const KASHIMO_AMBER_SELF_BLEED_DPS   = 40;    // 每秒扣血
const KASHIMO_AMBER_RELEASE_DAMAGE_PER_CHARGE = 30;
const KASHIMO_AMBER_RELEASE_RADIUS   = KASHIMO_FIELD_RADIUS;
const KASHIMO_DEER_LIGHTNING_COOLDOWN = 12.0;
const KASHIMO_DEER_LIGHTNING_CHARGE  = 1.0;
const KASHIMO_DEER_LIGHTNING_DAMAGE   = 240;   // 鹿式電：大量傷害
const KASHIMO_DEER_LIGHTNING_RANGE    = 620;   // 鹿式電球最大飛行距離
const KASHIMO_DEER_LIGHTNING_SPEED    = 920;
const KASHIMO_DEER_LIGHTNING_RADIUS   = 30;
const KASHIMO_DEER_LIGHTNING_WIDTH    = 28;
const KASHIMO_DEER_LIGHTNING_PARALYZE = 1.0;
const KASHIMO_DEER_LIGHTNING_STACKS   = 2;
const KASHIMO_FIELD_COLOR             = '#7d5cff';
const KASHIMO_AMBER_COLOR             = '#f5d76e';
const KASHIMO_DEER_LIGHTNING_COLOR    = '#ffe27a';
const KASHIMO_FX_SPARK_COUNT          = 34;
const KASHIMO_FX_AMBER_SPARK_COUNT    = 88;
const KASHIMO_FX_SHOCKWAVE_COUNT      = 5;
const KASHIMO_FX_SCREEN_DURATION      = 0.95;
const KASHIMO_FX_ARC_JITTER           = 18;





// 秤金次「坐殺博徒」常數
const KINJI_PASSION_MAX              = 40;
const KINJI_PASSION_PER_SECOND       = 2;   // 加快熱情累積，讓領域更快進入
const KINJI_PASSION_PER_BASIC_HIT    = 2;
const KINJI_PASSION_PER_SKILL_HIT    = 4;
const KINJI_TIME_SHORT_PASSION_MULT   = 2;   // 時短效果期間，熱情獲取翻倍
const KINJI_DAMAGE_SWING_MAX         = 20;   // 每次傷害獨立套用 ±1～20 的隨機浮動
const KINJI_GATE_DAMAGE               = 50;
const KINJI_GATE_COOLDOWN             = 1.5;
const KINJI_GATE_RANGE_PADDING         = 18;   // 閘門以雙方角色球半徑為基準，再加上少量近身判定裕度
const KINJI_GATE_HIT_CHANCE            = 1.0;  // 閘門在有效近身範圍內必中；保留常數方便日後調整
const KINJI_GATE_IMMOBILIZE           = 0.5; // 縮短閘門定身，避免控制時間過長
const KINJI_GATE_JACKPOT_COOLDOWN     = 1; // 咒力充涌期間更快出手
const KINJI_COMBO_HITS                = 5;
const KINJI_COMBO_DAMAGE              = 40;
const KINJI_COMBO_COOLDOWN            = 4.0;
const KINJI_COMBO_JACKPOT_COOLDOWN    = 2.0; // 咒力充涌期間更快連打
const KINJI_DOMAIN_PASSION_COST       = KINJI_PASSION_MAX;
const KINJI_DOMAIN_FREEZE_DURATION    = 2.0;
const KINJI_DOMAIN_NUMBER_INTERVAL    = 4.0; // 延長一般抽獎間隔
const KINJI_DOMAIN_NUMBER_INTERVAL_FAST = 1.5; // 時短期間抽獎間隔
const KINJI_DOMAIN_FINAL_DELAY        = 2.0; // 第三碼出現前的懸念停頓
const KINJI_DOMAIN_RESULT_HOLD        = 1.65; // 三碼結果展示時間
const KINJI_DOMAIN_MISS_HOLD          = 1.0; // 未中獎後進入下一組前的停頓
const KINJI_DOMAIN_OPEN_DURATION      = 0.95; // 多重列車門進場動畫
const KINJI_DOMAIN_MAX_NUMBERS        = 3; // 仍然是三碼抽獎，三碼全相同才中獎
const KINJI_DOMAIN_DRAW_POOL           = [4, 5, 6, 7]; // 一般四選項
const KINJI_DOMAIN_GUARANTEED_POOL     = [6, 7]; // 確變：四選項縮成兩選項
const KINJI_JACKPOT_DURATION          = 7.0;
const KINJI_DOMAIN_DURATION_LIMIT      = 0; // 0 = 未中獎前持續抽獎；保留常數供日後設定安全上限
const KINJI_SIMULATED_REEL_REPEAT_CHANCE = 0.35; // 模擬連偶爾重播抽獎動畫
const KINJI_SIMULATED_REEL_REPEAT_DURATION = 2.1;
const KINJI_SIMULATED_REEL_REVIVE_CHANCE = 0.50; // 抽獎期間遭致命傷時的復活機率
const KINJI_SIMULATED_REEL_MAX_REVIVES = 3;
const KINJI_SIMULATED_REEL_REVIVE_HP_RATIO = 0.50; // 復活後保留最大生命值比例
const KINJI_SIMULATED_REEL_FX_DURATION = 1.15;
	const KINJI_JACKPOT_AURA_RADIUS        = 3.9;  // 充涌外圍綠色咒力半徑
	const KINJI_JACKPOT_AURA_SPARKS        = 6;    // 少量高辨識度能量節點
	const KINJI_JACKPOT_AURA_PULSE_SPEED   = 10.5; // 綠色咒力脈動速度
const KINJI_JACKPOT_HEAL_PER_SECOND   = 150; // 回血速率翻倍
const KINJI_PACHINKO_BALL_COOLDOWN    = 0.8;
const KINJI_PACHINKO_BALL_DAMAGE      = 20;
const KINJI_PACHINKO_BALL_HEAL        = 80; // 始動口回血翻倍
const KINJI_PACHINKO_BALL_SPEED       = 460;
const KINJI_PACHINKO_BALL_RADIUS      = 7;
const KINJI_PACHINKO_BALL_LIFETIME    = 18.0;
// KINJI_DOMAIN_DURATION_LIMIT 已在抽獎常數區集中定義。
const KINJI_DOMAIN_COLOR              = '#ffbd38';
const KINJI_DOMAIN_GLOW               = 'rgba(255,189,56,0.72)';
// 天慧龍級視覺參數：高密度但限制上限，避免長時間領域造成效能堆積。
const KINJI_DRAGON_COMET_COUNT         = 10; // 領域只保留少量短暫光粒
const KINJI_DRAGON_RING_COUNT           = 0;  // 移除常駐旋轉光環，避免遮擋戰場
const KINJI_DRAGON_WAVE_COUNT           = 1;  // 只保留一圈開場／命中波紋
const KINJI_DRAGON_PARTICLE_CAP        = 40; // 低負載上限，確保敵我球清楚可見
const KINJI_DRAGON_COMET_LIFE           = 1.15; // 更快、更銳利的彗星節奏
const KINJI_DRAGON_BURST_LIFE          = 0.78;
const KINJI_STATUS_LABEL_WIDTH         = 42; // 保留舊介面；實際改用鹿紫雲式純文字
const KINJI_STATUS_LABEL_HEIGHT        = 14;
const KINJI_TRAIN_DOOR_SPEED            = 120; // 行駛中的列車門背景速度
const KINJI_TRAIN_DOOR_WIDTH            = 76;
const KINJI_COMBO_HIT_FLASH             = 0.22; // 連打命中閃停／爆閃基準
const KINJI_SPEED_BOOST_MULT             = 2; // 領域／咒力充涌期間移動加速
const KINJI_SPEED_TRAIL_COUNT            = 6;    // 加速殘影保留數量
const KINJI_JACKPOT_FX_DURATION           = 2.35; // 大獎爆發特效展示時間，保留完整蓄力／爆發／餘韻
const KINJI_JACKPOT_RAY_COUNT              = 16;   // 大獎放射光束數量；降低開獎瞬間單幀負載
const KINJI_JACKPOT_RING_COUNT             = 2;    // 大獎擴散環數量；保留衝擊感但避免同幀過重
const KINJI_JACKPOT_SPARK_COUNT            = 8;    // 大獎星芒數量；降低開獎瞬間粒子尖峰


// 維什戴爾（ew）與死魂靈常數
const EW_ATTACK_INTERVAL = 2.0; // 普攻間隔（秒）
const EW_ATTACK_DAMAGE = 40; // 靈魂彈主傷害
const EW_PROJECTILE_SPEED = 330; // 靈魂彈速度（px/s）
const EW_ATTACK_RADIUS = 50; // 主攻擊範圍半徑
const EW_AFTERSHOCK_DAMAGE_MULT = 0.5; // 餘震傷害＝主傷害的一半
const EW_AFTERSHOCK_RADIUS_MULT = 0.9; // 餘震範圍＝主攻擊範圍的0.9倍
const EW_AFTERSHOCK_DELAY = 0.16; // 主爆後第一道餘震延遲（秒）
const EW_AFTERSHOCK_INTERVAL = 0.12; // 額外餘震之間的間隔（秒）
const EW_AFTERIMAGE_DURATION = 6.0; // 殘影持續時間（秒）
const EW_AFTERIMAGE_REAPPLY_INTERVAL = 0.5; // 同一目標重新附加殘影的最小間隔（秒）
const EW_AFTERIMAGE_EXPLOSION_CHANCE = 0.20; // 餘震觸發殘影爆炸機率
const EW_AFTERIMAGE_EXPLOSION_DAMAGE_MULT = 1.2; // 殘影爆炸傷害倍率（以主攻擊傷害為基準）
const EW_AFTERIMAGE_EXPLOSION_RADIUS = 70; // 殘影爆炸範圍
const EW_AFTERIMAGE_IMMOBILIZE_DURATION = 0.5; // 殘影爆炸定身時間
const EW_CAMOUFLAGE_RADIUS = 50; // 死魂靈給 ew 迷彩的範圍
const EW_SOUL_HP = 300; // 死魂靈生命值
const EW_SOUL_RADIUS = 20; // 死魂靈碰撞半徑
const EW_SOUL_MAX_COUNT = 3; // 死魂靈上限
const EW_SKILL3_SUMMON_COUNT = 2; // 爆裂黎明觸發時額外召喚數量
const EW_SOUL_SKILL_MAX = 6; // 死魂靈技力上限
const EW_SOUL_SKILL_PER_SECOND = 1; // 死魂靈每秒技力
const EW_SOUL_BULLET_DAMAGE = 30; // 死魂靈紅色子彈傷害
const EW_SOUL_BULLET_SPEED = 360; // 死魂靈紅色子彈速度
const EW_SOUL_BULLET_INTERVAL = 0.35; // 死魂靈發射後內置間隔
const EW_SOUL_RANDOM_SKILL_GAIN_MAX = 2; // 死魂靈攻擊後隨機補回0~2技力
const EW_SKILL1_ATTACKS_REQUIRED = 3; // 技能一每幾次普攻觸發一次
const EW_SKILL1_EXTRA_AFTERSHOCKS = 2; // 技能一額外餘震數量
const EW_SKILL2_INITIAL_COOLDOWN = 8.0; // 技能二初始冷卻
const EW_SKILL2_COOLDOWN = 8.0; // 技能二完成後冷卻
const EW_SKILL2_SATURATION_DURATION = 8.0; // 飽和復仇持續時間
const EW_SKILL2_SATURATION_VOLLEY_COUNT = 3; // 飽和復仇每次普攻發數
const EW_SKILL2_SATURATION_DAMAGE_MULT = 0.7; // 飽和復仇每發傷害倍率
const EW_SKILL2_SATURATION_INTERVAL = 1.5; // 飽和復仇：原本 2 秒減少 0.5 秒＝1.5 秒
const EW_SKILL2_OVERLOAD_DURATION = 4.0; // 過載持續時間
const EW_SKILL2_OVERLOAD_VOLLEY_COUNT = 4; // 過載每次普攻發數
const EW_SKILL2_OVERLOAD_DAMAGE_MULT = 0.4; // 過載每發傷害倍率
const EW_SKILL2_OVERLOAD_INTERVAL = 1.0; // 過載普攻間隔
const EW_SKILL2_CHAIN_SPACING = 22; // 飽和／過載連發的串聯間距（px）
const EW_SKILL3_UNLOCK_TIME = 20.0; // ew 在場累積 20 秒後解鎖爆裂黎明
const EW_SKILL3_SOUL_BULLETS = 5; // 爆裂黎明死魂彈數量
const EW_SKILL3_DAMAGE_MULT = 2.0; // 爆裂黎明普攻傷害倍率
const EW_SKILL3_INTERVAL = 2.5; // 爆裂黎明攻擊間隔
const EW_SKILL3_SPLASH_RADIUS_MULT = 2.5; // 爆裂黎明濺射範圍倍率
const EW_SKILL3_COOLDOWN = 15.0; // 爆裂黎明完成後冷卻


// ══════ 魔彈射手・奧提斯（Otis）專屬常數 ══════
const OTIS_BASE_DAMAGE                 = 70;   // 魔彈基礎傷害
const OTIS_LOCK_INTERVAL               = 2.2;  // 每次攻擊／鎖定間隔 3 秒
const OTIS_PORTAL_DELAY                = 2.2;  // 鎖定後幾秒在目標旁開門並射擊
const OTIS_PORTAL_TARGET_OFFSET          = 88.0; // 傳送門與目標中心的固定距離
const OTIS_PORTAL_LIFE                 = 0.5; // 傳送門視覺壽命
const OTIS_BULLET_SPEED                = 900;  // 魔彈飛行速度（px/s）
const OTIS_BULLET_RADIUS               = 10;    // 魔彈碰撞半徑
const OTIS_BULLET_LIFETIME             = 5;  // 魔彈最長飛行時間
const OTIS_BULLET_PATH_PAD             = 3;    // 掃掠路徑額外命中寬度
const OTIS_SHOT_DAMAGE_MULTIPLIERS     = [0, 1.2, 1.1, 1.2, 1.3, 1.3, 1.0, 1.0];
const OTIS_PARALYZE_DURATION           = 2.0;  // 第二魔彈麻痺
const OTIS_WEAKEN_DURATION             = 2.0;  // 第三魔彈浸水／虛弱
const OTIS_WEAKEN_MULT                 = 0.7;  // 虛弱期間輸出倍率（-30%）
const OTIS_BURN_STACKS_PER_HIT         = 10;   // 第三／第五魔彈附加燒傷層數
const OTIS_BURN_DURATION               = Infinity; // 燒傷永久持續至本場戰鬥結束
const OTIS_BURN_MAX_STACKS             = 50;   // 避免多輪循環後無限膨脹
const OTIS_BURN_TICK_DAMAGE_PER_STACK  = 1;    // 每秒依燒傷層數跳血
const OTIS_VULN_STACKS_PER_HIT          = 3;    // 第四魔彈附加易傷層數
const OTIS_VULN_MAX_STACKS              = 12;   // 易傷永久層數上限
const OTIS_VULN_PER_STACK               = 0.05; // 每層受到傷害增加5%
const OTIS_PERMANENT_ATTACK_PENALTY     = 4;   // 第五魔彈：造成傷害永久-4
const OTIS_PERMANENT_DAMAGE_TAKEN_BONUS = 4;   // 第五魔彈：受到傷害永久+4
const OTIS_EXTRA_BURN_TRIGGER_STACKS    = 7;   // 第六魔彈每幾層燒傷觸發一次追加魔彈
const OTIS_EXTRA_BULLET_MAX             = 3;   // 第六魔彈追加攻擊上限
const OTIS_SELF_SHATTER_THRESHOLD      = 3;   // 第七魔彈無隊友時血條破碎層數
// 奧提斯 E.G.O. 風格視覺常數：全部使用 Canvas 幾何，限制常駐事件數避免高負載。
const OTIS_FX_PORTAL_MAX              = 40;
const OTIS_FX_RIFT_MAX                = 64;
const OTIS_FX_RIFT_LIFE               = 0.42;
const OTIS_FX_SCREEN_PULSE_LIFE       = 0.16;
const OTIS_FX_PARTICLE_CAP            = 6;
const OTIS_FX_PORTAL_WIDTH             = 18;   // 直立法陣半寬，固定不隨發數增加
const OTIS_FX_PORTAL_HEIGHT            = 76;   // 直立法陣半高，固定不隨發數增加
const OTIS_GUN_LENGTH                  = 42;   // 奧提斯手持魔彈槍長度
const OTIS_GUN_RECOIL_TIME              = 0.22; // 開槍後座動畫秒數
const OTIS_GUN_FLASH_TIME               = 0.22; // 槍口閃光秒數
const OTIS_FX_BULLET_TRAIL_MAX        = 20;   // 每顆魔彈最多保留的軌跡節點，控制低負載
const OTIS_FX_BULLET_TRAIL_LIFE       = 1.05; // 軌跡殘痕存活時間，讓經過位置更清楚
const OTIS_FX_BLOOD_CRACK_LENGTH      = 16;   // 血條碎痕向外延伸長度
const OTIS_FX_BULLET_TRAIL_TAIL     = 206;  // 強制可見的魔彈能量長尾
const OTIS_FX_BLOOD_SHATTER_LIFE    = 0.72; // 血量破碎爆裂特效秒數
const OTIS_FX_RETICLE_MAX             = 64;   // 鎖定準心上限
const OTIS_FX_RETICLE_START_RADIUS    = 108;   // 準心由遠處開始
const OTIS_FX_RETICLE_END_RADIUS      = 24;   // 準心最後收縮到目標附近
const OTIS_FX_RETICLE_LIFE            = 0.12; // 射擊瞬間準心收束殘影
//超界者這
const BOUNDARY_MAX_HP = 900;
const BOUNDARY_ATTACK_INTERVAL = 0.8;
const BOUNDARY_RIFT_LIFE = 2.4;
const BOUNDARY_RIFT_PULSE_INTERVAL = 0.2;
const BOUNDARY_RIFT_PULSE_DAMAGE = 30;
const BOUNDARY_BLACK_HOLE_INTERVAL = 8.0;
const BOUNDARY_BLACK_HOLE_EDGE_MARGIN = 60;
const BOUNDARY_BLACK_HOLE_MAX = 3;
const BOUNDARY_BLACK_HOLE_RADIUS = 18;
const BOUNDARY_BLACK_HOLE_BLAST_RADIUS = 50;
const BOUNDARY_BLACK_HOLE_BLAST_DAMAGE = 50;
const BOUNDARY_CAMOUFLAGE_NORMAL = 2.0;
const BOUNDARY_CAMOUFLAGE_DURATION = 1.0;
const BOUNDARY_WARP_TRIGGER_HP = 400;
const BOUNDARY_WARP_TRIGGER_TIME = 20;
const BOUNDARY_WARP_DURATION = 6;
const BOUNDARY_WARP_SPEED = 285;
const BOUNDARY_WARP_TURN_RATE = 3;
const BOUNDARY_WARP_DAMAGE = 50;
const BOUNDARY_WARP_HIT_INTERVAL = 0.4;
const BOUNDARY_RIFT_SPEED = 240;   // 次元裂隙飛行速度（px/s）

// ============================================================================
// 櫻🌸 專屬常數
// ============================================================================

// 被動「花筏」：花瓣層數上限
const SAKURA_PETAL_MAX = 12;

// 被動「千本櫻」：自身周圍傷害 + 緩速
const SAKURA_SENBON_TICK_INTERVAL       = 0.3;
const SAKURA_SENBON_BASE_DAMAGE         = 6;
const SAKURA_SENBON_DAMAGE_PER_3_PETALS = 1;
const SAKURA_SENBON_RADIUS_MULT         = 4;
const SAKURA_SENBON_SLOW_FACTOR         = 0.50;
const SAKURA_SENBON_SLOW_DURATION       = 0.4;

// 被動「八重櫻」：受到傷害時固定減傷
const SAKURA_YAE_DAMAGE_REDUCE      = 10;
const SAKURA_YAE_MAX_CHARGES        = 8;
const SAKURA_YAE_RECHARGE_TIME      = 6.0;
const SAKURA_YAE_RECHARGE_PER_PETAL = 0.2;

// 普攻「花刃」
const SAKURA_BASIC_DAMAGE   = 50;
const SAKURA_BASIC_INTERVAL = 1.0;
const SAKURA_BASIC_SPEED    = 520;

// 技能一「落櫻繽紛」
const SAKURA_FUBUN_RADIUS_MULT   = 2;
const SAKURA_FUBUN_DURATION      = 3.0;
const SAKURA_FUBUN_CD            = 6.0;
const SAKURA_FUBUN_TICK_INTERVAL = 0.3;

// 技能二「櫻印」
const SAKURA_MARK_DURATION   = 5.0;
const SAKURA_MARK_CD         = 9.0;
const SAKURA_MARK_DAMAGE_AMP = 0.3;

// 滿開「樱吹雪」
const SAKURA_FULL_BLOOM_DURATION           = 8.0;
const SAKURA_FULL_BLOOM_CD                 = 10.0;
const SAKURA_FULL_BLOOM_SPEED_MULT         = 2.0;
const SAKURA_FULL_BLOOM_TICK_INTERVAL      = 0.2;
const SAKURA_FULL_BLOOM_DURATION_PER_PETAL = 0.2;
// ============================================================================
// 博士📡 專屬常數
// ============================================================================

// 被動「磁暴電湧」：20% 爆擊，1.5 倍傷害，觸發時額外降下閃電
const BOSHI_CRIT_CHANCE         = 0.20;
const BOSHI_CRIT_MULT           = 1.5;
const BOSHI_CRIT_LIGHTNING_DMG  = 30;
const BOSHI_CRIT_LIGHTNING_PARA = 0.2;

// 被動「高能電球」：4 顆電球環繞，每 2 秒齊射雷射
const BOSHI_ORB_COUNT           = 4;
const BOSHI_ORB_RADIUS          = 42;
const BOSHI_ORB_LASER_INTERVAL  = 2.0;
const BOSHI_ORB_LASER_DAMAGE    = 25;
const BOSHI_ORB_LASER_SPEED     = 600;
const BOSHI_ORB_LASER_LIFE      = 1.5;
const BOSHI_ORB_ROTATE_SPEED    = 1.2;

// 被動「護盾」：最多 3 層，受到攻擊消耗一層減傷 20%
const BOSHI_SHIELD_MAX          = 3;
const BOSHI_SHIELD_REDUCE       = 0.20;

// 技能一「電磁場裝置」
const BOSHI_EM_FIELD_RADIUS     = 75;
const BOSHI_EM_FIELD_DURATION   = 3.0;
const BOSHI_EM_FIELD_CD         = 7.0;
const BOSHI_EM_FIELD_THROW_SPEED= 400;
const BOSHI_EM_FIELD_MAX_DIST   = 220;
const BOSHI_EM_FIELD_DPS        = 20;
const BOSHI_EM_FIELD_RING_TOL   = 12;

// 技能二「量子躍遷器」
const BOSHI_QUANTUM_CD          = 8.0;
const BOSHI_QUANTUM_STUN        = 1.0;
const BOSHI_QUANTUM_DURATION    = 5.0;
const BOSHI_QUANTUM_HALF_WIDTH  = 60;   // 單邊寬度（總寬 = 2 × 此值 = 2 × 球半徑）
const BOSHI_QUANTUM_PULSE_CD    = 1.0;
const BOSHI_QUANTUM_PULSE_RATIO = 0.20;
const BOSHI_QUANTUM_PULSE_DMG_CAP = 500; // 單次脈衝傷害上限，避免爆炸性堆疊


const MIN_SPEED          = 100;   // 最低移動速度（技能停止中除外）
const BOOST_INTERVAL_MIN = 3;
const BOOST_INTERVAL_MAX = 5;
const BOOST_MAGNITUDE    = 100;
const BOOST_MIN_MAGNITUDE = 50; // 最低加速合力，避免幾乎沒動


// ══════════════ 組裝模式：零件數值 ══════════════
const CUSTOM_BASIC_CHEF_INTERVAL   = CHEF_ATTACK_INTERVAL;   // 飛刀CD
const CUSTOM_BASIC_DRUNK_INTERVAL  = DRUNK_ATTACK_INTERVAL;  // 拋酒CD
const CUSTOM_BASIC_GUNNER_INTERVAL = 0.6;   // 速射CD
const CUSTOM_BASIC_GUNNER_DAMAGE   = 40;    // 速射每發傷害
const CUSTOM_BASIC_GUNNER_SPEED    = 420;   // 速射子彈速度
const CUSTOM_CHARGE_INTERVAL       = 5;     // 蓄能裝彈：每幾秒獲得一層
const CUSTOM_CHARGE_MAX_STACKS     = 3;     // 蓄能裝彈：層數上限
const CUSTOM_CHARGE_BONUS_MULT     = 1.2;   // 消耗一層後，普攻傷害倍率
const CUSTOM_TRAP_PASSIVE_INTERVAL = 6;     // 尖刺結界：每幾秒佈置一個
const CUSTOM_SKILL1_VAMPIRE_INTERVAL = VAMPIRE_DASH_INTERVAL; // 蝙蝠狂襲CD
const CUSTOM_SKILL1_VAMPIRE_DAMAGE   = 90;  // 蝙蝠狂襲撞擊傷害
const CUSTOM_SKILL1_TRAPPER_INTERVAL = 7;   // 鎖鏈CD
const CUSTOM_SKILL1_TRAPPER_DAMAGE   = 70;  // 鎖鏈命中傷害
const CUSTOM_SKILL1_TRAPPER_PULL_SPD = 260; // 鎖鏈拉扯速度
const CUSTOM_SKILL2_VAMPIRE_COOLDOWN = 1.0; // 咬擊結束後CD
const CUSTOM_SKILL2_GUNNER_INTERVAL  = 10;  // 連射爆發CD
const CUSTOM_SKILL2_GUNNER_BURST     = 4;   // 連射爆發：發數
const CUSTOM_SKILL2_GUNNER_GAP       = 0.12;// 連射爆發：每發間隔
const CUSTOM_OPM_DMG_REDUCE          = 0.2; // 超人體魄：全局減傷比例（對齊原角色數值）
const CUSTOM_OPM_PUNCH_INTERVAL      = 45;  // 一拳：蓄力間隔（秒）
const CUSTOM_SAMURAI_PARRY_ACTIVE    = 1.0; // 招架：持續時間
const CUSTOM_SAMURAI_PARRY_CD        = 2.0; // 招架：冷卻（不含持續時間）
const CUSTOM_SAMURAI_PARRY_REDUCE    = 0.7; // 招架：減傷比例
const CUSTOM_SAMURAI_IAIDO_DAMAGE    = 120; // 居合：斬擊傷害
const CUSTOM_SAMURAI_ZENMETSU_HITS   = 4;   // 識滅斬：段數
const CUSTOM_SAMURAI_ZENMETSU_DMG    = 140; // 識滅斬：每段傷害

// ── 機器人模式新零件集中常數（只供 customParts 使用）──
const CUSTOM_CURSED_SLASH_INTERVAL = CURSE_SLASH_INTERVAL;
const CUSTOM_CURSED_SLASH_DAMAGE = CURSE_SLASH_DAMAGE;
const CUSTOM_CURSED_SLASH_WARN_DUR = CURSE_SLASH_WARN_DUR;
const CUSTOM_CURSED_SLASH_SPEED = CURSE_SLASH_PROJECTILE_SPEED;
const CUSTOM_CURSED_SLASH_SLOW_FACTOR = CURSE_SLASH_SLOW_FACTOR;
const CUSTOM_CURSED_SLASH_SLOW_DUR = CURSE_SLASH_SLOW_DUR;
const CUSTOM_CURSED_HACHI_HITS = CURSE_HACHI_HITS;
const CUSTOM_CURSED_HACHI_DAMAGE = CURSE_HACHI_HIT_DAMAGE;
const CUSTOM_CURSED_HACHI_INTERVAL = CURSE_HACHI_HIT_INTERVAL;
const CUSTOM_CURSED_HACHI_KNOCKBACK = CURSE_HACHI_KNOCKBACK;
const CUSTOM_CURSED_HACHI_COOLDOWN = CURSE_HACHI_COOLDOWN;
const CUSTOM_KAMADO_INTERVAL = 5.0;
const CUSTOM_KAMADO_CHARGE_DUR = CURSE_KAMADO_CHARGE_DUR;
const CUSTOM_KAMADO_COOLDOWN = CURSE_KAMADO_COOLDOWN;
const CUSTOM_KAMADO_RANGE = CURSE_KAMADO_RANGE;
const CUSTOM_KAMADO_WIDTH = CURSE_KAMADO_WIDTH;
const CUSTOM_KAMADO_DAMAGE = CURSE_KAMADO_DAMAGE;
const CUSTOM_KAMADO_BLAST_RADIUS = CURSE_KAMADO_BLAST_R;
const CUSTOM_KAMADO_BLAST_LIFE = CURSE_KAMADO_BLAST_LIFE;
const CUSTOM_KAMADO_ZONE_DUR = CURSE_KAMADO_ZONE_DUR;
const CUSTOM_KAMADO_ZONE_DPS = CURSE_KAMADO_ZONE_DPS;
const CUSTOM_THUNDER_PILLAR_INTERVAL = 5.0;
const CUSTOM_THUNDER_PILLAR_LIFETIME = THUNDER_PILLAR_LIFETIME;
const CUSTOM_THUNDER_PILLAR_MAX = THUNDER_PILLAR_MAX;
const CUSTOM_SMITH_FORGE_INTERVAL = 1.8;
const CUSTOM_SMITH_FORGE_DAMAGE = 70;
const CUSTOM_SMITH_FORGE_RANGE = 78;
const CUSTOM_SMITH_FORGE_KNOCKBACK = 180;
const CUSTOM_NAOYA_SHADOW_INTERVAL = 0.16;
const CUSTOM_NAOYA_SHADOW_LIFETIME = 0.65;
const CUSTOM_SUSANOO_INTERVAL = 11.0;
const CUSTOM_SUSANOO_DURATION = ITACHI_SUSANOO_DURATION;
const CUSTOM_SUSANOO_STAB_INTERVAL = 0.65;
const CUSTOM_SUSANOO_STAB_DAMAGE = ITACHI_SUSANOO_BITE_DAMAGE;
const CUSTOM_RIKA_HIT_THRESHOLD = 5;
const CUSTOM_RIKA_HP = 420;
const CUSTOM_RIKA_RADIUS = RADIUS * 1.45;
const CUSTOM_RIKA_FOLLOW_RADIUS = YUTA_RIKA_FOLLOW_RADIUS;
const CUSTOM_RIKA_ATTACK_INTERVAL = YUTA_RIKA_CLAW_INTERVAL;
const CUSTOM_RIKA_ATTACK_DAMAGE = YUTA_RIKA_CLAW_DAMAGE;



const CUSTOM_PARTS = {
  passive: [
    { id: 'p_drunk',   name: '喝茫',     emoji: '🍺', from: '酒鬼',   desc: '移動方向不定時隨機改變，難以預測、難以命中。' },
    { id: 'p_trapper', name: '尖刺結界', emoji: '🪤', from: '陷阱大師', desc: `每 ${CUSTOM_TRAP_PASSIVE_INTERVAL} 秒在腳下佈置一個尖刺陷阱（上限6個），敵人踩到造成傷害並中毒。` },
    { id: 'p_opm',        name: '超人體魄', emoji: '👊', from: '一拳超人', desc: `全程減免所受傷害 ${Math.round(CUSTOM_OPM_DMG_REDUCE*100)}%。` },
    { id: 'p_gunner',  name: '蓄能裝彈', emoji: '🔋', from: '無名槍手', desc: `每 ${CUSTOM_CHARGE_INTERVAL} 秒累積 1 層蓄能（上限${CUSTOM_CHARGE_MAX_STACKS}層），普攻消耗一層造成 ${Math.round((CUSTOM_CHARGE_BONUS_MULT-1)*100)}% 加成傷害。` },
    { id: 'p_mage',    name: '瞬移',     emoji: '🎩', from: '魔術師',   desc: '神出鬼沒：每次釋放技能一或技能二後，立即瞬間移動到場地隨機處，難以被鎖定反擊。' },
    { id: 'p_naoya_shadow', name: '移動殘影', emoji: '👤', from: '禪院直哉', desc: `移動時每隔 ${CUSTOM_NAOYA_SHADOW_INTERVAL}s 留下短暫殘影，殘影可傷害接近的敵人。` },
    { id: 'p_rika', name: '里香', emoji: '👧', from: '純愛戰神', desc: `累積 ${CUSTOM_RIKA_HIT_THRESHOLD} 次普攻命中後召喚里香，里香會跟隨並攻擊敵人。` },
  ],
  basic: [
    { id: 'a_chef',   name: '飛刀', emoji: '🔪', from: '地獄廚神', desc: `每 ${CUSTOM_BASIC_CHEF_INTERVAL}s 投擲一把穿透菜刀，造成 ${KNIFE_DAMAGE} 傷害。` },
    { id: 'a_drunk',  name: '拋酒', emoji: '🍾', from: '酒鬼',   desc: `每 ${CUSTOM_BASIC_DRUNK_INTERVAL}s 投擲酒瓶，造成 ${BOTTLE_DAMAGE} 傷害。` },
    { id: 'a_gunner', name: '連射', emoji: '💥', from: '無名槍手', desc: `撞牆裝彈，每次+${GUNNER_MAG_count}發（上限${GUNNER_MAG_SIZE}發）；彈滿後停下連射，每發${GUNNER_BULLET_DAMAGE}傷害並擊退。` },
    { id: 'a_smith', name: '鍛造', emoji: '🔨', from: '鍛造師', desc: `每 ${CUSTOM_SMITH_FORGE_INTERVAL}s 鍛造一次近身武器，對近距離敵人造成 ${CUSTOM_SMITH_FORGE_DAMAGE} 傷害並擊退。` },
   ],
	  skill1: [
    { id: 's1_vampire', name: '蝙蝠狂襲', emoji: '🦇', from: '暗夜領主', desc: `每 ${CUSTOM_SKILL1_VAMPIRE_INTERVAL}s 高速衝向最近的敵人，造成 ${CUSTOM_SKILL1_VAMPIRE_DAMAGE} 撞擊傷害。` },
    { id: 's1_trapper', name: '鎖鏈',     emoji: '⛓️', from: '陷阱大師', desc: `每 ${CUSTOM_SKILL1_TRAPPER_INTERVAL}s 對最近敵人射出鎖鏈，將其拉向自己並造成 ${CUSTOM_SKILL1_TRAPPER_DAMAGE} 傷害。` },
    { id: 's1_gunner',  name: '閃光彈',   emoji: '💡', from: '無名槍手', desc: `每 ${GUNNER_FLASH_INTERVAL}s 對最近敵人投擲閃光彈，造成 ${GUNNER_FLASH_DAMAGE} 範圍傷害並凍結其攻擊與技能冷卻。` },
    { id: 's1_cursed_combo', name: '「解＋捌」', emoji: '💀', from: '詛咒之王', desc: `沿用現在版本：定時發射「解」飛斬，命中後造成 ${CUSTOM_CURSED_SLASH_DAMAGE} 傷害並緩速；接觸敵人時施放「捌」${CUSTOM_CURSED_HACHI_HITS} 段連斬。` },
    { id: 's1_thunder_pillar', name: '閃電柱', emoji: '⚡', from: '雷電法王', desc: `每 ${CUSTOM_THUNDER_PILLAR_INTERVAL}s 在最近敵人附近放置一根閃電柱，最多 ${CUSTOM_THUNDER_PILLAR_MAX} 根。` },
    { id: 's1_gojo',    name: '順逆轉「蒼／赫」', emoji: '😎', from: '現代最強', desc: `每 ${GOJO_COOLDOWN}s 隨機發動：50%「蒼」朝最近敵人射出飛行引力球，沿途穿透造成${GOJO_BLUE_FRAMEDMG}傷害/幀並拉扯周圍敵人（存在${GOJO_BLUE_LIFESPAN}秒）；50%「赫」射出飛行紅球，命中造成${GOJO_RED_DAMAGE}傷害並強力擊退。與本尊一樣共用同一個技能槽，不會兩個同時噴。` },
    { id: 's1_samurai', name: '招架',     emoji: '⚔️', from: '末代武士', desc: `每 ${CUSTOM_SAMURAI_PARRY_ACTIVE + CUSTOM_SAMURAI_PARRY_CD}s 進入招架狀態 ${CUSTOM_SAMURAI_PARRY_ACTIVE}秒（減傷${Math.round(CUSTOM_SAMURAI_PARRY_REDUCE*100)}%），期間碰到敵人觸發「居合」造成${CUSTOM_SAMURAI_IAIDO_DAMAGE}傷害；每${CUSTOM_SAMURAI_ZENMETSU_HITS}次居合後改為「識滅斬」，造成${CUSTOM_SAMURAI_ZENMETSU_DMG}×${CUSTOM_SAMURAI_ZENMETSU_HITS}傷害。` },
  ],
  skill2: [
    { id: 's2_vampire', name: '咬擊',     emoji: '🧛', from: '暗夜領主', desc: '碰到敵人時鎖定撕咬，4段傷害並吸血（內建冷卻，咬擊時無法移動）。' },
    { id: 's2_opm_punch', name: '一拳',     emoji: '👊', from: '一拳超人', desc: `每 ${CUSTOM_OPM_PUNCH_INTERVAL} 秒蓄力完成，對最近敵人使出必殺一拳，直接造成 ${MAX_HP} 傷害（形同秒殺）。` },
    { id: 's2_kamado', name: '竈', emoji: '🔥', from: '詛咒之王', desc: `每 ${CUSTOM_KAMADO_INTERVAL}s 鎖定最近敵人，凝聚業火化為弓並蓄力 ${CUSTOM_KAMADO_CHARGE_DUR}s；完成後射出短距離高威力火焰箭，命中後造成範圍爆炸與燃燒地面。` },
    { id: 's2_susanoo', name: '須佐能乎', emoji: '🛡️', from: '宇治波鼬', desc: `每 ${CUSTOM_SUSANOO_INTERVAL}s 展開須佐能乎 ${CUSTOM_SUSANOO_DURATION}s，並對靠近敵人進行刺擊。` },
  ],
};

// ══════════════ 組裝模式：全角色零件庫（泛用引擎驅動） ══════════════
// 這批零件不是照搬原角色程式碼，而是用幾種「泛用招式引擎」重新實作、對齊原角色的數值精神。
// 每個零件對應的引擎：heal（定時回血）／projectile（定時射出飛行物）／dash（定時衝刺撞擊）／
// debuff（定時對最近敵人施加傷害+異常狀態：poison中毒／root定身／stun暈眩／knockback擊退）／
// delayedAoe（定時在敵人腳下標記，延遲後對範圍內敵人造成傷害，類似地雷）。
const CUSTOM_PART_CFG = {
  p_opm:        { engine: 'reduce' },
};


// 四龍各自的外觀（共用同一個角色本體，僅顯示用配色不同）
const DRAGON4_ROLES = [
  { role: 'pendulum', emoji: '🐲', color: '#e8c93d', glowColor: 'rgba(232,201,61,0.6)',  name: '擺弧龍' },
  { role: 'venom',    emoji: '🐲', color: '#8e44ad', glowColor: 'rgba(142,68,173,0.6)',  name: '猛毒龍' },
  { role: 'wing',     emoji: '🐲', color: '#eeeeee', glowColor: 'rgba(238,238,238,0.6)', name: '淨翼龍' },
  { role: 'rebel',    emoji: '🐲', color: '#3a3a3a', glowColor: 'rgba(120,120,120,0.6)', name: '叛逆龍' },
];

const RSQJS_BOMB_IMAGE = 'image/tnt-bomb.png';


// ============================================================================
// CHEF HEXTECH CONSTANTS：廚神海克斯科技專用常數（獨立區塊）
// 只放海克斯科技數值，避免混入其他角色常數。
// ============================================================================

// 🍲 高壓鍋
const CHEF_PRESSURE_MAX = 30;
const CHEF_PRESSURE_PER_DAMAGE = 0.1;
const CHEF_PRESSURE_BLAST_DAMAGE = 180;
const CHEF_PRESSURE_BLAST_RADIUS = 155;
const CHEF_PRESSURE_FLASH_COLOR = '#ff9f43';

// 🔥 焦香
const CHEF_SEAR_MAX_STACKS = 8;
const CHEF_SEAR_DAMAGE_PER_STACK = 0.03;
const CHEF_SEAR_DECAY_DELAY = 3.0;
const CHEF_SEAR_DECAY_INTERVAL = 0.7;
const CHEF_SEAR_BURST_DAMAGE = 120;
const CHEF_SEAR_WARM_STACKS = 3;

// 🧂 鹽多一點
// 鹽多一點：每次飛刀造成有效傷害都生成調味道具。
const CHEF_ITEM_SPAWN_CHANCE = 1.0;
const CHEF_ITEM_LIFETIME = 8;
const CHEF_ITEM_PICKUP_RADIUS = 30;
const CHEF_ITEM_MAX = 8;
const CHEF_ITEM_BUFF_DAMAGE = 0.25;
const CHEF_ITEM_BUFF_DAMAGE_DURATION = 5;
const CHEF_ITEM_ATTACK_SPEED_MULT = 1.25; // 辣椒：攻速×1.25
const CHEF_ITEM_ATTACK_SPEED_DURATION = 3;
const CHEF_ITEM_HEAL = 80;
// 酒鬼海克斯科技
const DRUNK_MIST_INTERVAL = 5.0;
const DRUNK_MIST_DURATION = 1.4;
const DRUNK_MIST_SPEED = 300;
const DRUNK_MIST_RADIUS = 38;
const DRUNK_CONFUSION_DURATION = 2.0;
const DRUNK_PUNCH_DAMAGE = 60;
const DRUNK_PUNCH_DISTANCE = 78;
const DRUNK_PUNCH_RADIUS = 78; // 醉拳大範圍判定
const DRUNK_PUNCH_KNOCKBACK = 420;
const DRUNK_INTOX_INTERVAL = 3.0;
const DRUNK_INTOX_MAX = 10;
const DRUNK_INTOX_DURATION = 10.0;
const DRUNK_INTOX_ATTACK_REDUCE = 0.3;
const DRUNK_INTOX_SPEED_MULT = 1.35;
// ══════════════ 無名槍手海克斯科技 ══════════════

// 🎯 賞金標誌
const GUNNER_BOUNTY_CD          = 6.0;    // 掛標誌間隔（秒）
const GUNNER_BOUNTY_OPENING_CD  = 6.0;    // 開局冷卻（秒）：開場不會馬上掛出第一個標誌，可與 GUNNER_BOUNTY_CD 分開調整
const GUNNER_BOUNTY_DURATION    = 3.0;    // 標誌持續（秒）
const GUNNER_BOUNTY_HOMING_TURN = 2.0;    // 子彈追蹤轉向速率（弧度/秒）
const GUNNER_BOUNTY_MARK_R      = 28;     // 標誌視覺半徑（px）

// 💥 分裂彈
const GUNNER_SPLIT_COUNT        = 8;      // 散開子彈數
const GUNNER_SPLIT_DAMAGE_RATIO = 0.5;   // 每顆傷害比（對原傷）
const GUNNER_SPLIT_SPEED        = 500;    // 小子彈速度（px/s）
const GUNNER_SPLIT_LIFE         = 1.2;    // 小子彈存活（秒）
const GUNNER_SPLIT_RADIUS       = 8;      // 小子彈半徑（px）
