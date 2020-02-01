const Utils = require("./Utils.js")
const Logger = require("log4js").getLogger("MaintManager")
const htmlToText = require("html-to-text")
const fetch = require("node-fetch")

exports.init = () => {
    global.data.store.maintInfo = global.data.store.maintInfo || {}

    this.check()
    setInterval(() => {
        this.check()
    }, 60 * 1000)
}

exports.getTimes = () => {
    const {maintInfo} = global.data.store
    if(!maintInfo || !maintInfo.lastLine) return []

    const line = maintInfo.lastLine
    const times = line.match(/【.*?】/g)
    if(times.length == 3)
        return times.slice(1).map(k => k.replace(/[【|】]/g, ""))

    return times
}
exports.check = async () => {
    const {maintInfo} = global.data.store
    const html = await (await fetch("http://203.104.209.7/kcscontents/news/post.html")).text()
    const line = htmlToText.fromString(html)
    if(maintInfo.lastLine == line) return

    Logger.info(line)

    maintInfo.lastLine = line
    global.data.saveStore()

    Logger.info(this.getTimes())
    Utils.sendToChannels(global.config.maintChannels, `Maint info: ${this.getTimes().join(" ~ ")}\nMessage: ${line}`)
}
