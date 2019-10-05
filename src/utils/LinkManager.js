const Logger = require("log4js").getLogger("LinkManager")

exports.links = {}
exports.loadLinks = async () => {
    let linkDB = await global.client.channels.get("621460804541087744").fetchMessage("621461360705798164")
    let contents = linkDB.content
    contents.replace(/```/g, "")
    let lines = contents.split("\n").filter(line => line.includes(" = ")).map(line => line.trim().split(" = "))

    const printLines = []
    for(let line of lines) {
        this.links[line[0]] = line[1]
        global.commands.set(line[0], this)
        printLines.push(line.join(" -> "))
    }
    Logger.info(`Registered links:
${printLines.join("\n")}`)
}

exports.setLink = async (message, args) => {
    if(args.length < 1) return await message.reply("Not enough arguments")
    let command = args[0]
    if(args.length == 1) {
        if(this.links[command] == undefined)
            return await message.reply("That is not a link!")

        global.commands.delete(command)
        Logger.info(`${message.author.id} removed link ${command} (was ${this.links[command]})`)
        delete this.links[command]
        await this.updateDb()

        return await message.reply(`Deleted \`${command}\``)
    }
    let link = args.slice(1).join(" ")

    if(link.includes(" = ") || link.includes("\n"))
        return await message.reply("Illegal link.")

    if(global.commands.has(command) && this.links[command] == undefined)
        return await message.reply("This is another command OhNo")


    Logger.info(`${message.author.id} changed ${command} from ${this.links[command]} to ${link}`)
    this.links[command] = link

    await this.updateDb()

    if(!global.commands.has(command))
        global.commands.set(command, this)

    return await message.reply(`Updated \`${command}\` -> \`${link}\``)
}
exports.updateDb = async () => {
    let linkDB = await global.client.channels.get("621460804541087744").fetchMessage("621461360705798164")
    await linkDB.edit(`Links:
\`\`\`
${Object.entries(this.links).sort((a,b) => a[0].localeCompare(b[0])).map(a => a.join(" = ")).join("\n")}
\`\`\``)
}

exports.run = (message, args, command) => {
    return message.channel.send(this.links[command])
}
exports.help = false
exports.usage = false
exports.prefix = global.config.prefix
exports.category = "Links"
