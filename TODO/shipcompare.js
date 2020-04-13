const Utils = require("../../utils/Utils.js")

exports.run = (message, args) => {
    if(!args || args.length < 1 || args.join(" ").split(",").length != 2) return message.reply("Must provide two ship names.")
    const { data } = global

    const shipNameA = args.join(" ").split(",")[0].trim()
    const shipA = data.getShipByName(shipNameA)

    const shipNameB = args.join(" ").split(",")[1].trim()
    const shipB = data.getShipByName(shipNameB)

    if(shipA == undefined) return message.reply("Unknown first ship")
    if(shipB == undefined) return message.reply("Unknown second ship")

    Utils.handleShip(shipA)
    Utils.handleShip(shipB)

    const ship = {}
    for(let key of Object.keys(shipA))
        if(shipA[key] !== shipB[key])
            ship[key] = shipA[key] + "→" + shipB[key]
        else
            ship[key] = shipA[key]

    ship.equipment_text = `${shipA.equipment_text}
↓
${shipB.equipment_text}`
    ship.remodel_text = `${shipA.remodel_text}
↓
${shipB.remodel_text}`

    return message.channel.send(Utils.displayShip(ship))
}

exports.category = "Tools"
exports.help = "Compares two ships."
exports.usage = "shipcompare <ship A>, <ship B>"
exports.prefix = global.config.prefix
