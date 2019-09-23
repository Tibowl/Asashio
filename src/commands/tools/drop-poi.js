const Utils = require("./../../utils/Utils.js")

exports.run = (client, message, args) => Utils.dropTable(client, message, args, "poi")

exports.category = "Tools"
exports.help = () => {
    return "Gets drop list of a ship. Data from poi-statistics, bot will cache results up to 6 hours."
}
exports.usage = () => {
    return "drop-poi <ship> [rank: S/A]"
}
exports.prefix = (client) => {
    return client.config.prefix
}
