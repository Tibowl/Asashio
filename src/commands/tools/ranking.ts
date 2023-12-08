import { CommandInteraction, Message } from "discord.js"
import fetch from "node-fetch"

import Command from "../../utils/Command"
import { PAD_END, PAD_START, createTable, sendMessage, updateMessage } from "../../utils/Utils"
import emoji from "../../data/emoji.json"
import log4js from "log4js"
import { CommandSource, SendMessage } from "../../utils/Types"

const Logger = log4js.getLogger("ranking")

const en_names = ["?", "Yokosuka", "Kure", "Sasebo", "Maizuru", "Ominato", "Truk", "Lingga", "Rabaul", "Shortland", "Buin", "Tawi-Tawi", "Palau", "Brunei", "Hitokappu", "Paramushir", "Sukumo", "Kanoya", "Iwagawa", "Saiki Bay", "Hashirajima"]
const ranks = [1, 5, 20, 100, 500]

export interface SenkaAPI {
    code:   number
    status: string
    data:   ServerData[]
}

export interface ServerData {
    servernum:     number
    serverip:      string
    lastmodifided: number
    cutoff:        { [key: string]: number }
}

const cachedData: {time?: number, rankingData?: SenkaAPI} = {}
export default class Ranking extends Command {

    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Gets ranking data from https://senka.su",
            usage: "ranking [server name/id]",
            aliases: ["senka", "points", "stonks", "rank"],
            options: [{
                name: "server",
                description: "Name of server or ID",
                type: "STRING",
                required: false
            }]
        })
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return this.run(source, source.options.getString("server") ?? "")
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        return this.run(source, args.join(" "))
    }

    async run(source: CommandSource, arg: string): Promise<SendMessage | undefined> {
        if ((cachedData?.time ?? 0) + 15 * 60 * 1000 > Date.now() && cachedData.rankingData !== undefined)
            return sendMessage(source, this.formatData(cachedData.rankingData, arg))

        const reply = await sendMessage(source, `${emoji.loading} Loading...`)

        fetch(`https://api.kancolle.moe/server/list?date=${Date.now()}`).then(async (fetched) => {
            const api = await fetched.json() as SenkaAPI
            cachedData.time = Date.now()
            cachedData.rankingData = api

            if (reply)
                await updateMessage(reply, this.formatData(api, arg))
        }).catch(e => Logger.error(e))

        return reply
    }

    formatData(api: SenkaAPI, arg: string): string {
        const serverData = []

        const low = api.data.map(k => k.cutoff && k.cutoff[500]).sort((a, b) => a-b)[2]
        const high = api.data.map(k => k.cutoff && k.cutoff[500]).sort((a, b) => a-b)[api.data.length - 3]

        for (const serverID in en_names) {
            const found = api.data.find(k => +serverID == k.servernum)
            if (!(found && found.cutoff))
                continue
            const data = found

            if (arg && arg.length > 0 && !(serverID == arg || en_names[serverID].toLowerCase().includes(arg.toLowerCase())))
                continue

            const color = data.cutoff[500] <= low ? "+" : data.cutoff[500] >= high ? "-" : " "

            serverData.push([color + serverID.padStart(2), en_names[serverID], ...ranks.map(rank => data.cutoff[rank].toString() + " |"), new Date(data.lastmodifided).toLocaleString("en-UK", {
                timeZone: "Asia/Tokyo",
                hour12: false,
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }).replace(",", "")])
        }

        if (serverData.length == 0)
            return "Couldn't find a matching server!"

        return `\`\`\`diff\n${createTable(
            undefined,
            [
                [" ID", "Server", "T1 |", "T5 |", "T20 |", "T100 |", "T500 |", "Last updated"],
                ...serverData
            ],
            [PAD_START, PAD_END, PAD_START, PAD_START, PAD_START, PAD_START, PAD_START, PAD_END]
        )}\`\`\`\nData provided by <https://senka.su>`
    }
}
