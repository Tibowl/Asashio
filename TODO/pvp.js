exports.run = (message, args) => {
    if (!args || args.length < 1) return message.reply(this.usage)

    let [flagshipLevel, escortLevel] = args
    try {
        flagshipLevel = parseInt(flagshipLevel)

        if (escortLevel)
            escortLevel = parseInt(escortLevel) || 1
        else
            escortLevel = 0
    } catch (e) {
        return message.reply("Not a number")
    }

    if (!isFinite(flagshipLevel))
        return message.reply("Flagship level is not a number")
    if (flagshipLevel > global.data.getMaxLevel())
        return message.reply(`Flagship level is too large (max: ${global.data.getMaxLevel()})`)
    if (flagshipLevel < 1)
        return message.reply("Flagship level too small")

    if (!isFinite(escortLevel))
        return message.reply("Escort level is not a number")
    if (escortLevel > global.data.getMaxLevel())
        return message.reply(`Escort level is too large (max: ${global.data.getMaxLevel()})`)
    if (escortLevel < 0)
        return message.reply("Escort level too small")

    const flagshipXP = global.data.levels_exp[flagshipLevel - 1]
    const escortXP = global.data.levels_exp[(escortLevel||1) - 1]

    const precapMin = Math.floor(flagshipXP / 100 + escortXP / 300)
    const precapMax = precapMin + 3

    const baseMin = postcap(precapMin)
    const baseMax = postcap(precapMax)

    return message.channel.send(`A pvp with flagship level **${flagshipLevel}**${escortLevel > 0 ? ` and escort level **${escortLevel}**` : ""} gives **${range(Math.floor(baseMin), Math.floor(baseMax))}** base XP, **${range(Math.floor(baseMin * 1.2), Math.floor(baseMax * 1.2))}** for an S rank`)
}
function postcap(precap) {
    if(precap <= 500)
        return precap
    return Math.floor(500 + Math.sqrt(precap - 500))
}
function range(min, max) {
    if (min != max)
        return `${min}~${max}`
    return min
}
exports.category = "Tools"
exports.help = "Get experience you get from given ship lvls"
exports.usage = "pvp <flagship level> [escort level=0]"
exports.prefix = global.config.prefix
exports.aliases = ["pvpxp", "pvpexp"]
