const Discord = require("discord.js"),
      Enmap = require("enmap"),
      fs = require("fs"),
      log4js = require("log4js")

require("./logger")

const config = require("./data/config.json")
config.emoji = require("./data/emoji.json")
const client = new Discord.Client()
const Logger = log4js.getLogger("main")

global.config = config
global.data = require("./utils/DataManager.js")
global.linkManager = require("./utils/LinkManager.js")
global.timerManager = require("./utils/TimerManager.js")
global.tweetManager = require("./utils/TweetManager.js")
global.recentMessages = []
global.client = client

fs.readdir("./events/", (err, files) => {
    if (err) return Logger.error(err)
    files.forEach(file => {
        const event = require(`./events/${file}`)
        let eventName = file.split(".")[0]
        client.on(eventName, event.bind(null, client))
    })
})

global.commands = new Enmap()

const readDir = (dir) => {
    fs.readdir(dir, (err, files) => {
        if (err) return Logger.error(err)
        files.forEach(file => {
            if (!file.endsWith(".js")) return readDir(dir + file + "/")
            let props = require(`${dir}${file}`)
            let commandName = file.split(".")[0]
            Logger.info(`Loading ${commandName}`)
            global.commands.set(commandName, props)
        })
    })
}
readDir("./commands/")

client.login(config.token)
