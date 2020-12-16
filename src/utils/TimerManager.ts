import { shiftMinute, shiftDate, shiftHour, shiftMonth, changeName } from "./Utils"
import client from "../main"
import config from "../data/config.json"
import log4js from "log4js"
import { Guild, Message } from "discord.js"
import { TimeStamps } from "./Types"

const Logger = log4js.getLogger("TimerManager")

export default class TimerManager {
    activityTimer: NodeJS.Timeout | undefined = undefined
    lastName = "?"

    init(): void {
        this.scheduleNextMessages()

        const updateActivity = (): void => {
            const now = new Date()
            const nextMinute = new Date()
            nextMinute.setUTCSeconds(0, 0)
            shiftMinute(nextMinute, 1)

            let delay = nextMinute.getTime() - now.getTime()
            if (delay < 15000)
                delay += 60000

            if (client.user == undefined)
                delay = 1000
            this.activityTimer = setTimeout(updateActivity, delay + 500)

            if (client.user == undefined)
                return

            client.user.setActivity(config.activity.replace("%t", now.toLocaleString("en-UK", {
                timeZone: "Asia/Tokyo",
                hour12: false,
                hour: "2-digit",
                minute: "2-digit"
            })), {
                type: "LISTENING"
            })

            const time = now.getTime() - 24 * 60 * 60 * 1000
            const midnight = new Date(time)
            midnight.setUTCHours(15, 0, 0, 0)
            if (midnight.getTime() < time) shiftDate(midnight, 1)

            const birthdays = this.getShipsOnBirthday(midnight)
            if (birthdays.includes("Asashio") && this.lastName != "Asashio 🎉") {
                this.lastName = "Asashio 🎉"
                changeName(
                    [...client.guilds.cache.values()]
                        .sort((a, b) => b.memberCount - a.memberCount)
                        .slice(0, 100),
                    (k: Guild) => k != null && k.me != null && k.memberCount > 5 && k.me.permissions.has("CHANGE_NICKNAME") && (k.me.nickname == null || k.me.nickname == "Asashio"),
                    "Asashio 🎉"
                )
            } else if (!birthdays.includes("Asashio") && this.lastName != "Asashio") {
                this.lastName = "Asashio"
                changeName(
                    [...client.guilds.cache.values()]
                        .sort((b, a) => a.memberCount - b.memberCount),
                    (k: Guild) => k != null && k.me != null && k.me.permissions.has("CHANGE_NICKNAME") && k.me.nickname == "Asashio 🎉",
                    "Asashio"
                )
            }
        }

        if (this.activityTimer == undefined)
            updateActivity()
    }

    scheduleNextMessages(now = Date.now() + 60000): void {
        const nextTimeStamps = this.nextResetsTimestamp(now)
        const nextTimeStampsFull = this.nextResetsTimestamp(now, true)
        const nextEntry = Object.entries(nextTimeStamps).sort((a,b) => a[1] - b[1])[0]

        const type = nextEntry[0]
        const nextTimeStamp = nextEntry[1]

        /*console.info(`Next timestamps:
    ${Object.entries(nextTimeStamps).map(entry => `${entry[0]} @ ${new Date(entry[1]).toISOString()}`).join("\n")}`)*/

        Logger.debug(`Next time: ${type} @ ${new Date(nextTimeStamp).toISOString()}`)

        let message = "?"
        if (type == "quest") {
            message = "Daily"
            if (nextTimeStamp == nextTimeStampsFull.weeklyQuest)
                message += "/Weekly"
            if (nextTimeStamp == nextTimeStampsFull.monthlyQuest)
                message += "/Monthly"
            if (nextTimeStamp == nextTimeStampsFull.quarterlyQuest)
                message += "/Quarterly"
            message += " quest reset"
        } else if (type == "pvp")
            message = "PvP reset"
        else if (type == "rank")
            message = "Ranking cutoff"
        else if (type == "monthlyRank")
            message = "Monthly ranking cutoff"
        else if (type == "eoReset")
            message = "EO reset"
        else if (type == "monthlyExped")
            message = "Monthly expeditions reset"

        // console.info(nextTimeStamp - Date.now() - 30 * 60000)
        if (type !== "monthlyExped" && type !== "rank") {
            for (let k of [60, 30, 15, 5]) {
                let diff = nextTimeStamp - Date.now() - k * 60000
                if (diff > 0 && !(k == 60 && type == "pvp"))
                    setTimeout(() => this.update(`${message} in ${k} minutes.`), diff + config.timerOffsetms)
            }
        }

        setTimeout(() => {
            this.update(`${message}.`)
            this.scheduleNextMessages()
        }, nextTimeStamp - Date.now() + config.timerOffsetms)
    }

    getNextBirthdayDate(now = Date.now()): Date {
        const midnight = new Date(now)
        midnight.setUTCHours(15, 0, 0, 0)
        if (midnight.getTime() < now) shiftDate(midnight, 1)

        shiftDate(midnight, 1)
        for (let i = 0; i < 370; i++) {
            if (client.data.birthdays
                .some(s => s.day == midnight.getUTCDate() && s.month == midnight.getUTCMonth() + 1)) {
                shiftDate(midnight, -1)
                return midnight
            }
            shiftDate(midnight, 1)
        }
        return midnight
    }

    getShipsOnBirthday(date: number | Date): string[] {
        const dateJapan = new Date(date)
        shiftDate(dateJapan, 1)
        return client.data.birthdays
            .filter(s => s.day == dateJapan.getUTCDate() && s.month == dateJapan.getUTCMonth() + 1)
            .map(s => s.name)
            .sort((a, b) => a.localeCompare(b))
    }

    nextBirthday: undefined | NodeJS.Timeout = undefined
    scheduleNextBirthday(now = Date.now()): void {
        if (this.nextBirthday) clearTimeout(this.nextBirthday)

        const midnight = this.getNextBirthdayDate(now)
        const shipList = this.getShipsOnBirthday(midnight)

        Logger.info("Announcing birthday of " + shipList.join(", ").replace(/,([^,]*)$/, " and$1") + " on " + midnight.toISOString())
        this.nextBirthday = setTimeout(() => {
            this.scheduleNextBirthday(Date.now() + 60 * 60000)

            const newMessage = `Happy Birthday ${shipList.map(s => `**${s}**`).join(", ").replace(/,([^,]*)$/, " and$1")}!`
            client.followManager.send("birthday", newMessage, undefined, shipList)
        }, midnight.getTime() - Date.now() + config.timerOffsetms)
    }
    // https://github.com/KC3Kai/KC3Kai/blob/master/src/library/managers/CalculatorManager.js#L443
    nextResetsTimestamp(now = Date.now(), extraQuest = false): TimeStamps {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const timeStamps: any = {}

        // Next Quest reset time (UTC 2000 / JST 0500)
        const utc8pm = new Date(now),
              utc6am = new Date(now), utc6pm = new Date(now)
        utc8pm.setUTCHours(20, 0, 0, 0)
        if (utc8pm.getTime() < now) shiftDate(utc8pm, 1)
        timeStamps.quest = utc8pm.getTime()

        if (extraQuest) {
            // Weekly
            const weeklyReset = new Date(utc8pm)
            while (weeklyReset.getUTCDay() !== 0)
                shiftDate(weeklyReset, 1)
            timeStamps.weeklyQuest = weeklyReset.getTime()

            // Monthly
            const monthlyReset = new Date(utc8pm)
            shiftDate(monthlyReset, 1)
            while (monthlyReset.getUTCDate() !== 1)
                shiftDate(monthlyReset, 1)
            shiftDate(monthlyReset, -1)
            timeStamps.monthlyQuest = monthlyReset.getTime()

            // Quarterly
            const quarterlyReset = new Date(monthlyReset)
            shiftDate(quarterlyReset, 1)
            while (quarterlyReset.getUTCMonth() % 3 !== 2)
                shiftDate(quarterlyReset, 1)
            shiftDate(quarterlyReset, -1)
            timeStamps.quarterlyQuest = quarterlyReset.getTime()
        }

        // Next PvP reset time (UTC 1800,0600 / JST 0300,1500)
        utc6am.setUTCHours(6, 0, 0, 0)
        utc6pm.setUTCHours(18, 0, 0, 0)
        if (utc6am.getTime() < now) shiftDate(utc6am, 1)
        if (utc6pm.getTime() < now) shiftDate(utc6pm, 1)
        const nextPvPstamp = Math.min(utc6am.getTime(), utc6pm.getTime())
        timeStamps.pvp = nextPvPstamp

        // Next Rank points cut-off time (-1 hour from PvP reset time)
        //   extra cut-off monthly on JST 2200, the last day of every month,
        //   but points from quest Z cannon not counted after JST 1400.
        const nextPtCutoff = new Date(nextPvPstamp)
        shiftHour(nextPtCutoff, -1)
        if (nextPtCutoff.getTime() < now) shiftHour(nextPtCutoff, 12)
        timeStamps.rank = nextPtCutoff.getTime()

        const nextMonthlyPointReset = new Date(nextPtCutoff)
        nextMonthlyPointReset.setUTCHours(13, 0, 0, 0)
        if (nextMonthlyPointReset.getTime() < now) shiftDate(nextMonthlyPointReset, 1)
        shiftDate(nextMonthlyPointReset, 1)
        while (nextMonthlyPointReset.getUTCDate() !== 1)
            shiftDate(nextMonthlyPointReset, 1)
        shiftDate(nextMonthlyPointReset, -1)
        timeStamps.monthlyRank = nextMonthlyPointReset.getTime()

        const nextEOReset = new Date(nextPtCutoff)
        nextEOReset.setUTCHours(15, 0, 0, 0)
        if (nextEOReset.getTime() < now) shiftDate(nextEOReset, 1)
        shiftDate(nextEOReset, 1)
        while (nextEOReset.getUTCDate() !== 1)
            shiftDate(nextEOReset, 1)
        shiftDate(nextEOReset, -1)
        timeStamps.eoReset = nextEOReset.getTime()

        // Next monthly expedition reset time (15th JST 1200)
        const utc3am15th = new Date(now)
        utc3am15th.setUTCHours(3, 0, 0, 0)
        utc3am15th.setUTCDate(15)
        if (utc3am15th.getTime() < now) shiftMonth(utc3am15th, 1)
        timeStamps.monthlyExped = utc3am15th.getTime()

        return timeStamps
    }

    toDeleteMessages: (Message | Message[])[] = []

    async update(newMessage?: string): Promise<unknown[]> {
        let deletion = this.toDeleteMessages.map(td => {
            try {
                if (td instanceof Message)
                    return td.delete()
            } catch (error) {
                Logger.info(error)
            }
        }).filter(k => k)

        this.toDeleteMessages = []
        if (!newMessage) return Promise.all(deletion)

        this.toDeleteMessages = await client.followManager.send("timers", newMessage)
        Logger.info(`Send ${newMessage}`)

        return Promise.all(deletion)
    }
}
