import { Message } from "discord.js"

import Command from "../../utils/Command"

export default class OneHourDraw extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Hidden",
            help: "Random TADNE pic.",
            usage: "tadne",
            aliases: ["asashio", "prpr"],
        })
    }

    run(message: Message, args: string[]): Promise<Message | Message[]> {
        return message.channel.send(`https://flatisjustice.moe/TADNE/${args && args.length > 0 && !isNaN(parseInt(args[0])) ? args[0] : Math.floor(Math.random() * 1000)}.png`)
    }
}
