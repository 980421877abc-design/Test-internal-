// ============================================================================
// CHARACTER ROSTER：一般角色排列與資料（可調整順序、名稱、圖示與描述）
// ============================================================================

// CHARACTER ROSTER：一般角色名單（依目前角色順序排列）
// ============================================================================

const CHARACTERS = [
  {
    id: 'chef', emoji: '👨‍🍳', weapon: '🔪', name: '地獄廚神',
    desc: '刀鋒不只切開食材，也能切開勝負。真正的料理，足以改變戰局。',
    stats: ['飛刀'],
    skills: [`飛刀：投擲菜刀穿透敵方，造成${KNIFE_DAMAGE}傷害，CD${CHEF_ATTACK_INTERVAL}s。`, `特性：手持雙刀（上限${KNIFE_MAX_COUNT}把），刀要回收才能再次丟擲`],
    color: '#e84545', glowColor: 'rgba(232,69,69,0.6)', type: 'chef',
  winQuote: '這肉生的我還聽到他在叫呢。',
  loseQuote: '……看來，火候還是差了一點。',
  variants: [
    { id: 'triple_knife', label: '三刀流', desc: `刀刃持有上限提升為3把（原本${KNIFE_MAX_COUNT}把），可以同時在場上維持更多把刀`,
      apply: (ch) => { ch.knifeMaxOverride = 3; } },
    { id: 'pressure_cooker', label: '高壓鍋', desc: `受到傷害會累積「壓力」。滿${CHEF_PRESSURE_MAX}層自動釋放高溫蒸汽，造成範圍傷害。`,
      apply: (ch) => { ch.chefHexPressure = true; } },
    { id: 'charred', label: '焦香', desc: `持續攻擊同一名敵人會疊加「焦香」，最多${CHEF_SEAR_MAX_STACKS}層；滿層時爆發並重置，短時間內可快速重新疊層。`,
      apply: (ch) => { ch.chefHexSear = true; } },
    { id: 'extra_salt', label: '鹽多一點', desc: `攻擊命中時有機率在攻擊者與目標之間生成調味道具。只有廚神自己可以拾取；鹽增傷、辣椒提升攻速、奶油回血。`,
      apply: (ch) => { ch.chefHexItems = true; } }
  ]
  },
  {
    id: 'drunk', emoji: '🍺', weapon: '🍾', name: '酒鬼',
    desc: '將美酒化作力量，越是酩酊大醉，越能爆發驚人的戰鬥力。沒人知道他是真醉，還是假醉。',
    stats: ['拋酒', '喝茫'],
    skills: [`拋酒：投擲酒瓶，造成${BOTTLE_DAMAGE}傷害，CD${DRUNK_ATTACK_INTERVAL}s。`, '喝茫：軌跡飄忽不定，移動方向隨機改變。'],
    color: '#7b4cca', glowColor: 'rgba(123,76,202,0.6)', type: 'drunk',
    variants: [
      { id: 'drunk_mist', label: '酒氣', desc: `每${DRUNK_MIST_INTERVAL}秒朝敵人吐酒氣霧，命中後混亂${DRUNK_CONFUSION_DURATION}秒。`, apply: ch => { ch.drunkHexMist = true; } },
      { id: 'drunk_punch', label: '醉拳', desc: `喝茫轉向時沿目前方向衝撞，命中造成${DRUNK_PUNCH_DAMAGE}傷害。`, apply: ch => { ch.drunkHexPunch = true; } },
      { id: 'drunk_high', label: '喝高了', desc: `每${DRUNK_INTOX_INTERVAL}秒及酒瓶命中增加醉意，10層後酩酊大醉${DRUNK_INTOX_DURATION}秒。`, apply: ch => { ch.drunkHexHigh = true; } }
    ],
  winQuote: '阿爸了beer?',
  loseQuote: '我是誰我在哪？。'
  },
  {
    id: 'opm', emoji: '👊', weapon: '💥', name: '一拳超人',
    desc: '​「禿了，也變強了。」​歷經了三年超越極限的魔鬼訓練（伏地挺身、仰臥起坐、深蹲各100次，外加跑步10公里），他獲得了擊碎一切的實力，代價則是失去了滿頭秀髮。',
    stats: [ '普通拳', '超人體魄'],
    skills: [`被動：每秒累積怒氣值，上限${OPM_COUNTDOWN_START}點；碰撞及碰牆可額外增長怒氣值（碰人${OPM_COLLISION_REDUCE}點、碰牆${OPM_WALL_REDUCE}點）。`, '普通拳：怒氣值滿時，對敵人造成等同其血量上限的傷害。', `超人體魄：承受所有傷害減免${Math.round(OPM_DMG_REDUCE*100)}%。`],
    color: '#f5f5f5', glowColor: 'rgba(245,245,245,0.6)', type: 'opm',
  winQuote: '又是一拳結束了嗎？。',
  loseQuote: '……原來我也會輸啊。'
  },
  {
    id: 'vampire', emoji: '🧛', weapon: '🦇', name: '暗夜領主',
    desc: '​「永生是份詛咒，而你們的鮮血，是唯一的解藥。」​隱匿於古老古堡中的暗夜領主。他視人類為螻蟻，卻又迷戀那流淌在血管中的溫熱與甘甜。優雅的禮服下，隱藏著撕裂黑夜的致命爪牙。',
    stats: ['咬擊 ', '蝙蝠狂襲'],
    skills: [`咬擊：碰到敵人時鎖定撕咬，造成${VAMPIRE_BITE_DAMAGE}傷害×${VAMPIRE_BITE_COUNT}段並吸血${VAMPIRE_BITE_HEAL}×${VAMPIRE_BITE_COUNT}，敵人被咬期間無法移動。`, `蝙蝠狂襲：高速衝向敵人，CD${VAMPIRE_DASH_INTERVAL}秒。`, `領主眷屬：身旁圍繞蝙蝠，會自動追縱敵人並吸血`],
    color: '#8b1a8b', glowColor: 'rgba(139,26,139,0.6)', type: 'vampire',
  winQuote: '我跨越過時代，如獸般的姿態。',
  loseQuote: '……鮮血先流盡了。',
  variants: [
    { id: 'crimson_feast', label: '猩紅盛宴',
      desc: '使用蝙蝠狂襲後，下一次咬擊每段回血量翻倍；但蝙蝠狂襲冷卻 +4 秒。',
      apply: (ch) => { ch.vampireCrimsonFeast = true; } },
    { id: 'blood_bat', label: '血蝠',
      desc: '領主眷屬造成傷害時，回血量翻倍；但領主眷屬傷害降低 50%。',
      apply: (ch) => { ch.vampireBloodBat = true; } }
  ]
  },
  {
  id: 'gojo', emoji: '😎', weapon: '🔵', name: '現代最強',
  desc: '​「放心吧，因為我是最強的。」​戰場上最令人絕望的對手。可一旦他拉下眼罩，迎來的便是敵人的末日。他能使用「無下限術式」將對手玩弄於股掌之間。',
  stats: ['蒼', '赫', '紫', ],
skills: [
  `被動「無下限」：身邊 ${GOJO_INFINITY_RADIUS}px 內出現敵方投射物時，消耗 1 點無下限量條讓其逐漸停下並消失（不造成傷害）。量條上限 ${GOJO_INFINITY_MAX}，每 ${GOJO_INFINITY_REGEN_TIME} 秒補滿。`,
  `順轉「蒼」：發射引力球，穿透敵人持續造成 ${GOJO_BLUE_FRAMEDMG} 傷害/幀，吸引範圍內敵方投射物最多儲存 ${GOJO_BLUE_PROJECTILE_CAPTURE_MAX} 顆。`,
  `反轉「赫」：發射斥力球，命中造成 ${GOJO_RED_DAMAGE} 傷害並強力擊退，同時釋放蒼儲存的投射物。`,
  `蒼／赫交替發射，每 ${GOJO_COOLDOWN} 秒一發；每發射 ${GOJO_PURPLE_EVERY_N} 發後，下一發改為發射穿透紫球（${GOJO_PURPLE_DAMAGE} 傷害）。`,
  `蒼與赫在場上碰撞時，於碰撞點產生 ${GOJO_CLASH_DAMAGE} 傷害的大範圍爆炸（無限制虛式紫，對五條悟自身減免 ${Math.round(GOJO_CLASH_SELF_REDUCE * 100)}%）。`,
  `「蒼拳」：近身 ${GOJO_FIST_RANGE}px 內主動出拳，造成 ${GOJO_FIST_DAMAGE} 傷害並將敵人拉向自己，CD ${GOJO_FIST_COOLDOWN} 秒。`,
  `「領域展開・無量空處」：血量 ≥ ${GOJO_DOMAIN_HP_REQ} 時發動，全場敵人麻痺 ${GOJO_DOMAIN_PARALYZE} 秒並每秒受到 ${GOJO_DOMAIN_DPS} 傷害；站在五條悟 ${GOJO_DOMAIN_SAFE_RADIUS}px 內的敵人不受影響。持續 ${GOJO_DOMAIN_DURATION} 秒，CD ${GOJO_DOMAIN_CD} 秒。`,
  `被動「六眼覺醒」：血量 ≤ ${GOJO_HP_THRESHOLD} 時，所有技能 CD 減少 ${GOJO_UNLOCK_CD_BONUS} 秒。`
],
  color: '#00cfff', glowColor: 'rgba(0,207,255,0.6)', type: 'gojo',
  winQuote: '沒錯，是五條贏了。',
  loseQuote: '沒能讓你感到盡興真是抱歉。',
  vsQuotes: { cursed: ['我的學生可都在身後看著呢。',
 '好乏味啊' ,'先聲明，你才是挑戰者'],
  yuta:'學會如何運用你身上的能力吧去保護他人吧，憂太。',
  tiger:['我很看好你喔，悠仁。','五條什麼的，無所喂了吧。','放馬過來吧！'],
  geto:['傑，你是我唯一的摯友。','因為我們是最強的。'],
  nanami:'我們用報廢的飯糰玩傳接球吧～'}
  },
  {
  id: 'cursed', emoji: '💀', weapon: '⚔️', name: '詛咒之王',
  desc: '​「別自以為是了，雜碎。誰允許你抬頭看我的？」​千年前曾讓無數咒術師陷入絕望、擁有四隻手兩張臉的「詛咒之王」。他的存在本身就是天災，用他的術式「御廚子」將對手給切成碎片。',
  stats: ['解', '捌', '伏魔御廚子'],
  skills: [`「解」：預警鎖定敵人後，朝其擲出一道高速飛斬（不受距離限制），命中造成${CURSE_SLASH_DAMAGE}傷害並緩速，CD${CURSE_SLASH_INTERVAL}s。`, `「捌」：碰觸敵方時觸發連續${CURSE_HACHI_HITS}次小斬擊（每次${CURSE_HACHI_HIT_DAMAGE}傷害），並將對方往碰撞反方向擊退。`, `領域展開「伏魔御廚子」：血量降至${CURSE_DOMAIN_HP}展開，對領域內角色造成${CURSE_DOMAIN_FRAMEDMG}傷害/幀。`, `【領域解鎖】術式順轉・蝕「竈」：對同一敵人在${CURSE_KAMADO_SEASON_WINDOW}秒內同時命中「解」與「捌」（完成料理）後，雙手凝聚烈火化為巨弓，蓄力${CURSE_KAMADO_CHARGE_DUR}s後轟出射程極短、範圍極窄但威力驚人的「萬死之炎」，造成${CURSE_KAMADO_DAMAGE}傷害並引爆大爆炸，並留下${CURSE_KAMADO_ZONE_DUR}秒的燃燒地面持續灼燒。`],
  color: '#c0392b', glowColor: 'rgba(192,57,43,0.6)', type: 'cursed',
  winQuote: '不過是沒出生在我時代的凡夫罷了。',
  loseQuote: '……別小看我，我可是『詛咒』啊',
   vsQuotes: {cannondad : '呦，身體比我想的還強些。' ,
gojo:['我可能一輩子都不會忘了你吧。','從小鬼出來後第一個就殺了你','你不過是板上的魚肉罷了','好無聊啊！'],
yuta:'沒想到你能做到這地步，乙骨憂太！',
tiger:['你那同情我的態度真是令人作嘔，這只顯得你很懦弱。','小鬼，別用你那套可悲的理想來衡量我。','你實在無聊，令我毫無興致。'],
  },
  
  },
  {
  id: 'trapper', emoji: '🪤', weapon: '⛓️', name: '陷阱大師',
  desc: '​「踩下去的那一刻，聲音是不是很清脆？哈哈哈！」​天才卻又瘋狂的機關發明家。比起拿刀劍互砍，他更喜歡躲在暗處，欣賞敵人踩中機關時驚恐與痛苦的表情。！',
  stats: ['尖刺', '鎖鏈'],
  skills: [`被動：碰到邊界時放置尖刺陷阱，上限${TRAP_MAX_COUNT}個。`, `尖刺：敵人觸碰尖刺造成${TRAP_DAMAGE}傷害並中毒(${TRAP_DOT_DPS}/s)。`, `鎖鏈：每隔一段時間使尖刺射出鎖鏈，CD${TRAP_CHAIN_INTERVAL}s，強制將敵人拉向陷阱。`],
  color: '#27ae60', glowColor: 'rgba(39,174,96,0.6)', type: 'trapper',
  winQuote: '你逃不出我的手掌心。',
  loseQuote: '哈……連我自己都被困住了嗎。'
  },
  {
  id: 'yi', emoji: '⚫', weapon: '⬜', name: '奕',
  desc: '​「天地為局，眾生為子。這一步，你待如何？」​驚才絕艷的曠世棋聖。在他眼中，世間萬物的運作、戰場的廝殺，都不過是縱橫十九道棋路線上的博弈。',
  stats: ['連星', '天下劫', '料敵先機', '取勢'],
  skills: [`普攻「連星」：每${YI_BLACK_INTERVAL}s在最靠近敵人的格線交叉點落下兩枚棋，第二枚依上→右→下→左貼鄰；相鄰後永久激活，敵人碰到會沿既有連線引爆，每枚${YI_MINE_DAMAGE}傷害。`, `技能「天下劫」：奕生命低於600或進入戰場${YI_HEAVEN_FORCE_TIME}s未施放時觸發。奕獲得5枚「神之一手」每${YI_HEAVEN_PLACE_INTERVAL}s開始；先落中心棋，再每${YI_HEAVEN_STONE_INTERVAL}s依序落下四方附棋，附棋與中心相隔一格空交叉點，全部落完後還需等待${YI_STONE_ACTIVATION_DELAY}s才激活，敵人進入棋子爆炸範圍後每顆棋子引爆造成${YI_HEAVEN_DAMAGE}傷害，CD${YI_HEAVEN_COOLDOWN}s。`, `被動「料敵先機」：棋子激活時，連續直線上的每枚棋子使該棋子傷害+${Math.round(YI_LINK_DAMAGE_BONUS * 100)}%，最多${YI_LINK_MAX_STACKS}層。`, `被動「取勢」：奕造成傷害後，令敵人緩速${Math.round((1 - YI_ADVANTAGE_SLOW_FACTOR) * 100)}% ${YI_ADVANTAGE_SLOW_DURATION}s。`],
  color: '#e8e8e8', glowColor: 'rgba(232,232,232,0.6)', type: 'yi',
  winQuote: '神之一手！。',
  loseQuote: '我算漏了？。'
  },
  {
  id: 'gunner', emoji: '🔫', weapon: '💥', name: '無名槍手',
  desc: '​「在我的槍口前，每個人都只有一秒的時間後悔。」​游走在法律與罪惡邊緣的頂尖槍手。沒有人知道他的真名，只知道當他的皮靴馬刺聲響起，就代表死神的腳步近了。',
  stats: [  '連射', '額外裝填', '閃光彈'],
  skills: [`被動：每次撞牆裝彈${GUNNER_MAG_count}發，上限${GUNNER_MAG_SIZE}發；額外：每${GUNNER_EXTRA_RELOAD_INTERVAL}s裝填${GUNNER_EXTRA_RELOAD_COUNT}發，仍受彈夾上限限制。`, `原本連射：累積足夠子彈後停下連射，每發${GUNNER_BULLET_DAMAGE}傷害。`, `原本閃光彈：每${GUNNER_FLASH_INTERVAL}s投擲，造成${GUNNER_FLASH_DAMAGE}範圍傷害並凍結攻擊與技能冷卻${GUNNER_FLASH_COOLDOWN_FREEZE_DUR}s；額外附加速度降至${Math.round(GUNNER_FLASH_SLOW_FACTOR * 100)}%，持續${GUNNER_FLASH_SLOW_DURATION}s。`],
  color: '#f0c84a', glowColor: 'rgba(184,134,11,0.6)', type: 'gunner',
  winQuote: '顆秒！！！！！！。',
  loseQuote: '……看來這次，慢了半拍。'
  },
  {
  id: 'samurai', emoji: '⚔️', weapon: '⚔️', name: '末代武士',
  desc: '​「櫻花落盡之日，亦是吾輩刀鋒折斷之時。」​舊時代最後的守護者。當火槍與鋼鐵席捲大地，他依舊手握著那把象徵武士靈魂的太刀。。',
  stats: ['招架 ', '居合', '識滅斬',],
  skills: [
    `招架：定時進入「招架」狀態持續${SAMURAI_PARRY_DURATION}sCD${SAMURAI_PARRY_INTERVAL}s，可將部分飛來投射物反彈，反彈傷害×${SAMURAI_PARRY_REFLECT_MUL}，招架時受傷害減免${Math.round(SAMURAI_PARRY_DMG_REDUCE*100)}%。`,
    `「居合」：招架中碰到敵方球即觸發穿透斬擊，造成${SAMURAI_IAIDO_DAMAGE}傷害。`,
    `「識滅斬」：使用${SAMURAI_IAIDO_MAX}次居合居合後解鎖，造成${SAMURAI_SHIMETSU_DAMAGE}傷害×${SAMURAI_SHIMETSU_COUNT}段。`
  ],
  color: '#d4af37', glowColor: 'rgba(212,175,55,0.6)', type: 'samurai',
  winQuote: '此刻，識滅之時。',
  loseQuote: '刀鋒既斷，武士之道，亦盡於此。'
  },
  {
  id: 'mage', emoji: '🎩', weapon: '🕊️', name: '魔術師',
  desc: '神出鬼沒的舞台魔術師。定時施展「無中生有」，隨機變出其他角色的投射物；所有變出的投射物都能承載魔術技巧。施放後瞬間消失到場地另一處。',
  stats: ['無中生有', '瞬移', '魔術技巧'],
  skills: [`無中生有：每${MAGE_DOVE_INTERVAL}s隨機發射神奇的物品。`, `魔術技巧：每命中${MAGE_TRICK_HIT_COUNT}次，下一發無中生有投射物附帶回血／反彈／追蹤／定身其一。`],
  color: '#9b59b6', glowColor: 'rgba(155,89,182,0.6)', type: 'mage',
  winQuote: '好戲開演！！！！。',
  loseQuote: '幻夢隨雲散去，魔術落幕。'
  },
  {
  id: 'thunder', emoji: '⚡', weapon: '🌩️', name: '雷電法王',
  desc: '「凡人，見識過真正的『天罰』嗎？」​誕生於萬雷交加之夜的雷霆化身。他性格狂暴、傲慢，視世間萬物為導電的媒介。',
  stats: ['閃電柱', '麻痺', ],
  skills: ['閃電柱：碰到牆壁時留下閃電柱，上限8柱。', '閃電：閃電柱間每1於不同牆面產生閃電CD1.8s，每道閃電造成20傷害。', '麻痺：被閃電擊中有15%機率麻痺，使敵人定身並中斷攻擊。'],
  color: '#f1c40f', glowColor: 'rgba(241,196,15,0.6)', type: 'thunder',
  winQuote: '以雷霆擊碎黑暗！。',
  loseQuote: '……天罰，竟也降在了我自己身上。'
  },
  {
  id: 'blacksmith', emoji: '🔨', weapon: '⚔️', name: '鍛造師',
  desc: '​「千錘百鍊始成鋼，我的傑作，能斬斷神明的骨頭。」​隱居於火山熔岩旁的傳奇鍛造大師。對他而言，每一次錘擊都是與鋼鐵的對話',
  stats: ['鍛造',  '劍擊' ],
  skills: [
    `鍛造：平時持續鍛造武器，每次鍛造累積${SMITH_FORGE_DMG_PER_STACK}點加傷害並加快下次鍛造速度（上限${SMITH_FORGE_MAX_STACKS}層）。`,
    `劍擊：靠近敵人時拔劍砍擊，造成${SMITH_SWORD_BASE_DAMAGE}+鍛造加傷害；每次劍擊額外鍛造1層，並重置鍛造速度。`,
  ],
  color: '#cd7f32', glowColor: 'rgba(205,127,50,0.6)', type: 'blacksmith',
  winQuote: '比蟑螂還不如。',
  loseQuote: '……這把劍，終究還沒鍛造完全。'
  },
  {
  id: 'naoya', emoji: '👤', weapon: '👊', name: '禪院直哉', image: 'image/naoya.png',
  desc: '​「別隨便碰我，雜魚的弱者臭味會傳染的。」​咒術界名門「禪院家」的嫡子。擁有極致的天賦與高傲的血統，唯我獨尊，視弱者與女性如草芥。除了心中崇拜的那位「暴君」外，他不把任何人放在眼裡。',
  stats: ['投射法術', '凶星軌跡'],
  skills: [
    `投射法術：預定好行動軌跡時沿途留下殘影分身，上限${NAOBITO_SHADOW_MAX}個；直哉沿路徑移動時可穿透角色，碰到對手會使對手定身${NAOBITO_CONTACT_IMMOBILIZE_DURATION}s；敵人碰到殘影造成${NAOBITO_SHADOW_DAMAGE}傷害，CD${NAOBITO_PATH_INTERVAL}s。`,
    `「凶星軌跡」：累積${NAOBITO_KYOUSEI_THRESHOLD}個殘影時自動觸發，所有殘影與本體同時衝向敵人，造成${NAOBITO_KYOUSEI_PIERCE_DMG}+殘影${NAOBITO_KYOUSEI_SHADOW_DMG}×N傷害。`,
  ],
  color: '#e8e8f0', glowColor: 'rgba(220,220,255,0.6)', type: 'naoya',
  winQuote: '能跟上甚爾的人，只能是我。',
  loseQuote: '不能跟在男人身後走三步的女人，就該被捅死。。',
  vsQuotes: { yuta: '我可是真希的哥哥啊。',
tiger:'是宿儺的容器啊，順便殺了吧',
oniichan: '能力比弟弟還差的哥哥沒有存在的意義吧',
}
  },
  {
  id: 'itachi', emoji: '🐦‍⬛', weapon: '🔥', name: '宇治波鼬',
  desc: '​「無論村子有多麼黑暗，我都是木葉的宇智波鼬。」​背負著背叛者之名，隱匿於陰影中的孤高忍者。他將一切情感與光明埋葬在血色之夜，只為在暗處守護心愛的弟弟與村子的和平。',
  stats: [`天照 ${ITACHI_AMATERASU_DAMAGE}／下次傷害+${ITACHI_AMATERASU_NEXT_DAMAGE_BONUS}`, '月讀', '須佐能乎 減傷害50%', '烏鴉替身'],
  skills: [`「天照」：發射黑炎，命中造成${ITACHI_AMATERASU_DAMAGE}傷害，並使目標下次受到的傷害固定增加${ITACHI_AMATERASU_NEXT_DAMAGE_BONUS}點，CD${ITACHI_AMATERASU_INTERVAL}s。`, `「月讀」：使敵人定身${ITACHI_TSUKUYOMI_PIN_DUR}sCD${ITACHI_TSUKUYOMI_INTERVAL}s。`, '「須佐能乎」：血量降至500時自動觸發，攻擊改為近戰50傷害並恢復30血，減傷害50%。', `替身：瀕死時化作烏鴉瞬移到戰場某處並回復${ITACHI_CROW_HEAL}血量，每場一次。`],
  color: '#8b0000', glowColor: 'rgba(139,0,0,0.6)', type: 'itachi',
  winQuote: '沉浸在幻術的海洋之中吧。',
  loseQuote: '原諒我，這是最後一次了。'
  },
  {
  id: 'yuta', emoji: '💍', weapon: '👧', name: '純愛戰神',
  desc: '​「我們可是純愛啊。——來吧，里香！」​當代僅有的四位特級咒術師之一。背負著特級過咒怨靈「祈本里香」的少年。',
  stats: ['咒言', '咒力斬', '里香揮爪', '純愛砲'],
  skills: ['「咒言」：發射定身敵人的咒言，造成50傷害，CD2.5s，命中後定身1.5秒。', '「咒力斬」：靠近敵人時揮出斬擊，造成40傷害，CD1s。', '咒靈完全顯現：咒力斬命中三次後里香完全顯現，定時揮爪(180傷害/4s)並釋放純愛大砲(60傷害/s，持續6s)，同時增幅乙骨全部攻擊。'],
  color: '#ff6fa5', glowColor: 'rgba(255,111,165,0.6)', type: 'yuta',
  winQuote: '里香，謝謝妳。',
  loseQuote: '里香……抱歉，這次幫不了妳了。',
  vsQuotes: {cannondad : '僅限一次喔。' ,
gojo:'五條老師，指教了',
cursed:'我會親手殺了宿儺，為老師報仇。' , 
 itachi:'你沒有朋友或是家人嗎？',
 tiger:'你背負的罪惡不屬於你，你沒有錯。',
 geto:'真失禮，我們可是純愛阿。',
 kinji:'狀況好的話，比我還強喔'
 }
  },
  {
  id: 'engineer', emoji: '👷', weapon: '🔧', name: '工程師',
  desc: '​「真理只在我的砲台射程之內。——機甲，連線！」​智商高達 200 的頂尖機械天才。對他而言，戰場不過是一場大型的物理與火力實驗。。',
  stats: ['炮台', '電網', '機甲',],
  skills: ['砲台：原地部署自動炮台，發射每發20傷害的子彈。', '電網：定時於敵人周圍佈下電網，造成定身並持續20傷害/s。', '機甲：放置5個炮台後啟動機甲模式，全身換上重裝甲(減傷害10%)，改以35傷害的雷射光束橫掃戰場。'],
  color: '#3a8fd6', glowColor: 'rgba(58,143,214,0.6)', type: 'engineer',
  winQuote: '在大量子彈中找到少量受害者。',
  loseQuote: '……計算出現了誤差。'
  },
  {
  id: 'cannondad', emoji: '🚬', weapon: '💥', name: '砲爹',
  desc: '​「我的這生過得很充實，但……就是不夠甜啊！」​來自四百年前、咒術史上擁有「最高咒力輸出量」的狂熱戰士。他不為名利，只為了尋找能讓自己靈魂顫抖的「甜點」。',
  stats: ['追蹤光球', '光柱', '光砲 ', '拳擊'],
  skills: ['咒術「冰砂衝擊波」：隨機發射追蹤光球(30傷害×3/0.9s)、光柱(50傷害/1.6s)或蓄力光砲(60傷害×3/2.2s)。', '拳擊：近身時直接揮拳，造成20傷害。'],
  color: '#bdbdbd', glowColor: 'rgba(189,189,189,0.6)', type: 'cannondad',
  winQuote: '就這點實力，根本填不飽我。',
  loseQuote: '謝謝你，我吃飽了。',
vsQuotes: { yuta: ['真的很甜美啊！！！！乙骨。','你就是我的甜點嘛！',],
cursed:'喂喂喂 太甜了吧！'}    
  },
  {
  id: 'dio', emoji: '🧏', weapon: '🔪', name: 'DIO',
  desc: '​「貧弱，貧弱！人類的能力是有極限的……我不做人啦！」​跨越百年復活的惡之化身，站在替身頂點的帝王。擁有超越常理的怪力與吸血鬼不死之身，其替身「世界（The World）」更掌握了支配時間的至高力量。',
  stats: ['替身「世界」', '「The World」', '飛刀', 'HIGH狀態'],
  skills: [
    `替身「世界」：貼身連打，${DIO_STAND_PUNCH_DAMAGE}傷害/${DIO_STAND_PUNCH_INTERVAL}s。`,
    `「The World」：使時間停止(持續${DIO_WORLD_DURATION}秒，CD${DIO_WORLD_COOLDOWN}秒)，並在時停中丟刀，每刀${DIO_KNIFE_DAMAGE}傷害。`,
    '麵包：吃下場上的麵包可回血並丟刀',
    `「high狀態」吃滿${DIO_BREAD_HIGH_THRESHOLD}個麵包後進入HIGH狀態，時停延長至${DIO_WORLD_HIGH_DURATION}秒，並在第一次時停時丟壓路機。`
  ],
  color: '#f5d020', glowColor: 'rgba(245,208,32,0.6)', type: 'dio',
  winQuote: '我現在真是high到不行！',
  loseQuote: 'wryyyýyyyyy!!!!!。',
  vsQuotes:{ joseph :['如果說這個世界上還有誰配得上我正眼相看，那就只有你了','我不做人了，JOJO！']}
  },
  {
  id: 'tiger', emoji: '🐯', weapon: '👊', name: '虎天帝',
  desc: '​「只要還能動，我就會一直詛咒你。——接招吧，宿儺！」​歷經無數絕望與摯友的逝去，那個曾經只會用肉身搏擊的少年，終於在戰場上徹底覺醒為支配宿命的「虎天帝」。',
  stats: ['徑庭拳 ', '超新星 ', '穿血' , '宿儺容器'],
  skills: ['「徑庭拳」：距離130內蓄力0.4秒揮拳，命中造成80傷，1秒後追加50傷並擊退；20%機率觸發「黑閃」，兩段傷害提升1.5倍並清除等量流血。（CD 2.6秒）', '被動「宿儺容器」：受到傷害的65%轉為流血，之後以18/秒扣除，流血上限600；觸發黑閃時可清除等同於1.5倍黑閃傷害量的流血。', '「穿血」：消耗自身50血量（不致命）發射血刃，造成60傷害，並在自身留下等量流血；命中處留下可存活12秒的血球。（CD 2.2秒）', '「超新星」：集滿3顆血球後，原地蓄力0.7秒引爆，射出14根血流針，每根30傷，射程140。（CD 至少4秒）'],
  color: '#cc2200', glowColor: 'rgba(204,34,0,0.6)', type: 'tiger',
  winQuote: '我只是個零件。就算我是個零件，也要盡可能地祓除詛咒。',
  loseQuote: '這樣對嗎？老師',
  vsQuotes: { yuta: '乙骨前輩，辛苦你了。',
gojo:['這樣就可以了吧，老師。','老師你的術式好礙事啊。'],
cursed:'我不會憎恨你，但我會殺了你。如果你願意回到我體內，我就放過你。',
geto:'在成為咒術師前，我們是人類。',
yuki:'這是對我哥哥重要的人來說，她的理想',
nanami:'娜娜明⋯⋯？',
oniichan:'大哥，謝謝你'
}
  },
  {
  id: 'stargirl', emoji: '⭐', weapon: '🌟', name: '星星女孩',
  desc: '使用「星造術」，大星星碰牆時向周圍爆散出5顆小星星。小星星傷害敵人。不定時時召喚星隕，大量流星從天而降。',
  stats: ['大星星', '星散', '小星星', '星隕'],
  skills: ['「星造術」：操控大星星，碰牆時向周圍爆散出5顆小星星(星散)。', '小星星：接觸敵人造成傷害。', '「星隕」：不定時召喚流星雨，大量流星從天而降。'],
  color: '#ffe066', glowColor: 'rgba(255,224,102,0.6)', type: 'stargirl',
  winQuote: '一閃一閃亮晶晶。',
  loseQuote: '……星星，也會有墜落的時候呢。'
  },
  {
  id: 'obito', emoji: '🌀', weapon: '🔥', name: '宇智波帶土',
  desc: '​「這個世界……已經沒有存在的價值了。就在虛幻的夢境中，重逢吧。」​曾是憧憬火影的善良少年，在目睹世界的殘酷與絕望後，化身為在黑暗中操縱歷史的面具男。！',
  stats: ['火球', '神威', '虛化'],
  skills: ['「「火球」：向敵人發射火焰球，造成60傷害，命中後延遲0.6秒衝刺將敵人抓進神威空間。（CD 10秒）。', '「神威」：可將敵人或投射物吸入神威空間，主動進出造成60傷害；抓住敵人甩飛造成40傷害。（CD 7秒）。', '「虛化」：每3秒自動進入虛化狀態，持續0.5秒，可躲避並吸收投射物（最多6顆），神威時一併釋放。'],
  color: '#ff6600', glowColor: 'rgba(255,102,0,0.6)', type: 'obito',
  winQuote: ['我沒有名字，也不以任何身份而活。','我要創造一個有琳的世界','不能守護該守護的人，這份力量又有什麼意義？'],
  loseQuote: '好不容易才搞好關係……最終還是沒能向琳告白啊。',
  vsQuotes: { itachi: ['宇智波的血脈，終究逃不過悲劇嗎。','你選擇守護，我選擇毀滅，僅此而已。'],
  geto: '為了理想的世界不擇手段，我們還挺像的。',
  minato:['水門老師，這個村子，這個世界，已經都無所謂了！','既是為了發動戰爭，也是為了永久的和平','身為我的老師，卻沒認出我，你也不過爾爾',]
   }
  },
  {
  id: 'fisherman', emoji: '🎣', weapon: '🪝', name: '釣魚佬',
    desc: '每隔一段時間向場地邊緣拋出魚鉤，依照釣上來的魚觸發效果；空軍越多，後續釣魚越快，願者上鉤！',
    stats: ['釣魚', '魚', '鯊魚', '首領魚', '大海', '空軍獎勵'],
    skills: [`釣魚：向場地邊緣拋出魚鉤釣魚（基礎 CD ${FISHER_CAST_COOLDOWN.toFixed(1)} 秒）。`, '魚：造成30點傷害，延遲1秒後再造成50點傷害','鯊魚：造成70傷害並附70點dot傷害','首領魚：連續丟出大量魚總共240點傷害','大海：由側邊連續出現7道海浪（每道70傷），並衝向對手甩到牆上',`被動「空軍獎勵」：每次釣到空軍，後續釣魚冷卻減少 ${FISHER_AIRFORCE_CD_REDUCTION.toFixed(1)} 秒，可疊加至本場最低 ${FISHER_MIN_CAST_COOLDOWN.toFixed(1)} 秒，效果只持續本場戰鬥，戰鬥結束後重置。`,'機率：魚: 30, 鯊魚: 8, 空軍: 6, 首領魚:4 , 大海: 2'],
  color: '#4a90d9', glowColor: 'rgba(74,144,217,0.6)', type: 'fisherman',
  winQuote: ['只要相信海，海就會幫你。','聽海哭的聲音。','他說風雨中這點痛算什麼。'],
  loseQuote: '……這次，是我被釣走了。',
    },
  {
  id: 'geto', emoji: '🧘', weapon: '👻', name: '夏油條',
  desc: '「為了我們所堅信的『大義』，非術師們……請你們去死吧。」​曾是站在頂點的天才學生，如今則是創立宗教、操弄詛咒的特級詛咒師。他看透了保護弱者的虛偽與無趣，決定建立一個只有術士的純粹世界。',
  stats: ['咒靈', '特級咒靈', '極之番・漩渦', '游雲'],
  skills: ['被動「咒靈」：每秒消耗1點咒靈庫存（上限100）召喚小型咒靈，血量25，碰觸造成27傷害（同一隻咬擊冷卻1秒），咒靈咬人也會反震自身27傷害，存活上限14秒。', '「特級咒靈」：血量降至50%時召喚，血量300，承擔夏油條所受傷害的30%；隨機釋放：糾纏（枝條纏繞，每跳0.5秒共4跳，每跳22傷，造成傷害60%轉為回血，CD 5秒）／定身（範圍440內定身2秒，CD 5秒）／咒力奔流（蓄力1.4秒後造成95傷，蓄力中特級咒靈受傷提升50%，CD 6秒）。', '「極之番・漩渦」：血量降至25%時發動，蓄力2秒後射出光球，傷害250+庫存咒靈數×0.6', '被動「游雲」：貼身棍擊敵人，造成40傷害並擊退，冷卻2秒。'],
  color: '#5b3a8e', glowColor: 'rgba(91,58,142,0.6)', type: 'geto',
  winQuote: ['這個世界，只需要留下優秀的咒術師就好。','非術師不過是家畜罷了。',],
  loseQuote: '最後也說些詛咒人的話吧。',
  vsQuotes: { gojo: ['悟，這可不像你會說的話','因為你是五條悟所以你是最強，還是因為你是最強所以是五條悟？'],
   yuta: ['你這個欺騙愛人的東西，我可是大義！'],
  tiger: '你要保護的那些人，有天會背叛你的。',
  naoya: '禪院家的天才，也不過如此。',
  yuki:'只要把非術師殺了，是不是就不再有詛咒了。',
  oniichan:'你們只是我的失敗作品'
  
   }
  
  },
  {
  id: 'sakiko', emoji: '🎹', weapon: '🎼', name: 'Oblivionis',
  desc: '我，「無懼遺忘。」以鍵盤譜寫命運，以意志掌控舞台。凡踏入她所編織的劇場者，都將成為故事的一部分。你的掙扎，只是我劇本中的一段插曲',
  stats: ['頌樂音符 ', '鋼琴/管風琴', '新月甦醒', '殘月的餘韻'],
  skills: [
    `「頌樂音符」：持續發射會自動追蹤敵人的音符投射物，音符會根據不同的音色有不同屬性，音符在命中時會疊${SAKIKO_FEVER_PER_HIT}點fever值（滿層${SAKIKO_FEVER_MAX}），根據場上音符數量每顆音符提升${(SAKIKO_NOTE_DMG_PER_STACK*100).toFixed(0)}%傷害（上限${SAKIKO_NOTE_MAX_STACK}個）。`,
    '「滿月舞會」：碰牆時切換鋼琴音色／管風琴音色。',
    `「鋼琴音色」：速度較慢，對敵人造成${SAKIKO_PIANO_DAMAGE}傷害（CD${SAKIKO_PIANO_INTERVAL}秒）`,
    `「風琴音色」：速度較快，對敵人造成${SAKIKO_ORGAN_DAMAGE}傷害（CD${SAKIKO_ORGAN_INTERVAL}秒）`,
    `「新月甦醒」：連續丟出${SAKIKO_NOVA_COUNT}道當前音色音符，基礎傷害${SAKIKO_NOVA_BASE_DAMAGE} 從${(SAKIKO_NOVA_DECAY_START*100).toFixed(0)}%衰減到${(SAKIKO_NOVA_DECAY_END*100).toFixed(0)}%（CD${SAKIKO_NOVA_COOLDOWN}秒）。`,
    `「殘月的餘韻」：Fever值滿時觸發，同時發射兩種音色的音符（CD${SAKIKO_DUAL_FIRE_INTERVAL}），且在「殘月的餘韻」中不會死亡，持續${SAKIKO_DUAL_DURATION}秒。`,
  ],
  color: '#c9a4d1', glowColor: 'rgba(201,164,209,0.6)', type: 'sakiko',
  winQuote: ['現在正是復權的時代','歡迎來到Ave mujica的世界。','我將成為神'],
  loseQuote: '軟弱的我已經死了',
    },  {
  id: 'joseph', emoji: '☀️', weapon: '👊', name: '大喬',
  desc: '出身名門喬斯達家，擁有高尚的品格與堅不可摧的意志。面對宿敵，即使失去一切，也從未放棄守護他人。歷經殘酷試煉後，習得「波紋」之力，以生命能量化作驅逐黑暗的光芒。',
  stats: ['碰觸 ', '波紋疾走 ', '彈簧拳 ', 'SYO '],
  skills: ['被動：碰觸敵人造成15傷害（未蓄氣時5傷害）。','波紋呼吸法：開局蓄力兩秒，進入呼吸法狀態，在狀態下每秒回5血及造成傷害時都會回血（25血）', '「波紋疾走」：近距離拳擊，造成40點傷害，疊1層波紋（CD4秒）。', '「彈簧拳」：長距離拳擊，造成50點傷害疊2層波紋（CD7秒）。', '「SYO」：在開啟波紋呼吸法35秒後解鎖，對敵人造成連續拳擊。'],
  color: '#2f7dc0', glowColor: 'rgba(47,125,192,0.6)', type: 'joseph',
  winQuote: ['願你的靈魂能得到救贖，再見了。','這就是喬斯達家族的力量！'],
  loseQuote: '艾琳娜，你要幸福',
  vsQuotes: { dio: ['你的野心到此為止了！',] }
    },
  {
  id: 'steve', emoji: '⛏️', weapon: '⚔️', name: '史蒂夫',
  desc: '​來自未知維度的最高造物主。他沒有台詞，甚至沒有表情，但他的存在本身就是對世界規則的嘲弄。',
  stats: ['劍 5→25', '斧 ', '弓/弩 ', '重錘 '],
  skills: ['獲取升級：碰牆進行2秒資源收集可升級裝備一次，CD7秒，最高四階段。', '劍（碰撞傷害）：徒手10／木劍15／石劍20／鐵劍25。', '斧（主動劈砍）：木斧100(0.2s蓄力)／石斧125／鐵劍後石斧150／四階段雙持金斧175(高速小範圍)。', '弓／弩：二階段解鎖弓，50傷害(0.3s蓄力)，CD2s；三階段升級為弩，無蓄力50傷害；四階段升級煙花弩，100傷害，1s瞄準，命中會爆炸造成範圍傷害。', '「重錘」：解鎖四階段後開始5秒CD，時間到衝向敵人造成傷害並擊退'],
  color: '#4a8f3c', glowColor: 'rgba(74,143,60,0.6)', type: 'steve',
  winQuote: '讓我們，當個創世神吧。',
  loseQuote: '史帝夫離開了世界'
  },
  {
  id: 'daji', emoji: '🦊', weapon: '🦊', name: '九尾妖狐 妲己',
  desc: '媚骨天成，尾若九曳。以魅惑迷亂心智，以鬼火焚盡敵蹤——尾巴集滿之時，便是萬劫不復的狐嘯之刻。',
  stats: ['尾巴', '鬼火', '魅惑', '法術球'],
  skills: [
    `被動「九尾」：每次攻擊或釋放技能獲得一條尾巴，集滿${DAJI_TAIL_MAX}條時消耗全部尾巴，刷新兩個技能CD並強化下次施放的技能，強化技能命中/釋放時恢復${DAJI_ENH_HEAL}生命值。`,
    `普攻「鬼火」：發射追蹤鬼火，命中造成${DAJI_FIRE_DAMAGE}傷害並灼燒敵人，每秒造成${(DAJI_BURN_PCT*100).toFixed(0)}%最大生命值傷害(CD${DAJI_FIRE_INTERVAL}秒)。`,
    `技能一「魅惑」：魅惑敵人${DAJI_CHARM_DURATION}秒使其朝自己靠近，並強化下次攻擊為近戰強擊，造成${DAJI_MELEE_DMG}傷害並擊退；被動強化後傷害提升為${DAJI_MELEE_DMG_ENH}並附加${DAJI_MELEE_STUN_ENH}秒暈眩。（CD ${DAJI_SKILL1_CD}秒）`,
    `技能二「狐火彈」：發射法術球，基礎傷害${DAJI_BALL_BASE_DMG}，每有1條尾巴傷害+${DAJI_BALL_DMG_PER_TAIL}（最高${DAJI_BALL_MAX_DMG}），體積隨傷害增加；被動強化後原地蓄力${DAJI_ENH_CHANNEL_TIME}秒再高速射出，傷害與體積固定為最大值。（CD ${DAJI_SKILL2_CD}秒）`,
  ],
  color: '#e08ac7', glowColor: 'rgba(224,138,199,0.6)', type: 'daji',
  winQuote: ['九尾搖曳，魂為之傾倒。', '這就是……媚惑天下的力量。'],
  loseQuote: '……妖力，終究還是散了。'
  },
  {
  id: 'yuki', emoji: '🪐', weapon: '🌀', name: '九十九由基',
  desc: '「……那，你喜歡什麼類型的女性？」深不見底的重力操控者。每一次碰撞，都只是引力累積的前奏——當重力疊滿之時，她的身軀將化作足以吞噬萬物的星漿與黑洞。',
  stats: ['鳳輪', '重力', '星漿體', '假想黑洞'],
  skills: ['被動「引力」：由基自身帶有少許引力，持續將週遭敵人微微拉近，重力層數越高拉力越強。', '「ki鳳輪」：碰撞敵人後延遲片刻，鳳輪環繞由基身旁現身進行掃蕩攻擊，造成120傷害，並為自己疊加一層「重力」。', '被動「重力」：每層增加10%傷害，最多5層；疊滿後進入「星漿體」狀態。', '「星漿體」：持續15秒，每秒扣除20點血量；期間獲得「星之怒」，每2.5秒將敵人拉向自己，並立刻釋放兩次「鳳輪」。', '「假想黑洞」：星漿體狀態下，任一方血量低於400時發動，持續2.5秒持續將敵人吸入並造成200傷害/秒，結束後由基扣除500點血量。'],
  color: '#4b0082', glowColor: 'rgba(75,0,130,0.6)', type: 'yuki',
  winQuote: '你喜歡什麼類型的女性？',
  loseQuote: '無論重力，還是質量，深究下去的話。',
  vsQuotes: { geto: ['把非術師給肅清嘛，或許也是個方法吧','你能回答我之前的問題嘛',] ,
  tiger:'這是我一生的研究，接下來的靈魂與肉體之爭，就交給你們了。',
  yuta:'你必須作為主要戰力去參加死滅迴游，這裡就交給我吧。',
  oniichan:['雖然我是獨生女，但你真的是最棒的哥哥','作為『詛咒』的你已經在這裡死了。活下去吧!']
  }
  
  
  },
  {
    id: 'wuxing', emoji: '👻', weapon: '❔', name: '無形',
    desc: '「你以為你在跟誰打？下一秒，我就是別人了。」沒有固定招式與樣貌的存在，會不斷奪取他人的姿態與力量—。',
    stats: ['無形'],
    skills: [
      '被動「無形」：戰鬥開始立刻化身為隨機角色，之後每 7 秒隨機再變成不同角色，變身瞬間回復100血量。',
      '變身期間的技能、冷卻時間、攻擊方式完全比照當下化身的角色，等同直接操作那個角色。',
      '血量、位置以及當下所中的異常狀態（灼燒、麻痺、定身、緩速等）不會因變身而重置或清除。'
    ],
    color: '#9b8cce', glowColor: 'rgba(155,140,206,0.6)', type: 'wuxing',
    winQuote: '你甚至不知道，你剛剛打的到底是誰。',
    loseQuote: '……連我自己，都不知道輸的究竟是誰了。'
  },
  {
    id: 'sans', emoji: '🦴', weapon: '🦴', name: 'Sans🦴',
    desc: '「嘿，兄弟。」一名看似隨便的骷髏，似乎非常慵懶，他想跟你說個玩笑。',
    stats: ['完美閃避','骨牆','龍骨砲'],
    skills: [
      '被動「完美閃避」：血量固定為23點，無論實際傷害多少，每次受傷固定只扣1點，無視場地效果。',
      '普攻「骨頭」：朝敵人射出一根骨頭，貫穿敵人，每0.1秒造成20點傷害，冷卻1秒。',
      '技能一「骨牆」：隨機從地圖上/下/左/右其中一側生成一排骨頭（長度約邊長1/3），並平移至對面牆壁，碰到的敵人每0.1秒受到30點傷害，冷卻5秒。',
      '重力：每使用兩次骨牆，會在第二次發動時額外將敵人強制往上下左右其中一方向拖走，敵人因此撞牆時依移動距離受到傷害。',
      '技能二「龍骨砲」：從地圖外朝敵人方向射出一道大型光束，造成35點傷害，冷卻8秒。',
      '大招「大風車」：剩餘1點血量時觸發，停止所有行動、原地不動並進入無敵，接著朝八個方向輪流釋放龍骨砲式攻擊，每次命中25點且範圍逐次縮小，共20次、每0.25秒一次；若次打完仍未擊敗敵人，自己會直接死亡。'
    ],
    color: '#e8e8e8', glowColor: 'rgba(120,190,230,0.6)', type: 'sans',
    winQuote: '在這樣的日子裡，像你這樣的孩子……就該在地獄裡焚燒。',
    loseQuote: 'Papyrus，你要來點什麼嗎？。'
  },
  {
    id: 'pucci', emoji: '🤵🏾', weapon: '🐍', name: '普奇神父',
    desc: '「你相信引力嗎？」隱藏在監獄深處的神父，以白蛇窺探敵人的動向，於寂靜中低聲唸誦通往天堂的密語。當重力降臨、時間開始加速，通往「天堂」的階梯便無人能夠阻擋。',
    stats: ['白蛇', '密語', '新月', '天堂製造'],
    skills: [
      `「白蛇」：白蛇如替身般環繞在普奇身旁；敵人進入偵測範圍時，白蛇會迅速衝出以刺擊攻擊，造成${PUCCI_SNAKE_STAB_DAMAGE}傷害後歸位（冷卻${PUCCI_SNAKE_ATTACK_CD}秒）。命中瞬間會在場地隨機處丟出一片CD光碟，光碟未被踩到之前，被咬中的敵人所有技能冷卻都像時間靜止一樣不再流動；敵人踩到光碟後，冷卻才重新開始運作。同一名敵人的光碟效果尚未解除前，白蛇不會再對其出擊。`,
      `「密語」：若白蛇有一小段時間沒有出擊，普奇會停下腳步，依序低聲唸出十四句密語受傷或出擊都會打斷唸誦（已唸出的部分不會歸零），十四句唸畢後，場上隨機處會誕生一名爬向普奇的綠色嬰兒。`,
      `「新月」：嬰兒觸碰到普奇後，白蛇消失、替身進化為新月；範圍內敵人會被捲入重力隨機甩向上下左右一方，依甩飛距離造成傷害（冷卻${PUCCI_MOON_GRAVITY_CD}秒），受影響的敵人有一段時間只能貼牆移動。新月降臨約${PUCCI_MOON_ROCKET_DELAY}秒後，場地正中央會出現一座🚀。`,
      `「天堂製造」：普奇觸碰到🚀後停止移動，蓄力${PUCCI_HEAVEN_CHARGE_TIME}秒，新月進化為天堂製造。此後普奇自身與己方攻擊的速度提升${PUCCI_HEAVEN_SPEED_BASE}倍，之後每${PUCCI_HEAVEN_SPEED_INTERVAL}秒再加倍一次，普奇的碰撞傷害也隨速度倍率同步提升，且全程減傷${Math.round(PUCCI_HEAVEN_DMG_REDUCE*100)}%；天堂製造在場時，DIO的世界時停持續時間會縮短，且時停中普奇仍可以極慢速度移動。`
    ],
    color: '#8e6bbf', glowColor: 'rgba(142,107,191,0.6)', type: 'pucci',
    winQuote: ['我很敬佩第一個吃香菇的人。', '再說一次，時間要加速了！', '覺悟者恆幸福',],
     vsQuotes: { dio: ['你是王中之王，我願追隨於你！',],
      },
    loseQuote: '你能理解嗎？明白『命運』的意義嗎！？'
 },
  {
    id: 'baie', emoji: '🌄', weapon: '⚔️', name: '白厄',
    desc: '哀麗秘榭的白厄，向你致意。同為奧赫瑪的異鄉人，相聚即是緣分。隨我來，說不定我們以後還有並肩作戰的時候。',
    stats: ['逐火救世', '火種', '愛上雷神', '灾厄•弑魂焚诏'],
    skills: [
      `「逐火救世」：偵測範圍內敵人並揮砍，${BAIE_SLASH_DMG_BASE}傷害，冷卻${BAIE_SLASH_COOLDOWN}秒。`,
      `「火種」：造成傷害＋1、受到傷害＋1、碰撞到對方＋2，累積滿${BAIE_KINDLING_MAX}點後消耗觸發「愛上雷神」。`,
      `「愛上雷神」：血量上限+${Math.round(BAIE_LOVE_HP_BONUS*100)}%，「逐火救世」傷害提升至${BAIE_SLASH_DMG_ENHANCED}，期間免疫一切控制效果，展開領域特效，且不再累積火種；狀態最少間隔${BAIE_LOVE_MIN_INTERVAL}秒才能再次觸發。`,
      `「灾厄•弑魂焚诏」：愛上雷神狀態下，每次「逐火救世」命中後，下次攻擊改為原地不動${BAIE_ZAIE_DURATION}秒的大範圍劈砍，期間自身減傷${Math.round(BAIE_ZAIE_DMG_REDUCE*100)}%，並將對手原傷害的${Math.round(BAIE_ZAIE_REFLECT_RATIO*100)}%反彈給對手。`,
      `「支柱•死星天裁」：愛上雷神狀態結束時，召喚覆蓋全場的隕石，固定造成${BAIE_METEOR_DMG}傷害。`,
      `被動「不滅的英雄」：愛上雷神狀態下瀕死時，每場僅觸發一次不死，回復${Math.round(BAIE_REVIVE_HEAL_RATIO*100)}%生命上限，並引爆自身造成對手${BAIE_REVIVE_SELFDMG}傷害（一拳超人的必殺拳不受此限制）。`
    ],
    color: '#e8c840', glowColor: 'rgba(200,160,220,0.6)', type: 'baie',
    winQuote: ['翁法羅斯，一定會迎來真正的黎明。', '登登登 yellow and purple 小fish'],
    loseQuote: '白厄再次踏上了輪迴'
  },
  {
    id: 'rsqjs', emoji: '🛑', emoji2: '🔷', weapon: '💣', name: '紅石青金石',
    desc: '「因為我……不想失去你。」雙方把這句話藏在心裡，直到一切都無法挽回。自那之後，382次的輪迴，只為改寫每一次注定的離別。兩人害怕的從來不是死亡，而是眼睜睜看著重要的人消失，自己卻無能為力。只要還有一絲希望，就會戰鬥到最後一刻。',
    stats: ['炸藥', '附魔金蘋果', '附魔書', '水攻', '復仇'],
    skills: [
      `雙生：本角色由🛑紅石／🔷青金石兩顆球組成，各自擁有獨立${RSQJS_MAX_HP}血量（右上角分兩條血顯示）。`,
      `🛑炸藥：定時丟出💣，落地後延遲${RSQJS_BOMB_FUSE}s引爆，依距爆炸中心遠近造成${RSQJS_BOMB_MIN_DMG}~${RSQJS_BOMB_MAX_DMG}傷害（不會傷到🔷），冷卻${RSQJS_BOMB_CD}s。`,
      `🛑附魔金蘋果：吃下🍎，炸藥冷卻減半且每秒回復${RSQJS_APPLE_HEAL_PS}血，持續${RSQJS_APPLE_DURATION}s，冷卻${RSQJS_APPLE_CD}s。`,
      `🔷附魔：丟出📖，🛑撿到後附魔自身，同款書可疊加等級（上限${RSQJS_ENCHANT_MAX_LV}級），冷卻${RSQJS_BOOK_CD}s。書分三種——「分裂」每級炸藥+${RSQJS_ENCHANT_SPLIT_PER_LV}顆／「保護」每級減傷+${Math.round(RSQJS_ENCHANT_PROTECT_PER_LV*100)}%／「傷害」每級炸藥最高傷害+${RSQJS_ENCHANT_DMG_PER_LV}。`,
      `🔷水攻：定時在場上放水，範圍內敵方緩速並每秒受到${RSQJS_WATER_DPS}傷害，冷卻${RSQJS_WATER_INTERVAL}s。`,
      `復仇：若🔷先死，🛑所有附魔升一級並繼承水攻；若🛑先死，🔷繼承炸藥能力（附魔改直接加在🔷身上），並獲得「迅捷潛行」——冷卻${RSQJS_STEALTH_CD}s，觸發${RSQJS_STEALTH_DURATION}s無敵。`
    ],
    color: '#e84b4b', glowColor: 'rgba(232,75,75,0.6)', type: 'rsqjs', isTwin: true,
    twinRoles: {
      stop:    { suffix: '🛑', color: '#e84b4b', glowColor: 'rgba(232,75,75,0.6)', image: 'image/rsqjs-redstone.png' },
      diamond: { suffix: '🔷', color: '#3fa9e8', glowColor: 'rgba(63,169,232,0.6)', image: 'image/rsqjs-lapis.png' }
    },
    winQuote: ['在另一個世界，我們還是朋友嗎？。', '這一次，終於改寫了結局。'],
    
  },
  {
    id: 'dragon4', emoji: '🐲', weapon: '🐲', name: '四天之龍',
    desc: '「次元融合，四天歸位。」由四顆能力迥異的龍球融合而成的存在，擺弧、猛毒、淨翼、叛逆——四種截然不同的力量共享同一份生命。',
    stats: ['擺弧噴射', '猛毒控制', '淨翼白光', '叛逆吸取'],
    skills: [
      `次元融合：本角色由🟨擺弧龍／🟪猛毒龍／⬜淨翼龍／⬛叛逆龍四顆球組成，四龍共享同一份血量，受到傷害減免${Math.round(DRAGON4_DMG_REDUCE*100)}%；血量低於${DRAGON4_ENRAGE_HP}時進入強化狀態，四項技能冷卻全部減半。`,
      `🟨擺弧噴射：原地向敵人噴射螺旋波，持續${DRAGON4_PENDULUM_DURATION}s，每秒造成${DRAGON4_PENDULUM_DPS}傷害，冷卻${DRAGON4_PENDULUM_CD}s。`,
      `🟪猛毒控制：衝向敵人造成${DRAGON4_VENOM_DAMAGE}傷害並暈眩${DRAGON4_VENOM_STUN}s，並附加每秒${DRAGON4_VENOM_POISON_DPS}點、持續${DRAGON4_VENOM_POISON_DUR}s的中毒，冷卻${DRAGON4_VENOM_CD}s。`,
      `⬜淨翼白光：自身散發白光，使四龍攻擊力提升${Math.round(DRAGON4_WING_BUFF_MULT*100)}%，持續${DRAGON4_WING_BUFF_DURATION}s；同時對敵人造成${DRAGON4_WING_DAMAGE}傷害並使其麻痺，冷卻${DRAGON4_WING_CD}s。`,
      `⬛叛逆吸取：對敵人遠程吸取造成${DRAGON4_REBEL_DAMAGE}傷害，並使其傷害輸出降低${Math.round(DRAGON4_REBEL_WEAKEN_MULT*100)}%，持續${DRAGON4_REBEL_WEAKEN_DUR}s，冷卻${DRAGON4_REBEL_CD}s。`
    ],
    color: '#e8c93d', glowColor: 'rgba(232,201,61,0.6)', type: 'dragon4', isQuad: true,
    winQuote: '四龍歸一，天地為之退避。',
    loseQuote: '融合……終究還是崩解了嗎。'
  },
  {
    id: 'nanami', emoji: '👔', weapon: '🔪', name: '娜娜明',
    desc: '「這不是義務，是我自己選的。」原型：七海建人。手持鈍刀的社畜咒術師，平時冷靜分析戰局，一旦加班時間到了，便會卯足全力把帳算清楚。',
    stats: ['劈砍', '情報解析', '瓦落瓦落', '加班時間'],
    skills: [
      `「劈砍」：揮動鈍刀進行主動攻擊，碰觸敵人造成${NANAMI_SLASH_DMG}傷害，攻擊間隔${NANAMI_SLASH_INTERVAL}s。`,
      `被動「情報解析」：沒有觸發攻擊時，每${NANAMI_ANALYSIS_TICK}秒獲得一層增益（最多${NANAMI_ANALYSIS_MAX_STACKS}層），每層增加${Math.round(NANAMI_ANALYSIS_ATK_PER_STK*100)}%攻擊傷害與${Math.round(NANAMI_ANALYSIS_DEF_PER_STK*100)}%受擊減傷，一旦攻擊命中就會清空重新累積。`,
      `被動「十劃咒法」：每次「劈砍」攻擊有${Math.round(NANAMI_MARK_TRIGGER_CHANCE*100)}%機率讓這一刀直接就是十劃咒法，傷害變為${NANAMI_MARK_DMG_MULT}倍；觸發黑閃後，下一刀必定是十劃咒法。`,
      `被動「黑閃紀錄保持人」：每次近戰攻擊有${Math.round(NANAMI_BLACKFLASH_BASE*100)}%機率觸發黑閃，傷害變為${NANAMI_BLACKFLASH_DMG_MULT}倍（可與十劃咒法疊加）；觸發後下一刀必定是十劃咒法，且下次黑閃觸發機率增加${Math.round(NANAMI_BLACKFLASH_STEP*100)}%，最多連續觸發${NANAMI_BLACKFLASH_MAX_CHAIN}次，第五次攻擊必定不會觸發並重置。`,
      `「十劃咒法・瓦落瓦落」：每${NANAMI_WALL_COOLDOWN}秒對牆壁發動攻擊，牆壁沿直線持續掉落石塊，共${NANAMI_WALL_ROCK_COUNT}塊，每塊造成${NANAMI_WALL_ROCK_DMG}傷害。`,
      `「加班時間」：戰鬥開始${NANAMI_OVERTIME_TRIGGER}秒後發動，所有攻擊傷害提升至${Math.round(NANAMI_OVERTIME_DMG_MULT*100)}%，黑閃基礎觸發率提升至${Math.round(NANAMI_OVERTIME_BLACKFLASH*100)}%，移動速度提升，身上開始冒藍色咒力。`
    ],
    color: '#3d5a80', glowColor: 'rgba(61,90,128,0.6)', type: 'nanami',
    winQuote: '勞動就是狗屎、很遺憾，接下來是加班時間。',
    loseQuote: '我已經收到很多人的感謝，沒有遺憾了。',
    vsQuotes: {
      tiger: '我有義務要優先照顧你。',
      gojo: '我信任他，也信賴他，但是我並不尊敬他！'
    }
  },
  {
    id: 'momoi', emoji: '🍑', emoji2: '💚', weapon: '🔫', name: '桃井／綠',
    desc: '「靈感這種東西，是要用痛苦換來的。」／「靈感新鮮的時候，不用趕快畫下來嗎？」形影不離的創作者姊妹，桃井帶著獨特創意四處奔走，綠總跟在一旁，笑咪咪卻毫不留情地把子彈全招呼過去。',
    stats: ['獨特創意', '創作的痛苦', '堅守期限', '新鮮靈感', '繪畫藝術', '洗練的品味'],
    skills: [
      `雙生：本角色由🍑桃井／💚綠兩顆球組成，各自擁有獨立${MOMOI_MAX_HP}血量（右上角分兩條血顯示）。`,
      `🍑「獨特創意」：每${MOMOI_BURST_INTERVAL}秒發射三顆子彈，左中右各一顆（小扇形，依序射出、不是霰彈同時發射），每顆${MOMOI_BULLET_DAMAGE}傷害，射擊${MOMOI_SHOTS_BEFORE_RELOAD}輪後進行${MOMOI_RELOAD_TIME}秒的換彈。`,
      `🍑「創作的痛苦」：冷卻${MOMOI_SKILL_CD}秒，對面前扇形範圍內所有敵人造成${MOMOI_SKILL_DAMAGE}傷害；綠還活著時，額外造成${MOMOI_SKILL_SYNERGY_BONUS}傷害。`,
      `🍑「堅守期限」：每${MOMOI_PASSIVE_INTERVAL}秒，自身所有攻擊增加${MOMOI_PASSIVE_BUFF_DMG}傷害，持續${MOMOI_PASSIVE_BUFF_DURATION}秒。`,
      `💚「新鮮靈感」：每${MIDORI_ATTACK_INTERVAL}秒對一名敵人造成${MIDORI_BULLET_DAMAGE}傷害，射擊${MIDORI_SHOTS_BEFORE_RELOAD}次後進行${MIDORI_RELOAD_TIME}秒的換彈。`,
      `💚「繪畫藝術」：冷卻${MIDORI_SKILL_CD}秒，連續射擊${MIDORI_SKILL_SHOTS}次（可重複命中同一人），每次${MIDORI_SKILL_DAMAGE}傷害；桃井還活著時，每次額外造成${MIDORI_SKILL_SYNERGY_BONUS}傷害。`,
      `💚「洗練的品味」：每${MIDORI_PASSIVE_INTERVAL}秒，恢復桃井與綠兩人中血量較少的一方${MIDORI_PASSIVE_HEAL}血。`,
      `開發者加成：兩人都還活著時，綠的攻速從每${MIDORI_ATTACK_INTERVAL}秒一發提升至每${MIDORI_SYNERGY_ATTACK_INTERVAL}秒一發，桃井所有攻擊額外造成${MOMOI_SYNERGY_DMG_BONUS}傷害。`
    ],
    color: '#f2a65a', glowColor: 'rgba(242,166,90,0.6)', type: 'momoi', isTwin: true,
    twinRoles: {
      momoi:  { suffix: '🍑', color: '#f2a65a', glowColor: 'rgba(242,166,90,0.6)', image: 'image/momoi.png' },
      midori: { suffix: '💚', color: '#5cb85c', glowColor: 'rgba(92,184,92,0.6)', image: 'image/midori.png' }
    },
    winQuote: ['太好了！完全勝利！', '姐姐，不能太得意忘形喔。']
  },
  {
    id: 'oniichan', emoji: '🩸', weapon: '🩸', name: '歐尼醬',
    desc: '體內流著劇毒的血液，操控血液作為武器—九相圖的大哥，會肅清一切想傷害他弟弟的人。',
    stats: ['毒血', '穿血', '大哥'],
    skills: [
      `【被動】「咒胎九相圖」：血液中含有劇毒，中毒目標持續${ONIICHAN_POISON_DUR}秒、每秒受到${ONIICHAN_POISON_DPS}點傷害。`,
      `「血刃」：近戰攻擊，傷害${ONIICHAN_BLADE_DAMAGE}，附帶中毒。`,
      `「赤血操術・苅祓」：發射${ONIICHAN_TRACK_COUNT}顆追蹤血球，每顆傷害${ONIICHAN_TRACK_DAMAGE}，CD${ONIICHAN_TRACK_COOLDOWN}s，附帶中毒。`,
      `「超新星」：移動路徑上留下血球地雷，敵人觸碰爆炸造成${ONIICHAN_MINE_DAMAGE}傷害，附帶中毒。`,
      `「穿血」：原地蓄力${ONIICHAN_QUAD_WINDUP}s後，依敵人所在象限發射血線並順時針掃射整個象限，每秒傷害${ONIICHAN_QUAD_DPS}，CD${ONIICHAN_QUAD_COOLDOWN}s，附帶中毒。`,
      `「血雨」：從場地隨機一側邊緣射出${ONIICHAN_SPIKE_COUNT}支尖刺橫掃到對邊，每支傷害${ONIICHAN_SPIKE_DAMAGE}，CD${ONIICHAN_SPIKE_COOLDOWN}s，附帶中毒。`,
      `「血星磊」：發動時自身減傷${(ONIICHAN_BLOODSTAR_DMG_REDUCE*100).toFixed(0)}%持續${ONIICHAN_BLOODSTAR_DURATION}s，CD${ONIICHAN_BLOODSTAR_COOLDOWN}s，但結束時有${(ONIICHAN_BLOODSTAR_CLOT_CHANCE*100).toFixed(0)}%機率因血栓受到${ONIICHAN_BLOODSTAR_CLOT_DAMAGE}點自傷。`,
      `「赫鱗躍動・載」：血量低於${ONIICHAN_ENRAGE_HP_THRESHOLD}時，血刃傷害x${ONIICHAN_ENRAGE_BLADE_MULT}、移動速度x${ONIICHAN_ENRAGE_SPEED_MULT}。`,
      `「血潮」：血量低於${ONIICHAN_TIDE_HP_THRESHOLD}時，停止移動並釋放${ONIICHAN_TIDE_WAVE_COUNT}道擴散血浪，每道傷害${ONIICHAN_TIDE_WAVE_DAMAGE}，附帶中毒。`,
    ],
    color: '#c41e3a', glowColor: 'rgba(196,30,58,0.6)', type: 'oniichan',
    winQuote: '壞相、血塗看著吧，這就是你們的哥哥！',
    loseQuote: '抱歉啊，悠仁。又要留你孤身一人了',
    vsQuotes: {
      tiger: '怎麼⋯⋯回事⋯⋯',
      geto: '原來是這麼一回事，加茂憲倫！',
      yuki: '九十九，我是「人」嗎？',
      naoya: '我無法理解你這種不愛自己兄弟的人的心情',
    }
  },
  {
    id: 'minato', emoji: '🥷', weapon: '🗡️', name: '波風水門',
    desc: '「戰場上最快的男人。」木葉的金色閃光，將苦無標記與空間轉移運用到極致的天才忍者，敵人甚至來不及看清他的身影，勝負便已分曉。',
    stats: ['飛雷神斬', '飛雷神二段', '螺旋丸'],
    skills: [
      `「飛雷神斬」：朝敵人丟出苦無並短暫蓄力，隨即朝苦無方向發動穿透斬擊，造成${MINATO_SLASH_DAMAGE}傷害；斬擊命中則再次連段，最多${MINATO_SLASH_MAX_COMBO}次，苦無會插在牆上，CD${MINATO_SLASH_COOLDOWN}s。`,
      `「飛雷神二段」：牆上苦無累積${MINATO_STAGE2_KUNAI_REQ}把以上時觸發，額外丟出一把苦無後，在所有苦無間高速移動，每次移動對路途上的敵人造成${MINATO_STAGE2_HIT_DAMAGE}傷害，結束後收回所有苦無並進入${MINATO_PARRY_DURATION}秒「防反」狀態。`,
      `防反狀態：受到攻擊時無效該傷害，並瞬移到攻擊者身旁一腳踢出，造成${MINATO_PARRY_KICK_DAMAGE}傷害與擊退，之後解除防反。`,
      `「螺旋丸」：CD${MINATO_RASENGAN_COOLDOWN}s，衝向敵人造成${MINATO_RASENGAN_DAMAGE}傷害與擊退；若在防反狀態中發動，則改為瞬移到敵人身旁抓住敵人後轟出螺旋丸，造成${MINATO_RASENGAN_PARRY_DAMAGE}傷害並提前結束防反。發動螺旋丸時，飛雷神斬CD暫停倒數直到螺旋丸結束。`,
      `被動「金色閃光」：受到攻擊時瞬移到場上隨機一把苦無位置，並額外朝敵人丟出一把苦無，CD${MINATO_PASSIVE_COOLDOWN}s。苦無本身沒有傷害，僅作為飛雷神的位移標記。`,
          ],
    color: '#f4d35e', glowColor: 'rgba(244,211,94,0.6)', type: 'minato',
    winQuote:['雖然是對手，但你還不賴。','多少了解金色閃光的由來了嗎？','背負火影之名！我不能輸！'],
    loseQuote: '相信他吧，他可是……我們的孩子啊！',

vsQuotes: {
      obito: ['如果那時我能認出你，是否你還會走向一樣的道路','原來你還活著，如果你能成為火影該多好',]
      
    }



  },
  {
    id: 'elementmaster', emoji: '🧙‍♂️', weapon: '🔮', name: '元素大師',
    desc: '精通火、水、土、風、電五種元素的旅法師，走過的路上總會留下元素圖騰。累積的力量終將在戰場中央引爆一場元素奧義。',
    stats: ['魔法子彈', '元素圖騰', '元素奧義'],
    skills: [
      `「魔法子彈」：發射一枚帶有小追蹤的子彈，傷害${EM_BULLET_DAMAGE}，CD${EM_BULLET_COOLDOWN}s。`,
      `「元素圖騰」：碰撞到敵人時在原地隨機放置一個火／水／土／風／電圖騰，CD${EM_TOTEM_COOLDOWN}s。圖騰依元素對經過者產生效果，每個圖騰最多被經過${EM_TOTEM_MAX_HITS}次後消失，各圖騰觸發有獨立冷卻。`,
      `火圖騰：敵人經過灼燒${EM_FIRE_ENEMY_BURN_DMG}點；大師經過發射火彈，傷害${EM_FIRE_MASTER_BOLT_DMG}並附加${EM_FIRE_MASTER_BOLT_BURNDPS}×${EM_FIRE_MASTER_BOLT_BURNDUR}秒灼燒。`,
      `水圖騰：敵人經過附加「浸水」，${EM_WATER_SOAK_DURATION}秒內造成的傷害-${Math.round((1-EM_WATER_SOAK_MULT)*100)}%（可疊加時長）；大師經過回復${EM_WATER_MASTER_HEAL}血。`,
      `土圖騰：敵人經過${EM_EARTH_ENEMY_VULN_DUR}秒內受到傷害+${Math.round(EM_EARTH_ENEMY_VULN_PCT*100)}%；大師經過獲得${EM_EARTH_MASTER_INVUL_DUR}秒無敵。`,
      `風圖騰：敵人經過緩速${EM_WIND_ENEMY_SLOW_DUR}秒；大師經過重置所有技能冷卻。`,
      `電圖騰：敵人經過麻痺${EM_ELEC_ENEMY_PARALYZE}秒；大師經過朝上下左右釋放十字閃電，麻痺${EM_ELEC_MASTER_BOLT_PARALYZE}秒並造成${EM_ELEC_MASTER_BOLT_DMG}傷害。`,
      `「元素奧義」：開局${EM_ULT_BASE_WAIT}秒後（大師每經過一次圖騰-${EM_ULT_REDUCE_PER_PASS}秒）消耗場上所有圖騰並詠唱${EM_ULT_CAST_TIME}秒，釋放大師經過次數最多元素的奧義（全場僅一次）：`,
      `火「業炎・焚身衝」：取消魔法子彈，改為碰撞造成${EM_FIRE_ULT_CONTACT_DMG}傷害並灼燒；施放瞬間原地衝擊波造成${EM_FIRE_ULT_BURST_DMG}傷害並點燃範圍敵人，自身加速${Math.round(EM_FIRE_ULT_SPEED_BUFF*100)}%。`,
      `水「靜水・深淵潛流」：魔法子彈改為海嘯直線推進，命中造成${EM_WATER_ULT_WAVE_EXTRA_DMG+EM_BULLET_DAMAGE}傷害並強制擊退、附加${EM_WATER_ULT_SOAK_DURATION}秒浸水；水圖騰不再對敵人生效。`,
      `土「地母・不壞金剛體」：召喚會追蹤敵人的土魔像，碰撞擊退並造成${EM_EARTH_ULT_GOLEM_DMG}傷害；土圖騰只對敵人生效；自身獲得可吸收${Math.round(EM_EARTH_ULT_SHIELD_RATIO*100)}%最大生命值的岩甲護盾。`,
      `風「烈風・絕地暴渦」：召喚旋風領域，敵人減速並持續受到傷害；施放瞬間捲向中心一次、之後每${EM_WIND_ULT_PULL_INTERVAL}秒再吸拉一次，自身移速永久+${Math.round(EM_WIND_ULT_SPEED_BUFF*100)}%，且受到攻擊時有${Math.round(EM_WIND_ULT_MISS_CHANCE*100)}%機率MISS；風圖騰改為只對大師生效。`,
      `電「雷霆・天誅亂舞」：施放瞬間必中閃電，之後每${EM_ELEC_ULT_STRIKE_INTERVAL}秒在地圖隨機處降下閃電；電圖騰改為只對敵人生效，魔法子彈額外附加${EM_ELEC_ULT_BULLET_PARALYZE}秒麻痺。`,
      `釋放奧義後，元素圖騰冷卻縮短為${EM_TOTEM_COOLDOWN_ULT}s，且此後只會放置該元素的圖騰。`,
    ],
    color: '#8e6fd6', glowColor: 'rgba(142,111,214,0.6)', type: 'elementmaster',
    winQuote: '元素從不說謊，只有不懂聆聽的人。',
    loseQuote: '看來……我還沒能讀懂這片戰場的元素。'
  },
  {
  id: 'johnny', emoji: '🧑🏻‍🦽', weapon: '🌀', name: '喬尼・喬斯達',
  desc: '身負殘疾的騎手，見到一名奇怪的男人——傑洛·齊貝林，為了解開其鐵球的秘密，喬尼向他學習了黃金迴旋的技藝，並踏上跨越全美國的賽程。',
  stats: ['Tusk', '爪彈', 'lesson5', '黃金迴旋'],
  skills: [
    '被動「Tusk」：Tudk會依對黃金迴旋的熟悉度由 ACT1 進化至 ACT3；ACT3 上馬後進化為 ACT4。',
    '被動「漆黑意志」：最大生命值1500。每累積受到300點傷害後進入會掉下馬，無法攻擊且技能冷卻暫停，喬尼會慢慢爬向場上的馬。',
    'ACT1：連射8發藍色爪彈，每發8點傷害，冷卻1.5秒。',
    'ACT2：蓄力1秒發射100傷害強化爪彈，留下追蹤傷口，再造成50點真傷並緩速；冷卻4秒，吃草藥使冷卻減少1秒。',
    'ACT3：向牆壁發射爪彈並躲入牆體10秒，期間無法受到傷害，沿牆逆時針移動。',
    `ACT4：上馬後發射永久追蹤、不可反彈的黃金迴旋爪彈，命中後造成${JOHNNY_ACT4_DPS}點/幀真傷，持續${JOHNNY_ACT4_HIT_DURATION}秒；效果結束後可再次發射。`
  ],
  color: '#376dff', glowColor: 'rgba(55,109,255,0.7)', type: 'johnny',
  winQuote: ['這是個從負數到0的故事','贏的人是我們，而不是你！','真的、真的……繞了……好大一圈啊…',],
   loseQuote: '杰諾，是你在那裡嗎？'
  },

{
  id: 'amelia', emoji: '🕵🏻', weapon: '🔍', name: '阿梅', image: 'image/amelia.png',
    desc: '會說話的狐狸、魔法松鼠、超人狗狗等等，對網絡上各種關於hololive的奇聞軼事感到好奇的她，在調查這些傳聞的過程中，自己也萌生了成為偶像的想法，但意外的來到這個地方。',
    stats: ['放大鏡揮擊', '手槍射擊', 'Ground Pound', '時空旅人'],
    skills: [`近戰：靠近敵人時以放大鏡揮擊，造成${AMELIA_MELEE_DAMAGE}傷害。`, `遠程：手槍每${AMELIA_PISTOL_INTERVAL}秒射1發，每發${AMELIA_PISTOL_DAMAGE}傷害；${AMELIA_PISTOL_MAG_SIZE}發後裝填${AMELIA_PISTOL_RELOAD_TIME}秒。`, `Ground Pound：暫時消失${AMELIA_GROUND_POUND_DELAY}秒後落在敵人附近，造成${AMELIA_GROUND_POUND_DAMAGE}範圍傷害並緩速40%。`, `時空旅人：開場一次抽取${AMELIA_TIME_TRAVEL_MIN_HP}～${AMELIA_TIME_TRAVEL_MAX_HP}血，召喚同血量的阿梅。`, `被動「偵探」：放大鏡揮擊命中時疊加，最多${AMELIA_DETECTIVE_MAX_STACKS}層；每層使敵人受到的傷害增加${AMELIA_DETECTIVE_VULN_PER_STACK * 100}%。`, '被動「懷錶」：本體血量到達抽取血量時憑空消失；召喚阿梅不具備此被動。'],
    color: '#d9b15f', glowColor: 'rgba(217,177,95,0.72)', type: 'amelia',
    winQuote: 'Fast and easy... just like your mom!.',
    loseQuote: '（摔打鍵盤的聲音）。'
  },
  {
    id: 'kashimo', emoji: '🦌', weapon: '🪄', name: '鹿紫雲一',
    desc: '400年前的術師。為了與有史以來最強的術師宿儺交手，追尋強者的氣息，來到了這裡。',
    stats: ['閃電突刺', '電湧陷阱', '電解轟鳴', '瞬雷', '幻獸琥珀／鹿式電'],
    skills: [
      `被動「電荷分離」：普攻或技能命中附加${KASHIMO_NEGATIVE_PER_HIT}層負電荷；碰撞敵人或牆壁獲得1層正電荷，正電荷最多${KASHIMO_POSITIVE_MAX}層，每層移速+${KASHIMO_POSITIVE_SPEED_PER * 100}%。負電荷達${KASHIMO_NEGATIVE_MAX}層時觸發瞬雷，造成${KASHIMO_RELEASE_DAMAGE}傷害、麻痺${KASHIMO_RELEASE_PARALYZE}秒並清空負電荷。`,
      `普攻「閃電突刺」：每${KASHIMO_ATTACK_INTERVAL}秒高速衝向目標，造成${KASHIMO_ATTACK_DAMAGE}傷害並附加負電荷；正電荷達5層時產生磁力拉近目標。`,
      `技能一「電湧陷阱」：將如意棒插在原地並自由移動；敵人在鹿紫雲與如意棒之間時，紫色雷電造成${KASHIMO_TRAP_DAMAGE}傷害並附加負電荷，同一敵人短時間內不重複觸發。`,
      `技能二「電解轟鳴」：每${KASHIMO_FIELD_COOLDOWN}秒在自身周圍展開半徑${KASHIMO_FIELD_RADIUS}的雷電場，持續${KASHIMO_FIELD_DURATION}秒；每${KASHIMO_FIELD_TICK}秒造成${KASHIMO_FIELD_DAMAGE}傷害，每秒附加1層負電荷。`,
      `幻獸琥珀：戰鬥${KASHIMO_AMBER_UNLOCK_TIME}秒後自動釋放正電荷與場上負電荷，對附近敵人造成${KASHIMO_AMBER_RELEASE_DAMAGE_PER_CHARGE}×總電荷傷害；持續${KASHIMO_AMBER_DURATION}秒，移速+100%、普攻與技能 CD 減半、附加雙倍負電荷、不再使用電湧陷阱，並每秒扣${KASHIMO_AMBER_SELF_BLEED_DPS}血。`,
      `技能三「鹿式電」：僅幻獸琥珀可用，停止移動蓄力${KASHIMO_DEER_LIGHTNING_CHARGE}秒後向前方發射雷電炮擊，造成${KASHIMO_DEER_LIGHTNING_DAMAGE}傷害、麻痺${KASHIMO_DEER_LIGHTNING_PARALYZE}秒並附加${KASHIMO_DEER_LIGHTNING_STACKS}層負電荷；CD ${KASHIMO_DEER_LIGHTNING_COOLDOWN}秒。`
    ],
    color: '#b6a0ff', glowColor: 'rgba(125,92,255,0.78)', type: 'kashimo',
    winQuote: ['白白浪費生命。','很有見地','喂！別讓我太過期待好不好！',],
    loseQuote: '快給我個痛快吧。',
    vsQuotes: {
      tiger: '宿儺成了後輩？',
      cursed: '一刻也來不及為五條哀悼，立刻趕到戰場的是',
      cannondad: '你就是羂索提起的那個人吧。',
      geto: '我接受你之前的提議',
      gojo: '如果他死了，下一個換我',
      yuta: '別去插手！',
      kinji: ['把音樂放大聲點！好好給你送終！','我將在這4分11秒內幹掉你。','不自量力！','透過拖時間取勝，這是弱者的思維']
    }
  },
  {
    id: 'kinji', emoji: '🎰', weapon: '🎟️', name: '秤金次',
    desc: '東京咒術高專三年級學生，熱愛「狂熱」，認為狂熱就是賭博、賭博就是人生。',
    stats: ['閘門', '咒力連擊', '坐殺博徒', '小鋼珠'],
    skills: [
      `被動「狂熱」：每秒+${KINJI_PASSION_PER_SECOND}層；普攻命中+${KINJI_PASSION_PER_BASIC_HIT}層；技能命中+${KINJI_PASSION_PER_SKILL_HIT}層，最多${KINJI_PASSION_MAX}層。`,
      `被動「粗糙的咒力」：所有攻擊傷害每次獨立產生±1～${KINJI_DAMAGE_SWING_MAX}的傷害浮動。`,
      `普攻「閘門」：造成${KINJI_GATE_DAMAGE}傷害並定身${KINJI_GATE_IMMOBILIZE}秒，CD${KINJI_GATE_COOLDOWN}秒；咒力充涌時CD${KINJI_GATE_JACKPOT_COOLDOWN}秒。`,
      `技能「咒力連擊」：碰撞時,對敵人連續攻擊${KINJI_COMBO_HITS}拳，每拳${KINJI_COMBO_DAMAGE}傷害，CD${KINJI_COMBO_COOLDOWN}秒；咒力充涌時CD${KINJI_COMBO_JACKPOT_COOLDOWN}秒。`,
      `領域展開「坐殺博徒」：${KINJI_PASSION_MAX}層熱情時自動開啟；抽獎選項為${KINJI_DOMAIN_DRAW_POOL.join('、')}，每次抽3碼且前兩碼相同，三碼全相同進入${KINJI_JACKPOT_DURATION}秒咒力充涌，未中獎則持續抽下一組。前兩碼為偶數時觸發確變，下一組選項縮為${KINJI_DOMAIN_GUARANTEED_POOL.join('、')}；前兩碼為奇數時觸發時短。`,
      `「咒力充涌」：每秒恢復${KINJI_JACKPOT_HEAL_PER_SECOND}血，效果未消失前不能再次展開領域；領域內可發射小鋼珠，命中${KINJI_PACHINKO_BALL_DAMAGE}傷害，小鋼珠進入中獎洞時縮短數字間隔並回復${KINJI_PACHINKO_BALL_HEAL}血。`,
      `技能「模擬連」：抽獎失敗時有機率重播同一段抽獎動畫；抽獎期間遭受致命傷時有${Math.round(KINJI_SIMULATED_REEL_REVIVE_CHANCE * 100)}%機率以最大生命值${Math.round(KINJI_SIMULATED_REEL_REVIVE_HP_RATIO * 100)}%復活，每場最多${KINJI_SIMULATED_REEL_MAX_REVIVES}次。`
    ],
    color: '#f2b632', glowColor: KINJI_DOMAIN_GLOW, type: 'kinji',
    winQuote: ['我愛狂熱，狂熱是賭博，賭博是人生，而愛是支配。','我會憑實力，抓住好運。',],
    loseQuote: '……這次，運氣不好。',
    vsQuotes: {
     kashimo: ['我還是第一次接近瀕死狀態','我是秤金次，也可以叫我金醬喔','適度享受賭博這種事，是不可能的'],
     tiger: '哪有咒術師不認識五條悟'
    }
  },
  {
    id: 'ew', emoji: '💣', weapon: '👻', name: '維什戴爾',image: 'image/ew.png',
    desc: '「維什戴爾」，就把名字簽這裡，對吧？殿下告訴我，這個名字的意思是「許願一個家」，但我從不許願。啊？字太醜？還輪不到你來指指點點，今天又要炸誰呢？',
    stats: ['祖宗發射器', '好禮', '死魂靈的餘息', '定點清算', '飽和復仇', '爆裂黎明'],
    skills: [
      `特性「祖宗發射器」：靈魂彈在${EW_ATTACK_RADIUS}px範圍內造成主傷害${EW_ATTACK_DAMAGE}，並在${EW_AFTERSHOCK_DELAY}s後以${Math.round(EW_AFTERSHOCK_DAMAGE_MULT * 100)}%傷害發生餘震；餘震範圍為主範圍的${Math.round(EW_AFTERSHOCK_RADIUS_MULT * 100)}%。命中牆壁也會觸發範圍傷害。`,
      `被動「好禮」：命中敵人附著殘影；每個目標最多 1 層，同一目標重新附加需間隔至少${EW_AFTERIMAGE_REAPPLY_INTERVAL}s。殘影受到餘震時有${Math.round(EW_AFTERIMAGE_EXPLOSION_CHANCE * 100)}%機率爆炸，對周圍敵人造成${EW_AFTERIMAGE_EXPLOSION_DAMAGE_MULT}倍主傷害並定身${EW_AFTERIMAGE_IMMOBILIZE_DURATION}s。`,
      `被動「死魂靈的餘息」：進場召喚 1 隻死魂靈；死魂靈周圍${EW_CAMOUFLAGE_RADIUS}px內的維什戴爾進入迷彩，不會被鎖定且不受傷害，場上最多存在${EW_SOUL_MAX_COUNT}隻。`,
      `死魂靈：召喚物生命${EW_SOUL_HP}；每秒獲得${EW_SOUL_SKILL_PER_SECOND}技力，滿${EW_SOUL_SKILL_MAX}技力時發射紅色子彈，造成${EW_SOUL_BULLET_DAMAGE}傷害並附著殘影，攻擊後隨機回復0～${EW_SOUL_RANDOM_SKILL_GAIN_MAX}技力。`,
      `技能一「定點清算」：每${EW_SKILL1_ATTACKS_REQUIRED}次普攻後，下次普攻額外造成${EW_SKILL1_EXTRA_AFTERSHOCKS}次餘震，餘震傷害提高至主傷害的80%。`,
      `技能二「飽和復仇」：普攻間隔由${EW_ATTACK_INTERVAL}s減少${(EW_ATTACK_INTERVAL - EW_SKILL2_SATURATION_INTERVAL).toFixed(1)}秒至${EW_SKILL2_SATURATION_INTERVAL}s，改為像喬尼 Act 1 一樣沿同一方向串聯的${EW_SKILL2_SATURATION_VOLLEY_COUNT}連發，每發造成${EW_SKILL2_SATURATION_DAMAGE_MULT}倍傷害，持續${EW_SKILL2_SATURATION_DURATION}s；之後進入${EW_SKILL2_OVERLOAD_DURATION}s過載，改為同樣串聯的${EW_SKILL2_OVERLOAD_VOLLEY_COUNT}連發、每發${EW_SKILL2_OVERLOAD_DAMAGE_MULT}倍傷害，技能CD${EW_SKILL2_COOLDOWN}s。每一發仍獨立觸發餘震、殘影與技能一計數。`,
      `技能三「爆裂黎明」：ew 在場上累積${EW_SKILL3_UNLOCK_TIME}秒後解鎖，並召喚${EW_SKILL3_SUMMON_COUNT}隻死魂靈（場上最多${EW_SOUL_MAX_COUNT}隻）；停止移動並獲得${EW_SKILL3_SOUL_BULLETS}發死魂彈，普攻造成${EW_SKILL3_DAMAGE_MULT}倍傷害、攻擊間隔${EW_SKILL3_INTERVAL}s、濺射範圍擴大${EW_SKILL3_SPLASH_RADIUS_MULT}倍，且每發必定觸發好禮；全部射完後才進入${EW_SKILL3_COOLDOWN}s CD。`
    ],
    color: '#8f1638', glowColor: 'rgba(255,60,105,0.65)', type: 'ew',
    winQuote: '真可憐，今天輪到你倒霉。',
    loseQuote: '或許今天我們都會死在這裡。'
  },
  {
    id: 'otis', emoji: '🔮', weapon: '🔫', name: '魔彈射手・奧提斯',image: 'image/otis.png',

    desc: `為了追求更極致、絕不落空的絕對力量，他選擇與深淵中的惡魔簽訂契約。惡魔給了他七發魔彈，前六發能隨心所欲擊中任何目標，在絕望與詛咒中，獵人迷失了自我，徘徊到這裡。`,
    stats: ['射擊開始', '必中', '致命的子彈', '七發循環'],
    skills: [
      `「射擊開始」：每${OTIS_LOCK_INTERVAL}秒進行一次攻擊／鎖定。鎖定期間不會提前生成傳送門，只顯示由${OTIS_FX_RETICLE_START_RADIUS}px收束至${OTIS_FX_RETICLE_END_RADIUS}px的準心；倒數完成的射擊瞬間才在目標外側${OTIS_PORTAL_TARGET_OFFSET}px生成固定尺寸深藍傳送門並射出魔彈。每7發後重新計數。`,
      `「必中」：魔彈不受牙 ACT3、迷彩、無敵、神威等一般躲避／無敵狀態影響；七發魔彈的飛行路徑都不會命中奧提斯本人，奧斯提自己只會受到第七發自鎖所造成的虛擬血條破碎。`,
      `「致命的子彈」：基礎傷害${OTIS_BASE_DAMAGE}，1～7發傷害倍率依序為${OTIS_SHOT_DAMAGE_MULTIPLIERS.slice(1).join('／')}；魔彈會穿過飛行路徑上的所有敵我單位，但跳過射手本體。第二發造成${OTIS_PARALYZE_DURATION}秒麻痺；第三發造成${OTIS_WEAKEN_DURATION}秒浸水／虛弱（輸出倍率${OTIS_WEAKEN_MULT}）並附加${OTIS_BURN_STACKS_PER_HIT}層燒傷；燒傷每秒依層數跳傷害、永久保留至戰鬥結束，上限${OTIS_BURN_MAX_STACKS}層。第四發附加${OTIS_VULN_STACKS_PER_HIT}層易傷，每層受到傷害增加${OTIS_VULN_PER_STACK * 100}%，上限${OTIS_VULN_MAX_STACKS}層。第五發附加${OTIS_BURN_STACKS_PER_HIT}層燒傷，並使造成傷害永久-${OTIS_PERMANENT_ATTACK_PENALTY}、受到傷害永久+${OTIS_PERMANENT_DAMAGE_TAKEN_BONUS}。`,
      `第六魔彈：目標每${OTIS_EXTRA_BURN_TRIGGER_STACKS}層燒傷追加1次魔彈攻擊，最多${OTIS_EXTRA_BULLET_MAX}次；追加彈不會再次連鎖，不會改寫七發循環。`,
      `第七魔彈・詛咒：優先鎖定一名己方隊友；沒有隊友時鎖定自身血條。射擊瞬間直接累積1層「血條破碎」，不扣自身HP，達${OTIS_SELF_SHATTER_THRESHOLD}層後視作死亡。`
    ],
    color: '#5b2cff', glowColor: 'rgba(112,76,255,0.78)', type: 'otis',
    winQuote: '這枚神奇的子彈，能命中你指定的任何目標。',
    loseQuote: '我很清楚。如果這子彈有窮盡的一天，最后一顆子彈只會將我貫穿。'
  },
  {
    id: 'boundary', emoji: '👁️‍🗨️', weapon: '🌀', name: '超界者',
    desc: '自由穿梭在不同维度的高维生物，在黑洞與裂隙之間改寫戰場位置。',
    stats: ['次元之握', '維度穿梭'],
        skills: [
      `「次元之握」：每 ${BOUNDARY_ATTACK_INTERVAL}s 向敵人投擲可穿透一切單位與障礙的次元裂隙，持續 ${BOUNDARY_RIFT_LIFE}s，每 ${BOUNDARY_RIFT_PULSE_INTERVAL}s 對路徑上所有敵人造成 ${BOUNDARY_RIFT_PULSE_DAMAGE} 點震盪傷害。`,
      `「黑洞折射」：每 ${BOUNDARY_BLACK_HOLE_INTERVAL}s 在場上隨機生成 ${BOUNDARY_BLACK_HOLE_MAX} 個黑洞（遠離邊界 ${BOUNDARY_BLACK_HOLE_EDGE_MARGIN}px 以上）。當次元裂隙命中黑洞，其他黑洞會同步噴射出一道同樣的裂隙，朝各自方向擴散；黑洞被引爆時對範圍內敵人造成 ${BOUNDARY_BLACK_HOLE_BLAST_DAMAGE} 傷害。`,
      `「維度躍遷」：生命值降至 ${BOUNDARY_WARP_TRIGGER_HP} 或開局後 ${BOUNDARY_WARP_TRIGGER_TIME}s 自動觸發一次，持續 ${BOUNDARY_WARP_DURATION}s。期間以 ${BOUNDARY_WARP_SPEED}px/s 高速追擊同一敵人，每 ${BOUNDARY_WARP_HIT_INTERVAL}s 對其造成 ${BOUNDARY_WARP_DAMAGE} 傷害。`,
      `「迷彩」：每 ${BOUNDARY_CAMOUFLAGE_DURATION}s 迷彩 / ${BOUNDARY_CAMOUFLAGE_NORMAL}s 一般交替切換。迷彩期間無法被敵方索敵鎖定，但仍可被範圍傷害命中。`
    ],
    color: '#8ee7ff', glowColor: 'rgba(142,231,255,0.75)', type: 'boundary',
    winQuote: '時間在我眼裡就像一張沙盤。', loseQuote: '這個維度……拒絕了我。'
  },
  {
    id: 'sakura', emoji: '🌸', weapon: '🌸', name: '櫻',
    desc: '隱匿於櫻吹雪中的致命刀刃。指尖翻飛間，無數花瓣如千本利刃呼嘯而至。',
    stats: ['花筏', '千本櫻', '八重櫻', '落櫻繽紛', '櫻印', '樱吹雪'],
    skills: [
      `被動「花筏」：持有「花瓣」最多 ${SAKURA_PETAL_MAX} 層，用於強化千本櫻與樱吹雪；普攻命中、櫻印生效時各 +1 層。`,
      `被動「千本櫻」：自身周圍（半徑 ${SAKURA_SENBON_RADIUS_MULT} 倍球半徑）的敵人每 ${SAKURA_SENBON_TICK_INTERVAL}s 受到 ${SAKURA_SENBON_BASE_DAMAGE} 點傷害（每 3 層花瓣 +${SAKURA_SENBON_DAMAGE_PER_3_PETALS}）並緩速 50%。`,
      `被動「八重櫻」：受到傷害時固定減免 ${SAKURA_YAE_DAMAGE_REDUCE} 點，充能 ${SAKURA_YAE_MAX_CHARGES} 次；充能耗盡後 ${SAKURA_YAE_RECHARGE_TIME}s 重新獲得，每層花瓣縮短 ${SAKURA_YAE_RECHARGE_PER_PETAL}s。`,
      `普攻「花刃」：向前穿刺一片花瓣，造成 ${SAKURA_BASIC_DAMAGE} 傷害並 +1 花瓣層數，CD ${SAKURA_BASIC_INTERVAL}s。`,
      `技能「落櫻繽紛」：對最近敵人位置降下自身半徑 ${SAKURA_FUBUN_RADIUS_MULT} 倍大的千本櫻，持續 ${SAKURA_FUBUN_DURATION}s，CD ${SAKURA_FUBUN_CD}s。`,
      `技能「櫻印」：標記最近敵人 ${SAKURA_MARK_DURATION}s，受櫻傷害提高 ${Math.round(SAKURA_MARK_DAMAGE_AMP*100)}%，同時自身 +1 花瓣層數，CD ${SAKURA_MARK_CD}s。`,
      `滿開「樱吹雪」：移動速度 ×${SAKURA_FULL_BLOOM_SPEED_MULT}，將千本櫻擴及全場並改為每 ${SAKURA_FULL_BLOOM_TICK_INTERVAL}s 結算一次，基礎持續 ${SAKURA_FULL_BLOOM_DURATION}s（每層花瓣 +${SAKURA_FULL_BLOOM_DURATION_PER_PETAL}s），開場冷卻與 CD 皆為 ${SAKURA_FULL_BLOOM_CD}s。`
    ],
    color: '#ffa6c9', glowColor: 'rgba(255,166,201,0.7)', type: 'sakura',
    winQuote: '在綻放的櫻花中，靜靜的睡去吧。',
    loseQuote: '櫻花…還不能在此刻凋零……'
  },
  {
    id: 'boshi', emoji: '📡', weapon: '⚡', name: '博士',
    desc: '我懷疑我們活在遊戲世界裡，電磁與量子的操控者。身旁環繞高能電球，因意外的實驗失誤，來到這裡。',
    stats: ['磁暴電湧', '高能電球', '電磁場裝置', '量子躍遷器'],
    skills: [
      `被動「磁暴電湧」：攻擊時 ${Math.round(BOSHI_CRIT_CHANCE*100)}% 機率爆擊，傷害 ×${BOSHI_CRIT_MULT}；觸發爆擊時額外降下閃電造成 ${BOSHI_CRIT_LIGHTNING_DMG} 傷並麻痺 ${BOSHI_CRIT_LIGHTNING_PARA}s。`,
      `被動「高能電球」：進場時自身環繞 ${BOSHI_ORB_COUNT} 顆電球與 ${BOSHI_SHIELD_MAX} 層護盾。每顆電球每 ${BOSHI_ORB_LASER_INTERVAL}s 對敵人發射雷射造成 ${BOSHI_ORB_LASER_DAMAGE} 傷害；受到攻擊時消耗一層護盾，該次傷害減免 ${Math.round(BOSHI_SHIELD_REDUCE*100)}%。`,
      `技能「電磁場裝置」：朝敵人方向丟出一個電磁場（半徑 ${BOSHI_EM_FIELD_RADIUS}px），持續 ${BOSHI_EM_FIELD_DURATION}s、CD ${BOSHI_EM_FIELD_CD}s。敵人投射物觸碰到電磁場邊緣時被消除；敵人進入場內每秒受到 ${BOSHI_EM_FIELD_DPS} 傷（不爆擊）。博士每次進入自己的電磁場或量子領域，額外獲得 1 層護盾。`,
      `技能「量子躍遷器」：朝敵人方向瞬移，創造寬 ${BOSHI_QUANTUM_HALF_WIDTH*2}px、長貫穿場地的矩形量子領域。生成時領域內的敵人麻痺 ${BOSHI_QUANTUM_STUN}s 並清除場內所有敵方投射物；領域持續 ${BOSHI_QUANTUM_DURATION}s，每秒由領域起點牆向終點牆釋放脈衝，脈衝傷害為博士與隊友在領域內造成傷害的 ${Math.round(BOSHI_QUANTUM_PULSE_RATIO*100)}%。開場冷卻 CD ${BOSHI_QUANTUM_CD}s。`
    ],
    color: '#4fd6ff', glowColor: 'rgba(79,214,255,0.7)', type: 'boshi',
    winQuote: '魔法也是能量,遵循能量守恆定律。',
    loseQuote: '參數錯誤,量子效應再次失去平衡。'
  }
];
