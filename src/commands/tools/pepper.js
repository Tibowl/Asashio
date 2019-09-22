exports.run = (client, message, args) => {
    if(!args || args.length !== 2) return message.reply(`Usage: ${this.usage()}`)

    let [dropRate, chance] = args
    dropRate = dropRate.replace(/%$/, "")
    chance = chance.replace(/%$/, "")

    if(!dropRate.match(/^[0-9]{0,2}(|\.[0-9]+)$/)) return message.reply(`Usage: ${this.usage()}`)
    if(!chance.match(/^[0-9]{0,2}(|\.[0-9]+)$/)) return message.reply(`Usage: ${this.usage()}`)

    dropRate = parseFloat(dropRate)
    chance = parseFloat(chance)
    let runs = Math.log(1 - (chance/100)) / Math.log(1 - (dropRate/100))
    return message.channel.send(`**~${runs.toLocaleString(undefined, {
        "maximumFractionDigits": 1,
        "maximumSignificantDigits": 4
    })}** needed to have a ${chance.toLocaleString()}% chance to get a ${dropRate.toLocaleString()}% drop`)
}

exports.category = "Tools"
exports.help = () => {
    return "How many runs needed for X% drop reaches Y% chance"
}
exports.usage = () => {
    return "pepper <rate percantage> <wanted chance>"
}
exports.prefix = (client) => {
    return client.config.prefix
}
