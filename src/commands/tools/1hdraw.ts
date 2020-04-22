import { Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"

export default class OneHourDraw extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Check today's 1h draw ships",
            usage: "1hdraw",
            aliases: ["onehourdraw", "1hd", "1hourdraw"]
        })
    }

    run(message: Message): Promise<Message | Message[]> {
        const { cachedShips } = client.tweetManager

        if (!cachedShips.date) {
            return message.channel.send("No 1h draw loaded :(")
        }

        return message.channel.send(`Today's 1h draw ships: ${cachedShips.ships
            .map((name) => {
                const candidate = client.data.getShipByName(name)
                if (candidate && (name == candidate.japanese_name || name == candidate.reading))
                    return candidate.name
                return name
            })
            .map(s => `**${s}**`)
            .join(", ")
            .replace(/,([^,]*)$/, " and$1")}

Based on @${cachedShips.screen_name} tweet on: ${cachedShips.date}`)
    }
}
