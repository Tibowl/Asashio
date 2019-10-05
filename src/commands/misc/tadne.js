const { Attachment } = require("discord.js")

exports.run = (message, args) => {
    if(!global.config.admins.includes(message.author.id)) return

    const attachment = new Attachment(`https://flatisjustice.moe/TADNE/${args && args.length > 0 && !isNaN(parseInt(args[0])) ? args[0] : Math.floor(Math.random() * 1000)}.png`)
    return message.channel.send(attachment)
}

exports.category = "hidden"
exports.help = "Random TADNE pic. Admins only."
exports.usage = "tadne"
exports.prefix = global.config.prefix
exports.aliases = ["prpr"]
