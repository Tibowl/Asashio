const fetch = require("node-fetch")

this.cachedData = {}

const en_names = ["?", "Yokosuka", "Kure", "Sasebo", "Maizuru", "Ominato", "Truk", "Lingga", "Rabaul", "Shortland", "Buin", "Tawi-Tawi", "Palau", "Brunei", "Hitokappu", "Paramushir", "Sukumo", "Kanoya", "Iwagawa", "Saiki Bay", "Hashirajima"]
const ranks = [1, 5, 20, 100, 500]

exports.run = async (client, message, args) => {
    const cached = this.returnCached(message, args)
    if(cached) return cached
    const reply = message.reply("Loading...")

    fetch(`https://api.senka.com.ru/server/list?date=${Date.now()}`).then(async (api) => {
        api = await api.json()
        this.cachedData.time = Date.now()
        this.cachedData.rankingData = api

        ;(await reply).edit(this.formatData(api, args))
    })

    return reply
}

exports.formatData = (api, args) => {
    const longestENName = Math.max(...en_names.map(k => k.length))
    let rankingData = `\`\`\`\nID ${"Server".padEnd(11, " ")}   T1 |   T5 |  T20 | T100 | T500 | Last updated\n`
    let found = false

    for(let serverID in en_names) {
        let data = api.data.find(k => serverID == k.servernum)
        if(data && data.cutoff) {
            if(args && args.length > 0 && !(serverID == args[0] || en_names[serverID].toLowerCase().includes(args[0].toLowerCase())))
                continue
            found = true

            const cutoffs = ranks.map(rank => (data.cutoff[rank].toString()).padStart(5)).join(" |")
            rankingData += `${(serverID.toString()).padStart(2)} ${en_names[serverID].padEnd(longestENName)}${cutoffs} | ${new Date(data.lastmodifided).toLocaleString("en-UK", {
                timeZone: "Asia/Tokyo",
                hour12: false,
                hourCycle: "h24",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }).replace(",", "")}\n`
        }
    }
    rankingData += "```\nData provided by <https://senka.com.ru>"

    if(!found)
        return "Couldn't find a matching server!"
    return rankingData
}
exports.returnCached = (message, args) => {
    if(this.cachedData && this.cachedData.time + 15 * 60 * 1000 > Date.now())
        return message.channel.send(this.formatData(this.cachedData.rankingData, args))
}

exports.category = "Tools"
exports.help = () => {
    return "Gets ranking data from https://senka.com.ru"
}
exports.usage = () => {
    return "ranking [server name/id]"
}
exports.prefix = (client) => {
    return client.config.prefix
}
