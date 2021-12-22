import client from "../../main"
import { AutocompleteInteraction, CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import { displayShip, findFuzzyBestCandidates, handleShip, sendMessage } from "../../utils/Utils"
import { CommandResponse, CommandSource, SendMessage, ShipExtended } from "../../utils/Types"

export default class Ship extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Get ship information. Or a random ship from a class.",
            usage: "ship <type name | ship name>",
            options: [{
                name: "ship",
                description: "Name of ship or class",
                type:"STRING",
                autocomplete: true,
                required: true,
            }]
        })
    }

    async autocomplete(source: AutocompleteInteraction): Promise<void> {
        const targetNames = Object.values(client.data.ships).map(s => s.full_name)
        const search = source.options.getFocused().toString()

        await source.respond(findFuzzyBestCandidates(targetNames, search, 20).map(value => {
            return { name: value, value }
        }))
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return await this.run(source, source.options.getString("ship", true))
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length < 1) return sendMessage(source, "Must provide a ship name.")

        return await this.run(source, args.join(" "))
    }

    async run(source: CommandSource, shipName: string): Promise<CommandResponse> {
        const { data } = client

        let ship: ShipExtended | undefined
        const type = Object.entries(data.misc.ShipTypes)
            .concat(Object.entries(data.misc.ShipCodes))
            .find(k => k[1].toUpperCase() === shipName.toUpperCase())?.[0] ?? 0

        if (type !== 0) {
            const ships = Object.values(data.ships).filter(ship => ship.type == +type)
            ship = ships[Math.floor(Math.random() * ships.length)]
        } else
            ship = data.getShipByName(shipName)

        if (ship == undefined) return sendMessage(source, "Unknown ship")

        return sendMessage(source, displayShip(handleShip(ship)))
    }
}
