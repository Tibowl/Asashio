import Command from "../../utils/Command"
import Discord from "discord.js"
import client from "../../main"
import { CommandCategory } from "../../utils/Command"
import config from "../../data/config.json"

export default class Help extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Hidden",
            help: "Gets help.",
            usage: "help [command]"
        })
    }

    run(message: Discord.Message, args: string[]): Promise<Discord.Message | Discord.Message[]> {
        //if(message.channel.type !== "dm") return;
        const { commands } = client
        if (!args || args.length < 1) {
            let categorized: { [a in CommandCategory]: string[] } = {
                "Hidden": [],
                "Information": [],
                "Tools": [],
                "Links": [],
                "Links+": [],
                "Admin": []
            }
            commands.forEach(cmd => {
                let category = cmd?.category ?? "Misc"
                categorized[category].push(cmd.commandName)
            })
            categorized.Links = client.linkManager.getLinks()

            return message.channel.send(`Commands: 
${Object.entries(categorized)
        .filter(([category]) =>
            !(category.toLowerCase() == "hidden" ||
                (!config.admins.includes(message.author.id) && category.toLowerCase() == "admin"))
        ).map(([category, items]) => `**${category}**
    ${items.sort((a, b) => a.localeCompare(b)).map(cmd => `${config.prefix}${cmd}`).join(", ")}`)
        .join("\n")}

See \`${config.prefix}help <command name>\` for more information`)
        }

        let commandName = args[0]

        let command = client.commands.get(commandName)
        // Check aliases
        if (command == null)
            command = commands.find(k => (k.aliases||[]).includes(commandName))

        // Replace first char (could be some prefix)
        if (command == null)
            command = commands.find(k => (k.aliases||[]).includes(commandName.slice(1)))

        if (command == null)
            return message.reply("Command does not exist")

        if (command.help == false)
            return message.channel.send(`${command.commandName}`)

        return message.channel.send(`${command.commandName} - ${command.help}

Usage: \`${config.prefix}${command.usage}\`${command.aliases ? `
Aliases: ${command.aliases.map(k => `\`${k}\``).join(", ")}` : "None"}`)
    }
}
