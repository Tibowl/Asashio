exports.run = async (message) => {
    const { client } = global

    const msgPing = "**Pinging...**"
    const pingMsg = await message.reply(msgPing)
    const msgPong = [
        "**Pong!**",
        `The message round-trip took **${pingMsg.createdTimestamp - message.createdTimestamp}ms**.`,
        client.ping ? `The heartbeat ping is **${Math.round(client.ping)}ms**.` : ""
    ].join(" ").trim()
    pingMsg.edit(msgPong)
    return pingMsg
}

exports.category = "hidden"
exports.help = "Pong."
exports.usage = "ping"
exports.prefix = global.config.prefix
