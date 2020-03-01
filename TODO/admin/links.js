exports.run = (message) => {
    return message.reply(`<https://github.com/Tibowl/Asashio/blob/master/src/data/links.json>
All links (including redirects that are hidden from help):
${Object.keys(global.linkManager.links).join(", ")}`)
}

exports.category = "Admin"
exports.help = "List links"
exports.usage = "links"
exports.prefix = global.config.prefix
