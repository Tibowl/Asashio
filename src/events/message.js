const Logger = require("log4js").getLogger("message")

module.exports = async (client, message) => {
    if (message.author.bot) return
    const { commands } = global

    if(message.channel.type === "dm")
        Logger.info(`${message.author.id} (${message.author.username}) in ${message.channel.name || message.channel.type}: ${message.content}`)
    const args = message.content.slice(1).trim().split(/ +/g)
    const command = args.shift().toLowerCase()

    let cmd = commands.get(command)

    // If that command doesn't exist, silently exit and do nothing
    if (!cmd) {
        const newCommand = commands.keyArray().find(k => (commands.get(k).aliases||[]).includes(command))

        if(!newCommand)
            return
        cmd = commands.get(newCommand)
    }
    if (message.content.indexOf(cmd.prefix) !== 0) return

    try {
        if(message.channel.type !== "dm")
            Logger.info(`${message.author.id} (${message.author.username}) in ${message.channel.name || message.channel.type}: ${message.content}`)
        const msg = cmd.run(message, args, command)
        if(!msg || message.channel.type !== "text") return
        const reply = await msg
        if(!reply) return

        await reply.react("❌")
        reply.awaitReactions(
            (reaction, user) => reaction.emoji.name == "❌" && (user.id == message.author.id || global.config.admins.includes(user.id)),
            {max: 1, time: 60000, errors: ["time"]}
        ).then(() =>
            reply.delete()
        ).catch(() =>
            reply.reactions.forEach((reaction) => reaction.me ? reaction.remove() : 0)
        )
        global.recentMessages.push(reply)
        setTimeout(() => {
            global.recentMessages.shift()
        }, 65000)
    } catch (error) {
        Logger.error(error)
    }
}
