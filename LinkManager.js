exports.links = {};
exports.loadLinks = async (client) => {
    let linkDB = await client.channels.get('621460804541087744').fetchMessage('621461360705798164')
    let contents = linkDB.content;
    contents.replace(/```/g, "");
    let lines = contents.split("\n").filter(line => line.includes(' = ')).map(line => line.trim().split(" = "))
    console.log("Registered links:")
    for(let line of lines) {
        this.links[line[0]] = line[1];
        client.commands.set(line[0], this);
        console.log(line.join(" -> "))
    }
}

exports.setLink = async (client, message, args) => {
    if(args.length < 1) return await message.reply("Not enough arguments")
    let command = args[0];
    if(args.length == 1) {
        if(this.links[command] == undefined)
            return await message.reply("That is not a link!");

        client.commands.delete(command);
        delete this.links[command];
        await this.updateDb(client);

        return await message.reply(`Deleted \`${command}\``)
    }
    let link = args.slice(1).join(" ");

    if(link.includes(" = ") || link.includes("\n"))
        return await message.reply("Illegal link.")

    if(client.commands.has(command) && this.links[command] == undefined)
        return await message.reply("This is another command OhNo");
    

    this.links[command] = link;

    await this.updateDb(client);

    if(!client.commands.has(command))
        client.commands.set(command, this);

    return await message.reply(`Updated \`${command}\` -> \`${link}\``)
}
exports.updateDb = async (client) => {
    let linkDB = await client.channels.get('621460804541087744').fetchMessage('621461360705798164')
    await linkDB.edit(`Links:
\`\`\`
${Object.entries(this.links).sort((a,b) => a[0].localeCompare(b[0])).map(a => a.join(" = ")).join("\n")}
\`\`\``)
}

exports.run = (client, message, args, command) => {
    return message.channel.send(this.links[command]);
}
exports.help = () => {
    return false;
}
exports.usage = () => {
    return false;
}
exports.prefix = (client) => {
    return client.config.prefix;
}
exports.category = "Links";