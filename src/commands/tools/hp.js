const Utils = require("../../utils/Utils.js")

exports.run = (message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide a ship name.")

    const shipName = args.join(" ")
    const ship = global.data.getShipByName(shipName)

    if(ship == undefined) return message.reply("Unknown ship")
    // console.log(ship)

    return message.channel.send(`HP values of **${ship.full_name}**:\`\`\`
 unmarried: ${this.generateLine(ship, false)}

   married: ${this.generateLine(ship, true)}
\`\`\``)
}

exports.generateLine = (ship, married) => {
    const f = (hp) => `${hp%12?`4N+${hp%4}`:"12N+0"} (Overkill: ${(Utils.calculatePostCap(9999, hp, hp, 1).taiha * 100).toFixed(1)}% Taiha)`
    let {hp, hp_max} = ship
    if(married)
        hp = Math.min(hp_max, hp + [4,4,4,5,6,7,7,8,8,9][Math.floor(hp/10)])

    let maxMod = Math.min(hp_max - hp, 2)
    let line = `${hp} ${f(hp)}`

    for(let i = 1; i <= maxMod; i++)
        line += `
modernized: ${hp + i} ${f(hp + i)}`

    return line
}

exports.category = "Tools"
exports.help = "Gets HP values of a ship, before and after marriage, with and without modding."
exports.usage = "hp <ship>"
exports.prefix = global.config.prefix
