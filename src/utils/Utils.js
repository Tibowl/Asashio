const Discord = require("discord.js")

exports.displayShip = (ship) => {
    const embed = new Discord.RichEmbed()
        .setTitle([`No. ${ship.id} (api id: ${ship.api_id})`,ship.full_name, ship.japanese_name, /*ship.reading,*/ ship.rarity_name].filter(a => a).join(" | "))

    if(typeof ship.api_id == "number")
        embed.setURL(`https://kancolle.fandom.com/wiki/${ship.name.replace(/ /g, "_")}`)
            .setThumbnail(`https://raw.githubusercontent.com/KC3Kai/KC3Kai/develop/src/assets/img/ships/${ship.api_id}.png`)
    // TODO rarity color? .setColor("#")

    embed.setDescription(`${ship.class_description} | ${ship.ship_type}`)

    embed.addField("Stats", `\`\`\`asciidoc
HP        :: ${ship.hp} [${ship.hp_married}] (cap ${ship.hp_max})
Firepower :: ${ship.firepower} (${ship.firepower_max})
Torpedo   :: ${ship.torpedo} (${ship.torpedo_max})
AA        :: ${ship.aa} (${ship.aa_max})
Armor     :: ${ship.armor} (${ship.armor_max})
Luck      :: ${ship.luck} (${ship.luck_max})
ASW       :: ${ship.asw} (${ship.asw_max}) [${ship.asw_ring}]
Evasion   :: ${ship.evasion} (${ship.evasion_max}) [${ship.evasion_ring}]
LOS       :: ${ship.los} (${ship.los_max}) [${ship.los_ring}]
Speed     :: ${ship.speed_name}
Range     :: ${ship.range_name}
Fuel      :: ${ship.fuel}
Ammo      :: ${ship.ammo}
Mod       :: ${ship.mods}
Scrap     :: ${ship.scraps}
\`\`\``)

    if(ship.equipment)
        embed.addField("Equipment", ship.equipment_text ? ship.equipment_text : "No equipment slots")

    if(ship.remodel_text)
        embed.addField("Remodel", ship.remodel_text)

    return embed
}

exports.calculatePostCap = (atk, currenthp, maxhp, armor, calculatedDamage = calculateDamagesDone(atk, currenthp, armor, maxhp)) => {
    let sum = 0
    let dmgsDealth = calculatedDamage.damages
    for(let posdmg in dmgsDealth)
        sum += dmgsDealth[posdmg]
    let stages = {
        "sunk" : 0,
        "taiha" : 0,
        "chuuha" : 0,
        "shouha" : 0,
        "ok" : 0,
        "overkill" : 0,
        "normal" : 0,
        "scratch" : 0,
        "hps" : []
    }
    for(let posdmg in dmgsDealth) {
        let ch = dmgsDealth[posdmg], afterhp = currenthp - posdmg
        if(ch == 0) continue
        stages.hps[afterhp] = ch/sum
        if(afterhp <= 0)
            stages.sunk += ch/sum
        else if(afterhp <= .25 * maxhp)
            stages.taiha += ch/sum
        else if(afterhp <= .50 * maxhp)
            stages.chuuha += ch/sum
        else if(afterhp <= .75 * maxhp)
            stages.shouha += ch/sum
        else
            stages.ok += ch/sum

        stages.minhp = compare.min(stages.minhp, afterhp < 0 ? 0 : afterhp)
        stages.mindmg = compare.min(stages.mindmg, posdmg)
        stages.maxhp = compare.max(stages.maxhp, afterhp < 0 ? 0 : afterhp)
        stages.maxdmg = compare.max(stages.maxdmg, posdmg)
    }
    stages.overkill += calculatedDamage.overkill / sum
    stages.normal += calculatedDamage.normal / sum
    stages.scratch += calculatedDamage.scratch / sum
    return stages
}
function calculateDamagesDone(atk, currenthp, armor, maxhp, overkillprot = currenthp > 0.25 * maxhp && maxhp < 200) {
    let dmgtype = {
        "scratch" : 0,
        "normal" : 0,
        "overkill" : 0
    }
    let damages = {}
    for(let arm = 0; arm < armor; arm++) {
        let dmg = Math.floor((atk - (0.7 * armor + arm * 0.6)))

        if(dmg >= currenthp && overkillprot) { // Overkill protection
            let possibledmg = []
            for(let hpRoll = 0; hpRoll < currenthp; hpRoll++)
                possibledmg.push(Math.floor(0.5 * currenthp + 0.3 * hpRoll))
            for(let posdmg of possibledmg)
                damages[posdmg] = (damages[posdmg] || 0) + (1.0 / possibledmg.length)
            dmgtype.overkill = (dmgtype.overkill || 0) + 1.0
        } else if(dmg < 1) { // Scratch
            let possibledmg = []
            for(let hpRoll = 0; hpRoll < currenthp; hpRoll++)
                possibledmg.push(Math.floor(0.06 * currenthp + 0.08 * hpRoll))
            for(let posdmg of possibledmg)
                damages[posdmg] = (damages[posdmg] || 0) + (1.0 / possibledmg.length)
            dmgtype.scratch = (dmgtype.scratch || 0) + 1.0
        } else {
            damages[dmg] = (damages[dmg] || 0) + 1.0
            dmgtype.normal = (dmgtype.normal || 0) + 1.0
        }
    }
    dmgtype.damages = damages
    return dmgtype
}
const compare = {
    min: function(a, b) {
        if(isNaN(a)) return b
        if(isNaN(b)) return a
        if(a == 0 || b == 0)
            return 0
        return Math.min(a||b, b||a)
    },
    max: function(a, b) {
        if(isNaN(a)) return b
        if(isNaN(b)) return a
        return Math.max(a||b, b||a)
    }
}
