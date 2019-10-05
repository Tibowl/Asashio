const Logger = require("log4js").getLogger("avatar")

exports.run = (message, args) => {
    const {config, client} = global
    if(!config.admins.includes(message.author.id)) return
    if(!args || args.length < 1) return message.reply("Must provide an URL.")

    const url = args[0]
    return client.user.setAvatar(url)
        .then(() => {
            message.reply("Success!")
            Logger.info(`Updated avatar to ${url} by ${message.author.id}`)
        })
        .catch(err => {
            if(err) {
                message.reply("Failed")
                Logger.error(err)
            }
        })
}

exports.category = "Admin"
exports.help = "Sets avatar. Admins only."
exports.usage = "avatar <URL>"
exports.prefix = global.config.prefix
exports.aliases = ["setavatar"]
