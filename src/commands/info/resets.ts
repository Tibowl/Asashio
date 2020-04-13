import { Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import { TimeStamps } from "../../utils/Types"

export default class Resets extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Get times when stuff resets",
            usage: "resets",
            aliases: ["cutoff", "cutoffs", "reset", "timer", "timers"],
        })
    }

    async run(message: Message): Promise<Message | Message[]> {
        const { timerManager } = client

        const now = new Date().getTime()
        const resets = timerManager.nextResetsTimestamp(now, true)
        const longNames: {
            [key in keyof TimeStamps]: string
        } = {
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

        return message.channel.send(Object.entries(resets)
            .map(([key, time]) => `${longNames[key as keyof TimeStamps]} in **${this.timeLeft(time - now)}** @ ${new Date(time).toLocaleString("en-UK", {
                timeZone: "Asia/Tokyo",
                hour12: false,
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            })} JST`).join("\n"))
    }

    timeLeft(diff: number): string {
        let result = [], originalTime = diff / 1000

        diff /= 1000 // convert to s
        if (diff >= 24*60*60) {
            result.push(Math.floor(diff / 24 / 60 / 60) + "d")
            diff -= Math.floor(diff / 24 / 60 / 60) * 24 * 60 * 60
        }

        if (diff >= 60*60) {
            result.push(Math.floor(diff / 60 / 60) + "h")
            diff -= Math.floor(diff / 60 / 60) * 60 * 60
        }

        if (diff >= 60 && originalTime < 24*60*60) {
            result.push(Math.floor(diff / 60) + "m")
            diff -= Math.floor(diff / 60) * 60
        }

        if (diff > 0  && originalTime < 60*60) {
            result.push(Math.floor(diff) + "s")
        }

        return result.join(", ")
    }
}
