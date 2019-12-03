const Discord = require("discord.js")
const Utils = require("../../utils/Utils.js")

exports.run = (message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide a map.")

    const map = args[0]
    if(!map.includes("-") || map.split("-").length !== 2 || map.split("-").filter(a => isNaN(parseInt(a))).length > 0) return message.reply("Invalid map.")

    const [world, mapid] = map.split("-").map(a => parseInt(a))
    const bgm = global.data.api_start2.api_mst_mapbgm.find(k => k.api_no == mapid && k.api_maparea_id == world)

    if(bgm == undefined) return message.reply("Invalid map.")

    const embed = new Discord.RichEmbed()
        .setURL(Utils.getWiki("Music", message.guild))
        .setTitle(`${map} BGM`)

    embed.addField("Overworld", this.parseLine(bgm.api_moving_bgm))
    if(bgm.api_map_bgm[0] == bgm.api_map_bgm[1])
        embed.addField("Normal Node (Day & Night)", this.parseLine(bgm.api_map_bgm[0]))
    else {
        embed.addField("Normal Node (Day)", this.parseLine(bgm.api_map_bgm[0]))
        embed.addField("Normal Node (Night)", this.parseLine(bgm.api_map_bgm[1]))
    }

    if(bgm.api_boss_bgm[0] == bgm.api_boss_bgm[1])
        embed.addField("Boss Node (Day & Night)", this.parseLine(bgm.api_boss_bgm[0]))
    else {
        embed.addField("Boss Node (Day)", this.parseLine(bgm.api_boss_bgm[0]))
        embed.addField("Boss Node (Night)", this.parseLine(bgm.api_boss_bgm[1]))
    }

    return message.channel.send(embed)
}

exports.parseLine = (bgmId) => `${(this.bgmidmap[bgmId] || `Unknown BGM #${bgmId}`).replace(/<br>/g, " - ").replace(/<i>/g, "*").replace(/<\/i>/g, "*")} [▶️](${global.data.getBGMLink(bgmId)})`
exports.category = "Information"
exports.help = "Gets BGM from a map."
exports.usage = "bgm <map>"
exports.prefix = global.config.prefix

exports.bgmidmap = {
    "-171": "Summer 2016 Event Main Operation: Normal Node BGM", // LBAS = 70
    "-2" : "No BGM: No boss node",

    "0"  : "No BGM",

    "1"  : "砲雷撃戦、始め！<br><i>Commence Gun & Torpedo Battle!</i>",
    "2"  : "夜戦<br><i>Night Battle</i>",
    "3"  : "全艦娘、突撃！<br><i>All Shipgirls, Attack!</i>",
    "4"  : "二水戦の航跡<br><i>Wake of the Second Torpedo Squadron</i>",
    "5"  : "次発装填、再突入！<br><i>Next Round Loaded, Re-engage!</i>",
    "6"  : "我、敵機動部隊ト交戦ス<br><i>Battle the Enemy Task Force!</i>",
    "7"  : "海上護衛戦<br><i>Maritime Escort Warfare</i>",
    "8"  : "索敵機、発艦始め！<br><i>Scout Planes, Take Off!</i>",
    "9"  : "敵艦隊、見ゆ！<br><i>Enemy Fleet, Spotted!</i>",
    "10" : "暁の水平線に (インストver)<br><i>At Dawn's Horizon (instrumental)</i>",
    "11" : "第五戦隊の出撃<br><i>Sortie of the Fifth Squad</i>",
    "12" : "飛龍の反撃<br><i>Hiryū's counterattack</i>",
    "13" : "華の二水戦<br><i>The Splendid 2nd Torpedo Squadron</i>",

    // 2014 Summer Event
    "14" : "海原へ<br><i>Into the Ocean</i>",
    "15" : "強襲！空母機動部隊<br><i>Assault! Aircraft Carrier Task Force</i>",
    "16" : "MI作戦<br><i>Operation MI</i>",
    "17" : "シズメシズメ<br><i>Sink Sink</i>",
    // "18" : "作戦発動<br><i>Commence Operation</i>",

    "19" : "士魂の護り<br><i>Protection of the Warrior Spirit</i>",
    "20" : "眼下の伊号<br><i>The I-Class Below Us</i>",

    // 2013 Fall Event
    "21" : "敵大型超弩級戦艦を叩け！<br><i>Assault the Enemy's Super Dreadnought!</i>",
    "22" : "決戦！鉄底海峡を抜けて<br><i>Decisive Battle! Escape from Ironbottom Sound!</i>",

    // 2013 Winter Event
    "23" : "冬の抜錨！<br><i>Sallying Forth in Winter!</i>",
    // "24" : "Savior of Song",

    // 2014 Fall Event
    "25" : "秋月の空<br><i>Sky of the Autumn Moon</i>",
    "26" : "防空駆逐艦、参戦！<br><i>Anti-air destroyer, engage!</i>",
    "27" : "連合艦隊の出撃<br><i>Combined Fleet's Sortie</i>",
    "28" : "艦隊決戦<br><i>Fleet decisive battle</i>",
    "29" : "冬の艦隊<br><i>Winter Fleet</i>",

    // 2015 Winter Event
    "30" : "特型駆逐艦<br><i>Special-type Destroyer</i>",
    "31" : "吹雪、出撃す<br><i>Fubuki, Sortieing!</i>",
    "32" : "吹雪 (A)<br><i>Fubuki (Anime ED)</i>",
    "33" : "吹雪 (B)<br><i>Fubuki (Anime ED)</i>",
    "34" : "海色（みいろ） (A)<br><i>Miiro (Anime OP)</i>",
    "35" : "海色（みいろ） (B)<br><i>Miiro (Anime OP)</i>",
    "36" : "海色（みいろ） (C)<br><i>Miiro (Anime OP)</i>",
    "37" : "新編「海上護衛隊」抜錨！<br><i>New Maritime Escort Fleet, setting sail!</i>",

    // 2015 Spring Event
    "38" : "睦月型駆逐艦の戦い<br><i>Battle of Mutsuki-Class Destroyers</i>",
    "39" : "連合艦隊、西へ<br><i>Combined Fleet, Westward</i>",
    "40" : "深海への誘い<br><i>Invitation to the Abyss</i>",
    "41" : "モドレナイノ<br><i>No Going Back</i>",
    "42" : "第三十駆逐隊、抜錨準備！<br><i>30th Destroyer Division, prepare to sortie!</i>",
    "43" : "敵地侵入<br><i>Invading Enemy Territory</i>",
    "44" : "加賀岬<br><i>Cape Kaga</i>",

    // 2015 Summer Event
    "45" : "艦隊の再集結<br><i>Regathering of the Fleet</i>",
    "46" : "出撃！第八艦隊<br><i>Sortie! 8th Division</i>",
    "47" : "艦隊、ソロモン海へ！<br><i>Fleet, toward the Solomon Sea!</i>",
    "48" : "深海水上打撃部隊<br><i>Abyssal Surface Task Force</i>",
    "49" : "アイアンボトムサウンド<br><i>Ironbottom Sound</i>",
    "50" : "激突！夜間砲撃戦！<br><i>Clash! Exchanging Fire at Night!</i>",

    // 2015 Fall Event
    //"51" : "鎮守府秋刀魚祭り<br><i>Mackerel Pike Festival</i>",
    "51" : "艦隊集結<br><i>Fleet Gathering</i>",
    "52" : "海上輸送作戦<br><i>Marine Transport Operation</i>",
    "53" : "水雷戦隊の反撃<br><i>The Torpedo Squadron's Counterattack</i>",
    "54" : "水雷戦隊の反撃<br><i>The Torpedo Squadron's Counterattack (debuff)</i>",
    "55" : "待ち伏せの夜戦<br><i>Night Battle Ambush</i>",
    "56" : "待ち伏せの夜戦<br><i>Night Battle Ambush (debuff)</i>",

    // 2016 Winter Event
    "57" : "冬の二水戦<br><i>The 2nd Torpedo Squadron in Winter</i>",
    "58" : "礼号作戦<br><i>Operation Rei-gō</i>",
    "59" : "艦隊突入！上陸船団を討て<br><i>Fleet, Assault! Attack the Landing Convoy</i>",
    "60" : "礼号作戦の凱歌<br><i>The Paean of Operation Rei-gō</i>",

    // 2016 Spring Event
    "61" : "戦場海域<br><i>Battlewaters</i>",
    "62" : "水底から<br><i>From Bottom of the Water</i>",
    "63" : "友邦任務部隊<br><i>Allied Nation's Task Force<i>",
    "64" : "友邦任務部隊<br><i>Allied Nation's Task Force<i>",
    "65" : "遥かなる友邦<br><i>Distant Allies</i>",
    "66" : "紅い海の侵食<br><i></i>",
    "67" : "敵航空基地を叩け<br><i>Attack the Enemy Aviation Base</i>",
    "68" : "波濤を超えて<br><i>Beyond the Surging Sea</i>",

    // 2016 Summer Event
    "69" : "整備員の休息<br><i>Rest Time of the Technicians</i>",
    "70" : "迎撃隊、発進！<br><i>Interception Squad, Sortie!</i>",
    "71" : "水着の出撃<br><i>Mizugi no Shutsugeki</i>",
    "72" : "Summer 2016 Event E-2 and E-3 Boss Node BGM",
    "73" : "戦争を忌むもの<br><i>Those Who Detest War</i>",
    "74" : "基地航空隊<br><i>Land Base Air Corps</i>",
    "75" : "海鷲の翼<br><i>Wings of Sea Eagles</i>",

    // 2016 Sanma Event
    "76" : "鎮守府秋刀魚祭り改<br><i>Mackerel Pike Festival Kai</i>",
    "77" : "艦娘音頭<br><i>The Shipgirl Festival Dance</i>",

    // 2016 Fall Event
    "78" : "Fall 2016 Event Main Operation: Map Screen BGM",
    "79" : "発令！ 艦隊作戦第三法<br><i>Proclamation! Fleet Strategy Plan #3</i>",
    "80" : "Fall 2016 Event Main Operation: Normal Node BGM",
    "81" : "Fall 2016 Event Main Operation: Boss Node BGM",
    "82" : "渚を越えて<br><i>Beyond the Shore</i>",

    // 2016 -> 2017 Holidays
    "83" : "聖夜の母港<br><i>Home Port on Christmas Eve</i>",
    "84" : "師走の鎮守府<br><i>December at the Naval Base</i>",
    "85" : "迎春の鎮守府<br><i>New Years at the Naval Base</i>",

    // 2017 Winter Event
    "86" : "Winter 2017 Event: Map Screen BGM",
    "87" : "Winter 2017 Event: Normal Node BGM",
    "88" : "Winter 2017 Event: Boss Node BGM",
    "89" : "偵察戦力緊急展開<br><i>Scout Force Emergency Deployment</i>",

    // 2017 Spring Event
    "90" : "北東方面艦隊の集結<br><i>Gathering of the Northeastern Fleet</i>",
    "91" : "第五艦隊の奮戦<br><i>Hard Fight of the Fifth Fleet</i>",
    "92" : "北方艦隊決戦<br><i>Decisive Northen Naval Battle</i>",
    "93" : "士魂の反撃<br><i>Counterattack of the Warrior Spirit</i>",
    "94" : "連合艦隊旗艦<br><i>Combined Fleet Flagship</i>",

    // 2017 Summer Event
    "95" : "Summer 2017 Event Main Operation: Map Screen BGM",
    "96" : "Summer 2017 Event E-2 and E-3: Normal Battle BGM",
    "97" : "Summer 2017 Event E-2 and E-3: Boss Battle BGM",
    "98" : "Summer 2017 Event E-4: Normal Battle BGM",
    "99" : "Summer 2017 Event E-4, E-5 and E-6: Boss Battle BGM",
    "100": "西方再打通！欧州救援作戦 最終海域 ボス戦<br><i>Western revival! European relief strategy final battle b</i>s fight''",

    // 2017 Sanma event
    "101": "月夜海<br><i>Moonlit Sea</i>",
    "102": "鎮守府秋刀魚祭り改二<br><i>Naval Base Saury Festival Kai Ni</i>",

    // 2017 Fall Event
    "103": "捷号決戦前夜<br><i>Operation Sho-go's Eve</i>",
    "104": "捷一号作戦<br><i>Operation Sho-ichi-go</i>",
    "105": "激戦！遊撃部隊<br><i>Intense Battle! Strike Force</i>",
    "106": "海峡へ<br><i>To the Strait</i>",
    "107": "西村艦隊の戦い<br><i>Battles of the Nishimura Fleet</i>",
    "108": "祈り<br><i>Prayer</i>",

    // 2018 Winter Event
    "109": "出擊前夜<br><i>Eve of Sortie</i>",
    "110": "Winter 2018 Event Main Operation: Normal Battle BGM",
    "111": "シブヤン海海戦<br><i>Battle of the Sibuyan Sea</i>",
    "112": "多号作戦改<br><i>Operation Ta-gō Kai</i>",
    "113": "友軍艦隊！反撃開始<br><i>Friend Fleet! Begin Counterattack</i>",
    "114": "鶴墜ちる海<br><i>The Sea Where the Crane Falls</i>",
    "115": "暁の水平線に勝利を！<br><i>Victory over the Dawn Horizon</i>!",

    // 2018 Spring Mini Event
    "116" : "Spring 2018 Mini Event: Map Screen BGM",
    "117" : "Spring 2018 Mini Event: Map Battle BGM",

    // KanColle on ice
    "118" : "梅雨明けの白露<br><i>The Glistening Dew After The Rainy Season</i>",

    // 2018 Early Fall Event
    "119" : "Early Fall 2018 Event: Main Operation: Map Screen BGM",
    "120" : "Early Fall 2018 Event: Main Operation: Battle BGM",
    "121" : "Early Fall 2018 Event E-1 and E-2: Boss BGM",
    "122" : "Early Fall 2018 Event: Extra Operation: Map Screen BGM",
    "123" : "Early Fall 2018 Event E-3 Boss; E-4 and E-5 Battle BGM",
    "124" : "Early Fall 2018 Event E-3 Boss Battle BGM",

    // 2018 Fall Mini-Event
    "125": "鎮守府秋刀魚祭り改三<br><i>Naval Base Saury Festival Kai San</i>",

    // 2019 Winter Event
    "126": "Winter 2019 Event: Main Operation: Map Screen BGM",
    "127": "Winter 2019 Event: Main Operation: Battle BGM",
    "128": "Winter 2019 Event: Main Operation: Boss BGM",
    "129": "Winter 2019 Event: Extra Operation: Map Screen BGM",
    "130": "日の進むところ<br><i>A Place the Sun Goes Forward</i>",
    "131": "Winter 2019 Event: Extra Operation: Boss BGM",

    // Zuiun fest
    "132": "瑞雲の空<br><i>The Sky of Zuiun</i>",
    "133": "長波、駆ける<br><i>Naganami, Running forth</i>",

    // 2019 Spring Event
    "134": "Spring 2019 Event: Main Operation: Map Screen BGM",
    "135": "Spring 2019 Event: E1 ~ E4: Battle BGM",
    "136": "Spring 2019 Event: E1 ~ E4: Boss BGM; E5 Battle BGM",
    "137": "Spring 2019 Event: Extra Operation: Map Screen BGM",
    "138": "Spring 2019 Event: E5 Boss BGM",

    // 2019 Summer Event
    "139": "北大西洋の風<br><i>The Wind in North Atlantic Ocean</i>",
    "140": "欧州防衛作戦<br><i>European Defense Operation</i>",
    "141": "ジブラルタルの戦鬼<br><i>War Demon of Gibraltar</i>",
    "142": "地中海の潮風<br><i>A sea breeze in the Mediterranean Sea</i>",
    "143": "佐世保の時雨 (インストver.)<br><i>Shigure of Sasebo</i>",
    "144": "アンツィオ沖の戦い<br><i>Battle of Anzio</i>",
}
