const fetch = require("node-fetch")

this.cachedData = {}

const en_names = ["?", "Yokosuka", "Kure", "Sasebo", "Maizuru", "Ominato", "Truk", "Lingga", "Rabaul", "Shortland", "Buin", "Tawi-Tawi", "Palau", "Brunei", "Hitokappu", "Paramushir", "Sukumo", "Kanoya", "Iwagawa", "Saiki Bay", "Hashirajima"]
const ranks = [1, 5, 20, 100, 500]

exports.run = async (client, message) => {
    const cached = this.returnCached(message)
    if(cached) return cached
    const reply = message.reply("Loading...")

    let api = await fetch(`https://api.senka.com.ru/server/list?date=${Date.now()}`)//.then(async (api) => {
    api = await api.json()
    this.cachedData.time = Date.now()

    const longestENName = Math.max(...en_names.map(k => k.length))
    let rankingData = `\`\`\`
ID ${"Server".padEnd(11, " ")}   T1 |   T5 |  T20 | T100 | T500 | Last updated
`
    for(let serverID in en_names) {
        let data = api.data.find(k => serverID == k.servernum)
        if(data && data.cutoff) {
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
    this.cachedData.rankingData = rankingData
    ;(await reply).edit(rankingData)
    //})

    return reply
}

exports.returnCached = (message) => {
    if(this.cachedData && this.cachedData.time + 15 * 60 * 1000 > Date.now())
        return message.channel.send(this.cachedData.rankingData)
}

exports.category = "Tools"
exports.help = () => {
    return "Gets ranking data from https://senka.com.ru"
}
exports.usage = () => {
    return "ranking"
}
exports.prefix = (client) => {
    return client.config.prefix
}
