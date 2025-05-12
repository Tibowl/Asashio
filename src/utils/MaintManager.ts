import log4js from "log4js"
import { htmlToText } from "html-to-text"
import fetch from "node-fetch"

import client from "../main"

const gadgetServer = "w00g.kancolle-server.com"

const Logger = log4js.getLogger("MaintManager")
export default class MaintManager {
    async init(): Promise<void> {
        client.data.store.maintInfo = client.data.store.maintInfo ?? {}
        client.data.store.versionInfo = client.data.store.versionInfo ?? {}

        await this.checkUpdates()
        setInterval(async () => this.checkUpdates(), 60 * 1000)
    }

    getTimes(): string[] | null {
        const { maintInfo } = client.data.store
        if (!maintInfo || !maintInfo.lastLine) return []

        const line = maintInfo.lastLine
        const times: RegExpMatchArray | null = line.match(/【.*?】/g)
        if (times && times.length == 3)
            return times.slice(1).map(k => k.replace(/[【|】]/g, ""))

        return times
    }

    async checkUpdates(): Promise<void> {
        try {
            await this.checkNews()
        } catch (error) {
            Logger.error(`An error occurred while handling news ${error}`)
        }

        try {
            await this.checkVersion()
        } catch (error) {
            Logger.error(`An error occurred while handling news ${error}`)
        }
    }

    async checkNews(): Promise<void> {
        const { maintInfo } = client.data.store
        const html = await (await fetch(`http://${gadgetServer}/kcscontents/news/post.html`)).text()
        if (html.includes("403 Forbidden")) {
            Logger.error("Unable to fetch maint updates (403)")
            return
        }
        const line = htmlToText(html)
        if (maintInfo.lastLine == line) return

        Logger.info(line)

        maintInfo.lastLine = line
        client.data.saveStore()

        Logger.info(this.getTimes())
        if (line.trim().length == 0)
            await client.followManager.send("maint", "Maint info cleared")
        else
            await client.followManager.send("maint", `Maint info: ${this.getTimes()?.join(" ~ ")}\nMessage: ${line}`)
    }

    async checkVersion(): Promise<void> {
        const { versionInfo } = client.data.store
        const isFirstRun = versionInfo.lastKCAVersion == undefined
        let output = ""
        let isDoing = false, isEmergency = false, endDateTime = "", newMainVersion = ""

        const html = await (await fetch(`http://${gadgetServer}/gadget_html5/js/kcs_const.js`)).text()
        if (html.includes("403 Forbidden")) {
            Logger.error("Unable to fetch maint updates (403)")
            return
        }

        for (const line of html.split("\n")) {
            if (line.indexOf("MaintenanceInfo.IsDoing") >= 0)
                isDoing = !!parseInt(line.split("= ")[1].replace(";", "").trim())
            else if (line.indexOf("MaintenanceInfo.IsEmergency") >= 0)
                isEmergency = !!parseInt(line.split("= ")[1].replace(";", "").trim())
            else if (line.indexOf("MaintenanceInfo.EndDateTime") >= 0)
                endDateTime = line.split("parse(\"")[1].replace("\");", "").trim()
            else if (line.indexOf("VersionInfo.scriptVesion") >= 0)
                newMainVersion = line.split("\"")[1].replace("\";", "").trim()
        }

        const infoLines = isDoing ? [
            `📉 ${isEmergency ? "[Emergency] " : ""}Maintenance ongoing`,
            "Expected end time: " + endDateTime
        ] : [
            "📈 Maintenance ended"
        ]

        if (infoLines.join("\n") !== versionInfo.lastMaintString) {
            versionInfo.lastMaintString = infoLines.join("\n")
            if (isDoing && !versionInfo.lastMaintOngoing)
                infoLines[0] = `📉 ${isEmergency ? "[Emergency] " : ""}Maintenance has started - you can no longer refresh`

            versionInfo.lastMaintOngoing = isDoing
            output += infoLines.join("\n")
            output += "\n"
        }

        if (newMainVersion !== versionInfo.lastMainVersion) {
            output += `Main game version changed from ${versionInfo.lastMainVersion} -> ${newMainVersion}\n`
            versionInfo.lastMainVersion = newMainVersion
        }

        try {
            const kca = await (await fetch(`http://${gadgetServer}/kca/version.json`)).json() as { api: { api_start2: string } }
            const newKCAVersion = kca?.api?.api_start2 ?? "?.?.?.?"
            if (newKCAVersion !== versionInfo.lastKCAVersion) {
                output += `Metadata version changed from ${versionInfo.lastKCAVersion} -> ${newKCAVersion}\n`
                versionInfo.lastKCAVersion = newKCAVersion
            }
        } catch (error) {
            Logger.error("Failed to get android version", error)
        }

        output = output.trim()
        if (isFirstRun) {
            Logger.info(`First run - not sending ${output}`)
            client.data.saveStore()
            return
        }
        if (output.length == 0) return
        Logger.info(output)

        client.data.saveStore()
        await client.followManager.send("maint", output)
    }
}
