const Discord = require("discord.js")

exports.run = (client, message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide a ship name.")

    let aswOffset = 0, equipmentAsw = -1
    if(args[args.length-1].match(/\+[0-9]+/)) aswOffset = parseInt(args.pop().slice(1))
    if(args[args.length-1].match(/=[0-9]+/)) equipmentAsw = parseInt(args.pop().slice(1))
    if(args[args.length-1].match(/\+[0-9]+/)) aswOffset = parseInt(args.pop().slice(1))

    const shipName = args.join(" ")
    const ship = client.data.getShipByName(shipName)

    if(ship == undefined) return message.reply("Unknown ship")

    const embed = new Discord.RichEmbed()
        .setTitle(`${ship.full_name} ${aswOffset > 0 ? `+${aswOffset} ASW` : ""}`)
        .setURL(`https://kancolle.fandom.com/wiki/${ship.name.replace(/ /g, "_")}`)
        .setThumbnail(`https://raw.githubusercontent.com/KC3Kai/KC3Kai/develop/src/assets/img/ships/${ship.api_id}.png`)

    const aswRequired = this.findAswRequired(ship)

    if(aswRequired > 0) {
        embed.setColor("#0066ff")
            .addField("Opening ASW", `This ship requires ${aswRequired} ASW${ship.asw_max == null || ship.asw == null? ". Stats are not yet updated for this ship":""}`)
        if(ship.asw_max == null || ship.asw == null);
        else if(equipmentAsw < 0)
            embed.addField("Equipment - Levels", this.aswEquip(ship, aswOffset))
        else
            embed.addField("Equipment - Levels", `\`\`\`
+${equipmentAsw} ASW - ${this.levelAtAsw(ship, aswRequired - aswOffset - equipmentAsw)}
\`\`\``)
    } else if (aswRequired === 0)
        embed.setColor("#00ff00")
            .addField("Opening ASW", "This ship can always OASW")
    else if (aswRequired === -2)
        embed.setColor("#ff6600")
            .addField("Opening ASW", "This ship can OASW but it's a bit complicated. General rule: +7 ASW plane and >=65 displayed ASW.")
    else if (aswRequired === -3)
        embed.setColor("#ff6600")
            .addField("Opening ASW", "This ship might be able to OASW but it's a bit complicated.")
    else
        embed.setColor("#ff0000")
            .addField("Opening ASW", "This ship is not supported or can't OASW")
    return message.channel.send(embed)
}

// https://github.com/KC3Kai/KC3Kai/blob/develop/src/library/objects/Ship.js#L2191
exports.findAswRequired = (ship) => {
    if([141, 478, 394, 681, 562, 689, 596, 692, 893].includes(ship.api_id)) return 0
    if(ship.type === 1) return 60
    if([2, 3, 4, 21].includes(ship.type)) return 100

    if(ship.type === 7 && ship.asw > 0) return -2
    if(ship.full_name == "Hyuuga Kai Ni") return -3
    if([6, 10, 16, 17].includes(ship.type)) return -3

    return -99
}
exports.aswAtLevel = (ship, level) => {
    return Math.floor(ship.asw + ((ship.asw_max - ship.asw) * level / 99))
}
exports.levelAtAsw = (ship, asw) => {
    let aswPerLevel = (ship.asw_max - ship.asw) / 99
    if(aswPerLevel <= 0) return -1
    let level = Math.ceil((asw - ship.asw) / aswPerLevel)
    if (level < ship.remodel_level)
        level = ship.remodel_level

    return level
}
exports.aswEquip = (ship, aswOffset) => {
    const aswRequired = this.findAswRequired(ship)
    const maxSlots = ship.equipment.length

    let string = "```"
    for(let slots = maxSlots; slots > 0; slots--) {
        if(slots == 1) {
            string += this.generateLine([15], ship, aswRequired, aswOffset, maxSlots)
            string += this.generateLine([13], ship, aswRequired, aswOffset, maxSlots)
            string += this.generateLine([12], ship, aswRequired, aswOffset, maxSlots)
            string += this.generateLine([10], ship, aswRequired, aswOffset, maxSlots, true)
            break
        }

        let equipAsw = []
        for(let i = 0; i < slots; i++)
            equipAsw.push(12)

        let allLinesT3 = false
        while(!allLinesT3) {
            string += this.generateLine(equipAsw, ship, aswRequired, aswOffset, maxSlots)

            for(let i = slots - 1; i >= 0; i--) {
                if(equipAsw[i] == 12) {
                    equipAsw[i] = 10
                    break
                } else if (equipAsw[i] == 10 && i == slots - 1) {
                    equipAsw[i] = 8
                    break
                }
            }
            allLinesT3 = equipAsw.filter(val => val == 12).length == 0
        }
        string += this.generateLine(equipAsw, ship, aswRequired, aswOffset, maxSlots, true)
    }
    return string + "```"
}
exports.generateLine = (equipAsw, ship, aswRequired, aswOffset, maxSlots, force = false) => {
    let equipmentAsw = equipAsw.reduce((a,b) => a+b)
    let level = this.levelAtAsw(ship, aswRequired - aswOffset - equipmentAsw)

    if(this.levelAtAsw(ship, aswRequired - aswOffset - equipmentAsw + 2) <= ship.remodel_level && !force)
        return ""

    return `${equipAsw.map(val => {
        switch (val) {
            case 12: return "T4"
            case 10: return "T3"
            case  8: return "DC"
            case 15: return "HFDF"
            case 13: return "T144"
            default: return val
        }
    }).join("/").padStart(maxSlots * 3 - 1)} - ${level}
`
}
exports.category = "Tools"
exports.help = () => {
    return "Gets levels when a ship can OASW with certain equipment."
}
exports.usage = () => {
    return "oasw <ship> [+<asw mod>] [=<equipment ASW>]"
}
exports.prefix = (client) => {
    return client.config.prefix
}
