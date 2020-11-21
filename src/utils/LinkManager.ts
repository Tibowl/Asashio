import cprocess from "child_process"
import log4js from "log4js"
import { join } from "path"
import { Message } from "discord.js"
import { existsSync, readFileSync, writeFileSync, unlinkSync, moveSync } from "fs-extra"

import Command from "./Command"
import client from "../main"

const Logger = log4js.getLogger("LinkManager")

const path = join(__dirname, "../../src/data/")
const linkLocation = join(path, "links.json")
const oldLinks = join(path, "links.json.old")

const linkMap = new Map<string, string>()

export default class LinkManager extends Command {
    constructor() {
        super({
            name: "Links",
            category: "Links",
            help: false,
            usage: false
        })
    }

    loadMap(file: string): void {
        linkMap.clear()

        const obj = JSON.parse(readFileSync(file).toString())
        for (const [k, v] of Object.entries(obj))
            linkMap.set(k, v as string)
    }

    async loadLinks(): Promise<void> {
        if (existsSync(linkLocation))
            try {
                this.loadMap(linkLocation)
            } catch (error) {
                Logger.error("Failed to read/parse links.json", error)
            }

        if (existsSync(oldLinks) && linkMap == undefined)
            try {
                this.loadMap(oldLinks)
                Logger.error("Restored from old links!")
            } catch (error) {
                Logger.error("Failed to read/parse links.json.old")
            }

        for (const link of linkMap.keys())
            client.commands.set(link, this)

        Logger.debug(`Registered links: ${this.getLinks(true).join(", ")}`)
    }

    async setLink(message: Message, args: string[]): Promise<Message | Message[]> {
        if (args.length < 1) return await message.reply("Not enough arguments")
        let command = args[0]
        if (args.length == 1) {
            if (!linkMap.has(command))
                return await message.reply("That is not a link!")

            client.commands.delete(command)
            Logger.info(`${message.author.id} removed link ${command} (was ${linkMap.get(command)})`)
            linkMap.delete(command)
            await this.updateDb(message.author.id)

            return await message.reply(`Deleted \`${command}\``)
        }
        let link = args.slice(1).join(" ")

        if (client.commands.has(command) && !linkMap.has(command))
            return await message.reply("This is another command OhNo")

        const oldValue = linkMap.get(command)
        Logger.info(`${message.author.id} changed ${command} from ${oldValue} to ${link}`)
        linkMap.set(command, link)

        await this.updateDb(message.author.id)

        if (!client.commands.has(command))
            client.commands.set(command, this)

        return await message.reply(`Updated \`${command}\` from \`${oldValue}\` -> \`${link}\``)
    }

    getLinks(all = false): string[] {
        const entries = []
        for (const entry of linkMap.entries())
            entries.push(entry)
        return entries.filter(entry => all || !entry[1].startsWith("@")).map((entry) => entry[0])
    }

    async updateDb(id: string): Promise<void> {
        if (existsSync(oldLinks))
            unlinkSync(oldLinks)

        if (existsSync(linkLocation))
            moveSync(linkLocation, oldLinks)

        const obj = Object.create(null)
        for (const [k, v] of linkMap)
            obj[k] = v

        writeFileSync(linkLocation, JSON.stringify(obj, undefined, 4))

        cprocess.execSync(`git add ${linkLocation} && git commit -m "Link updated by ${id}" && git push`)
    }

    run(message: Message, args: string[], command: string): Promise<Message | Message[]> {
        let toSend = linkMap.get(command)

        let tries = 0
        while (toSend?.startsWith("@") && tries++ < 100)
            toSend = linkMap.get(toSend.substring(1))

        if (toSend == undefined)
            toSend = "Unknown link"

        return message.channel.send(toSend)
    }
}
