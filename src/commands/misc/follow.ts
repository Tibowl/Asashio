import { CommandInteraction, Message, TextChannel } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import { CommandSource, FollowCategory, SendMessage } from "../../utils/Types"
import { createTable, getUserID, sendMessage } from "../../utils/Utils"
import config from "../../data/config.json"

export default class Follow extends Command {
    filterRequirements: {[x in FollowCategory]: true | {
        words: string
        filter: (potentionalFilter: string) => string | undefined}
    }

    constructor(name: string) {
        super({
            name,
            category: "Tools",
            usage:  "follow list <...> | <add|remove> <...> [...]",
            help: "Follow certain events",
            aliases: ["following", "reminders", "notifications", "subscribe"],
            options: []
        })

        this.filterRequirements = {
            "1hrdraw": {
                words: "Enter a shipname or * for all",
                filter: (name: string): string | undefined=> name == "*" ? "*" : client.data.get1HrDrawName(name)
            },
            birthday: {
                words: "Enter a shipname or * for all",
                filter: (shipName: string): string|undefined => {
                    if (!shipName) return undefined
                    if (shipName === "*") return "*"

                    const birthday = client.data.getBirthdayByName(shipName)
                    return birthday?.name
                }
            },
            maint: true,
            twitter: true,
            twitter_replies: true,
            timers: true
        }
        this.options = [{
            name: "list",
            description: "List the currently following events",
            type: "SUB_COMMAND",
            options: [{
                name: "category",
                description: "Category of the event",
                type: "STRING",
                required: false,
                choices: Object.keys(this.filterRequirements).map(d => {
                    return {
                        name: d,
                        value: d
                    }
                })
            }]
        }, {
            name: "add",
            description: "Add an category to follow in this channel",
            type: "SUB_COMMAND",
            options: [{
                name: "category",
                description: "Category of the event",
                type: "STRING",
                required: true,
                choices: Object.keys(this.filterRequirements).map(d => {
                    return {
                        name: d,
                        value: d
                    }
                })
            }, {
                name: "filter",
                description: "Filterer of the event",
                type: "STRING"
            }]
        }, {
            name: "remove",
            description: "Remove an category to follow in this channel",
            type: "SUB_COMMAND",
            options: [{
                name: "category",
                description: "Category of the event",
                type: "STRING",
                required: true,
                choices: Object.keys(this.filterRequirements).map(d => {
                    return {
                        name: d,
                        value: d
                    }
                })
            }, {
                name: "filter",
                description: "Filterer of the event",
                type: "STRING"
            }]
        }]

        this.usage = `follow list <${Object.keys(this.filterRequirements).join("|")}> | <add|remove> <${Object.keys(this.filterRequirements).join("|")}> [...]`
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        if (!(source.channel instanceof TextChannel) || source.guild == null)
            return sendMessage(source, "This command can only be executed in guild channels. You can invite this bot in your own server via `.invite`", { ephemeral: true })

        if (typeof source.member?.permissions == "string")
            return sendMessage(source, "Unable to check permissions", { ephemeral: true })

        if (!source.member?.permissions.has("ADMINISTRATOR") && !config.admins.includes(getUserID(source)))
            return sendMessage(source, "You do not have administrator rights in this server, and thus can't edit follows. If you still want to use this feature, add this bot in your own server via `.invite`", { ephemeral: true })

        const { options } = source
        const sub = options.getSubcommand()

        if (sub == "list") {
            return this.runList(source, options.getString("category") as (FollowCategory | null))
        } else if (sub == "add") {
            return this.runFollow(source, options.getString("category", true) as FollowCategory, options.getString("filter") ?? "*")
        } else if (sub == "remove") {
            return this.runUnfollow(source, options.getString("category", true) as FollowCategory, options.getString("filter") ?? "*")
        }
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!(source.channel instanceof TextChannel) || source.guild == null)
            return sendMessage(source, "This command can only be executed in guild channels. You can invite this bot in your own server via `.invite`", { ephemeral: true })

        if (!source.member?.permissions.has("ADMINISTRATOR") && !config.admins.includes(getUserID(source)))
            return sendMessage(source, "You do not have administrator rights in this server, and thus can't edit follows. If you still want to use this feature, add this bot in your own server via `.invite`", { ephemeral: true })

        const sub = args[0]?.toLowerCase() ?? "help"
        args.shift()
        const otherArgs = args[0]
        args.shift()
        const filter = args.join(" ")

        const category: FollowCategory | undefined = otherArgs ? Object.keys(this.filterRequirements).find(r => r.toLowerCase() == otherArgs.toLowerCase()) as (FollowCategory | undefined) : undefined
        if (!category)
            if (["list", "l"].includes(sub))
                return this.runList(source)
            else
                return sendMessage(source, `Unknown category \`${otherArgs}\`, valid categories: ${Object.keys(this.filterRequirements).map(k => `\`${k}\``).join(", ")}`)

        if (["list", "l"].includes(sub)) {
            return this.runList(source, category)
        } else if (["add", "a", "follow", "enable", "on"].includes(sub)) {
            return this.runFollow(source, category, filter)
        } else if (["remove", "delete", "d", "r", "disable", "off", "unfollow"].includes(sub)) {
            return this.runUnfollow(source, category, filter)
        }
    }
    async runList(source: CommandSource, category?: FollowCategory | null): Promise<SendMessage | undefined> {
        if (!(source.channel instanceof TextChannel) || source.guild == null)
            return sendMessage(source, "Unable to check channel", { ephemeral: true })

        const { followManager } = client

        if (!category) {
            const following = followManager.following(source.guild)

            const channels: {category: string, amount: number, channelname: string}[] = []
            for (const follow of following)
                try {
                    const channel = await client.channels.fetch(follow.channelID)
                    if (channel instanceof TextChannel)
                        channels.push({
                            channelname: channel.name,
                            amount: follow.amount,
                            category: follow.category
                        })
                } catch (error) {
                    followManager.dropChannel(follow.channelID)
                }
            if (channels.length == 0) return sendMessage(source, "Following nothing")

            return sendMessage(source, `Following per category: \`\`\`
${createTable(
        ["Category", "|", "Channel", "|", "Amount"],
        channels.map(
            k => [k.category, "|", k.channelname, "|", k.amount.toString()]
        ))}\`\`\``)
        }

        const follows = followManager.getFollows(source.channel, category)
        if (follows.length == 0) return sendMessage(source, `Following nothing in ${category}`)
        return sendMessage(source, `Following ${category}: \`\`\`
${createTable(
        ["Filter", "|", "Added on", "|", "Added By"],
        follows.map(
            k => [k.filter, "|", new Date(k.addedOn).toLocaleString("en-UK", {
                timeZone: "GMT",
                hour12: false,
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }), "|", k.addedBy]
        ))}\`\`\``)
    }

    async runUnfollow(source: CommandSource, category: FollowCategory, filter: string): Promise<SendMessage | undefined> {
        if (!(source.channel instanceof TextChannel) || source.guild == null)
            return sendMessage(source, "Unable to unfollow in this channel", { ephemeral: true })

        const { followManager } = client
        const filterer = this.filterRequirements[category]

        if (filterer === true) filter = "*"
        else if (!followManager.follows(source.channel, category, filter)) {
            const filtered = filterer.filter(filter)

            if (filtered == undefined)
                return sendMessage(source, `Unknown filter for category ${category}: ${filterer.words}`)
            filter = filtered
        }

        if (filter == "*") {
            followManager.dropChannelCategory(source.channel.id, category)
            return sendMessage(source, `Yeeted everything out of ${category} in <#${source.channel.id}>`)
        }

        if (!followManager.follows(source.channel, category, filter))
            return sendMessage(source, `Can't unfollow what is not being followed in <#${source.channel.id}>`)

        followManager.unfollow(source.channel, category, filter)
        return sendMessage(source, `Yeeted ${filter} out of ${category} in <#${source.channel.id}>`)
    }

    async runFollow(source: CommandSource, category: FollowCategory, filter: string): Promise<SendMessage | undefined> {
        if (!(source.channel instanceof TextChannel) || source.guild == null)
            return sendMessage(source, "Unable to unfollow in this channel", { ephemeral: true })

        const { followManager } = client
        const filterer = this.filterRequirements[category]

        if (filterer == true) {
            followManager.dropChannelCategory(source.channel.id, category)
            followManager.addFollow(source.guild, source.channel, category, getUserID(source), "*")
            return sendMessage(source, `Now following ${category} in <#${source.channel.id}>`)
        }

        const filtered = filterer.filter(filter)
        if (filtered == undefined)
            return sendMessage(source, `Unknown filter for category ${category}: ${filterer.words}`)

        if (filtered == "*")
            followManager.dropChannelCategory(source.channel.id, category)
        followManager.addFollow(source.guild, source.channel, category, getUserID(source), filtered)
        return sendMessage(source, `Now following ${category} of ${filtered} in <#${source.channel.id}>`)
    }
}
