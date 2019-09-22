exports.run = async (client, message) => {
    if(!client.config.admins.includes(message.author.id)) return

    const toRemove = client.recentMessages.map(reply => reply.reactions.map((reaction) => reaction.me ? reaction.remove() : false).find(k => k)).filter(k => k)
    const reply = await message.reply(`Shutting down after cleanup. ${toRemove.length ? `Removing ${toRemove.length} reactions...` : ""}`)

    client.tweetManager.shutdown()
    await client.timerManager.update()
    await Promise.all(toRemove)
    await reply.edit("<:wooper:617004982440427606>")
    process.exit()
}

exports.category = "Admin"
exports.help = () => {
    return "Kills bot. Admins only."
}
exports.usage = () => {
    return "shoukillme"
}
exports.prefix = (client) => {
    return client.config.prefix
}
