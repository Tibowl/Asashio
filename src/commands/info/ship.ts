import client from "../../main"
import { Message } from "discord.js"

import Command from "../../utils/Command"
import { displayShip, handleShip } from "../../utils/Utils"

export default class Ship extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Get ship information.",
            usage: "ship <ship>",
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length < 1) return message.reply("Must provide a ship name.")
        const { data } = client

        const shipName = args.join(" ")
        const ship = data.getShipByName(shipName)

        if (ship == undefined) return message.reply("Unknown ship")

        return message.channel.send(displayShip(handleShip(ship), message.guild))
    }
}
