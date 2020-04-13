import { Message } from "discord.js"
import fetch from "node-fetch"

import Command from "../../utils/Command"

export default class Wikia extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Links+",
            help: "Search a term on wikia",
            usage: "wikia [search term]",
            aliases: ["wiki"],
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length < 1) return message.channel.send("<http://kancolle.fandom.com/>")
        const result = await (await fetch(`https://kancolle.fandom.com/api/v1/Search/List?query=${encodeURIComponent(args.join(" "))}&limit=5&namespaces=0,14`)).json()
        if (!result.items || result.items.length == 0)
            return message.channel.send("No matches found")
        return message.channel.send(`Possible matches:\n${result.items.map((i: { url: string }) => `<${i.url}>`).join("\n")}`)
    }
}
