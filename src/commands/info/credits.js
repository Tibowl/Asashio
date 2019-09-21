exports.run = (client, message, args) => {
    return message.channel.send(`This bot is created by @Tibo#8271 - contact him in case there are any problems or if you want to donate slots/asashio rings.

Ship/Quest data provided by wikia.
Birthday data provided by swdn.
Linked charts are provided by the community. Special thanks to swdn, にしくま, Soul and wikia`)
}

exports.category = "Information";
exports.help = () => {
    return "Bot credits"
}
exports.usage = () => {
    return "credits"
}
exports.prefix = (client) => {
    return client.config.prefix;
}