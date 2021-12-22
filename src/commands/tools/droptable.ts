import fetch from "node-fetch"
import { CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import { CommandSource, SendMessage } from "../../utils/Types"
import { sendMessage } from "../../utils/Utils"

export default class DropTable extends Command {
    constructor(name: string) {
        super({
            name,
            help: "Gets drop table of a map. Replies only in DM. Uses <http://kc.piro.moe> API",
            usage: "droptable <map>",
            aliases: ["drops"],
            category: "Tools",
            options: [{
                name: "map",
                description: "Map to check",
                type: "STRING",
                required: true
            }]
        })
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return this.run(source, source.options.getString("map", true))
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length != 1) return sendMessage(source, `Usage: \`${this.usage}\``)
        return this.run(source, args[0])
    }

    async run(source: CommandSource, arg: string): Promise<SendMessage | undefined> {
        const { data } = client

        let map = arg.toUpperCase()
        if (map.startsWith("E-")) map = map.replace("E", data.eventID().toString())
        else if (map.startsWith("E")) map = map.replace("E", data.eventID() + "-")
        if (map.split("-").length != 2) return sendMessage(source, "Invalid map!")

        const isEventMap = map.split("-")[0].length > 1

        let table = (await (await fetch(`http://kc.piro.moe/api/routing/droptable/${map}`)).text())
            .replace(/^\| /gm, "")
            .replace(/\|$/gm, "")
            .replace(/\| ([A-Z0-9]) +/g, isEventMap ? "|  $1  " : "| $1 ")
            .replace(/\| ([A-Z0-9]{2}) +/g, isEventMap ? "|  $1  " : "| $1")
            .replace(/Casual/g, "C")
            .replace(/Normal/g, "N")
            .replace(/Easy/g, "E")
            .replace(/Hard/g, "H")
            .replace(/(C|N|E|H) *(S|A)/g, "$1 $2")
            .replace(/\| {5} +/g, "|     ")

        if (!isEventMap)
            table = table.replace(/\| {2}/g, "| ")

        const rows = table.split("\n")
        rows[1] = ""
        table = rows.filter(k => k.length).map(k => k.trim()).join("\n")

        if (table.length > 1800)
            return sendMessage(source, "Table too long!", { ephemeral: true })
        else if (table.length < 5)
            return sendMessage(source, "No notable drops found!", { ephemeral: true })

        return sendMessage(source, `Drop table of ${map}\`\`\`\n${table}\n\`\`\`\nData provided by TsunDB.`, { ephemeral: true })
    }
}
