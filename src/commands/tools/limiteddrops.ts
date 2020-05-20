import { Message } from "discord.js"
import Command from "../../utils/Command"
import { specialDrops } from "../../utils/Utils"

export default class LimitedDrop extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Get a summary of notable limited drops. Data from TsunDB, bot will cache results up to 6 hours. Uses <http://kc.piro.moe> API",
            usage: "limiteddrops",
            aliases: ["ldrop", "ldrops", "limiteddrop", "us", "usa"]
        })
    }

    run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (args.length > 0 && args[0] == "poi")
            return specialDrops(message, "poi")
        return specialDrops(message, "tsundb")
    }
}
