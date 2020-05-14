import { Message, TextChannel } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import { FollowCategory } from "../../utils/Types"
import { createTable } from "../../utils/Utils"
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
            usage:  "follow <...> <list|add|remove> [...] or just follow list",
            help: "Follow certain events",
            aliases: ["following", "reminders", "notifications", "subscribe"]
        })

        this.filterRequirements = {
            "1hrdraw": {
                words: "Enter a shipname or * for all",
                filter: client.data.get1HrDrawName
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
            timers: true
        }

        this.usage = `follow <${Object.keys(this.filterRequirements).join("|")}> <list|add|remove> [...] or just follow list`
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!(message.channel instanceof TextChannel) || message.guild == null)
            return message.reply("This command can only be executed in guild channels. You can invite this bot in your own server via `.invite`")

        if (!message.member?.hasPermission("ADMINISTRATOR") && !config.admins.includes(message.author.id))
            return message.reply("You do not have administrator rights in this server, and thus can't edit follows. If you still want to use this feature, add this bot in your own server via `.invite`")

        const { followManager } = client

        if (args.length < 2)
            if (args.length > 0 && ["list"].includes(args[0].toLowerCase())) {
                const following = followManager.following(message.guild)

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
                if (channels.length == 0) return message.channel.send("Following nothing")

                return message.channel.send(`Following per category: \`\`\`
${createTable(
        ["Category", "|", "Channel", "|", "Amount"],
        channels.map(
            k => [k.category, "|", k.channelname, "|", k.amount]
        ))}\`\`\``, {
                    split: {
                        append: "```",
                        prepend: "```",
                        maxLength: 1900
                    }
                })
            } else
                return message.reply(`Usage: \`${this.usage}\``)

        const category: FollowCategory | undefined = Object.keys(this.filterRequirements).find(r => r.toLowerCase() == args[0].toLowerCase()) as (FollowCategory | undefined)
        if (!category)
            return message.reply(`Unknown category \`${args[0]}\`, valid categories: ${Object.keys(this.filterRequirements).map(k => `\`${k}\``).join(", ")}`)

        if (["list", "l"].includes(args[1].toLowerCase())) {
            const follows = followManager.getFollows(message.channel, category)
            if (follows.length == 0) return message.channel.send(`Following nothing in ${category}`)
            return message.channel.send(`Following ${category}: \`\`\`
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
        ))}\`\`\``, {
                split: {
                    append: "```",
                    prepend: "```",
                    maxLength: 1900
                }
            })
        } else if (["remove", "delete", "d", "r", "disable", "off", "follow"].includes(args[1].toLowerCase())) {
            const filterer = this.filterRequirements[category]
            let filter = args.slice(2).join(" ")

            if (filterer === true) filter = "*"
            else if (!followManager.follows(message.channel, category, filter)) {
                const filtered = filterer.filter(args.slice(2).join(" "))

                if (filtered == undefined)
                    return message.channel.send(`Unknown filter for category ${category}: ${filterer.words}`)
                filter = filtered
            }

            if (filter == "*") {
                followManager.dropChannelCategory(message.channel.id, category)
                return message.channel.send(`Yeeted everything out of ${category} in <#${message.channel.id}>`)
            }

            if (!followManager.follows(message.channel, category, filter))
                return message.reply(`Can't unfollow what is not being followed in <#${message.channel.id}>`)

            followManager.unfollow(message.channel, category, filter)
            return message.channel.send(`Yeeted ${filter} out of ${category} in <#${message.channel.id}>`)
        } else if (["add", "a", "follow", "enable", "on", "unfollow"].includes(args[1].toLowerCase())) {
            const filterer = this.filterRequirements[category]

            if (filterer == true) {
                followManager.dropChannelCategory(message.channel.id, category)
                followManager.addFollow(message.guild, message.channel, category, message.author, "*")
                return message.channel.send(`Now following ${category} in <#${message.channel.id}>`)
            }

            const filter = filterer.filter(args.slice(2).join(" "))
            if (filter == undefined)
                return message.channel.send(`Unknown filter for category ${category}: ${filterer.words}`)

            if (filter == "*")
                followManager.dropChannelCategory(message.channel.id, category)
            followManager.addFollow(message.guild, message.channel, category, message.author, filter)
            return message.channel.send(`Now following ${category} of ${filter} in <#${message.channel.id}>`)
        } else
            return message.reply(`Usage: \`${this.usage}\``)
    }
}
