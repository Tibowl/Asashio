import log4js from "log4js"
import AsashioClient from "./AsashioClient"
import fs from "fs"

log4js.configure({
    appenders: {
        file: { type: "dateFile", filename: "../logs/asashio.log", alwaysIncludePattern: true, backups: 31, compress: true },
        out: { type: "stdout" },
    }, categories: {
        default: { appenders: ["file", "out"], level: "debug" }
    }
})
const Logger = log4js.getLogger("main")

const client = new AsashioClient()
if (!fs.existsSync("./data/config.json")) {
    Logger.error("Config does not exist!")
} else {
    client.init()
}

export default client
