const Utils = require("../../utils/Utils.js")

exports.run = (client, message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide a ship name.");

    const shipName = args.join(" ");
    const ship = client.data.getShipByName(shipName);

    if(ship == undefined) return message.reply("Unknown ship");
    // console.log(ship)

    return message.channel.send(`HP values of **${ship.full_name}**:\`\`\`
unmaried: ${this.generateLine(ship, false, client)}
married: ${this.generateLine(ship, true, client)}
\`\`\``);
}

exports.generateLine = (ship, married, client) => {
    const f = (hp) => `${hp%12?`4N+${hp%4}`:`12N+0`} (Overkill: ${(Utils.calculatePostCap(9999, hp, hp, 1).taiha * 100).toFixed(1)}% Taiha)`
    let {hp, hp_max} = ship;
    if(married) 
        hp = Math.min(hp_max, hp + [4,4,4,5,6,7,7,8,8,9][Math.floor(hp/10)])
    
    let maxMod = Math.min(hp_max - hp, 2);
    let line = `${hp}(+${maxMod}) ${f(hp)}`

    if(maxMod > 0)
        line += `
modernized: ${hp + maxMod} ${f(hp + maxMod)}`

    return line;
}

exports.category = "Tools";
exports.help = () => {
    return "Gets HP values of a ship, before and after marriage, with and without modding."
}
exports.usage = () => {
    return "hp <ship>"
}
exports.prefix = (client) => {
    return client.config.prefix;
}