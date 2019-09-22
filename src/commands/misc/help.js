exports.run = (client, message, args) => {
    //if(message.channel.type !== "dm") return;
    if(!args || args.length < 1) {
        let commands = client.commands.keyArray()
        let categorized = {
            "Information": [],
            "Tools": [],
            "Links": [],
            "Links+": [],
            "Admin": []
        }
        commands.forEach(cmd => {
            let category = client.commands.get(cmd).category || "??"
            if(categorized[category] == undefined)
                categorized[category] = []
            categorized[category].push(cmd)
        })

        return message.channel.send(`Commands: 
${Object.keys(categorized)
        .filter(category =>
            !(
                category.toLowerCase() == "hidden" ||
            (!client.config.admins.includes(message.author.id) && category.toLowerCase() == "admin")
            )
        ).map(category => `**${category}**
    ${categorized[category].sort((a,b) => a.localeCompare(b)).map(cmd => `${client.commands.get(cmd).prefix(client)}${cmd}`).join(", ")}`)
        .join("\n")}

See \`${exports.prefix(client)}help <command name>\` for more information`)
    }

    let commandName = args[0]

    if(!client.commands.has(commandName)) {
        if(client.commands.has(commandName.slice(1)))
            commandName = commandName.slice(1)
        else
            return message.reply("Command does not exist")
    }

    const command = client.commands.get(commandName)
    if(command.help() == false)
        return

    return message.channel.send(`${commandName} - ${command.help()}

Usage: \`${command.prefix(client)}${command.usage()}\``)
}

exports.category = "Hidden"
exports.help = () => {
    return "Gets help."
}
exports.usage = () => {
    return "help <command>"
}
exports.prefix = (client) => {
    return client.config.prefix
}
