import Discord, { ClientEvents, Intents } from "discord.js"
import DBL from "dblapi.js"
import Enmap from "enmap"
import fs from "fs"
import { join } from "path"

import LinkManager from "./utils/LinkManager"
import TimerManager from "./utils/TimerManager"
import TweetManager from "./utils/TweetManager"
import MaintManager from "./utils/MaintManager"
import DataManager from "./utils/DataManager"

import config from "./data/config.json"
import log4js from "log4js"
import Command from "./utils/Command"
import FollowManager from "./utils/FollowManager"

const Logger = log4js.getLogger("main")
const intents = new Intents()
intents.add(
    // For handling commands in DMs
    "DIRECT_MESSAGES", "DIRECT_MESSAGE_REACTIONS",
    // For follow stuff, also required for guild messages for some reason?
    "GUILDS",
    // For handling commands in guilds, reactions for X to delete
    "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"
)

export default class AsashioClient extends Discord.Client {
    data: DataManager = new DataManager()
    linkManager: LinkManager = new LinkManager()
    timerManager: TimerManager = new TimerManager()
    tweetManager: TweetManager = new TweetManager()
    maintManager: MaintManager = new MaintManager()
    followManager: FollowManager = new FollowManager()

    commands: Enmap<string, Command> = new Enmap()
    recentMessages: Discord.Message[] = []

    constructor() {
        super({
            presence: {
                status: "idle"
            },
            ws: {
                intents
            }
        })
    }

    init(): void {
        fs.readdir(join(__dirname, "./events/"), (err, files) => {
            if (err) return Logger.error(err)
            files.forEach(file => {
                if (file.endsWith(".d.ts")) return
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const event = require(`./events/${file}`)
                const eventName = file.split(".")[0] as keyof ClientEvents
                this.on(eventName, event.handle)
            })
        })

        const readDir = (dir: string): void => {
            fs.readdir(join(__dirname, dir), (err, files) => {
                if (err) return Logger.error(err)
                files.forEach(file => {
                    if (!(file.endsWith(".js") || file.endsWith(".ts"))) return readDir(dir + file + "/")
                    if (file.endsWith(".d.ts")) return
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const props = require(`${dir}${file}`)
                    const commandName = file.split(".")[0]
                    Logger.info(`Loading ${commandName}`)
                    this.commands.set(commandName, new (props.default)(commandName))
                })
            })
        }
        readDir("./commands/")

        this.login(config.token)
        if (config.dbl_token)
            new DBL(config.dbl_token, this)
    }
}
