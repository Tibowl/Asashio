const Logger = require("log4js").getLogger("shoukillme")

exports.run = async (message) => {
    if(!global.config.admins.includes(message.author.id)) return
    const { client } = global

    Logger.info(`Shutting down by ${message.author.id}`)
    await client.user.setStatus("dnd")
    const toRemove = global.recentMessages.map(reply => reply.reactions.map((reaction) => reaction.me ? reaction.remove() : false).find(k => k)).filter(k => k)
    const reply = await message.reply(`Shutting down after cleanup. ${toRemove.length ? `Removing ${toRemove.length} reactions...` : ""}`)

    global.tweetManager.shutdown()
    await global.timerManager.update()
    await Promise.all(toRemove)
    await reply.edit("<:wooper:617004982440427606>")
    await client.destroy()
    process.exit()
}

exports.category = "Admin"
exports.help = "Kills bot. Admins only."
exports.usage = "shoukillme"
exports.prefix = global.config.prefix
exports.aliases = ["shutdown", "sink"]
