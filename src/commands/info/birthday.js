exports.run = async (message, args) => {
    const now = new Date()
    if(args && args.length > 0) {
        const monthDayMatch = args[0].match(/^(\d{1,2})[/\-~\\](\d{1,2})$/)
        if(args.length == 1 && monthDayMatch) {
            const d = monthDayMatch[1], m = monthDayMatch[2]

            if ((+m > 12 && +d > 12) || +m > 31 || +d > 31 || +m <= 0 || +d <= 0)
                return message.reply("Invalid date!")

            const target = new Date(now)
            target.setUTCHours(15, 0, 0, 0)

            let msg = ""

            if(+m <= 12 && +d <= 31) {
                target.setUTCFullYear(now.getUTCFullYear())
                target.setUTCMonth((+m)-1, (+d)-1)
                if(now.getTime() > target.getTime()) target.setUTCFullYear(now.getUTCFullYear() + 1)

                const ships = global.timerManager.getShipsOnBirthday(target)
                if (ships.length == 0)
                    msg += `There are no birthdays in ${this.getDateLine(target, now)}\n`
                else
                    msg += `${ships.map(s => `**${s}**`).join(", ").replace(/,([^,]*)$/, " and$1")} birthday is in ${this.getDateLine(target, now)}\n`
            }

            if(+d <= 12 && +m <= 31 && +d != +m) {
                target.setUTCFullYear(now.getUTCFullYear())
                target.setUTCMonth((+d)-1, (+m)-1)
                if(now.getTime() > target.getTime()) target.setUTCFullYear(now.getUTCFullYear() + 1)

                const ships = global.timerManager.getShipsOnBirthday(target)
                if (ships.length == 0)
                    msg += `There are no birthdays in ${this.getDateLine(target, now)}\n`
                else
                    msg += `${ships.map(s => `**${s}**`).join(", ").replace(/,([^,]*)$/, " and$1")} birthday is in ${this.getDateLine(target, now)}`
            }

            message.channel.send(msg.trim())
            return
        }
        const shipName = args.join(" ")
        const ship = global.data.getBirthdayByName(shipName)
        if(ship == undefined)
            return message.channel.send("Cannot find ship!")

        const next = new Date(now)
        next.setUTCHours(15, 0, 0, 0)
        if(now.getTime() > next.getTime()) next.shiftDate(1)

        next.shiftDate(1)
        while(!(ship.day == next.getUTCDate() && ship.month == next.getUTCMonth() + 1))
            next.shiftDate(1)
        next.shiftDate(-1)
        return message.channel.send(`**${ship.name}**'s birthday is in ${this.getDateLine(next, now)} (launched in ${ship.year})`)
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
exports.usage = "birthday [ship or dd/mm]"
exports.prefix = global.config.prefix
