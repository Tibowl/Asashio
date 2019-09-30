const TM = require("../src/utils/TimerManager")

exports.test = () => {
    for(let i = Date.now(); i < Date.now() + 365*24*60*60*1001; i+= 36000) {
        const now = new Date(i)
        const nextTimeStampsFull = TM.nextResetsTimestamp(now, true)

        const nextTimeStamp = Math.min(...Object.values(nextTimeStampsFull))
        if(now.getTime() > nextTimeStamp)
            return [now.toISOString(), nextTimeStampsFull]
    }
    return false
}

if(this.test())
    process.exit(-99)
