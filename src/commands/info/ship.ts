import client from "../../main"
import { Message } from "discord.js"

import Command from "../../utils/Command"
import { displayShip, handleShip } from "../../utils/Utils"
import { ShipExtended } from "../../utils/Types"

export default class Ship extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Get ship information. Or a random ship from a class.",
            usage: "ship <type name | ship name>",
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length < 1) return message.reply("Must provide a ship name.")
        const { data } = client

        const shipName = args.join(" ")
        let ship: ShipExtended | undefined
        if (Object.values(data.misc.ShipTypes).includes(shipName.toUpperCase())
            || Object.values(data.misc.ShipCodes).includes(shipName.toUpperCase())) {
            const type = Object.entries(data.misc.ShipTypes)
                .concat(Object.entries(data.misc.ShipCodes))
                .find(k => k[1] === shipName.toUpperCase())?.[0] ?? 0

            const ships = Object.values(data.ships).filter(ship => ship.type == type)
            ship = ships[Math.floor(Math.random() * ships.length)]
        } else
            data.getShipByName(shipName)

        if (ship == undefined) return message.reply("Unknown ship")

        return message.channel.send(displayShip(handleShip(ship), message.guild))
    }
}
