import { Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"

export default class Credits extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Bot credits",
            usage: "credits"
        })
    }

    async run(message: Message): Promise<Message | Message[]> {
        return message.channel.send(`This is an open-source bot created by @${(await client.users.fetch("127393188729192448")).tag} - contact him in case there are any problems or if you want to donate slots/asashio rings.
The source-code is hosted on GitHub: <https://github.com/Tibowl/Asashio>

Ship/Quest data provided by wikia.
Birthday data provided by swdn.
Linked charts are provided by the community. Special thanks to swdn, にしくま, Soul and wikia`)
    }
}
