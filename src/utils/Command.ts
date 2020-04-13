import Discord from "discord.js"

export type CommandCategory = "Admin" | "Links" | "Links+" | "Tools" | "Information" | "Misc" | "Hidden"
export interface CommandOptions {
    name: string
    help: false | string
    usage: false | string
    category: CommandCategory
    aliases?: string[]
}

export default abstract class Command {
    public readonly commandName: string
    public readonly aliases: string[]
    public readonly usage: string | false
    public readonly help: string | false
    public readonly category: CommandCategory

    protected constructor(options: CommandOptions) {
        this.commandName = options.name
        this.aliases = options.aliases ?? []
        this.usage = options.usage
        this.help = options.help
        this.category = options.category
    }

    abstract run(message: Discord.Message, args: string[], command: string): Promise<Discord.Message | Discord.Message[] | undefined> | undefined
}
