exports.run = async (message, args) => {
    const {client, config} = global
    if(config.admins[0] !== message.author.id) return

    try {
        const result = await eval(args.join(" "))
        return message.reply(`\`\`\`json\n${JSON
            .stringify(result, null, 2)
            .substring(0, 1800)
            .replace(
                new RegExp(client.token.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&"), "gi"),
                ""
            )}\`\`\``)
    } catch (error) {
        return message.reply(`${error.name}: ${error.message}`)
    }
}

exports.category = "hidden"
exports.help = "Evaluate stuff. Tibi only."
exports.usage = "eval [code]"
exports.prefix = global.config.prefix
