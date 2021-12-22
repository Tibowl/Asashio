import { CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import { CommandResponse, CommandSource, SendMessage } from "../../utils/Types"
import { sendMessage } from "../../utils/Utils"

export default class OneHourDraw extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Check today's 1h draw ships",
            usage: "1hdraw",
            aliases: ["onehourdraw", "1hd", "1hourdraw", "1hrdraw"],
            options: []
        })
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return this.run(source)
    }

    async runMessage(source: Message): Promise<SendMessage | undefined> {
        return this.run(source)
    }

    run(source: CommandSource): CommandResponse {
        const { cachedShips } = client.data.store

        if (cachedShips == undefined || !cachedShips.date) {
            return sendMessage(source, "No 1h draw loaded :(")
        }

        return sendMessage(source, `Today's 1h draw ships: ${cachedShips.ships
            .map(s => `**${s}**`)
            .join(", ")
            .replace(/,([^,]*)$/, " and$1")}

Based on @${cachedShips.screen_name} tweet on: ${cachedShips.date}`)
    }
}
