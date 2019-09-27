const Logger = require("log4js").getLogger("ready")

module.exports = (client) => {
    Logger.info(`In ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`)
    client.linkManager.loadLinks(client)
    client.timerManager.init(client)
    client.tweetManager.init(client)
    client.data.reloadShipData(client)
}
