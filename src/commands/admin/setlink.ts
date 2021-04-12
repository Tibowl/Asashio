import { Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import config from "../../data/config.json"

export default class SetLink extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Admin",
            help: "Sets a link. Admins only.",
            usage: "setlink <name> [url]",
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!config.admins.includes(message.author.id)) return message.reply("Admins only")
        return client.linkManager.setLink(message, args)
    }
}
