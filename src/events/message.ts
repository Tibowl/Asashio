import log4js from "log4js"
import { Message, TextChannel, MessageAttachment } from "discord.js"
import Command from "../utils/Command"
import client from "../main"
import config from "../data/config.json"

const Logger = log4js.getLogger("message")

interface ParsedCommand {
    args: string[]
    command: string
    cmd: Command
}

function getCommand(message: Message): ParsedCommand | false {
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g)
    const command = args.shift()?.toLowerCase()
    if (!command) return false

    let cmd = client.commands.get(command)

    // If that command doesn't exist, try to find an alias
    if (!cmd) {
        cmd = client.commands.find((cmd: Command) => cmd.aliases.includes(command))

        // If that command doesn't exist, silently exit and do nothing
        if (!cmd)
            return false
    }
    if (message.content.indexOf(config.prefix) !== 0) return false
    return { args, command, cmd }
}

function addStats(msg: Message, cmdInfo: ParsedCommand): void {
    const { command, cmd } = cmdInfo
    const stats = client.data.store.stats ?? {}
    const cmdStats = stats[cmd.commandName.toLowerCase()] ?? {}

    cmdStats[command] = (cmdStats[command] || 0) + 1

    stats[cmd.commandName.toLowerCase()] = cmdStats
    client.data.store.stats = stats
    client.data.saveStore()
}

async function deletable(reply: Message, message: Message): Promise<void> {
    try {
        await reply.react("❌")
        reply.awaitReactions(
            (reaction, user) => reaction.emoji.name == "❌" && (user.id == message.author.id || config.admins.includes(user.id)),
            { max: 1, time: 60000, errors: ["time", "messageDelete", "channelDelete", "guildDelete"] }
        ).then(async (collected) => {
            if (collected && collected.size > 0 && reply.deletable) {
                await reply.delete()
            }
        }).catch(async () => {
            const user = client.user
            if (user == undefined || reply.deleted) return
            await Promise.allSettled(reply?.reactions?.cache.map((reaction) => reaction.me ? reaction.users.remove(user) : undefined).filter(f => f))
        })
        client.recentMessages.push(reply)
        setTimeout(() => {
            client.recentMessages.shift()
        }, 65000)
    } catch (error) {
        if (reply.editable)
            reply.edit(`${reply.content}

Unable to add ❌ reaction, please contact admins of this discord guild to give this bot the ability to add reactions.
Doing so, will allow users to delete bot replies within some time.`).catch(Logger.error)
        else
            Logger.error(error)
    }
}

async function handleCommand(message: Message, cmdInfo: ParsedCommand): Promise<void> {
    const { args, command, cmd } = cmdInfo
    try {
        const msg = cmd.run(message, args, command)
        if (!msg || message.channel.type !== "text") return
        const reply = await msg
        if (!reply) return
        if (!(reply instanceof Message)) {
            if (reply.length)
                await reply.map(async r => deletable(r, message))
            return
        }

        await deletable(reply, message)
    } catch (error) {
        Logger.error(error)
    }
    return
}

export async function handle(message: Message): Promise<void> {
    if (message.author.bot) {
        if (message.guild?.id == "616569685370077192"
            && message.author !== client.user
            && message.channel.type == "news"
            && message.guild.me
            && message.channel.permissionsFor(message.guild.me)?.has("MANAGE_MESSAGES"))
            await message.crosspost()
        return
    }

    const cmdInfo = await getCommand(message)

    const attachStr = (message.attachments && message.attachments
        .filter((k: MessageAttachment) => k?.url !== undefined)
        .map((k: MessageAttachment) => k.url).join(", ")) ?? ""
    const attach = attachStr.length < 1 ? "" : (" +" + attachStr)

    if (cmdInfo && cmdInfo.cmd) {
        const channel = message.channel instanceof TextChannel ? message.channel.name : message.channel.type
        if (message.channel.type === "dm")
            Logger.info(`${message.author.id} (${message.author.username}) executes command in ${channel}${attach}: ${message.content}`)
        else
            Logger.info(`${message.author.id} (${message.author.username}) executes command in ${channel} (guild ${message.guild ? message.guild.id : "NaN"})${attach}: ${message.content}`)

        addStats(message, cmdInfo)
        await handleCommand(message, cmdInfo)
    } else if (message.channel.type === "dm") {
        Logger.info(`${message.author.id} (${message.author.username}) sends message ${message.type} in dm${attach}: ${message.content}`)
        // Gather information for new aliases
        const channel = await client.channels.fetch("658083473818517505")
        if (channel && channel instanceof TextChannel)
            await channel.send(`${message.author.id} (${message.author.username}) sends message ${message.type} in dm${attach}: ${message.content}`)
    }
    // Logger.info(message)
}
