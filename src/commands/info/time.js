exports.run = (client, message) => {
    const now = new Date()
    const timeZones = [
        "Asia/Tokyo",
        "Europe/Brussels",
        "GMT",
        "America/New_York",
        "America/Los_Angeles"
    ]

    return message.channel.send(timeZones.map(timeZone => now.toLocaleString("en-UK", {
        timeZone,
        timeZoneName: "long",
        hour12: false,
        hourCycle: "h24",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    })).join("\n"))
}

exports.category = "Information"
exports.help = () => {
    return "Get current time in a couple time zones"
}
exports.usage = () => {
    return "time"
}
exports.prefix = (client) => {
    return client.config.prefix
}
