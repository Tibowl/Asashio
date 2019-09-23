const Utils = require("./../../utils/Utils.js")

exports.run = async (client, message, args) => await Utils.dropTable(client, message, args, "tsundb")

exports.category = "Tools"
exports.help = () => {
    return "Gets drop list of a ship. Data from TsunDB, bot will cache results up to 6 hours. Uses <http://kc.piro.moe> API"
}
exports.usage = () => {
    return "drop <ship> [rank: S/A]"
}
exports.prefix = (client) => {
    return client.config.prefix
}
