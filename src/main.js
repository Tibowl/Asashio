const Discord = require("discord.js")
const Enmap = require("enmap")
const fs = require("fs")
const DataManager = require("./utils/DataManager.js")
const LinkManager = require("./utils/LinkManager.js")
const TimerManager = require("./utils/TimerManager.js")
const TweetManager = require("./utils/TweetManager.js")

const config = require("./config.json")
const client = new Discord.Client()

client.config = config
client.data = DataManager
client.linkManager = LinkManager
client.timerManager = TimerManager
client.tweetManager = TweetManager
client.recentMessages = []

fs.readdir("./events/", (err, files) => {
    if (err) return console.error(err)
    files.forEach(file => {
        const event = require(`./events/${file}`)
        let eventName = file.split(".")[0]
        client.on(eventName, event.bind(null, client))
    })
})

client.commands = new Enmap()

const readDir = (dir) => {
    fs.readdir(dir, (err, files) => {
        if (err) return console.error(err)
        files.forEach(file => {
            if (!file.endsWith(".js")) return readDir(dir + file + "/")
            let props = require(`${dir}${file}`)
            let commandName = file.split(".")[0]
            console.log(`Loading ${commandName}`)
            client.commands.set(commandName, props)
        })
    })
}
readDir("./commands/")

client.login(config.token)
