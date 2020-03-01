exports.run = (message, args) => {
    return message.channel.send(`https://flatisjustice.moe/TADNE/${args && args.length > 0 && !isNaN(parseInt(args[0])) ? args[0] : Math.floor(Math.random() * 1000)}.png`)
}

exports.category = "hidden"
exports.help = "Random TADNE pic."
exports.usage = "tadne"
exports.prefix = global.config.prefix
exports.aliases = ["asashio", "prpr"]
