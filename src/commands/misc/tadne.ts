import { CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import { CommandResponse, CommandSource, SendMessage } from "../../utils/Types"
import { sendMessage } from "../../utils/Utils"

export default class TADNE extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Hidden",
            help: "Random TADNE pic.",
            usage: "tadne",
            aliases: ["asashio", "prpr", "sendmeasashiolewdstibi"],
            options: [{
                name: "id",
                description: "ID to specific image",
                type: "STRING",
                required: false
            }]
        })
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return this.run(source, source.options.getString("id"))
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        return this.run(source, args.join(" "))
    }

    run(source: CommandSource, arg?: string | null): CommandResponse {
        return sendMessage(source, `https://flatisjustice.moe/TADNE/${arg && arg.length > 0 && !isNaN(parseInt(arg)) ? arg : Math.floor(Math.random() * 1000)}.jpg`)
    }
}
