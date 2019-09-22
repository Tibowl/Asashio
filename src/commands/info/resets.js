exports.run = (client, message) => {
    const now = new Date()
    const resets = client.timerManager.nextResetsTimestamp(now.getTime(), true)
    const longNames = {
        quest: "**Daily** quest resets",
        weeklyQuest: "**Weekly** quest resets",
        monthlyQuest: "**Monthly** quest resets",
        quarterlyQuest: "**Quarterly** quest resets",
        pvp: "**PvP** resets",
        rank: "**Ranking** cutoff",
        monthlyRank: "**Monthly ranking** cutoff",
        eoReset: "**Extra Operations** reset",
        monthlyExped: "**Monthly exped** resets"
    }

    return message.channel.send(Object.entries(longNames).map(reset => `${reset[1]} in **${this.timeLeft(resets[reset[0]] - now)}** @ ${new Date(resets[reset[0]]).toLocaleString("en-UK", {
        timeZone: "Asia/Tokyo",
        hour12: false,
        hourCycle: "h24",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    })} JST`).join("\n"))
}
exports.timeLeft = (diff) => {
    let result = [], originalTime = diff / 1000

    diff /= 1000 // convert to s
    if(diff >= 24*60*60) {
        result.push(Math.floor(diff / 24 / 60 / 60) + "d")
        diff -= Math.floor(diff / 24 / 60 / 60) * 24 * 60 * 60
    }

    if(diff >= 60*60) {
        result.push(Math.floor(diff / 60 / 60) + "h")
        diff -= Math.floor(diff / 60 / 60) * 60 * 60
    }

    if(diff >= 60 && originalTime < 24*60*60) {
        result.push(Math.floor(diff / 60) + "m")
        diff -= Math.floor(diff / 60) * 60
    }

    if(diff > 0  && originalTime < 60*60) {
        result.push(Math.floor(diff) + "s")
    }

    return result.join(", ")
}

exports.category = "Information"
exports.help = () => {
    return "Get times when stuff resets"
}
exports.usage = () => {
    return "resets"
}
exports.prefix = (client) => {
    return client.config.prefix
}
