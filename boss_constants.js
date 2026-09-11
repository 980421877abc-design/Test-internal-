// ============================================================================
// BOSS CONFIG：宿儺／天慧龍（秘紅赫耀天彗龍）完整數值
// 只要修改這個檔案即可調整 Boss 戰鬥數值；主程式不再保存重複宣告。
// ============================================================================


// ============================================================================
// USER CONFIG 2/3：Boss 數值
// 可調整：宿儺、魔虛羅、天慧龍、Boss 道具與 Boss 專用技能數值。
// 帶有 VFX／PARTICLE／TRAIL／GLOW 字樣的項目屬於視覺特效，平時不要修改。
// ============================================================================
// ══════════════ Boss模式 ══════════════
// Boss不是CHARACTERS陣列裡的常駐角色，只在Boss模式建立戰鬥時直接生成球體使用，
// 不會出現在一般選角輪播、圖鑑、沙盒、車輪戰、組裝模式等任何角色清單裡。
// 這裡只保留「未填寫 Boss 設定時」的安全預設值；實際 Boss 數值必須寫在自己的 registerBoss 定義中。
const DEFAULT_BOSS_ARENA_SIZE = 400;

// 秘紅赫耀天彗龍 Boss 專屬設定：數值與宿儺完全分離，避免互相污染。
// DRAGON_HP 與所有 DRAGON_* 天慧龍 Boss 常數均集中在本檔；character_constants.js 不含天慧龍 Boss 數值。
// 【快速調整區】天慧龍 Boss 血量
// 只要修改下一行的數字即可調整天慧龍總血量。
const DRAGON_HP = 30000;

const DRAGON_ARENA_SIZE = 550;
const DRAGON_RADIUS_MULT = 2.0;
const DRAGON_SPEED_MULT = 0.80;
const DRAGON_LIBERATED_SPEED_MULT = 1.7;
const DRAGON_QI_MAX = 1000;
const DRAGON_QI_INIT = 300;
const DRAGON_QI_REGEN = 100;
const DRAGON_QI_HIT_REDUCE = 20;
const DRAGON_QI_HIT_INTERVAL = 0.5;
const DRAGON_QI_LIBERATE_HITS = 50;
const DRAGON_ROAR_DAMAGE = 20;
const DRAGON_ROAR_PARALYZE = 3;
const DRAGON_ROAR_CHARGE = 1.0;
const DRAGON_ATTACK_INTERVAL = 2;
const DRAGON_CHARGE_DAMAGE = 135;
// DRAGON_GROUP_ATTACK_V2：衝撞、龍氣彈與龍閃均以玩家隊伍為群體判定。
const DRAGON_CHARGE_AOE_RADIUS = 145;
const DRAGON_WING_AOE_RADIUS = 112;
const DRAGON_ORB_AOE_RADIUS = 160;
const DRAGON_ORB_SECOND_AOE_RADIUS = 120;
const DRAGON_BEAM_HALF_WIDTH = 150;
const DRAGON_BEAM_CORE_RADIUS = 76;
const DRAGON_CHARGE_STOP = 1.5;
const DRAGON_WING_DAMAGE = 120;
const DRAGON_WING_EXPLODE_DAMAGE = 105;
const DRAGON_ORB_DAMAGE = 125;
const DRAGON_ORB_SECOND_DAMAGE = 105;
const DRAGON_BEAM_DAMAGE = 70;
const DRAGON_BEAM_DURATION = 2.4;
const DRAGON_BEAM_INTERVAL = 0.2;
const DRAGON_BEAM_CD = 8.0;
const DRAGON_BEAM_EXPLODE_DAMAGE = 105;
const DRAGON_COMET_DAMAGE = 600;
const DRAGON_COMET_STUN = 2.0;
const DRAGON_COMET_AIRTIME = 5.0;
const DRAGON_TEAM_REVIVE_COUNT = 3;
const DRAGON_REVIVE_DELAY = 3.0;
const DRAGON_MISSION_TIME = 150;
// DRAGON_VFX_POLISH_V1：天彗龍專用的視覺脈衝與粒子參數。
const DRAGON_ORB_TRAVEL_TIME = 0.75;
const DRAGON_ORB_TRAIL_COUNT = 12;
const DRAGON_ROAR_WAVE_COUNT = 5;
const DRAGON_BEAM_SPARK_COUNT = 18;
const DRAGON_WING_SEGMENTS = 5;
// DRAGON_CHARGE_JET_VFX_V2：參考天彗龍高速突進時的展翼噴氣、火焰羽流與黑紅殘影。
const DRAGON_CHARGE_JET_COUNT = 13;
const DRAGON_CHARGE_FLAME_COUNT = 12;
const DRAGON_CHARGE_AFTERIMAGE_COUNT = 9;
const DRAGON_CHARGE_JET_LENGTH = 4.65;
const DRAGON_CHARGE_WING_SPAN = 2.65;
const DRAGON_CHARGE_VFX_FADE = 0.86;
// DRAGON_CHARGE_JET_VFX_V3：雙翼噴口、羽狀火焰與高速殘影參數。
const DRAGON_CHARGE_JET_NOZZLE_COUNT = 4;
const DRAGON_CHARGE_FLAME_FEATHER_COUNT = 11;
const DRAGON_CHARGE_TRAIL_SAMPLE_COUNT = 12;
const DRAGON_CHARGE_AFTERIMAGE_ALPHA = 0.46;
const DRAGON_CHARGE_WING_HEAT = 1.5;
// DRAGON_CHARGE_JET_VFX_V4：以參考圖為靈感的翼根推進器、分叉噴流與煙羽參數。
const DRAGON_CHARGE_EXHAUST_STRANDS = 7;
const DRAGON_CHARGE_EXHAUST_SMOKE = 10;
const DRAGON_CHARGE_EXHAUST_SPLIT = 3;
// DRAGON_CHARGE_LOCK_FIX：突進採用一次鎖定、專用位移，避免被通用移動倍率與逐幀追蹤干擾。
const DRAGON_CHARGE_SPEED_MULT = 5.5;
const DRAGON_CHARGE_SPEED = BASE_SPEED * DRAGON_CHARGE_SPEED_MULT;
const DRAGON_CHARGE_DASH_TIME = 1.5;
const DRAGON_CHARGE_CONTACT_PAD = 24;
// DRAGON_LIBERATION_VFX_V2：暗紅氣體、旋轉光環與外噴粒子。
const DRAGON_LIBERATION_RING_COUNT = 4;
const DRAGON_LIBERATION_PARTICLE_COUNT = 18;
const DEFAULT_BOSS_RADIUS     = RADIUS * 1.5;

// 詛咒之王・真祖（Boss版）專屬常數 —— 與上面「詛咒之王」原版數值互相獨立，
// 招式邏輯共用（type仍是'cursed'），但數值可在此單獨調整，不會影響一般版角色。
// 初始值先複製自原版，之後可依實戰單獨改動。
const BOSS_CURSE_SLASH_INTERVAL    = 3.0;   // 解：斬痕發動間隔（秒）
const BOSS_CURSE_SLASH_DAMAGE      = 150;   // 解：斬痕傷害
const BOSS_CURSE_SLASH_SLOW_FACTOR = 0.6;   // 解：緩速倍率（剩幾成速度）
const BOSS_CURSE_SLASH_SLOW_DUR    = 3.0;   // 解：緩速持續時間（秒）
const BOSS_CURSE_SLASH_WARN_DUR    = 0.5;   // 解：預警箭頭持續時間（秒）
const BOSS_CURSE_SLASH_PROJECTILE_SPEED = 2000; // 解：飛斬速度（px/s）
const BOSS_CURSE_SLASH_PROJECTILE_WIDTH = 30;   // 解：飛斬判定寬度（px）
const BOSS_CURSE_HACHI_HITS         = 5;    // 捌：連續小斬次數
const BOSS_CURSE_HACHI_HIT_DAMAGE   = 15;   // 捌：每小斬傷害
const BOSS_CURSE_HACHI_HIT_INTERVAL = 0.11; // 捌：每小斬間隔（秒）
const BOSS_CURSE_HACHI_KNOCKBACK    = 300;  // 捌：總擊退力道（分攤到每次小斬）
const BOSS_CURSE_HACHI_COOLDOWN     = 0.8;  // 捌：整段combo觸發後的冷卻
const BOSS_CURSE_DOMAIN_HP         = 2400;   // 伏魔御廚子：觸發血量
const BOSS_CURSE_DOMAIN_RADIUS     = 100;   // 伏魔御廚子：範圍半徑（px）
const BOSS_CURSE_DOMAIN_FRAMEDMG   = 5;     // 伏魔御廚子：每幀傷害
const BOSS_CURSE_DOMAIN_FREEZE_DUR = 2.0;   // 伏魔御廚子：原地持續時間（秒）
const BOSS_CURSE_KAMADO_SEASON_WINDOW = 10;  // 竈：「解」與「捌」需在此秒數內都命中同一敵人，才算完成料理
const BOSS_CURSE_KAMADO_CHARGE_DUR    = 1.4;  // 竈：雙手凝聚火焰化為弓的蓄力時間（角色定身，速度極慢）
const BOSS_CURSE_KAMADO_COOLDOWN      = 5.0;  // 竈：發動後的內建冷卻（主要仍受限於料理前提，此為保底防連發）
const BOSS_CURSE_KAMADO_RANGE         = 190;  // 竈：射程極短
const BOSS_CURSE_KAMADO_WIDTH         = 50;   // 竈：範圍極窄
const BOSS_CURSE_KAMADO_DAMAGE        = 340;  // 竈：萬死之炎，單發近乎斬殺
const BOSS_CURSE_KAMADO_BLAST_R       = 55;   // 竈：命中處爆炸半徑（波及爆心周圍角色）
const BOSS_CURSE_KAMADO_BLAST_LIFE    = 0.5;  // 竈：爆炸視覺持續時間
const BOSS_CURSE_KAMADO_ZONE_DUR      = 4.5;  // 竈：留下的燃燒地面持續時間（秒）
const BOSS_CURSE_KAMADO_ZONE_DPS      = 30;   // 竈：燃燒地面每秒灼燒傷害

// ═══════ Boss宿儺二階段／魔虛羅（可自行調整） ═══════
// 宿儺每一條血都使用這個獨立絕對值；第一條歸零時才會進入原身宿儺。
// 普通角色 MAX_HP 改動不會連動 Boss。
const BOSS_SUKUNA_MAHORAGA_SPAWN_RATIO  = 0.50; // 第一條血降至此比例時召喚魔虛羅
const BOSS_SUKUNA_P2_DOMAIN_HP          = 800;  // 原身宿儺再次展開御廚子的觸發血量
const BOSS_SUKUNA_WORLD_SLASH_CHANT_TIME = 3.0;   // 「龍鱗／反發／成雙之流星」逐詞詠唱時間
const BOSS_SUKUNA_WORLD_SLASH_BLACKOUT   = 0.45;  // 詠唱完成後的全屏黑幕時間
const BOSS_SUKUNA_WORLD_SLASH_STRIKE     = 0.85;  // 黑幕後超大斬擊亮起時間
const BOSS_SUKUNA_WORLD_SLASH_LIFE       = BOSS_SUKUNA_WORLD_SLASH_CHANT_TIME + BOSS_SUKUNA_WORLD_SLASH_BLACKOUT + BOSS_SUKUNA_WORLD_SLASH_STRIKE;
// 世界斬不使用固定傷害值：完成演出後直接對當下仍在場角色執行必中秒殺。

// Boss 戰場地支援道具：不定時生成，僅 Boss 模式使用；數值可自行調整。
const BOSS_BATTLE_ITEM_SPAWN_MIN         = 5.0;   // 生成間隔下限（秒）
const BOSS_BATTLE_ITEM_SPAWN_MAX         = 10.0;  // 生成間隔上限（秒）
const BOSS_BATTLE_ITEM_MAX_ON_FIELD      = 3;     // 場上最多同時存在數量
const BOSS_BATTLE_ITEM_LIFE             = 14.0;  // 未拾取時存在時間（秒）
const BOSS_BATTLE_ITEM_RADIUS            = 15;    // 道具碰撞半徑
const BOSS_BATTLE_ITEM_HEAL_RATIO        = 0.30;  // 回復拾取者最大生命值比例
const BOSS_BATTLE_DAMAGE_BOOST_MULT     = 1.5;  // 加傷倍率
const BOSS_BATTLE_DAMAGE_BOOST_DURATION = 8.0;   // 加傷持續時間（秒）
const BOSS_BATTLE_ITEM_HEAL              = 'heal';
const BOSS_BATTLE_ITEM_DAMAGE            = 'damage';
const BOSS_SHINBU_CLEAVE_COOLDOWN       = 5.0;  // 神武解CD
const BOSS_SHINBU_CLEAVE_COUNT          = 8;    // 每輪隨機雷擊區塊數量
const BOSS_SHINBU_CLEAVE_DAMAGE         = 50;   // 單一雷擊傷害
const BOSS_SHINBU_CLEAVE_RADIUS         = 40;   // 雷擊圓形傷害區半徑
const BOSS_SHINBU_CLEAVE_WARN_DUR       = 0.55; // 雷擊預警秒數
const BOSS_SHINBU_CLEAVE_PARALYZE       = 0.4;  // 麻痺秒數；與元素大師電圖騰 EM_ELEC_ENEMY_PARALYZE 相同

// 原身御廚子：範圍變大、傷害降低；其餘解、捌、竈仍沿用 Boss 原數值。
const BOSS_P2_DOMAIN_RADIUS             = 150;
const BOSS_P2_DOMAIN_FRAMEDMG           = 3;

// 十影宿儺第一條血限定：乾粉滅火器（可自行調整）
// 「冷卻凍結」：敵人在乾粉區域內時，所有技能計時器停止倒數；離開後恢復倒數。
const BOSS_SUKUNA_DRY_POWDER_CD             = 10.0; // 乾粉滅火器再次使用間隔
const BOSS_SUKUNA_DRY_POWDER_INITIAL_DELAY  = 4.0;  // 第一條血開始後首次使用前的等待時間
const BOSS_SUKUNA_DRY_POWDER_THROW_SPEED    = 360;  // 滅火器投擲速度（px/s）
const BOSS_SUKUNA_DRY_POWDER_FUSE           = 0.5; // 飛行後爆開前的時間
const BOSS_SUKUNA_DRY_POWDER_RADIUS         = 112;  // 乾粉區域半徑（px）
const BOSS_SUKUNA_DRY_POWDER_DURATION       = 3.0;  // 乾粉區域持續時間（秒）
const BOSS_SUKUNA_DRY_POWDER_BLAST_LIFE     = 0.65; // 爆開視覺持續時間（秒）

// 魔虛羅：本體、法輪適應與退魔之劍。
const MAHORAGA_RADIUS                   = RADIUS * 1.7;
const MAHORAGA_MAX_HP                   = 1800;
const MAHORAGA_WHEEL_ROTATE_TIME        = 30;
const MAHORAGA_HIT_REDUCE_PER_ADAPT     = 1;    // 每次受傷使該圈法輪冷卻額外-1秒
const MAHORAGA_ROTATE_HEAL              = 200;
const MAHORAGA_BIG_HIT_THRESHOLD        = 100;
const MAHORAGA_BIG_HIT_REDUCE           = 0.20;
const MAHORAGA_BIG_HIT_REDUCE_CAP       = 0.80;
const MAHORAGA_BIG_HIT_CAP_HEAL         = 150;
const MAHORAGA_LOW_DAMAGE_THRESHOLD     = 150;
const MAHORAGA_ATTACK_BONUS_PER_ADAPT   = 10;
const MAHORAGA_SPEED_BONUS_PER_ADAPT    = 0.12;
const MAHORAGA_SWORD_RANGE_PAD        = 20;
const MAHORAGA_ATTACK_DAMAGE            = 50;
const MAHORAGA_ATTACK_COOLDOWN          = 2.0;
const MAHORAGA_ATTACK_FX_RADIUS         = 32;
const MAHORAGA_SWORD_LENGTH             = 92;   // 退魔之劍刺擊伸出長度（px）
const MAHORAGA_SWORD_WIDTH              = 13;   // 退魔之劍劍身寬度（px）

// ═══════ 幻影小隊／幻影將軍 Boss（雙階段＋領域決鬥） ═══════
// 第一階段是三名各自可復活一次的 Boss 成員；第二階段由同一 Boss 球轉化為將軍。
// 暫時隱藏公開入口，但保留完整程式與數值，日後改為 false 即可恢復。
const PHANTOM_BOSS_HIDDEN = true;
const PHANTOM_ARENA_SIZE                 = 500;
const PHANTOM_DOMAIN_SIZE                = 380;
const PHANTOM_SHIELD_HP                  = 2000;
const PHANTOM_SHIELD_DAMAGE_REDUCE       = 0.25;
const PHANTOM_SHIELD_BASH_DAMAGE         = 100;
const PHANTOM_SHIELD_BASH_COOLDOWN       = 1.1;
const PHANTOM_SHIELD_BASH_KNOCKBACK      = 360;
const PHANTOM_SHIELD_INVULN              = 0.2;
const PHANTOM_ARCHER_HP                  = 1500;
const PHANTOM_ARCHER_VOLLEY_INTERVAL     = 2.5;
const PHANTOM_ARCHER_BASE_ARROWS         = 6;
const PHANTOM_ARCHER_EXTRA_ARROWS        = 2;
const PHANTOM_ARCHER_ARROW_DAMAGE        = 100;
const PHANTOM_ARCHER_ARROW_VULN          = 0.5;
const PHANTOM_ARCHER_ARROW_VULN_DUR      = 2.0;
const PHANTOM_ARCHER_DEATH_ARROWS        = 20;
const PHANTOM_ARCHER_DEATH_ARROW_DAMAGE  = 75;
const PHANTOM_CAVALRY_HP                 = 1000;
const PHANTOM_CAVALRY_SPEED_MULT         = 2.5;
const PHANTOM_CAVALRY_CHARGE_DAMAGE      = 100;
const PHANTOM_CAVALRY_BLEED_DAMAGE       = 50;
const PHANTOM_CAVALRY_COMBO_DAMAGE       = 200;
const PHANTOM_CAVALRY_CHARGE_COOLDOWN    = 0.65;
const PHANTOM_CAVALRY_COMBO_WINDOW       = 1.0;
const PHANTOM_CAVALRY_REST_HITS          = 5;
const PHANTOM_CAVALRY_REST_DURATION      = 3.0;
const PHANTOM_CAVALRY_REST_HEAL          = 150;
const PHANTOM_CAVALRY_REST_VULN          = 0.25;
const PHANTOM_CAVALRY_DEATH_STUN         = 1.5;
const PHANTOM_MEMBER_REVIVES             = 1;
// 復活先進入 1.6 秒靈魂重組與無敵階段，避免只閃一下就完成。
const PHANTOM_MEMBER_REVIVE_DELAY        = 1.6;
const PHANTOM_MEMBER_REVIVE_VFX_DURATION  = 1.9;
const PHANTOM_GENERAL_HP                 = 3600;
const PHANTOM_GENERAL_DAMAGE_REDUCE      = 0.58;
const PHANTOM_GENERAL_SPEED_MULT         = 2.0;
// 將軍沿預設王駕路線巡行；路線只依場地尺寸，不讀取玩家座標。
const PHANTOM_GENERAL_MARCH_SPEED       = 185;
const PHANTOM_GENERAL_MARCH_INTERVAL    = 1.55;
const PHANTOM_GENERAL_MARCH_PAUSE       = 0.12;
const PHANTOM_GENERAL_CONTACT_DAMAGE     = 145;
const PHANTOM_GENERAL_CONTACT_COOLDOWN   = 0.58;
const PHANTOM_GENERAL_SLASH_COOLDOWN     = 4.2;
const PHANTOM_GENERAL_SLASH_KNOCKBACK    = 380;
const PHANTOM_GENERAL_SLASH_STUN         = 0.55;
const PHANTOM_GENERAL_SLASH_FIRST_DAMAGE  = 140;
const PHANTOM_GENERAL_SLASH_SECOND_DAMAGE = 330;
const PHANTOM_GENERAL_SLASH_CHARGE       = 1.0;
const PHANTOM_GENERAL_MISS_REST          = 5.0;
const PHANTOM_GENERAL_MISS_HEAL          = 300;
const PHANTOM_GENERAL_ARROW_INTERVAL     = 1.5;
const PHANTOM_GENERAL_ARROW_COUNT        = 3;
const PHANTOM_GENERAL_COMMAND_INTERVAL   = 3.25;
const PHANTOM_GENERAL_COMMAND_CHARGE     = 0.62;
const PHANTOM_GENERAL_ARROW_DAMAGE       = 135;
const PHANTOM_GENERAL_ARROW_BLEED        = 70;
const PHANTOM_GENERAL_ARROW_SPLIT_DAMAGE = 50;
const PHANTOM_GENERAL_DOMAIN_THRESHOLD   = 1000;
// 領域內維持 25% 減傷；將軍以進域前剩餘生命承接前半場輸出，不會重新灌滿。
const PHANTOM_DOMAIN_GENERAL_REDUCE      = 0.25;
const PHANTOM_DOMAIN_ENTRY_DURATION     = 2.0;
const PHANTOM_DOMAIN_FIGHTER_REVIVE_TIME = 10.0;
const PHANTOM_DOMAIN_FIGHTER_REVIVE_BONUS = 0.10;
const PHANTOM_DOMAIN_FIGHTER_REVIVE_REDUCE = 1.0;
const PHANTOM_FIGHT_SPIRIT_MAX           = 3;
const PHANTOM_FIGHT_SPIRIT_CONTACT       = 1;
const PHANTOM_FIGHT_SPIRIT_STORE_RATIO   = 0.5;
const PHANTOM_FIGHT_SPIRIT_CONSUME       = 2;

// Boss 專用戰鬥參數必須在所有 BOSS_CURSE_* 常數宣告後才建立，避免 TDZ 初始化錯誤.
const BOSS_CURSE_STATS = {
  SLASH_INTERVAL: BOSS_CURSE_SLASH_INTERVAL, SLASH_DAMAGE: BOSS_CURSE_SLASH_DAMAGE,
  SLASH_SLOW_FACTOR: BOSS_CURSE_SLASH_SLOW_FACTOR, SLASH_SLOW_DUR: BOSS_CURSE_SLASH_SLOW_DUR,
  SLASH_WARN_DUR: BOSS_CURSE_SLASH_WARN_DUR, SLASH_PROJECTILE_SPEED: BOSS_CURSE_SLASH_PROJECTILE_SPEED,
  SLASH_PROJECTILE_WIDTH: BOSS_CURSE_SLASH_PROJECTILE_WIDTH,
  HACHI_HITS: BOSS_CURSE_HACHI_HITS, HACHI_HIT_DAMAGE: BOSS_CURSE_HACHI_HIT_DAMAGE,
  HACHI_HIT_INTERVAL: BOSS_CURSE_HACHI_HIT_INTERVAL, HACHI_KNOCKBACK: BOSS_CURSE_HACHI_KNOCKBACK,
  HACHI_COOLDOWN: BOSS_CURSE_HACHI_COOLDOWN,
  DOMAIN_HP: BOSS_CURSE_DOMAIN_HP, DOMAIN_RADIUS: BOSS_CURSE_DOMAIN_RADIUS,
  DOMAIN_FRAMEDMG: BOSS_CURSE_DOMAIN_FRAMEDMG, DOMAIN_FREEZE_DUR: BOSS_CURSE_DOMAIN_FREEZE_DUR,
  KAMADO_SEASON_WINDOW: BOSS_CURSE_KAMADO_SEASON_WINDOW, KAMADO_CHARGE_DUR: BOSS_CURSE_KAMADO_CHARGE_DUR,
  KAMADO_COOLDOWN: BOSS_CURSE_KAMADO_COOLDOWN, KAMADO_RANGE: BOSS_CURSE_KAMADO_RANGE,
  KAMADO_WIDTH: BOSS_CURSE_KAMADO_WIDTH, KAMADO_DAMAGE: BOSS_CURSE_KAMADO_DAMAGE,
  KAMADO_BLAST_R: BOSS_CURSE_KAMADO_BLAST_R, KAMADO_BLAST_LIFE: BOSS_CURSE_KAMADO_BLAST_LIFE,
  KAMADO_ZONE_DUR: BOSS_CURSE_KAMADO_ZONE_DUR, KAMADO_ZONE_DPS: BOSS_CURSE_KAMADO_ZONE_DPS
};
const BOSS_CURSE_PHASE2_STATS = {
  ...BOSS_CURSE_STATS,
  DOMAIN_HP: BOSS_SUKUNA_P2_DOMAIN_HP,
  DOMAIN_RADIUS: BOSS_P2_DOMAIN_RADIUS,
  DOMAIN_FRAMEDMG: BOSS_P2_DOMAIN_FRAMEDMG
};

