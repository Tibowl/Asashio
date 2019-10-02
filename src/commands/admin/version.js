const child_process = require("child_process")

exports.run = async (client, message) => {
    if(!client.config.admins.includes(message.author.id)) return
    return message.reply(`Running on commit https://github.com/Tibowl/Asashio/commit/${child_process.execSync("git rev-parse HEAD").toString().trim()}`)
}

exports.category = "Admin"
exports.help = () => {
    return "Get current version. Admins only."
}
exports.usage = () => {
    return "version"
}
exports.prefix = (client) => {
    return client.config.prefix
}
