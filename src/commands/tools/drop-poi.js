const Utils = require("./../../utils/Utils.js")

exports.run = (message, args) => Utils.dropTable(message, args, "poi")

exports.category = "Tools"
exports.help = "Gets drop list of a ship. Data from poi-statistics, bot will cache results up to 6 hours."
exports.usage = "drop-poi <ship> [rank: S/A]"
exports.prefix = global.config.prefix
