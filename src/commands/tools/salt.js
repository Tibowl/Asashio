exports.run = (client, message, args) => {
    if(!args || args.length !== 2) return message.reply(`Usage: ${this.usage()}`);

    let [dropRate, runs] = args;
    dropRate = dropRate.replace(/%$/, "");
    
    if(!dropRate.match(/^[0-9]{0,2}(|\.[0-9]+)$/)) return message.reply(`Usage: ${this.usage()}`);
    if(!runs.match(/^[0-9]{0,6}(|\.[0-9]+)$/)) return message.reply(`Usage: ${this.usage()}`);

    dropRate = parseFloat(dropRate);
    runs = parseFloat(runs);
    let rate = 1 - ((1-(dropRate/100))**runs);
    return message.channel.send(`**~${(rate*100).toLocaleString(undefined, {
        "minimumFractionDigits": 1,
        "maximumSignificantDigits": 4
    })}%** to get a ${dropRate.toLocaleString()}% drop in ${runs.toLocaleString()} runs`);
}

exports.category = "Tools";
exports.help = () => {
    return "What's the chance to not get a X% drop in Y runs"
}
exports.usage = () => {
    return "salt <drop rate> <runs>"
}
exports.prefix = (client) => {
    return client.config.prefix;
}