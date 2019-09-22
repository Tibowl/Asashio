const cutins = {
    trl: {
        name: "Torpedo-Radar-Lookout (DD only)",
        value: 150
    },
    gci: {
        name: "Gun Cut-In",
        value: 140
    },
    mgci: {
        name: "Mixed Gun Cut-In",
        value: 130
    },
    gtr: {
        name: "Gun-Torpedo-Radar (DD only)",
        value: 130
    },
    tci: {
        name: "Torpedo Cut-In",
        value: 122
    },
    mtci: {
        name: "Mixed Torpedo Cut-In",
        value: 115
    }
}
Object.keys(cutins).forEach(key => cutins[key].short = key)

exports.run = async (client, message, args) => {
    if(!args || args.length < 1) return message.reply(`Usage: \`${this.usage()}\`
Available types: ${Object.keys(cutins).map(k => `\`${k}\``).join(", ")}`)

    let [cutin, level, luck] = args
    if((cutin = cutins[cutin]) == undefined) return message.reply("Unknown cutin")

    if(level == undefined) {
        const format = (base) => (base / cutin.value * 100).toFixed(2).padStart(5)
        return message.channel.send(`For level/luck specific stats use \`${this.prefix(client)}nb ${cutin.short} <level> <luck>\`

**${cutin.name}** (base value: ${cutin.value})
\`\`\`diff
Bonuses:
+${format(15)}% | Flagship
+${format(18)}% | Chuuha
+${format(7)}% | Allied Searchlight
+    ?% | Allied L. Searchlight
+${format(4)}% | Allied Star Shell
+${format(5)}% | Skilled Lookouts
Penalties:
-${format(5)}% | Enemy Searchlight
-    ?% | Enemy L. Searchlight
-${format(10)}% | Enemy Star Shell \`\`\``)
    }

    if(args.length < 3) return message.reply(`Usage: \`${this.prefix(client)}nb ${cutin.short} <level> <luck>\``)

    if(isNaN(level = parseInt(level)) || level < 0 || level > client.data.getMaxLevel() + 50) return message.reply("Invalid/unrealistic level.")
    if(isNaN(luck = parseInt(luck)) || luck < 0 || luck > 200) return message.reply("Invalid/unrealistic luck.")

    let base = 0
    if(luck < 50)
        base = Math.floor(15 + luck + 0.75 * Math.sqrt(level))
    else
        base = Math.floor(65 + Math.sqrt(luck - 50) + 0.8 * Math.sqrt(level))

    return message.channel.send(`The base cut-in rate is **${(base/cutin.value*100).toFixed(2)}%** for a level **${level}** ship with **${luck}** luck. See \`${this.prefix(client)}nb ${cutin.short}\` for bonus information.`)
}
exports.category = "Tools"
exports.help = () => {
    return `Show night battle cutin rates.
- When only cut-in type provided, shows list of bonuses.`
}
exports.usage = () => {
    return "nb <cutin> [level] [luck]"
}
exports.prefix = (client) => {
    return client.config.prefix
}
