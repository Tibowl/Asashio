const Logger = require("log4js").getLogger("ready")

let alreadyLoaded = false
module.exports = (client) => {
    Logger.info(`In ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`)

    if(alreadyLoaded) return
    alreadyLoaded = true

    client.user.setStatus("online")

    global.linkManager.loadLinks()
    global.timerManager.init()
    global.tweetManager.init()
    global.data.reloadShipData()
    global.maintManager.init()
}
