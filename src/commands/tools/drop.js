const Utils = require("./../../utils/Utils.js")

exports.run = (message, args) => Utils.dropTable(message, args, "tsundb")

exports.category = "Tools"
exports.help = "Gets drop list of a ship. Data from TsunDB, bot will cache results up to 6 hours. Uses <http://kc.piro.moe> API"
exports.usage = "drop <ship> [rank: S/A]"
exports.prefix = global.config.prefix
exports.aliases = ["locate", "droprate", "droprates"]
