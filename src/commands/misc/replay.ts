import { CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import { SendMessage } from "../../utils/Types"
import { sendMessage } from "../../utils/Utils"

const baseLink = "https://kc3kai.github.io/kancolle-replay/battleplayer.html"
export default class Replay extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Links+",
            help: "Get link to replayer site. Will use either given URL or attached image.",
            usage: "replay [url]",
            options: [{
                name: "url",
                description: "URL to replay file",
                type: "STRING",
                required: false
            }]
        })
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        let link = baseLink
        const arg = source.options.getString("url")
        if (arg && arg.length > 0 && (arg.startsWith("http") || arg.startsWith("<http")))
            link = `${baseLink}?fromImg=${arg.replace(/^</, "").replace(/>$/, "")}`

        return sendMessage(source, `<${link}>`)
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        const found = source.attachments?.find(k => !!k.url)
        let link = baseLink
        if (args && args.length > 0 && (args[0].startsWith("http") || args[0].startsWith("<http")))
            link = `${baseLink}?fromImg=${args[0].replace(/^</, "").replace(/>$/, "")}`
        else if (found)
            link = `${baseLink}?fromImg=${found.url}`
        return sendMessage(source, `<${link}>`)
    }
}
