const child_process = require("child_process")

exports.run = async (client, message, args) => {
    if(!client.config.admins.includes(message.author.id)) return

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
        const users = client.config.admins.map(id => client.fetchUser(id))
        return (await Promise.all(users)).map(user => user.tag).join(", ")
    }

    return message.channel.send(`Running on commit ${args && args.length > 0 ? `<${getVersion()}>` : getVersion()}
Memory heap usage: ${getMemoryUsage()}
Current uptime: ${getUptime()}
${args && args.length > 0 ? `
Loaded ${Object.keys(client.data.ships).length} ships, ${Object.keys(client.data.quests).length} quests, ${client.data.expeds.length} expeds, ${client.data.birthdays.length} birthdays, ${Object.keys(client.config.emoji).length} emoji
Cached ${Object.keys(client.data.mapInfoCache).length} maps

Max ship level: ${client.data.getMaxLevel()}
Image server: <${client.data.getServerIP()}>
Event ID: ${client.data.eventID()}

Timer offset: ${client.config.timerOffsetms}ms
Timer channels: ${client.config.timerChannels.map(id => `<#${id}>`).join(", ")}
Birthday channels: ${client.config.birthdayChannels.map(id => `<#${id}>`).join(", ")}
Tweet channels: ${client.config.tweetChannels.map(id => `<#${id}>`).join(", ")}
Tweeting: ${client.config.toTweet.length} users
Admins: ${await getAdmins()}
`:""}`)
}

exports.category = "Admin"
exports.help = () => {
    return "Get bot status. Admins only."
}
exports.usage = () => {
    return "status [more]"
}
exports.prefix = (client) => {
    return client.config.prefix
}
