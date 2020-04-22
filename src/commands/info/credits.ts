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
        return message.channel.send(`This is an open-source bot created by @${(await client.users.fetch("127393188729192448")).tag}. The source-code is available on GitHub: <https://github.com/Tibowl/Asashio>. Feel free to make a PR :)

You contact me at <https://discord.gg/Hm5M4pf> if there are any problems.
You can support me at <https://ko-fi.com/Tibot> ~~if you want donate slots/asashio rings~~ (will be used for stuff like domain name/bot hosting).

Ship/Quest data provided by wikia.
Birthday data provided by swdn.
Linked charts are provided by the community. Special thanks to swdn, にしくま, Soul and wikia`)
    }
}
