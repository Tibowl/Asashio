const log4js = require("log4js")

/**
 * Config log4js
 */
class Logger {

    constructor() {
        log4js.configure({
            appenders: {
                file: { type: "dateFile", filename: "../logs/asashio.log", alwaysIncludePattern: true, backups: 31, compress: true },
                out: { type: "stdout" },
            }, categories: {
                default: { appenders: ["file", "out"], level: "debug" }
            }
        })
    }

}

module.exports = new Logger()
