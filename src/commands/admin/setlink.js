exports.run = (client, message, args) => {
    if(!client.config.admins.includes(message.author.id)) return
    return client.linkManager.setLink(client, message, args)
}

exports.category = "Admin"
exports.help = () => {
    return "Sets a link. Admins only."
}
exports.usage = () => {
    return "setlink <name> [url]"
}
exports.prefix = (client) => {
    return client.config.prefix
}
