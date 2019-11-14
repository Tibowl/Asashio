const Logger = require("log4js").getLogger("1hdraw")

let cachedShips = {
    ships: [],
    date: 0
}

exports.setTweet = (tweet) => {
    let text = tweet.text

    if(tweet.extended_tweet)
        text = tweet.extended_tweet.full_text

    Logger.info(`Received new tweet: ${text}`)
    let match = text.match(/お題は(.*)(になります|となります)/)
    if(match) {
        const ships = match[1].trim().split(" ")

        cachedShips = {
            ships,
            date: new Date(tweet.created_at).toLocaleString("en-UK", {
                timeZone: "Asia/Tokyo",
                timeZoneName: "short",
                hour12: false,
                hourCycle: "h24",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
        }
        Logger.info(`Cached data set to: ${cachedShips.ships.join(", ")} at ${cachedShips.date}`)
    }
}
exports.run = (message) => {
    if(!cachedShips.date) {
        return message.channel.send("No 1h draw loaded :(")
    }

    return message.channel.send(`Today's 1h draw ships: ${cachedShips.ships
        .map((name) => {
            const candidate = global.data.getShipByName(name)
            if(candidate && (name == candidate.japanese_name || name == candidate.reading))
                return candidate.name
            return name
        })
        .map(s => `**${s}**`)
        .join(", ")
        .replace(/,([^,]*)$/, " and$1")}

Based on @kancolle_1draw tweet on: ${cachedShips.date}`)
}

exports.category = "Tools"
exports.help = "Check today's 1h draw ships"
exports.usage = "1hdraw"
exports.prefix = global.config.prefix
exports.aliases = ["onehourdraw", "1hd", "1hourdraw"]
