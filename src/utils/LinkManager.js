const Logger = require("log4js").getLogger("LinkManager")
const fs = require("fs")
const child_process = require("child_process")

exports.links = {}
exports.loadLinks = async () => {
    this.links = require("../data/links.json")

    const printLines = []
    for(let link of Object.entries(this.links)) {
        global.commands.set(link[0], this)
        printLines.push(link.join(" -> "))
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
        await this.updateDb(message.author.id)

        return await message.reply(`Deleted \`${command}\``)
    }
    let link = args.slice(1).join(" ")

    if(global.commands.has(command) && this.links[command] == undefined)
        return await message.reply("This is another command OhNo")

    const oldValue = this.links[command]
    Logger.info(`${message.author.id} changed ${command} from ${oldValue} to ${link}`)
    this.links[command] = link

    await this.updateDb(message.author.id)

    if(!global.commands.has(command))
        global.commands.set(command, this)

    return await message.reply(`Updated \`${command}\` from \`${oldValue}\` -> \`${link}\``)
}

exports.getLinks = () => {
    return Object.keys(this.links).filter(k => !this.links[k].startsWith("@"))
}

exports.updateDb = async (id) => {
    fs.writeFileSync("./data/links.json", JSON.stringify(this.links, null, 4))
    child_process.execSync(`git add ./data/links.json && git commit -m "Link updated by ${id}" && git push`)
}

exports.run = (message, args, command) => {
    let toSend = this.links[command]

    let tries = 0
    while (toSend.startsWith("@") && tries++ < 100)
        toSend = this.links[toSend.substring(1)]

    return message.channel.send(toSend)
}
exports.help = false
exports.usage = false
exports.prefix = global.config.prefix
exports.category = "Links"
exports.commandName = "Links"
