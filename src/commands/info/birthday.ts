import { CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import { sendMessage, shiftDate } from "../../utils/Utils"
import client from "../../main"
import { CommandResponse, CommandSource, SendMessage } from "../../utils/Types"
import TimerManager from "../../utils/TimerManager"

export default class Birthday extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Get birthday of a ship or list upcomming ones",
            usage: "birthday [ship or dd/mm]",
            aliases: ["birthdays"],
            options: [{
                name: "name",
                description: "Name of ship or dd/mm date",
                type:"STRING",
                required: false,
            }]
        })
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return await this.run(source, source.options.getString("name") ?? "")
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        return await this.run(source, args.join(" "))
    }

    async run(source: CommandSource, arg: string): Promise<CommandResponse> {
        const now = new Date()
        const { timerManager, data } = client

        if (arg.length > 0) {
            const monthDayMatch = arg.match(/^(\d{1,2})[/\-~\\](\d{1,2})$/)
            if (monthDayMatch) {
                const d = +monthDayMatch[1], m = +monthDayMatch[2]

                if ((m > 12 && d > 12) || m > 31 || d > 31 || m <= 0 || d <= 0)
                    return sendMessage(source, "Invalid date!")


                let msg = ""

                if (m <= 12 && d <= 31)
                    msg += this.getBirthdayLine(now, m, d, timerManager)

                if (d <= 12 && m <= 31 && d != m)
                    msg += this.getBirthdayLine(now, d, m, timerManager)


                return sendMessage(source, msg.trim())
            }
            const ship = data.getBirthdayByName(arg)
            if (ship == undefined)
                return sendMessage(source, "Cannot find ship!")

            const next = new Date(now)
            next.setUTCHours(15, 0, 0, 0)
            if (now.getTime() > next.getTime()) shiftDate(next, 1)

            shiftDate(next, 1)
            while (!(ship.day == next.getUTCDate() && ship.month == next.getUTCMonth() + 1))
                shiftDate(next, 1)
            shiftDate(next, -1)
            return sendMessage(source, `**${ship.name}**'s birthday is in ${this.getDateLine(next, now)} (launched in ${ship.year})`)
        }

        const birthdays = []
        let today = ""

        let lastDate = now.getTime() - 24*60*60*1000
        for (let i = 0; i < (source.channel?.type == "DM" ? 15 : 5); i++) {
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

        return sendMessage(source, `${today}Upcoming birthdays:\n` + birthdays.join("\n"))
    }

    private getBirthdayLine(now: Date, m: number, d: number, timerManager: TimerManager) {
        const target = new Date(now)
        target.setUTCHours(15, 0, 0, 0)
        target.setUTCFullYear(now.getUTCFullYear())
        target.setUTCMonth((m) - 1, (d) - 1)
        if (now.getTime() > target.getTime())
            target.setUTCFullYear(now.getUTCFullYear() + 1)

        const ships = timerManager.getShipsOnBirthday(target)
        if (ships.length == 0)
            return `There are no birthdays in ${this.getDateLine(target, now)}\n`
        else
            return `${ships.map(s => `**${s}**`).join(", ").replace(/,([^,]*)$/, " and$1")} birthday is in ${this.getDateLine(target, now)}\n`
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
