import { Message } from "discord.js"
import Command from "../../utils/Command"
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

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        return dropTable(message, args, "tsundb")
    }
}
