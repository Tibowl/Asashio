const Discord = require("discord.js"),
      Enmap = require("enmap"),
      fs = require("fs"),
      DataManager = require("./utils/DataManager.js"),
      LinkManager = require("./utils/LinkManager.js"),
      TimerManager = require("./utils/TimerManager.js"),
      TweetManager = require("./utils/TweetManager.js"),
      log4js = require("log4js")

require("./logger")

const config = require("./data/config.json")
config.emoji = require("./data/emoji.json")
const client = new Discord.Client()
const Logger = log4js.getLogger("main")

client.config = config
client.data = DataManager
client.linkManager = LinkManager
client.timerManager = TimerManager
client.tweetManager = TweetManager
client.recentMessages = []

fs.readdir("./events/", (err, files) => {
    if (err) return Logger.error(err)
    files.forEach(file => {
        const event = require(`./events/${file}`)
        let eventName = file.split(".")[0]
        client.on(eventName, event.bind(null, client))
    })
})

client.commands = new Enmap()

const readDir = (dir) => {
    fs.readdir(dir, (err, files) => {
        if (err) return Logger.error(err)
        files.forEach(file => {
            if (!file.endsWith(".js")) return readDir(dir + file + "/")
            let props = require(`${dir}${file}`)
            let commandName = file.split(".")[0]
            Logger.info(`Loading ${commandName}`)
            client.commands.set(commandName, props)
        })
    })
}
readDir("./commands/")

client.login(config.token)
