import cprocess from "child_process"
import fs from "fs"
import log4js from "log4js"
import Command from "./Command"
import client from "../main"
import Discord from "discord.js"

const Logger = log4js.getLogger("LinkManager")

interface LinksDB {
    [key: string]: string
}

export default class LinkManager extends Command {
    constructor() {
        super({
            name: "Links",
            category: "Links",
            help: false,
            usage: false
        })
    }

    links: LinksDB = {}
    async loadLinks(): Promise<void> {
        this.links = require("../../src/data/links.json")

        const printLines = []
        for (let link of Object.entries(this.links)) {
            client.commands.set(link[0], this)
            printLines.push(link.join(" -> "))
        }
        Logger.info(`Registered links:
${printLines.join("\n")}`)
    }

    async setLink(message: Discord.Message, args: string[]): Promise<Discord.Message | Discord.Message[]> {
        if (args.length < 1) return await message.reply("Not enough arguments")
        let command = args[0]
        if (args.length == 1) {
            if (this.links[command] == undefined)
                return await message.reply("That is not a link!")

            client.commands.delete(command)
            Logger.info(`${message.author.id} removed link ${command} (was ${this.links[command]})`)
            delete this.links[command]
            await this.updateDb(message.author.id)

            return await message.reply(`Deleted \`${command}\``)
        }
        let link = args.slice(1).join(" ")

        if (client.commands.has(command) && this.links[command] == undefined)
            return await message.reply("This is another command OhNo")

        const oldValue = this.links[command]
        Logger.info(`${message.author.id} changed ${command} from ${oldValue} to ${link}`)
        this.links[command] = link

        await this.updateDb(message.author.id)

        if (!client.commands.has(command))
            client.commands.set(command, this)

        return await message.reply(`Updated \`${command}\` from \`${oldValue}\` -> \`${link}\``)
    }

    getLinks(): string[] {
        return Object.keys(this.links).filter(k => !this.links[k].startsWith("@"))
    }

    async updateDb(id: string): Promise<void> {
        fs.writeFileSync("../src/data/links.json", JSON.stringify(this.links, null, 4))
        cprocess.execSync(`git add ../src/data/links.json && git commit -m "Link updated by ${id}" && git push`)
    }

    run(message: Discord.Message, args: string[], command: string): Promise<Discord.Message | Discord.Message[]> {
        let toSend = this.links[command]

        let tries = 0
        while (toSend.startsWith("@") && tries++ < 100)
            toSend = this.links[toSend.substring(1)]

        return message.channel.send(toSend)
    }
}
