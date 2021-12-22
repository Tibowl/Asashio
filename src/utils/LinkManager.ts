import cprocess from "child_process"
import log4js from "log4js"
import { join } from "path"
import { AutocompleteInteraction, CommandInteraction, Message } from "discord.js"
import { existsSync, readFileSync, writeFileSync, unlinkSync, moveSync } from "fs-extra"

import Command from "./Command"
import client from "../main"
import { CommandResponse, CommandSource, SendMessage } from "./Types"
import { findFuzzyBestCandidates, getUserID, sendMessage } from "./Utils"

const Logger = log4js.getLogger("LinkManager")

const path = join(__dirname, "../../src/data/")
const linkLocation = join(path, "links.json")
const oldLinks = join(path, "links.json.old")

const linkMap = new Map<string, string>()

export default class LinkManager extends Command {
    constructor() {
        super({
            name: "link",
            category: "Links",
            help: "Retrieve a link",
            usage: "link <name>",
            options: [{
                name: "name",
                description: "Name of the link",
                type: "STRING",
                required: true,
                autocomplete: true
            }]
        })
    }

    async autocomplete(source: AutocompleteInteraction): Promise<void> {
        const targetNames = this.getLinks(true)

        const search = source.options.getFocused().toString()

        if (search == "") {
            return await source.respond([
                ...targetNames.filter((_, i) => i < 20).map(value => {
                    return { name: value, value }
                })
            ])
        }

        await source.respond(findFuzzyBestCandidates(targetNames, search, 20).map(value => {
            return { name: value, value }
        }))
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        const { options } = source
        return this.run(source, options.getString("name", true))
    }

    async runMessage(source: Message, args: string[], command: string): Promise<SendMessage | undefined> {
        if (command == "link" && args.length > 0)
            command = args[0]
        return this.run(source, command)
    }

    loadMap(file: string): void {
        linkMap.clear()

        const obj = JSON.parse(readFileSync(file).toString())
        for (const [k, v] of Object.entries(obj))
            linkMap.set(k, v as string)
    }

    loadLinks(): void {
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

        client.commands.set("link", this)
        for (const link of linkMap.keys())
            client.commands.set(link, this)

        Logger.debug(`Registered links: ${this.getLinks(true).join(", ")}`)
    }

    async setLink(source: CommandSource, args: string[]): Promise<CommandResponse> {
        if (args.length < 1) return await sendMessage(source, "Not enough arguments", { ephemeral: true })
        const userID = getUserID(source)
        const command = args[0]

        if (args.length == 1) {
            if (!linkMap.has(command))
                return await sendMessage(source, "That is not a link!", { ephemeral: true })

            client.commands.delete(command)
            Logger.info(`${userID} removed link ${command} (was ${linkMap.get(command)})`)
            linkMap.delete(command)
            await this.updateDb(userID)

            return await sendMessage(source, `Deleted \`${command}\``, { ephemeral: true })
        }
        const link = args.slice(1).join(" ")

        if (client.commands.has(command) && !linkMap.has(command))
            return await sendMessage(source, "This is another command OhNo", { ephemeral: true })

        const oldValue = linkMap.get(command)

        if (oldValue == link)
            return await sendMessage(source, "Link no changed", { ephemeral: true })

        Logger.info(`${userID} changed ${command} from ${oldValue} to ${link}`)
        linkMap.set(command, link)

        await this.updateDb(userID)

        if (!client.commands.has(command))
            client.commands.set(command, this)

        let reply = `Updated \`${command}\` from \`${oldValue}\` -> \`${link}\``
        if (reply.length > 1995)
            reply = reply.substring(1990) + " [...]"

        return await sendMessage(source, reply)
    }

    getLinks(all = false): string[] {
        const entries = []
        for (const entry of linkMap.entries())
            entries.push(entry)
        return entries.filter(entry => all || !entry[1].startsWith("@")).map((entry) => entry[0])
    }

    updateDb(id: string): void {
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

    async run(source: CommandSource, command: string): Promise<SendMessage | undefined> {
        let toSend = linkMap.get(command)

        let tries = 0
        while (toSend?.startsWith("@") && tries++ < 100)
            toSend = linkMap.get(toSend.substring(1))

        if (toSend == undefined)
            toSend = "Unknown link"

        return sendMessage(source, toSend)
    }
}
