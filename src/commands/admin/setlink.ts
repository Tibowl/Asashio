import { CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import config from "../../data/config.json"
import { CommandResponse, CommandSource, SendMessage } from "../../utils/Types"
import { getUserID, sendMessage } from "../../utils/Utils"

export default class SetLink extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Admin",
            help: "Sets a link. Admins only.",
            usage: "setlink <name> [url]",
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
        if (!config.admins.includes(getUserID(source))) return sendMessage(source, "Admins only", { ephemeral: true })
        return client.linkManager.setLink(source, args)
    }
}
