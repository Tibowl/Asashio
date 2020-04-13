import { Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import { handleShip, displayShip } from "../../utils/Utils"
import { ShipExtended } from "../../utils/Types"

export default class ShipCompare extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Compares two ships.",
            usage: "shipcompare <ship A>, <ship B>",
        })
    }

    run(message: Message, args: string[]): Promise<Message | Message[]> {
        if(!args || args.length < 1 || args.join(" ").split(",").length != 2) return message.reply("Must provide two ship names.")
        const { data } = client

        const shipNameA = args.join(" ").split(",")[0].trim()
        const shipA = data.getShipByName(shipNameA)

        const shipNameB = args.join(" ").split(",")[1].trim()
        const shipB = data.getShipByName(shipNameB)

        if(shipA == undefined) return message.reply("Unknown first ship")
        if(shipB == undefined) return message.reply("Unknown second ship")

        handleShip(shipA)
        handleShip(shipB)

        const ship: ShipExtended = Object.assign({}, shipA, shipB)
        for(let key of Object.keys(ship))
            if(shipA[key] !== shipB[key])
                ship[key] = shipA[key] + "→" + shipB[key]
            else
                ship[key] = shipA[key]

        ship.equipment_text = `${shipA.equipment_text}
↓
${shipB.equipment_text}`
        ship.remodel_text = `${shipA.remodel_text}
↓
${shipB.remodel_text}`

        return message.channel.send(displayShip(ship))
    }
}
