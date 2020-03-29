const fetch = require("node-fetch")
const Utils = require("../../utils/Utils")

this.cachedData = {}

const en_names = ["?", "Yokosuka", "Kure", "Sasebo", "Maizuru", "Ominato", "Truk", "Lingga", "Rabaul", "Shortland", "Buin", "Tawi-Tawi", "Palau", "Brunei", "Hitokappu", "Paramushir", "Sukumo", "Kanoya", "Iwagawa", "Saiki Bay", "Hashirajima"]
const ranks = [1, 5, 20, 100, 500]

exports.run = async (message, args) => {
    const cached = this.returnCached(message, args)
    if(cached) return cached
    const reply = message.reply("Loading...")

    fetch(`https://api.kancolle.moe/server/list?date=${Date.now()}`).then(async (api) => {
        api = await api.json()
        this.cachedData.time = Date.now()
        this.cachedData.rankingData = api

        ;(await reply).edit(this.formatData(api, args))
    })

    return reply
}

exports.formatData = (api, args) => {
    const serverData = []

    const low = api.data.map(k => k.cutoff && k.cutoff[500]).sort((a,b) => a-b)[2]
    const high = api.data.map(k => k.cutoff && k.cutoff[500]).sort((a,b) => a-b)[api.data.length - 3]

    for(let serverID in en_names) {
        let data = api.data.find(k => serverID == k.servernum)
        if(data && data.cutoff) {
            if(args && args.length > 0 && !(serverID == args[0] || en_names[serverID].toLowerCase().includes(args[0].toLowerCase())))
                continue

            const color = data.cutoff[500] <= low ? "+" : data.cutoff[500] >= high ? "-" : " "

            serverData.push([color + serverID.padStart(2), en_names[serverID], ...ranks.map(rank => data.cutoff[rank].toString() + " |"), new Date(data.lastmodifided).toLocaleString("en-UK", {
                timeZone: "Asia/Tokyo",
                hour12: false,
                hourCycle: "h24",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }).replace(",", "")])
        }
    }

    if(serverData.length == 0)
        return "Couldn't find a matching server!"

    return `\`\`\`diff\n${Utils.createTable(
        undefined,
        [
            [" ID", "Server", "T1 |", "T5 |", "T20 |", "T100 |", "T500 |", "Last updated"],
            ...serverData
        ],
        [Utils.PAD_START, Utils.PAD_END, Utils.PAD_START, Utils.PAD_START, Utils.PAD_START, Utils.PAD_START, Utils.PAD_START, Utils.PAD_END]
    )}\`\`\`\nData provided by <https://senka.su>`
}
exports.returnCached = (message, args) => {
    if(this.cachedData && this.cachedData.time + 15 * 60 * 1000 > Date.now())
        return message.channel.send(this.formatData(this.cachedData.rankingData, args))
}

exports.category = "Tools"
exports.help = "Gets ranking data from https://senka.su"
exports.usage = "ranking [server name/id]"
exports.prefix = global.config.prefix
