import { CommandInteraction, Message } from "discord.js"
import client from "../../main"
import Command from "../../utils/Command"
import { CommandResponse, CommandSource, SendMessage } from "../../utils/Types"
import { sendMessage } from "../../utils/Utils"


export default class Links extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Admin",
            help: "List links",
            usage: "links",
            options: []
        })
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return await this.run(source)
    }

    async runMessage(source: Message): Promise<SendMessage | undefined> {
        return await this.run(source)
    }

    async run(source: CommandSource): Promise<CommandResponse> {
        return sendMessage(source, `<https://github.com/Tibowl/Asashio/blob/master/src/data/links.json>
All links (including redirects that are hidden from help):
${client.linkManager.getLinks(true).join(", ")}`)
    }
}
