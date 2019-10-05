const fs = require("fs")
const Logger = require("log4js").getLogger("reload")

exports.run = (client, message, args) => {
    if(!client.config.admins.includes(message.author.id)) return
    if(!args || args.length < 1) return message.reply("Must provide a command name to reload.")

    let commandName = args[0]

    if(commandName === "config") {
        delete require.cache[require.resolve("../../config.json")]
        client.config = require("../../config.json")
        return message.reply("The config has been reloaded")
    } else if(commandName === "data") {
        delete require.cache[require.resolve("../../utils/DataManager.js")]
        client.data = require("../../utils/DataManager.js")
        client.data.reloadShipData(client)
        return message.reply("The DataManager is now being reloaded!")
    } else if(commandName === "links") {
        client.linkManager.loadLinks(client)
        return message.reply("Links are now being reloaded!")
    }

    if(!client.commands.has(commandName) && client.commands.has(commandName.slice(1)))
        commandName = commandName.slice(1)

    const readDir = (dir) => {
        fs.readdir(dir, (err, files) => {
            if (err) return Logger.error(err)
            files.forEach(file => {
                if (!file.endsWith(".js")) return readDir(dir + file + "/")
                let name = file.split(".")[0]
                if(name == commandName) {
                    delete require.cache[require.resolve(`../../${dir}/${commandName}.js`)]
                    let props = require(`../../${dir}/${commandName}.js`)
                    Logger.info(`Loading ${commandName}`)
                    client.commands.delete(commandName)
                    client.commands.set(commandName, props)
                }
            })
        })
    }
    readDir("./commands/")

    return message.reply(`The command \`${commandName}\` will be reloaded`)
}

exports.category = "Admin"
exports.help = () => {
    return "Reload config/command. Admins only."
}
exports.usage = () => {
    return "reload <command name>"
}
exports.prefix = (client) => {
    return client.config.prefix
}
