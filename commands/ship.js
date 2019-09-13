const Discord = require('discord.js');

exports.run = (client, message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide a ship name.");
    const data = client.data;

    const shipName = args.join(" ");
    const ship = data.getShipByName(shipName);

    if(ship == undefined) return message.reply("Unknown ship");
    ship.hp_married = Math.min(ship.hp_max, ship.hp + [4,4,4,5,6,7,7,8,8,9][Math.floor(ship.hp/10)]);
    ship.ship_type = `${data.misc.ShipTypes[ship.type]} (${data.misc.ShipCodes[ship.type]})`

    for(let key of ["asw", "evasion", "los"]) {
        if(ship[key] != undefined && ship[`${key}_max`] != undefined)
            ship[`${key}_ring`] = ship[key] + Math.floor((ship[`${key}_max`] - ship[key]) / 99 * data.getMaxLevel())
        else
            ship[`${key}_ring`] = "??"
        if(ship[key] == undefined) ship[key] = "??"
        if(ship[`${key}_max`] == undefined) ship[`${key}_max`] = "??"
    }

    ship.speed_name = data.misc.SpeedNames[ship.speed]
    ship.range_name = data.misc.RangeNames[ship.range]
    ship.rarity_name = data.misc.RarityNames[ship.rarity]

    ship.mods = [ship.firepower_mod || 0, ship.torpedo_mod || 0, ship.aa_mod || 0, ship.armor_mod || 0].join("/")
    ship.scraps = [ship.scrap_fuel || 0, ship.scrap_ammo || 0, ship.scrap_steel || 0, ship.scrap_bauxite || 0].join("/")

    ship.aircraft = ship.equipment.map(equip => equip.size).reduce((a,b) => a + b, 0);
    ship.equipment_text = ship.equipment.map(equip => `• ${ship.aircraft > 0 ? `${equip.size}${client.config.emoji.plane} `:""}${equip.equipment == undefined ? "??" : equip.equipment ? equip.equipment : "None"}`).join("\n")
    
    if(ship.remodel_level) {
        ship.remodel_text = `Remodel requires:`
        let requirements = [`Lv.${ship.remodel_level}.`]
        const k = (remodel) => remodel == true ? 1 : remodel;

        if(ship.remodel_ammo) requirements.push(`${ship.remodel_ammo}×${client.config.emoji.ammo}`)
        if(ship.remodel_steel) requirements.push(`${ship.remodel_steel}×${client.config.emoji.steel}`)
        if(ship.remodel_development_material) requirements.push(`${k(ship.remodel_development_material)}×${client.config.emoji.devmat}`)
        if(ship.remodel_blueprint) requirements.push(`${k(ship.remodel_blueprint)}×${client.config.emoji.blueprint}`)
        if(ship.remodel_report) requirements.push(`${k(ship.remodel_report)}×${client.config.emoji.action_report}`)
        if(ship.remodel_catapult) requirements.push(`${k(ship.remodel_catapult)}×${client.config.emoji.catapult}`)
        if(ship.remodel_gunmat) requirements.push(`${k(ship.remodel_gunmat)}×${client.config.emoji.gun_mat}`)

        ship.remodel_text += requirements.join(", ")
    }
    ship.class_description = `${ship.class} Class #${ship.class_number}`

    const embed = this.displayShip(ship, data)
    
    return message.channel.send(embed);
}

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


exports.category = "Information";
exports.help = () => {
    return "Get ship information."
}
exports.usage = () => {
    return "ship <ship>"
}
exports.prefix = (client) => {
    return client.config.prefix;
}