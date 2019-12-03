const Utils = require("../../utils/Utils.js")

exports.run = (message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide a ship name.")
    const { data, config } = global

    const shipName = args.join(" ")
    const ship = data.getShipByName(shipName)

    if(ship == undefined) return message.reply("Unknown ship")
    ship.hp_married = Math.min(ship.hp_max, ship.hp + [4,4,4,5,6,7,7,8,8,9][Math.floor(ship.hp/10)])
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

    ship.aircraft = ship.equipment.map(equip => equip.size).reduce((a,b) => a + b, 0)
    ship.equipment_text = ship.equipment.map(equip => `• ${ship.aircraft > 0 ? `${equip.size}${config.emoji.plane} `:""}${equip.equipment == undefined ? "??" : equip.equipment ? equip.equipment : "None"}`).join("\n")

    if(ship.remodel_level) {
        ship.remodel_text = "Remodel requires: "
        let requirements = [`Lv.${ship.remodel_level}.`]
        const k = (remodel) => remodel == true ? 1 : remodel

        if(ship.remodel_ammo) requirements.push(`${ship.remodel_ammo}×${config.emoji.ammo}`)
        if(ship.remodel_steel) requirements.push(`${ship.remodel_steel}×${config.emoji.steel}`)
        if(ship.remodel_development_material) requirements.push(`${k(ship.remodel_development_material)}×${config.emoji.devmat}`)
        if(ship.remodel_blueprint) requirements.push(`${k(ship.remodel_blueprint)}×${config.emoji.blueprint}`)
        if(ship.remodel_report) requirements.push(`${k(ship.remodel_report)}×${config.emoji.action_report}`)
        if(ship.remodel_catapult) requirements.push(`${k(ship.remodel_catapult)}×${config.emoji.catapult}`)
        if(ship.remodel_gunmat) requirements.push(`${k(ship.remodel_gunmat)}×${config.emoji.gun_mat}`)

        ship.remodel_text += requirements.join(", ")
    }
    ship.class_description = `${ship.class} Class #${ship.class_number}`

    return message.channel.send(Utils.displayShip(ship, message.guild))
}

exports.category = "Information"
exports.help = "Get ship information."
exports.usage = "ship <ship>"
exports.prefix = global.config.prefix
