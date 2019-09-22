const fetch = require("node-fetch")

exports.run = async (client, message, args) => {
    if(!args || args.length < 1) return message.channel.send("<http://kancolle.fandom.com/>")
    const result = await (await fetch(`https://kancolle.fandom.com/api/v1/Search/List?query=${encodeURIComponent(args.join(" "))}&limit=5&namespaces=0,14`)).json()
    if(!result.items || result.items.length == 0)
        return message.channel.send("No matches found")
    return message.channel.send(`Possible matches:\n${result.items.map(i => `<${i.url}>`).join("\n")}`)
}

exports.category = "Links+"
exports.help = () => {
    return "Search a term on wikia"
}
exports.usage = () => {
    return "wikia [search term]"
}
exports.prefix = (client) => {
    return client.config.prefix
}
