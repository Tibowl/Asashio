import Command from "../../utils/Command"
import { AutocompleteInteraction, CommandInteraction, Message } from "discord.js"
import client from "../../main"
import { CommandCategory } from "../../utils/Command"
import config from "../../data/config.json"
import { findFuzzyBestCandidates, sendMessage } from "../../utils/Utils"
import { CommandSource, SendMessage } from "../../utils/Types"

export default class Help extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Hidden",
            help: "Gets help.",
            usage: "help [command]",
            aliases: ["command", "commands"],
            options: [{
                name: "command",
                description: "Command",
                type: "STRING",
                required: false,
                autocomplete: true
            }]
        })
    }

    async autocomplete(source: AutocompleteInteraction): Promise<void> {
        const targetNames = client.commands.keyArray()

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
        const command = source.options.getString("command")
        if (command == undefined)
            return this.runList(source)
        return this.run(source, command)
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (args.length <1)
            return this.runList(source)
        return this.run(source, args.join(" "))
    }

    async runList(source: CommandSource): Promise<SendMessage | undefined> {
        const { commands } = client

        const categorized: { [a in CommandCategory]: string[] } = {
            "Hidden": [],
            "Information": [],
            "Tools": [],
            "Links": [],
            "Links+": [],
            "Admin": []
        }
        commands.forEach(cmd => {
            const category = cmd?.category ?? "Misc"
            categorized[category].push(cmd.commandName)
        })
        categorized.Links = client.linkManager.getLinks()

        return sendMessage(source, `**Commands**: 

${Object.entries(categorized)
        .filter(([category]) =>
            !(category.toLowerCase() == "hidden")
        ).map(([category, items]) => `**${category}**
    ${items.sort((a, b) => a.localeCompare(b)).map(cmd => `${config.prefix}${cmd}`).join(", ")}`)
        .join("\n")}

*Use \`${config.prefix}help <command name>\` for more information about a specific command.*
*See \`${config.prefix}credits\` for how to contact the developer.*
*You can invite this bot to your server with \`${config.prefix}invite\`.*`)
    }

    async run(source: CommandSource, commandName: string): Promise<SendMessage | undefined> {
        const { commands } = client

        let command = client.commands.get(commandName)
        // Check aliases
        if (command == null)
            command = commands.find(k => (k.aliases??[]).includes(commandName))

        // Replace prefix
        commandName = commandName.replace(config.prefix, "")
        if (command == null)
            command = commands.find(k => k.commandName === commandName.replace(config.prefix, "") || (k.aliases??[]).includes(commandName.replace(config.prefix, "")))

        if (command == null)
            return sendMessage(source, "Command does not exist")

        return sendMessage(source, `${command.commandName} - ${command.help}

Usage: \`${config.prefix}${command.usage}\`${command.aliases ? `
Aliases: ${command.aliases.map(k => `\`${k}\``).join(", ")}` : "None"}`)
    }
}
