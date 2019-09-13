exports.run = async (client, message, args) => {
    if(!client.config.admins.includes(message.author.id)) return;
    client.tweetManager.shutdown();
    await client.timerManager.update()
    // TODO clean reactions
    await message.reply("<:wooper:617004982440427606>")
    process.exit();
}

exports.category = "Admin";
exports.help = () => {
    return "Kills bot. Admins only."
}
exports.usage = () => {
    return "shoukillme"
}
exports.prefix = (client) => {
    return client.config.prefix;
}