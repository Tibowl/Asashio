import client from "../main"
import log4js from "log4js"
import { ApplicationCommandData } from "discord.js"
import config from "../data/config.json"

const Logger = log4js.getLogger("ready")

let alreadyLoaded = false
export async function handle(): Promise<void> {
    Logger.info(`In ${(client.channels.cache).size} channels on ${(client.guilds.cache).size} servers, for a total of ${(client.users.cache).size} users.`)

    if (alreadyLoaded) return
    client.user?.setStatus("online")
    alreadyLoaded = true
    await client.data.reloadShipData()
    client.linkManager.loadLinks()
    client.tweetManager.init()
    client.timerManager.init()
    await client.maintManager.init()

    if (!client.application?.owner) await client.application?.fetch()
    const cmds: ApplicationCommandData[] = client.commands
        .array()
        .filter((cmd, i, arr) => cmd.category !== "Admin" && arr.findIndex(x => x.commandName == cmd.commandName) == i)
        .map(cmd => {
            const help = (cmd.shortHelp ?? cmd.help).split("\n")[0]
            const name = cmd.commandName

            if (help.length > 99)
                Logger.error(`${name}'s description is too long'`)

            return {
                name,
                options: cmd.options,
                description: help.substring(0, 100),
            // TODO default permissions?
            }
        })

    if (config.production)
        await client.application?.commands.set(cmds)
    else
        await client.guilds.cache.get("247122362942619649")?.commands.set(cmds)
    Logger.info(`Commands registered for ${config.production}`)

}
