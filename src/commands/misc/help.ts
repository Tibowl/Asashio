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
        if (!args || args.length < 1) {
            let commands = client.commands.keyArray()
            let categorized: { [a in CommandCategory]: string[] } = {
                "Hidden": [],
                "Information": [],
                "Tools": [],
                "Links": [],
                "Links+": [],
                "Misc": [],
                "Admin": []
            }
            commands.forEach(cmd => {
                let category = client.commands.get(cmd)?.category ?? "Misc"
                categorized[category].push(cmd)
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
        if (!command) {
            command = client.commands.get(commandName = commandName.slice(1))
            if (!command)
                return message.reply("Command does not exist")
        }

        if (command.help == false)
            return message.channel.send(`${commandName}`)

        return message.channel.send(`${commandName} - ${command.help}

Usage: \`${config.prefix}${command.usage}\`${command.aliases ? `
Aliases: ${command.aliases.map(k => `\`${k}\``).join(", ")}` : ""}`)
    }
}
