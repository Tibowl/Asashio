const fetch = require("node-fetch")
const Utils = require("../../utils/Utils")

this.cachedData = {}

const en_names = ["?", "Yokosuka", "Kure", "Sasebo", "Maizuru", "Ominato", "Truk", "Lingga", "Rabaul", "Shortland", "Buin", "Tawi-Tawi", "Palau", "Brunei", "Hitokappu", "Paramushir", "Sukumo", "Kanoya", "Iwagawa", "Saiki Bay", "Hashirajima"]

exports.run = async (message, args) => {
    const cached = this.returnCached(message, args)
    if(cached) return cached
    const reply = message.reply("Loading...")

    fetch(`https://tsundb.kc3.moe/api/kc_servers?date=${Date.now()}`).then(async (api) => {
        api = await api.json()
        this.cachedData.time = Date.now()
        this.cachedData.kc_servers = api

        ;(await reply).edit(this.formatData(this.cachedData, args))
    })

    return reply
}

exports.formatData = (data, args) => {
    const serverData = []

    for(let serverID in en_names) {
        let currentServer = data.kc_servers.find(k => serverID == k.api_id)
        if(currentServer && (args.length > 0 || currentServer.api_entry))
            serverData.push([currentServer.api_entry ? "+ Open" : "- Closed", "|", serverID, "|", en_names[serverID], "|", currentServer.api_rate.toString()])
    }

    if(serverData.length == 0)
        return "There are no open servers!"

    return `${args.length > 0 ? "All" : "Open"} servers:\`\`\`diff\n${Utils.createTable(
        undefined,
        [
            ["Status", "|", "ID", "|", "Server Name", "|", "%"],
            ...serverData
        ],
        [Utils.PAD_END, Utils.PAD_END, Utils.PAD_START, Utils.PAD_END, Utils.PAD_END, Utils.PAD_END, Utils.PAD_START]
    )}\`\`\`\nLast updated ${new Date(data.time).toLocaleString("en-UK", {
        timeZone: "GMT",
        timeZoneName: "short",
        hour12: false,
        hourCycle: "h24",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })}`
}
exports.returnCached = (message, args) => {
    if(this.cachedData && this.cachedData.time + 60 * 60 * 1000 > Date.now())
        return message.channel.send(this.formatData(this.cachedData, args))
}

exports.category = "Tools"
exports.help = "Lists open servers"
exports.usage = "openserver [all?]"
exports.prefix = global.config.prefix
exports.aliases = ["open", "openkcservers", "openservers", "openkcserver"]
