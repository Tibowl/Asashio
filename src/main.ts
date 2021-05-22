import log4js from "log4js"
import AsashioClient from "./AsashioClient"
import fs from "fs"
import { join } from "path"

log4js.configure({
    appenders: {
        file: { type: "dateFile", filename: "./logs/asashio.log", alwaysIncludePattern: true, backups: 31, compress: true },
        out: { type: "stdout" },
    }, categories: {
        default: { appenders: ["file", "out"], level: "debug" }
    }
})
const Logger = log4js.getLogger("main")

const client = new AsashioClient()
if (!fs.existsSync(join(__dirname, "./data/config.json"))) {
    Logger.error("Config does not exist!")
} else {
    client.init().catch(Logger.error)
}

export default client
