import { CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import { CommandResponse, CommandSource, SendMessage } from "../../utils/Types"
import { sendMessage } from "../../utils/Utils"

export default class Credits extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Bot credits",
            usage: "credits",
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
        return sendMessage(source, `This is an open-source bot created by @${(await client.users.fetch("127393188729192448")).tag}. The source-code is available on GitHub: <https://github.com/Tibowl/Asashio>. Feel free to make a PR :)

You contact me at <https://discord.gg/Hm5M4pf> if there are any problems.
You can support me at <https://ko-fi.com/Tibot> ~~if you want donate slots/asashio rings~~ (will be used for stuff like domain name/bot hosting).

Ship/Quest data provided by wikia.
Birthday data provided by swdn.
Linked charts are provided by the community. Special thanks to swdn, にしくま, Soul and wikia`)
    }
}
