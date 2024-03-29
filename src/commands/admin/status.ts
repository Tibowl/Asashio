import { CommandInteraction, Message } from "discord.js"
import child_process from "child_process"

import Command from "../../utils/Command"
import client from "../../main"
import config from "../../data/config.json"
import emoji from "../../data/emoji.json"
import { SendMessage } from "../../utils/Types"
import { sendMessage } from "../../utils/Utils"

export default class SetLink extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Admin",
            help: "Get bot status. Admins only.",
            usage: "status [more]",
            aliases: ["version"],
            options: []
        })
    }
    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return sendMessage(source, "Not supported", { ephemeral: true })
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!config.admins.includes(source.author.id)) return source.reply("Admins only")
        const { data } = client

        const formatTime = (sec: number): string => {
            const p = (t: number): string => t.toString().padStart(2, "0")

            const d = Math.floor(sec / (3600*24))
            const h = Math.floor(sec % (3600*24) / (3600))
            const m = Math.floor(sec % (3600) / 60)
            const s = Math.floor(sec % 60)

            return `${d}d${p(h)}h${p(m)}m${p(s)}s`
        }

        const getVersion = (): string => `https://github.com/Tibowl/Asashio/commit/${child_process.execSync("git rev-parse HEAD").toString().trim()}`
        const getMemoryUsage = (): string => {
            const mem = (bytes: number): string => `${(bytes/10e6).toFixed(2)} MB`
            const { heapTotal, heapUsed } = process.memoryUsage()
            return `${mem(heapUsed)}/${mem(heapTotal)}`
        }
        const getAdmins = async (): Promise<string> => {
            const users = config.admins.map(async id => client.users.fetch(id))
            return (await Promise.all(users)).map(user => user.tag).join(", ")
        }

        const stats = data.store.stats
        if (stats == undefined) return source.reply("Stats are unavailable, try again later")

        const totalCommands = Object.keys(stats).map(k => Object.values(stats[k]).reduce((a, b) => a+b, 0)).reduce((a, b) => a+b, 0)
        return source.channel.send(`Running on commit ${args && args.length > 0 ? `<${getVersion()}>` : getVersion()}
Memory heap usage: ${getMemoryUsage()}
Current uptime: ${formatTime(process.uptime())}
Cache: in ${client.channels.cache.size} channels on ${client.guilds.cache.size} servers, for a total of ${client.users.cache.size} users.
Total commands executed: ${totalCommands}
${args && args.length > 0 ? `
Loaded ${Object.keys(data.ships).length} ships, ${Object.keys(data.quests).length} quests, ${data.expeds.length} expeds, ${data.birthdays.length} birthdays, ${Object.keys(emoji).length} emoji
Cached ${Object.keys(data.mapInfoCache).length} maps

Max ship level: ${data.getMaxLevel()}
Image server: <${data.getServerIP()}>
Event ID: ${data.eventID()}

Timer offset: ${config.timerOffsetms}ms
Tweeting: ${config.toTweet.length} users
Admins: ${await getAdmins()}
`:""}`)
    }
}
