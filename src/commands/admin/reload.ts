import { CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import config from "../../data/config.json"
import { getUserID, isMessage, sendMessage } from "../../utils/Utils"
import { CommandResponse, CommandSource, SendMessage } from "../../utils/Types"

export default class Reload extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Admin",
            help: "Reload config/command. Admins only.",
            usage: "reload <command name>",
            options: [] // Admin commands not supported
        })
    }
    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return sendMessage(source, "Not supported", { ephemeral: true })
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        return await this.run(source, args)
    }

    async run(source: CommandSource, args: string[]): Promise<CommandResponse> {
        if (!config.admins.includes(getUserID(source))) return sendMessage(source, "Admins only")
        if (!args || args.length < 1) return sendMessage(source, "Must provide a command name to reload.")

        const commandName = args[0]

        if (commandName === "config") {
            return sendMessage(source, "Config reloading is disabled")
        } else if (commandName === "data") {
            const { data } = client
            const msg = await sendMessage(source, "The DataManager is now being reloaded!")
            await data.reloadShipData()
            if (isMessage(msg))
                await msg.delete()
            await sendMessage(source, "Ship data reloaded!")
            return msg
        } else if (commandName === "links") {
            return sendMessage(source, "This requires a restart!")
        }

        return sendMessage(source, "Command reloading is disabled")
    }
}
