const fetch = require("node-fetch")

exports.run = async (client, message, args) => {
    if(!args || args.length != 1) return message.reply(`Usage: \`${this.usage()}\``)


    let map = args[0].toUpperCase()
    if(map.startsWith("E-")) map = map.replace("E", client.data.eventID())
    else if(map.startsWith("E")) map = map.replace("E", client.data.eventID() + "-")
    if(map.split("-").length != 2) return message.author.send("Invalid map!")

    let table = (await (await fetch(`http://kc.piro.moe/api/routing/droptable/${map}`)).text())
        .replace(/^\| /gm, "")
        .replace(/\|$/gm, "")
        .replace(/\| ([A-Z0-9]) +/g, "|  $1  ")
        .replace(/\| ([A-Z0-9]{2}) +/g, "| $1  ")
        .replace(/Casual/g, "C")
        .replace(/Normal/g, "N")
        .replace(/Easy {2}/g, "E")
        .replace(/Hard {2}/g, "H")
        .replace(/\| {10}/g, "|     ")

    const rows = table.split("\n")
    rows[1] = undefined
    table = rows.filter(k => k).map(k => k.trim()).join("\n")

    if(table.length > 1800)
        return message.author.send("Table too long!")
    else if(table.length < 5)
        return message.author.send("No notable drops found!")

    return message.author.send(`Drop table of ${map}\`\`\`\n${table}\n\`\`\`\nData provided by TsunDB.`)
}

exports.category = "Tools"
exports.help = () => {
    return "Gets drop table of a map. Replies only in DM. Uses <http://kc.piro.moe> API"
}
exports.usage = () => {
    return "droptable <map>"
}
exports.prefix = (client) => {
    return client.config.prefix
}
