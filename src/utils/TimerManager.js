const Utils = require("./Utils.js")
const Logger = require("log4js").getLogger("TimerManager")

exports.client = undefined
exports.activityTimer = undefined

exports.init = (client) => {
    this.client = client

    this.scheduleNextMessages()

    const updateActivity = () => {
        const now = new Date()
        client.user.setActivity(client.config.activity.replace("%t", now.toLocaleString("en-UK", {
            timeZone: "Asia/Tokyo",
            hour12: false,
            hourCycle: "h24",
            hour: "2-digit",
            minute: "2-digit"
        })))

        const nextMinute = new Date()
        nextMinute.setUTCSeconds(0, 0)
        nextMinute.shiftMinute(1)

        let delay = nextMinute.getTime() - now.getTime()
        if(delay < 15000)
            delay += 60000
        this.activityTimer = setTimeout(updateActivity, delay + 500)
    }

    if(this.activityTimer == undefined)
        updateActivity()
}

exports.scheduleNextMessages = (now = Date.now() + 60000) => {
    const nextTimeStamps = this.nextResetsTimestamp(now)
    const nextTimeStampsFull = this.nextResetsTimestamp(now, true)
    const nextTimeStamp = Math.min(...Object.values(nextTimeStamps))

    /*console.info(`Next timestamps:
${Object.entries(nextTimeStamps).map(entry => `${entry[0]} @ ${new Date(entry[1]).toISOString()}`).join("\n")}`)*/

    const type = Object.keys(nextTimeStamps).find(key => nextTimeStamps[key] == nextTimeStamp)

    Logger.debug(`Next time: ${type} @ ${new Date(nextTimeStamp).toISOString()}`)

    let message = "?"
    if(type == "quest") {
        message = "Daily"
        if(nextTimeStamp == nextTimeStampsFull.weeklyQuest)
            message += "/Weekly"
        if(nextTimeStamp == nextTimeStampsFull.monthlyQuest)
            message += "/Monthly"
        if(nextTimeStamp == nextTimeStampsFull.quarterlyQuest)
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
    if(type !== "monthlyExped" && type !== "rank") {
        for (let k of [60, 30, 15, 5]) {
            let diff = nextTimeStamp - Date.now() - k * 60000
            if (diff > 0 && !(k == 60 && type == "pvp"))
                setTimeout(() => this.update(`${message} in ${k} minutes.`), diff + this.client.config.timerOffsetms)
        }
    }

    setTimeout(() => {
        this.update(`${message}.`)
        this.scheduleNextMessages()
    }, nextTimeStamp - Date.now() + this.client.config.timerOffsetms)
}

exports.getNextBirthdayDate = (now = Date.now()) => {
    const midnight = new Date(now)
    midnight.setUTCHours(15, 0, 0, 0)
    if(midnight.getTime() < now) midnight.shiftDate(1)

    midnight.shiftDate(1)
    for(let i = 0; i < 370; i++) {
        if(this.client.data.birthdays
            .some(s => s.Day == midnight.getUTCDate() && s.Month == midnight.getUTCMonth() + 1)) {
            midnight.shiftDate(-1)
            return midnight
        }
        midnight.shiftDate(1)
    }
    return midnight
}
exports.getShipsOnBirthday = (date) => {
    const dateJapan = new Date(date)
    dateJapan.shiftDate(1)
    return this.client.data.birthdays
        .filter(s => s.Day == dateJapan.getUTCDate() && s.Month == dateJapan.getUTCMonth() + 1)
        .map(s => s.Name)
        .sort((a,b) => a-b)
}
exports.nextBirthday = undefined
exports.scheduleNextBirthday = (now = Date.now()) => {
    if(exports.nextBirthday) clearTimeout(this.nextBirthday)

    const midnight = this.getNextBirthdayDate(now)
    const shipList = this.getShipsOnBirthday(midnight)

    Logger.info("Announcing birthday of " + shipList.join(", ").replace(/,([^,]*)$/, " and$1") + " on " + midnight.toISOString())
    this.nextBirthday = setTimeout(() => {
        this.scheduleNextBirthday(Date.now() + 60 * 60000)

        const newMessage = `Happy Birthday ${shipList.map(s => `**${s}**`).join(", ").replace(/,([^,]*)$/, " and$1")}!`
        Utils.sendToChannels(this.client, this.client.config.birthdayChannels, newMessage)
    }, midnight.getTime() - Date.now() + this.client.config.timerOffsetms)
}
// https://github.com/KC3Kai/KC3Kai/blob/master/src/library/managers/CalculatorManager.js#L443
exports.nextResetsTimestamp = (now = Date.now(), extraQuest = false) => {
    const timeStamps = {}

    // Next Quest reset time (UTC 2000 / JST 0500)
    const utc8pm = new Date(now),
          utc6am = new Date(now), utc6pm = new Date(now)
    utc8pm.setUTCHours(20, 0, 0, 0)
    if(utc8pm.getTime() < now) utc8pm.shiftDate(1)
    timeStamps.quest = utc8pm.getTime()

    if(extraQuest) {
        // Weekly
        const weeklyReset = new Date(utc8pm)
        while(weeklyReset.getUTCDay() !== 0)
            weeklyReset.shiftDate(1)
        timeStamps.weeklyQuest = weeklyReset.getTime()

        // Monthly
        const monthlyReset = new Date(utc8pm)
        while(monthlyReset.getUTCDate() !== 1)
            monthlyReset.shiftDate(1)
        monthlyReset.shiftDate(-1)
        timeStamps.monthlyQuest = monthlyReset.getTime()

        // Quarterly
        const quarterlyReset = new Date(monthlyReset)
        quarterlyReset.shiftDate(1)
        while(quarterlyReset.getUTCMonth() % 3 !== 2)
            quarterlyReset.shiftDate(1)
        quarterlyReset.shiftDate(-1)
        timeStamps.quarterlyQuest = quarterlyReset.getTime()
    }

    // Next PvP reset time (UTC 1800,0600 / JST 0300,1500)
    utc6am.setUTCHours(6, 0, 0, 0)
    utc6pm.setUTCHours(18, 0, 0, 0)
    if(utc6am.getTime() < now) utc6am.shiftDate(1)
    if(utc6pm.getTime() < now) utc6pm.shiftDate(1)
    const nextPvPstamp = Math.min(utc6am.getTime(), utc6pm.getTime())
    timeStamps.pvp = nextPvPstamp

    // Next Rank points cut-off time (-1 hour from PvP reset time)
    //   extra cut-off monthly on JST 2200, the last day of every month,
    //   but points from quest Z cannon not counted after JST 1400.
    const nextPtCutoff = new Date(nextPvPstamp)
    nextPtCutoff.shiftHour(-1)
    if(nextPtCutoff.getTime() < now) nextPtCutoff.shiftHour(13)
    timeStamps.rank = nextPtCutoff.getTime()

    const nextMonthlyPointReset = new Date(nextPtCutoff)
    nextMonthlyPointReset.setUTCHours(13, 0, 0, 0)
    while(nextMonthlyPointReset.getUTCDate() !== 1)
        nextMonthlyPointReset.shiftDate(1)
    nextMonthlyPointReset.shiftDate(-1)
    if(nextMonthlyPointReset.getTime() < now){
        nextMonthlyPointReset.shiftDate(20)
        while(nextMonthlyPointReset.getUTCDate() !== 1)
            nextMonthlyPointReset.shiftDate(1)
        nextMonthlyPointReset.shiftDate(-1)
    }
    timeStamps.monthlyRank = nextMonthlyPointReset.getTime()

    const nextEOReset = new Date(nextPtCutoff)
    nextEOReset.setUTCHours(15, 0, 0, 0)
    while(nextEOReset.getUTCDate() !== 1)
        nextEOReset.shiftDate(1)
    nextEOReset.shiftDate(-1)
    if(nextEOReset.getTime() < now) {
        nextEOReset.shiftDate(20)
        while(nextEOReset.getUTCDate() !== 1)
            nextEOReset.shiftDate(1)
        nextEOReset.shiftDate(-1)
    }

    timeStamps.eoReset = nextEOReset.getTime()

    // Next monthly expedition reset time (15th JST 1200)
    const utc3am15th = new Date(now)
    utc3am15th.setUTCHours(3, 0, 0, 0)
    utc3am15th.setUTCDate(15)
    if(utc3am15th.getTime() < now) utc3am15th.shiftMonth(1)
    timeStamps.monthlyExped = utc3am15th.getTime()

    return timeStamps
}

exports.toDeleteMessages = []

exports.update = async (newMessage) => {
    let deletion = this.toDeleteMessages.map(td => {try {
        return td.delete()
    } catch (error) {
        Logger.info(error)
    }}).filter(k => k)

    this.toDeleteMessages = []
    if(!newMessage) return Promise.all(deletion)

    this.toDeleteMessages = await Utils.sendToChannels(this.client, this.client.config.timerChannels, newMessage)
    Logger.info(`Send ${newMessage}`)

    return Promise.all(deletion)
}

Date.prototype.shiftDate = function(time) {
    this.setUTCDate(this.getUTCDate() + time)
}
Date.prototype.shiftMonth = function(time) {
    this.setUTCMonth(this.getUTCMonth() + time)
}
Date.prototype.shiftHour = function(time) {
    this.setUTCHours(this.getUTCHours() + time)
}
Date.prototype.shiftMinute = function(time) {
    this.setUTCMinutes(this.getUTCMinutes() + time)
}
