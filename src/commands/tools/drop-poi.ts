import Command from "../../utils/Command"
import Discord from "discord.js"
import { dropTable } from "../../utils/Utils"

export default class DropPoi extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Gets drop list of a ship. Data from poi-statistics, bot will cache results up to 6 hours.",
            usage: "drop-poi <ship> [rank: S/A]"
        })
    }

    run(message: Discord.Message, args: string[]): Promise<Discord.Message | Discord.Message[]> {
        return dropTable(message, args, "poi")
    }
}
