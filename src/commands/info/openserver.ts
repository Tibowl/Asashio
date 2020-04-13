import { Message } from "discord.js"
import fetch from "node-fetch"
import Command from "../../utils/Command"

import { createTable, PAD_START, PAD_END } from "../../utils/Utils"

interface CacheData {
    time: number
    kc_servers?: {
        api_id: number
        api_entry: number
        api_rate: number
    }[]
    errors?: { message: string }[]
}
const cachedData: CacheData = { time: 0 }
const en_names = ["?", "Yokosuka", "Kure", "Sasebo", "Maizuru", "Ominato", "Truk", "Lingga", "Rabaul", "Shortland", "Buin", "Tawi-Tawi", "Palau", "Brunei", "Hitokappu", "Paramushir", "Sukumo", "Kanoya", "Iwagawa", "Saiki Bay", "Hashirajima"]

export default class OpenServer extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Lists open servers",
            usage: "openserver [all?]",
            aliases: ["open", "openkcservers", "openservers", "openkcserver"],
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        const cached = this.returnCached(message, args)
        if (cached != undefined) return cached
        const reply = message.reply("Loading...")

        fetch(`https://tsundb.kc3.moe/api/kc_servers?date=${Date.now()}`).then(async (api) => {
            const parsed = await api.json()
            cachedData.time = Date.now()
            cachedData.kc_servers = parsed
            if (parsed.errors)
                cachedData.errors = parsed.errors;

            (await reply).edit(this.formatData(cachedData, args))
        })

        return reply
    }

    formatData(data: CacheData, args: string[]): string {
        if (cachedData.errors != undefined) {
            return "An error occured while fetching data"
        }

        const serverData = []

        for (let serverID in en_names) {
            let currentServer = data.kc_servers?.find(k => (+serverID) == k.api_id)
            if (currentServer && (args.length > 0 || currentServer.api_entry))
                serverData.push([currentServer.api_entry ? "+ Open" : "- Closed", "|", serverID, "|", en_names[serverID], "|", currentServer.api_rate.toString()])
        }

        if (serverData.length == 0)
            return "There are no open servers!"

        return `${args.length > 0 ? "All" : "Open"} servers:\`\`\`diff\n${createTable(
            undefined,
            [
                ["Status", "|", "ID", "|", "Server Name", "|", "%"],
                ...serverData
            ],
            [PAD_END, PAD_END, PAD_START, PAD_END, PAD_END, PAD_END, PAD_START]
        )}\`\`\`\nLast updated ${new Date(data.time).toLocaleString("en-UK", {
            timeZone: "GMT",
            timeZoneName: "short",
            hour12: false,
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })}`
    }

    returnCached (message: Message, args: string[]): Promise<Message> | undefined {
        if (cachedData.time + 60 * 60 * 1000 > Date.now())
            return message.channel.send(this.formatData(cachedData, args))
    }
}
