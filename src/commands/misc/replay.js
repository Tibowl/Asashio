exports.run = (message, args) => {
    let baseLink = "https://kc3kai.github.io/kancolle-replay/battleplayer.html"

    let link = baseLink
    if(args && args.length > 0 && (args[0].startsWith("http") || args[0].startsWith("<http")))
        link = `${baseLink}?fromImg=${args[0].replace(/^</, "").replace(/>$/, "")}`
    else if (message.attachments && message.attachments.find(k => k && k.url))
        link = `${baseLink}?fromImg=${message.attachments.find(k => k && k.url).url}`
    return message.channel.send(`<${link}>`)
}

exports.category = "Links+"
exports.help = "Get link to replayer site. Will use either given URL or attached image."
exports.usage = "replay [url]"
exports.prefix = global.config.prefix
