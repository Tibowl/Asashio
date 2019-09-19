const Discord = require('discord.js');

exports.displayShip = (ship) => {
    const embed = new Discord.RichEmbed()
        .setTitle([`No. ${ship.id} (api id: ${ship.api_id})`,ship.full_name, ship.japanese_name, /*ship.reading,*/ ship.rarity_name].filter(a => a).join(" | "))

    if(typeof ship.api_id == "number")
        embed.setURL(`https://kancolle.fandom.com/wiki/${ship.name.replace(/ /g, "_")}`)
             .setThumbnail(`https://raw.githubusercontent.com/KC3Kai/KC3Kai/develop/src/assets/img/ships/${ship.api_id}.png`)
        // TODO rarity color? .setColor("#")

    embed.setDescription(`${ship.class_description} | ${ship.ship_type}`);

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

    return embed;
}