const TM = require("../src/utils/TimerManager")

exports.test = () => {
    let prevTimeStampsFull = {}
    for(let i = Date.now(); i < Date.now() + 365*24*60*60*1001; i+= 36000) {
        const now = new Date(i)
        const nextTimeStampsFull = TM.nextResetsTimestamp(now, true)

        for (const key of Object.keys(prevTimeStampsFull))
            if(prevTimeStampsFull[key] > nextTimeStampsFull[key])
                return [console.log(key, now.toISOString(), new Date(prevTimeStampsFull[key]).toISOString(), new Date(nextTimeStampsFull[key]).toISOString())]
        prevTimeStampsFull = nextTimeStampsFull

        const nextTimeStamp = Math.min(...Object.values(nextTimeStampsFull))
        if(now.getTime() > nextTimeStamp)
            return [now.toISOString(), nextTimeStampsFull]
    }
    return false
}

if(this.test())
    process.exit(-99)
