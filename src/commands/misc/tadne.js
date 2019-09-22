const { Attachment } = require("discord.js")

exports.run = (client, message, args) => {
    if(!client.config.admins.includes(message.author.id)) return

    const attachment = new Attachment(`https://flatisjustice.moe/TADNE/${args && args.length > 0 && !isNaN(parseInt(args[0])) ? args[0] : Math.floor(Math.random() * 1000)}.png`)
    return message.channel.send(attachment)
}

exports.category = "hidden"
exports.help = () => {
    return "Random TADNE pic. Admins only."
}
exports.usage = () => {
    return "tadne"
}
exports.prefix = (client) => {
    return client.config.prefix
}
