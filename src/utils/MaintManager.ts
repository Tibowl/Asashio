import { sendToChannels } from "./Utils"
import log4js from "log4js"
import htmlToText from "html-to-text"
import fetch from "node-fetch"

import client from "../main"
import config from "../data/config.json"

const Logger = log4js.getLogger("MaintManager")
export default class MaintManager{
    init(): void {
        client.data.store.maintInfo = client.data.store.maintInfo || {}

        this.check()
        setInterval(() => {
            this.check()
        }, 60 * 1000)
    }

    getTimes(): string[] | null {
        const {maintInfo} = client.data.store
        if (!maintInfo || !maintInfo.lastLine) return []

        const line = maintInfo.lastLine
        const times: RegExpMatchArray | null = line.match(/【.*?】/g)
        if (times && times.length == 3)
            return times.slice(1).map(k => k.replace(/[【|】]/g, ""))

        return times
    }

    async check(): Promise<void> {
        const {maintInfo} = client.data.store
        const html = await (await fetch("http://203.104.209.7/kcscontents/news/post.html")).text()
        const line = htmlToText.fromString(html)
        if (maintInfo.lastLine == line) return

        Logger.info(line)

        maintInfo.lastLine = line
        client.data.saveStore()

        Logger.info(this.getTimes())
        sendToChannels(config.maintChannels, `Maint info: ${this.getTimes()?.join(" ~ ")}\nMessage: ${line}`)
    }
}
