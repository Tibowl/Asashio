exports.run = (message, args) => {
    //if(message.channel.type !== "dm") return;
    if(!args || args.length < 1) {
        let commands = global.commands.keyArray()
        let categorized = {
            "Information": [],
            "Tools": [],
            "Links": [],
            "Links+": [],
            "Admin": []
        }
        commands.forEach(cmd => {
            let category = global.commands.get(cmd).category || "??"
            if(categorized[category] == undefined)
                categorized[category] = []
            categorized[category].push(cmd)
        })

        return message.channel.send(`Commands: 
${Object.keys(categorized)
        .filter(category =>
            !(
                category.toLowerCase() == "hidden" ||
            (!global.config.admins.includes(message.author.id) && category.toLowerCase() == "admin")
            )
        ).map(category => `**${category}**
    ${categorized[category].sort((a,b) => a.localeCompare(b)).map(cmd => `${global.commands.get(cmd).prefix}${cmd}`).join(", ")}`)
        .join("\n")}

See \`${exports.prefix}help <command name>\` for more information`)
    }

    let commandName = args[0]

    if(!global.commands.has(commandName)) {
        if(global.commands.has(commandName.slice(1)))
            commandName = commandName.slice(1)
        else
            return message.reply("Command does not exist")
    }

    const command = global.commands.get(commandName)
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
