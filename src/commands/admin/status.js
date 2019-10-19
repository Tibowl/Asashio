const child_process = require("child_process")

exports.run = async (message, args) => {
    if(!global.config.admins.includes(message.author.id)) return
    const { client } = global

    const formatTime = (sec) => {
        const p = (t) => t.toString().padStart(2, "0")

        const d = Math.floor(sec / (3600*24))
        const h = Math.floor(sec % (3600*24) / (3600))
        const m = Math.floor(sec % (3600) / 60)
        const s = Math.floor(sec % 60)

        return `${d}d${p(h)}h${p(m)}m${p(s)}s`
    }

    const getVersion = () => `https://github.com/Tibowl/Asashio/commit/${child_process.execSync("git rev-parse HEAD").toString().trim()}`
    const getMemoryUsage = () => {
        const mem = (bytes) => `${(bytes/10e6).toFixed(2)} MB`
        const {heapTotal, heapUsed} = process.memoryUsage()
        return `${mem(heapUsed)}/${mem(heapTotal)}`
    }
    const getUptime = () => formatTime(process.uptime())
    const getAdmins = async () => {
        const users = global.config.admins.map(id => client.fetchUser(id))
        return (await Promise.all(users)).map(user => user.tag).join(", ")
    }

    return message.channel.send(`Running on commit ${args && args.length > 0 ? `<${getVersion()}>` : getVersion()}
Memory heap usage: ${getMemoryUsage()}
Current uptime: ${getUptime()}
In ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.
${args && args.length > 0 ? `
Loaded ${Object.keys(global.data.ships).length} ships, ${Object.keys(global.data.quests).length} quests, ${global.data.expeds.length} expeds, ${global.data.birthdays.length} birthdays, ${Object.keys(global.config.emoji).length} emoji
Cached ${Object.keys(global.data.mapInfoCache).length} maps

Max ship level: ${global.data.getMaxLevel()}
Image server: <${global.data.getServerIP()}>
Event ID: ${global.data.eventID()}

Timer offset: ${global.config.timerOffsetms}ms
Timer channels: ${global.config.timerChannels.map(id => `<#${id}>`).join(", ")}
Birthday channels: ${global.config.birthdayChannels.map(id => `<#${id}>`).join(", ")}
Tweet channels: ${global.config.tweetChannels.map(id => `<#${id}>`).join(", ")}
Tweeting: ${global.config.toTweet.length} users
Admins: ${await getAdmins()}
`:""}`)
}

exports.category = "Admin"
exports.help = "Get bot status. Admins only."
exports.usage = "status [more]"
exports.prefix = global.config.prefix
exports.aliases = ["version"]
