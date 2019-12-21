const Logger = require("log4js").getLogger("message")

module.exports = async (client, message) => {
    if (message.author.bot) return

    const cmdInfo = await getCommand(message)

    if (cmdInfo && cmdInfo.cmd) {
        if (message.channel.type === "dm")
            Logger.info(`${message.author.id} (${message.author.username}) executes command in ${message.channel.name || message.channel.type}: ${message.content}`)
        else
            Logger.info(`${message.author.id} (${message.author.username}) executes command in ${message.channel.name || message.channel.type} (guild ${message.guild ? message.guild.id : "NaN"}): ${message.content}`)

        handleCommand(message, cmdInfo)
        addStats(message, cmdInfo)
    } else if(message.channel.type === "dm")
        Logger.info(`${message.author.id} (${message.author.username}) sends message in dm: ${message.content}`)
}

function getCommand(message) {
    const { commands } = global

    const args = message.content.slice(1).trim().split(/ +/g)
    const command = args.shift().toLowerCase()

    let cmd = commands.get(command)

    // If that command doesn't exist, silently exit and do nothing
    if (!cmd) {
        const newCommand = commands.keyArray().find(k => (commands.get(k).aliases||[]).includes(command))

        if(!newCommand)
            return false
        cmd = commands.get(newCommand)
    }
    if (message.content.indexOf(cmd.prefix) !== 0) return false
    return { args, command, cmd }
}

function addStats(msg, cmdInfo) {
    const { command, cmd } = cmdInfo
    const stats = global.data.store.stats || {}
    const cmdStats = stats[cmd.commandName.toLowerCase()] || {}

    cmdStats[command] = cmdStats[command] + 1 || 1

    stats[cmd.commandName.toLowerCase()] = cmdStats
    global.data.store.stats = stats
    global.data.saveStore()
}
async function handleCommand(message, cmdInfo) {
    const { args, command, cmd } = cmdInfo
    try {
        const msg = cmd.run(message, args, command)
        if(!msg || message.channel.type !== "text") return true
        const reply = await msg
        if(!reply) return true

        try {
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
            if (reply.editable)
                reply.edit(reply.content + "\n\nUnable to pre-add ❌ to remove reaction, please contact your local discord admins to fix bot permissions (tell them to enable ADD_REACTIONS for me).")
            else
                Logger.error(error)
        }
    } catch (error) {
        Logger.error(error)
    }
    return true
}
