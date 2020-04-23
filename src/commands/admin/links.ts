import { Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"

export default class Links extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Admin",
            help: "List links",
            usage: "links",
        })
    }

    run(message: Message): Promise<Message | Message[]> {
        return message.reply(`<https://github.com/Tibowl/Asashio/blob/master/src/data/links.json>
All links (including redirects that are hidden from help):
${client.linkManager.getLinks(true).join(", ")}`)
    }
}
