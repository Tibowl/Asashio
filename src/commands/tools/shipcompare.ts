import { AutocompleteInteraction, CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import { handleShip, displayShip, sendMessage, findFuzzyBestCandidates } from "../../utils/Utils"
import { CommandSource, SendMessage, ShipExtended } from "../../utils/Types"

export default class ShipCompare extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Compares two ships.",
            usage: "shipcompare <ship A>, <ship B>",
            aliases: ["compareship", "compareships", "shipscompare"],
            options: [{
                name: "first",
                description: "First ship to compare",
                type: "STRING",
                required: true,
                autocomplete: true
            }, {
                name: "second",
                description: "Second ship to compare",
                type: "STRING",
                required: true,
                autocomplete: true
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
        return this.run(source, source.options.getString("first", true), source.options.getString("second", true))
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length < 1 || args.join(" ").split(",").length != 2) return sendMessage(source, "Must provide two ship names.")

        const shipNameA = args.join(" ").split(",")[0].trim()
        const shipNameB = args.join(" ").split(",")[1].trim()
        return this.run(source, shipNameA, shipNameB)
    }

    async run(source: CommandSource, shipNameA: string, shipNameB: string): Promise<SendMessage | undefined> {
        const { data } = client
        const shipA = data.getShipByName(shipNameA)

        const shipB = data.getShipByName(shipNameB)

        if (shipA == undefined) return sendMessage(source, "Unknown first ship")
        if (shipB == undefined) return sendMessage(source, "Unknown second ship")

        handleShip(shipA)
        handleShip(shipB)

        const ship: ShipExtended = Object.assign({}, shipA, shipB)
        for (const key of Object.keys(ship))
            if (shipA[key] !== shipB[key])
                ship[key] = shipA[key] + "→" + shipB[key]
            else
                ship[key] = shipA[key]

        ship.equipment_text = `${shipA.equipment_text}
↓
${shipB.equipment_text}`
        ship.remodel_text = `${shipA.remodel_text}
↓
${shipB.remodel_text}`

        return sendMessage(source, displayShip(ship))
    }
}
