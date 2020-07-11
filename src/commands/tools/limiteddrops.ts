import { Message } from "discord.js"
import Command from "../../utils/Command"
import { specialDrops } from "../../utils/Utils"
import client from "../../main"
import { ShipExtended } from "../../utils/Types"

function base(ships: ShipExtended[]): string[] {
    return ships.map(ship => {
        let tries = 10
        while (ship.remodel_from && typeof ship.remodel_from == "string" && tries-- > 0)
            ship = client.data.getShipByName(ship.remodel_from.replace("/", "")) ?? ship
        return ship.name
    }).filter(function(item, pos, arr) {
        return arr.indexOf(item) == pos
    })
}

function ctype(classes: string[]): () => string[] {
    return (): string[] => base(
        Object.values(client.data.ships)
            .filter(ship => classes.includes(ship.class))
    )
}

function stype(classes: number[]): () => string[] {
    return (): string[] => base(
        Object.values(client.data.ships)
            .filter(ship => classes.includes(ship.type))
    )
}

const types: {
    [key: string]: () => string[]
} = {
    "new": () => ["Jingei", "Kaiboukan No.4", "Ariake", "Helena", "Yashiro"],

    "de": stype([1]),

    "duck": ctype(["Akizuki"]),

    "german": ctype(["Type 1934", "Admiral Hipper", "Bismarck", "Graf Zeppelin", "Type IXC U-boat"]),
    "italy": ctype(["Maestrale", "Duca degli Abruzzi", "Zara", "Vittorio Veneto", "Aquila", "Guglielmo Marconi"]),
    "uk": ctype(["J", "Queen Elizabeth", "Nelson", "Ark Royal"]),
    "france": ctype(["Richelieu", "Commandant Teste"]),
    "russia": ctype(["Tashkent", "Gangut"]),

    "usa-dd": ctype(["John C. Butler", "Fletcher"]),
    "usa-cruiser": ctype(["Atlanta", "Northampton"]),
    "usa-bb": ctype(["Iowa", "Colorado"]),
    "usa-cv": ctype(["Casablanca", "Lexington", "Essex"]),
}

export default class LimitedDrop extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Get a summary of notable limited drops. Data from TsunDB, bot will cache results up to 2 hours. Uses <http://kc.piro.moe> API or poi-db depending on arguments",
            usage: "limiteddrops [type] [db: poi/tsundb]",
            aliases: ["ldrop", "ldrops", "limiteddrop", "newdrops", "specialdrops", "sdrops", "droplist"]
        })
    }

    run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length < 1) return message.reply(`Usage: \`${this.usage}\`
Available types: ${Object.keys(types).map(k => `\`${k}\``).join(", ")}`)

        const typeName = args[0].toLowerCase()
        const ships = types[typeName]

        if (ships == undefined) return message.reply(`Unknown type, available: ${Object.keys(types).map(k => `\`${k}\``).join(", ")}`)

        const list = ships()
        if (list.length > 5 && message.channel.type !== "dm")
            return message.reply("This list can only be used in DM")

        if (args.length > 1 && args[1] == "poi")
            return specialDrops(message, list, "poi")
        return specialDrops(message, list, "tsundb")
    }
}
