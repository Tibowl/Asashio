exports.run = (message, args) => {
    const { commands } = global
    //if(message.channel.type !== "dm") return;
    if(!args || args.length < 1) {
        let categorized = {
            "Information": [],
            "Tools": [],
            "Links": [],
            "Links+": [],
            "Admin": []
        }
        commands.keyArray().forEach(cmd => {
            let category = commands.get(cmd).category || "??"
            if(categorized[category] == undefined)
                categorized[category] = []
            categorized[category].push(cmd)
        })
        categorized.Links = global.linkManager.getLinks()

        return message.channel.send(`Commands: 
${Object.keys(categorized)
        .filter(category =>
            !(
                category.toLowerCase() == "hidden" ||
            (!global.config.admins.includes(message.author.id) && category.toLowerCase() == "admin")
            )
        ).map(category => `**${category}**
    ${categorized[category].sort((a,b) => a.localeCompare(b)).map(cmd => `${commands.get(cmd).prefix}${cmd}`).join(", ")}`)
        .join("\n")}

See \`${exports.prefix}help <command name>\` for more information`)
    }

    let commandName = args[0]

    let command = commands.get(commandName)

    // Check aliases
    if(command == null)
        command = commands.find(k => (k.aliases||[]).includes(commandName))

    // Replace first char (could be some prefix)
    if(command == null) {
        commandName = commandName.slice(1)
        command = commands.find(k => (k.aliases||[]).includes(commandName))
    }

    // Command not found
    if(command == null)
        return message.reply("Command does not exist")

    commandName = command.commandName
    if(command.help == false)
        return

    return message.channel.send(`${commandName} - ${command.help}

Usage: \`${command.prefix}${command.usage}\`${command.aliases?`
Aliases: ${command.aliases.map(k => `\`${k}\``).join(", ")}`:""}`)
}

exports.category = "Hidden"
exports.help = "Gets help."
exports.usage = "help <command>"
exports.prefix = global.config.prefix
