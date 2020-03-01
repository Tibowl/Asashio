import Command from "../../utils/Command"
import Discord from "discord.js"
import { dropTable } from "../../utils/Utils"

export default class Drop extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Gets drop list of a ship. Data from TsunDB, bot will cache results up to 6 hours. Uses <http://kc.piro.moe> API",
            usage: "drop <ship> [rank: S/A]",
            aliases: ["locate", "droprate", "droprates"]
        })
    }

    run(message: Discord.Message, args: string[]): Promise<Discord.Message | Discord.Message[]> {
        return dropTable(message, args, "tsundb")
    }
}
