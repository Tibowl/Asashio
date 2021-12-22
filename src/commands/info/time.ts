import { CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import { CommandResponse, CommandSource, SendMessage } from "../../utils/Types"
import { sendMessage } from "../../utils/Utils"

export default class Resets extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Get current time in a couple time zones",
            usage: "time",
            aliases: ["timezones"],
            options: []
        })
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return await this.run(source)
    }

    async runMessage(source: Message): Promise<SendMessage | undefined> {
        return await this.run(source)
    }

    async run(source: CommandSource): Promise<CommandResponse> {
        const now = new Date()
        const timeZones = [
            "Asia/Tokyo",
            "Europe/Brussels",
            "GMT",
            "America/New_York",
            "America/Los_Angeles"
        ]

        return sendMessage(source, timeZones.map(timeZone => now.toLocaleString("en-UK", {
            timeZone,
            timeZoneName: "long",
            hour12: false,
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })).join("\n"))
    }
}
