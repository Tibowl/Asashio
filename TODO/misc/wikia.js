const fetch = require("node-fetch")

exports.run = async (message, args) => {
    if(!args || args.length < 1) return message.channel.send("<http://kancolle.fandom.com/>")
    const result = await (await fetch(`https://kancolle.fandom.com/api/v1/Search/List?query=${encodeURIComponent(args.join(" "))}&limit=5&namespaces=0,14`)).json()
    if(!result.items || result.items.length == 0)
        return message.channel.send("No matches found")
    return message.channel.send(`Possible matches:\n${result.items.map(i => `<${i.url}>`).join("\n")}`)
}

exports.category = "Links+"
exports.help = "Search a term on wikia"
exports.usage = "wikia [search term]"
exports.prefix = global.config.prefix
exports.aliases = ["wiki"]
