const Utils = require("../../utils/Utils.js");

exports.run = (client, message, args) => {
    if(!args || args.length < 1 || args.join(" ").split(",").length != 2) return message.reply("Must provide two ship names.");
    const data = client.data;

    const shipNameA = args.join(" ").split(",")[0].trim();
    const shipA = data.getShipByName(shipNameA);

    const shipNameB = args.join(" ").split(",")[1].trim();
    const shipB = data.getShipByName(shipNameB);

    if(shipA == undefined) return message.reply("Unknown first ship");
    if(shipB == undefined) return message.reply("Unknown second ship");

    const handleShip = (ship) => {
        ship.aircraft = ship.equipment.map(equip => equip.size).reduce((a,b) => a + b, 0);
        ship.hp_married = Math.min(ship.hp_max, ship.hp + [4,4,4,5,6,7,7,8,8,9][Math.floor(ship.hp/10)]);
        ship.speed_name = data.misc.SpeedNames[ship.speed]
        ship.range_name = data.misc.RangeNames[ship.range]
        ship.rarity_name = data.misc.RarityNames[ship.rarity]
        ship.mods = [ship.firepower_mod || 0, ship.torpedo_mod || 0, ship.aa_mod || 0, ship.armor_mod || 0].join("/")
        ship.scraps = [ship.scrap_fuel || 0, ship.scrap_ammo || 0, ship.scrap_steel || 0, ship.scrap_bauxite || 0].join("/")
        ship.equipment_text = ship.equipment.map(equip => `• ${ship.aircraft > 0 ? `${equip.size}${client.config.emoji.plane} `:""}${equip.equipment == undefined ? "??" : equip.equipment ? equip.equipment : "None"}`).join("\n")
        ship.ship_type = `${data.misc.ShipTypes[ship.type]} (${data.misc.ShipCodes[ship.type]})`

        for(let key of ["asw", "evasion", "los"]) {
            if(ship[key] != undefined && ship[`${key}_max`] != undefined)
                ship[`${key}_ring`] = ship[key] + Math.floor((ship[`${key}_max`] - ship[key]) / 99 * data.getMaxLevel())
            else
                ship[`${key}_ring`] = "??"
            if(ship[key] == undefined) ship[key] = "??"
            if(ship[`${key}_max`] == undefined) ship[`${key}_max`] = "??"
        }

        if(ship.remodel_level) {
            ship.remodel_text = ``
            let requirements = [`Lv.${ship.remodel_level}`]
            const k = (remodel) => remodel == true ? 1 : remodel;
    
            if(ship.remodel_ammo) requirements.push(`${ship.remodel_ammo}×${client.config.emoji.ammo}`)
            if(ship.remodel_steel) requirements.push(`${ship.remodel_steel}×${client.config.emoji.steel}`)
            if(ship.remodel_development_material) requirements.push(`${k(ship.remodel_development_material)}×${client.config.emoji.devmat}`)
            if(ship.remodel_blueprint) requirements.push(`${k(ship.remodel_blueprint)}×${client.config.emoji.blueprint}`)
            if(ship.remodel_report) requirements.push(`${k(ship.remodel_report)}×${client.config.emoji.action_report}`)
            if(ship.remodel_catapult) requirements.push(`${k(ship.remodel_catapult)}×${client.config.emoji.catapult}`)
            if(ship.remodel_gunmat) requirements.push(`${k(ship.remodel_gunmat)}×${client.config.emoji.gun_mat}`)
    
            ship.remodel_text += requirements.join(", ")
        } else {
            ship.remodel_text = "Lv.1"
        }
        ship.class_description = `${ship.class} Class #${ship.class_number}`
        
    };
    handleShip(shipA);
    handleShip(shipB);
    
    const ship = {};
    for(let key of Object.keys(shipA)) 
        if(shipA[key] !== shipB[key])
            ship[key] = shipA[key] + "→" + shipB[key]
        else
            ship[key] = shipA[key];

    ship.equipment_text = `${shipA.equipment_text}
↓
${shipB.equipment_text}`;
    ship.remodel_text = `${shipA.remodel_text}
↓
${shipB.remodel_text}`;
    
    return message.channel.send(Utils.displayShip(ship));
}


exports.getImage = (file) => {
    return `https://kancolle.fandom.com/wiki/Special:FilePath/${file.replace(/ /g, "_")}`
}
exports.category = "Tools";
exports.help = () => {
    return "Compares two ships."
}
exports.usage = () => {
    return "shipcompare <ship A>, <ship B>"
}
exports.prefix = (client) => {
    return client.config.prefix;
}