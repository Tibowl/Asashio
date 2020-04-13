const Utils = require("../../utils/Utils.js")

exports.run = (message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide a ship name.")
    const { data } = global

    const shipName = args.join(" ")
    const ship = data.getShipByName(shipName)

    if(ship == undefined) return message.reply("Unknown ship")

    return message.channel.send(Utils.displayShip(Utils.handleShip(ship), message.guild))
}

exports.category = "Information"
exports.help = "Get ship information."
exports.usage = "ship <ship>"
exports.prefix = global.config.prefix
