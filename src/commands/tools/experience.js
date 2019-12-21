exports.run = (message, args) => {
    if(!args || args.length < 1) return message.reply(`Usage: \`${this.usage()}\``)

    let [currentLevel, targetLevel] = args
    let xpOffset = 0
    try {
        if(currentLevel.includes("+") || currentLevel.includes("-")) {
            const split = currentLevel.split(/[+-]/)
            if(split.length > 2) return message.reply("Invalid arguments")
            const [lvl, offset] = split
            xpOffset = parseInt(offset)
            if(currentLevel.includes("-") && xpOffset > 0)
                xpOffset = -xpOffset

            currentLevel = parseInt(lvl)
        } else
            currentLevel = parseInt(currentLevel)

        if(targetLevel)
            targetLevel = parseInt(targetLevel)
        else if (currentLevel > 99)
            targetLevel = global.data.getMaxLevel()
        else
            targetLevel = 99
    } catch (e) {
        return message.reply("Not a number")
    }
    if(!isFinite(xpOffset))
        return message.reply("Invalid offset")

    if(!isFinite(currentLevel))
        return message.reply("Current level is not a number")
    if(currentLevel > global.data.getMaxLevel())
        return message.reply(`Current level is too large (max: ${global.data.getMaxLevel()})`)
    if(currentLevel < 1)
        return message.reply("Current level too small")

    if(!isFinite(targetLevel))
        return message.reply("Target level is not a number")
    if(targetLevel > global.data.getMaxLevel())
        return message.reply(`Target level is too large (max: ${global.data.getMaxLevel()})`)
    if(targetLevel < 1)
        return message.reply("Target level too small")

    if(currentLevel > targetLevel)
        [currentLevel, targetLevel] = [targetLevel, currentLevel]

    const currentXP = global.data.levels_exp[currentLevel - 1] + xpOffset
    const targetXP = global.data.levels_exp[targetLevel - 1]
    const diffXP = targetXP - currentXP
    const progress = currentXP / targetXP * 100

    return message.channel.send(`From **${currentLevel}** (${currentXP.toLocaleString()} XP) to **${targetLevel}** (${targetXP.toLocaleString()} XP) you need **${diffXP.toLocaleString()}** XP (Progress: ${progress.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}%)`)
}

exports.category = "Tools"
exports.help = "Get experience needed to reach a target level (defaults to 99 or max level)"
exports.usage = "experience <current level[(+ or -)current xp offset]> [target level]"
exports.prefix = global.config.prefix
exports.aliases = ["xp", "exp"]
