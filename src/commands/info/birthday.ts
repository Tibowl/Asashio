import { Message } from "discord.js"

import Command from "../../utils/Command"
import { shiftDate } from "../../utils/Utils"
import client from "../../main"

export default class Birthday extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Get birthday of a ship or list upcomming ones",
            usage: "birthday [ship or dd/mm]",
            aliases: ["birthdays"]
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        const now = new Date()
        const { timerManager, data } = client

        if (args && args.length > 0) {
            const monthDayMatch = args[0].match(/^(\d{1,2})[/\-~\\](\d{1,2})$/)
            if (args.length == 1 && monthDayMatch) {
                const d = monthDayMatch[1], m = monthDayMatch[2]

                if ((+m > 12 && +d > 12) || +m > 31 || +d > 31 || +m <= 0 || +d <= 0)
                    return message.reply("Invalid date!")

                const target = new Date(now)
                target.setUTCHours(15, 0, 0, 0)

                let msg = ""

                if (+m <= 12 && +d <= 31) {
                    target.setUTCFullYear(now.getUTCFullYear())
                    target.setUTCMonth((+m)-1, (+d)-1)
                    if (now.getTime() > target.getTime()) target.setUTCFullYear(now.getUTCFullYear() + 1)

                    const ships = timerManager.getShipsOnBirthday(target)
                    if (ships.length == 0)
                        msg += `There are no birthdays in ${this.getDateLine(target, now)}\n`
                    else
                        msg += `${ships.map(s => `**${s}**`).join(", ").replace(/,([^,]*)$/, " and$1")} birthday is in ${this.getDateLine(target, now)}\n`
                }

                if (+d <= 12 && +m <= 31 && +d != +m) {
                    target.setUTCFullYear(now.getUTCFullYear())
                    target.setUTCMonth((+d)-1, (+m)-1)
                    if (now.getTime() > target.getTime()) target.setUTCFullYear(now.getUTCFullYear() + 1)

                    const ships = timerManager.getShipsOnBirthday(target)
                    if (ships.length == 0)
                        msg += `There are no birthdays in ${this.getDateLine(target, now)}\n`
                    else
                        msg += `${ships.map(s => `**${s}**`).join(", ").replace(/,([^,]*)$/, " and$1")} birthday is in ${this.getDateLine(target, now)}`
                }

                return message.channel.send(msg.trim())
            }
            const shipName = args.join(" ")
            const ship = data.getBirthdayByName(shipName)
            if (ship == undefined)
                return message.channel.send("Cannot find ship!")

            const next = new Date(now)
            next.setUTCHours(15, 0, 0, 0)
            if (now.getTime() > next.getTime()) shiftDate(next, 1)

            shiftDate(next, 1)
            while (!(ship.day == next.getUTCDate() && ship.month == next.getUTCMonth() + 1))
                shiftDate(next, 1)
            shiftDate(next, -1)
            return message.channel.send(`**${ship.name}**'s birthday is in ${this.getDateLine(next, now)} (launched in ${ship.year})`)
        }

        const birthdays = []
        let today = ""

        let lastDate = now.getTime() - 24*60*60*1000
        for (let i = 0; i < (message.channel.type == "dm" ? 15 : 5); i++) {
            const next = timerManager.getNextBirthdayDate(lastDate)

            if (next.getTime() < now.getTime())
                today = (`**Today** it's ${timerManager.getShipsOnBirthday(next)
                    .map(s => `**${s}**`)
                    .join(", ")
                    .replace(/,([^,]*)$/, " and$1")}'s birthday.\n`)
            else
                birthdays.push(`${timerManager.getShipsOnBirthday(next)
                    .map(s => `**${s}**`)
                    .join(", ")
                    .replace(/,([^,]*)$/, " and$1")} in ${this.getDateLine(next, now)}`)
            lastDate = next.getTime() + 10000
        }

        return message.channel.send(`${today}Upcoming birthdays:\n` + birthdays.join("\n"))
    }
    getDateLine(next: Date, now: Date): string {
        const timeLeft = this.timeLeft(next.getTime() - now.getTime())
        return `**${timeLeft}** @ ${next.toLocaleString("en-UK", {
            timeZone: "Asia/Tokyo",
            hour12: false,
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        })}`
    }

    timeLeft(diff: number): string {
        const result = [], originalTime = diff / 1000

        diff /= 1000 // convert to s
        if (diff >= 24*60*60) {
            result.push(Math.floor(diff / 24 / 60 / 60) + "d")
            diff -= Math.floor(diff / 24 / 60 / 60) * 24 * 60 * 60
        }

        if (diff >= 60*60) {
            result.push(Math.floor(diff / 60 / 60) + "h")
            diff -= Math.floor(diff / 60 / 60) * 60 * 60
        }

        if (originalTime < 24*60*60)
            result.push(Math.ceil(diff / 60) + "m")

        return result.join(", ")
    }
}
