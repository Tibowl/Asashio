import { Message } from "discord.js"

import Command from "../../utils/Command"
import { dropTable } from "../../utils/Utils"

export default class DropPoi extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Gets drop list of a ship. Data from poi-statistics, bot will cache results up to 6 hours.",
            usage: "drop-poi <ship> [rank: S/A]",
            aliases: ["poidrop", "poi-drop", "poidb"]
        })
    }

    run(message: Message, args: string[]): Promise<Message | Message[]> {
        return dropTable(message, args, "poi")
    }
}
