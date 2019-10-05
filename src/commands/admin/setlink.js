exports.run = (message, args) => {
    if(!global.config.admins.includes(message.author.id)) return
    return global.linkManager.setLink(message, args)
}

exports.category = "Admin"
exports.help = "Sets a link. Admins only."
exports.usage = "setlink <name> [url]"
exports.prefix = global.config.prefix
