exports.run = (client, message, args) => {
    if(!client.config.admins.includes(message.author.id)) return;
    if(!args || args.length < 1) return message.reply("Must provide a command name to reload.");

    let commandName = args[0];

    if(commandName === 'config') {
        delete require.cache[require.resolve(`./../config.json`)];
        client.config = require("./../config.json")
        return message.reply(`The config has been reloaded`);
    }
    if(commandName === 'data') {
        delete require.cache[require.resolve(`./../DataManager.js`)];
        client.data = require("./../DataManager.js")
        client.data.reloadShipData(client);
        return message.reply(`The DataManager is now being reloaded!`);
    }
    if(commandName === 'links') {
        client.linkManager.loadLinks(client);
        return message.reply(`Links are now being reloaded!`);
    }

    if(!client.commands.has(commandName)) {
        if(client.commands.has(commandName.slice(1)))
            commandName = commandName.slice(1)
        else
            try {
                client.commands.set(commandName, require(`./${commandName}.js`));
                return message.reply(`Loaded \`${commandName}\``);
            } catch (error) {
                return message.reply(`\`${commandName}\` does not exist`);
            }
    }

    delete require.cache[require.resolve(`./${commandName}.js`)];

    client.commands.delete(commandName);
    client.commands.set(commandName, require(`./${commandName}.js`));
    return message.reply(`The command \`${commandName}\` has been reloaded`);
};

exports.category = "Admin";
exports.help = () => {
    return "Reload config/command. Admins only."
}
exports.usage = () => {
    return "reload <command name>"
}
exports.prefix = (client) => {
    return client.config.prefix;
}