import { Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import config from "../../data/config.json"

export default class Reload extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Admin",
            help: "Reload config/command. Admins only.",
            usage: "reload <command name>",
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!config.admins.includes(message.author.id)) return message.reply("Admins only")
        if (!args || args.length < 1) return message.reply("Must provide a command name to reload.")

        const commandName = args[0]

        if (commandName === "config") {
            return message.reply("Config reloading is disabled")
        } else if (commandName === "data") {
            const { data } = client
            const msg = message.reply("The DataManager is now being reloaded!")
            await data.reloadShipData()
            await (await msg).edit("Reloaded!")
            return msg
        } else if (commandName === "links") {
            return message.reply("This requires a restart!")
        }

        return message.reply("Command reloading is disabled")
    }
}
