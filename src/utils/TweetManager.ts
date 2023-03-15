import { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError, TweetSearchV2StreamParams } from 'twitter-api-v2';
import Discord, { TextChannel } from "discord.js"
import log4js from "log4js"

import config from "../data/config.json"
import client from "../main"

const Logger = log4js.getLogger("TweetManager")
const twitter = new TwitterApi(config.twitter.v2.bearerToken)

interface Tweet {
    created_at: string
    user: User
    extended_tweet?: Tweet
    retweeted_status?: Tweet
    entities?: Entities
    extended_entities?: Entities
    text: string
    full_text?: string

    [key: string]: unknown
}

interface Entities {
    hashtags?: unknown[]
    media?: {
        media_url_https: string
        url: string
        type: "photo" | "video" | "animated_gif"

        [key: string]: unknown
    }[]
    user_mentions?: unknown[]
    symbols?: unknown[]
    urls?: {
        expanded_url: string
        url: string

        [key: string]: unknown
    }[]

    [key: string]: unknown
}

interface User {
    screen_name: string
    id_str: string
    profile_image_url_https: string

    [key: string]: unknown
}

export default class Tweetmanager {
    stream: TweetStream | undefined = undefined
    toFollow = config.toTweet

    async init(): Promise<void> {

        // Get and delete old rules if needed
        const rules = await twitter.v2.streamRules();
        if (rules.data?.length) {
            await twitter.v2.updateStreamRules({
                delete: { ids: rules.data.map(rule => rule.id) },
            })
        }

        await twitter.v2.updateStreamRules({
            add: [{ value: this.toFollow.map(u=>`from:${u}`).join(' OR ') }]
        })


        const searchOpts: Partial<TweetSearchV2StreamParams> = {
            'tweet.fields': ['referenced_tweets', 'author_id', 'created_at', 'entities'],
            'user.fields': ['username', 'profile_image_url'],
            'media.fields': ['url'],
            expansions: ['referenced_tweets.id', 'author_id', 'attachments.media_keys'],
          }

        this.stream = await twitter.v2.searchStream(searchOpts)
          
        this.stream.autoReconnect = true

        this.stream.on(ETwitterStreamEvent.Data, this.handleTweet)

        const kc1drawTweets = await twitter.v2.search("お題は (from:kancolle_1draw2)", searchOpts)
        for await (const tweet of kc1drawTweets) {
            Logger.info("Setting 1hdraw:\n" + tweet.text)
            this.set1hrDrawTweet(tweet, 'kancolle_1draw2', tweet.text)
            break
        }

        Logger.info(`Following ${this.toFollow.length} twitter account(s)!`)

    }

    getAuthor = (tweet: any): any => {
        return tweet.includes.users.find((user: any) => user.id == tweet.data.author_id)
    }

    handleTweet = async (tweet: any): Promise<void> => {
        let author = this.getAuthor(tweet)
        if (!this.toFollow.includes(author.username)) return
        const tweetLink = `https://twitter.com/${author.username}/status/${tweet.data.id}`
        let retweet: any
        if (tweet.referenced_tweets && tweet.referenced_tweets.length > 0 && tweet.referenced_tweets[0].type === "retweeted")
        {
            retweet = tweet.tweets.find((t: any) => t.id === tweet.referenced_tweets[0].id)
            author = tweet.includes.users.find((user: any) => user.id == retweet.author_id)
            if (this.toFollow.includes(author.username))
            return Logger.debug(`Skipping RT ${tweetLink}`)
        }

        let text = (retweet || tweet.data).text.replace("&gt;", ">").replace("&lt;", "<")

        if (author.username == "kancolle_1draw2") {
            if (text.includes("お題は"))
                this.set1hrDrawTweet(tweet, author.username, text)
            return
        }

        Logger.info(`Sending tweet to channels: ${tweetLink}`)

        //if (tweet.retweeted_status)
            //tweet = tweet.retweeted_status

        const embed = new Discord.MessageEmbed()
            .setAuthor(author.username as string, author.profile_image_url, `https://twitter.com/${author.username}`)
            //.setColor(`#${tweet.user.profile_background_color}`)

        // Tweet has media, don't embed it
        if (tweet.includes.media?.length > 0) {
            if (tweet.includes.media[0].type != "photo") {
                client.followManager.send("twitter", tweetLink).catch(e => Logger.error(e))
                return
            } else
                embed.setImage(tweet.includes.media[0].url)
        }


        if (tweet.data.entities) {
            const entities = tweet.data.entities

            if (entities.urls)
                for (const url of entities.urls)
                    text = text.replace(url.url, url.expanded_url)

            // Tweet has media, don't embed it
            if (entities.media) {
                if (entities.media[0].type != "photo") {
                    client.followManager.send("twitter", tweetLink).catch(e => Logger.error(e))
                    return
                } else
                    embed.setImage(entities.media[0].url)
            }

        }

        embed.setDescription(text)

        client.followManager.send("twitter", `<${tweetLink}>`, embed).catch(e => Logger.error(e))
    }

    shutdown = (): void => {
        if (this.stream !== undefined)
            this.stream.close()
    }

    set1hrDrawTweet(tweet: any, username: string, text: string): void {
        const match = text.match(/お題は(.*)(になります|となります)/)
        if (match?.length) {
            const ships = match![1].trim().replace(" (龍鳳)", "").split(" ").map((name) => {
                const candidate = client.data.get1HrDrawName(name)
                if (candidate)
                    return candidate

                client.channels.fetch("658083473818517505").then(channel => {
                    if (channel && channel instanceof TextChannel)
                        channel.send(`Unknown ship 1 hour draw ship! - ${name} <@127393188729192448>`).catch(e => Logger.error(e))
                }).catch(e => Logger.error("While fetching channel", e))

                return name
            })

            if (client.data.store.cachedShips?.ships.join(", ") != ships.join(", ")) {
                Logger.info("Changed ships!")
                client.followManager.send(
                    "1hrdraw",
                    `Today's 1h draw ships: ${
                        ships.map(s => `**${s}**`).join(", ").replace(/,([^,]*)$/, " and$1")
                    }`,
                    undefined,
                    ships
                ).catch(e => Logger.error(e))
            }

            const date = new Date(tweet.data?.created_at || tweet.created_at).toLocaleString("en-UK", {
                timeZone: "Asia/Tokyo",
                timeZoneName: "short",
                hour12: false,
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })

            client.data.store.cachedShips = {
                screen_name: username,
                ships,
                date
            }
            client.data.saveStore()

            Logger.info(`Cached data set to: ${ships.join(", ")} at ${date}`)
        }
    }
}
