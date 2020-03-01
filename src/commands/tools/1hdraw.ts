import Command from "../../utils/Command"
import client from "../../main"
import Discord from "discord.js"

export default class OneHourDraw extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Check today's 1h draw ships",
            usage: "1hdraw"
        })
    }

    run(message: Discord.Message): Promise<Discord.Message | Discord.Message[]> {
        const { cachedShips } = client.tweetManager

        if(!cachedShips.date) {
            return message.channel.send("No 1h draw loaded :(")
        }

        return message.channel.send(`Today's 1h draw ships: ${cachedShips.ships
            .map((name) => {
                const candidate = client.data.getShipByName(name)
                if(candidate && (name == candidate.japanese_name || name == candidate.reading))
                    return candidate.name
                return name
            })
            .map(s => `**${s}**`)
            .join(", ")
            .replace(/,([^,]*)$/, " and$1")}

Based on @kancolle_1draw tweet on: ${cachedShips.date}`)
    }
}
