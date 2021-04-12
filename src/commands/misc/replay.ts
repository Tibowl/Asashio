import { Message } from "discord.js"

import Command from "../../utils/Command"

export default class Replay extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Links+",
            help: "Get link to replayer site. Will use either given URL or attached image.",
            usage: "replay [url]",
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        const baseLink = "https://kc3kai.github.io/kancolle-replay/battleplayer.html"

        const found = message.attachments?.find(k => !!k.url)
        let link = baseLink
        if (args && args.length > 0 && (args[0].startsWith("http") || args[0].startsWith("<http")))
            link = `${baseLink}?fromImg=${args[0].replace(/^</, "").replace(/>$/, "")}`
        else if (found)
            link = `${baseLink}?fromImg=${found.url}`
        return message.channel.send(`<${link}>`)
    }
}
