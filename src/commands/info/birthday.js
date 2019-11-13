exports.run = async (message, args) => {
    const now = new Date()
    if(args && args.length > 0) {
        const shipName = args.join(" ")
        const ship = global.data.getBirthdayByName(shipName)
        if(ship == undefined)
            return message.channel.send("Cannot find ship!")

        const next = new Date(now)
        next.setUTCHours(15, 0, 0, 0)
        if(now.getTime() > next.getTime()) next.shiftDate(1)

        next.shiftDate(1)
        while(!(ship.Day == next.getUTCDate() && ship.Month == next.getUTCMonth() + 1))
            next.shiftDate(1)
        next.shiftDate(-1)
        return message.channel.send(`**${ship.Name}**'s birthday is in ${this.getDateLine(next, now)} (from ${ship.Year})`)
    }

    const birthdays = []
    let today = ""

    let lastDate = now.getTime() - 24*60*60*1000
    for(let i = 0; i < (message.channel.type == "dm" ? 15 : 5); i++) {
        const next = global.timerManager.getNextBirthdayDate(lastDate)

        if(next < now.getTime())
            today = (`**Today** it's ${global.timerManager.getShipsOnBirthday(next)
                .map(s => `**${s}**`)
                .join(", ")
                .replace(/,([^,]*)$/, " and$1")}'s birthday.\n`)
        else
            birthdays.push(`${global.timerManager.getShipsOnBirthday(next)
                .map(s => `**${s}**`)
                .join(", ")
                .replace(/,([^,]*)$/, " and$1")} in ${this.getDateLine(next, now)}`)
        lastDate = next.getTime() + 10000
    }

    return message.channel.send(`${today}Upcoming birthdays:\n` + birthdays.join("\n"))
}
exports.getDateLine = (next, now) => {
    const timeLeft = this.timeLeft(next.getTime() - now)
    return `**${timeLeft}** @ ${next.toLocaleString("en-UK", {
        timeZone: "Asia/Tokyo",
        hour12: false,
        hourCycle: "h24",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    })}`
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

    if(originalTime < 24*60*60)
        result.push(Math.ceil(diff / 60) + "m")

    return result.join(", ")
}

exports.category = "Information"
exports.help = "Get birthday of a ship or list upcomming ones"
exports.usage = "birthday"
exports.prefix = global.config.prefix
