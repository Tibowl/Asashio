import {
    APIRequest,
    APIRequestHeader,
    APIURLType,
    Authorization,
    Bearer,
    GraphQuery,
    GraphQueryIds,
    GuestToken,
    Tweet,
    TwitterURL,
    TwitterUser,
} from "./mod";

export type TwitterAuthHeaders = {
    authorization: string
}

export type TwitterAuthGuestTokenHeaders = TwitterAuthHeaders & {
    'x-guest-token': string
}

/**
 * URL search query parameters
 */
export class RequestQuery {
    data: Record<string, string> = {};

    constructor(data?: Record<string, unknown>) {
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                this.data[key] = typeof value === "string"
                    ? value
                    : JSON.stringify(value);
            });
        }
    }
}

export interface RequestOptions {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    urlType: APIURLType;
    path: string;
    cookie?: Map<string, string> | string;
    query?: RequestQuery;
    body?: Record<string, unknown>;
}

export class TwitterAPI {
    auth: Authorization;
    guestToken?: GuestToken;
    graphQueryIds?: GraphQueryIds;

    constructor(
        private _auth: Authorization = Bearer.Web,
    ) {
        this.auth = _auth;
    }

    /**
     * Refresh the guest token.
     */
    async refreshGuestToken() {
        this.guestToken = await GuestToken.getToken();
    }

    /**
     * Refresh the graph query id
     */
    async refreshGraphQueryIds() {
        this.graphQueryIds = await GraphQuery.getIds();
    }

    /**
     * Send HTTP request.
     * @param options
     * @returns
     * @example await request({
     *  method: "GET",
     *  urlType: "api/1.1",
     *  path: "/search/typeahead.json",
     * })
     */
    async request(options: RequestOptions): Promise<Response> {
        if (this.guestToken === undefined) {
            await this.refreshGuestToken();
        }

        const header = APIRequestHeader({
            cookie: options.cookie,
            guestToken: this.guestToken!.token,
            auth: {
                type: this.auth.type,
                token: this.auth.token,
            },
        });

        const path: string = await (async () => {
            if (this.graphQueryIds == null) {
                await this.refreshGraphQueryIds();
            }

            if (options.urlType == "gql") {
                const id = this.graphQueryIds!.get(options.path);
                if (id == undefined) {
                    throw new Error(`Graph query id not found: ${options.path}`);
                }
                return `/${id}/${options.path}`;
            } else {
                return options.path;
            }
        })();

        const res = await APIRequest({
            method: options.method,
            url: TwitterURL.API(options.urlType),
            path: path,
            headers: header,
            query: options.query?.data,
            body: options.body,
        });

        return res;
    }

    static async getGuestToken(): Promise<GuestToken> {
        return await GuestToken.getToken();
    }

    async getUserByRestId(userId: string) {
        const query = new RequestQuery({
            variables: {
                userId,
                withSafetyModeUserFields: true,
            },
            features: {
                blue_business_profile_image_shape_enabled: true,
                responsive_web_graphql_exclude_directive_enabled: true,
                verified_phone_label_enabled: false,
                highlights_tweets_tab_ui_enabled: true,
                creator_subscriptions_tweet_preview_api_enabled: false,
                responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
                responsive_web_graphql_timeline_navigation_enabled: true,
                hidden_profile_likes_enabled: true,
                subscriptions_verification_info_verified_since_enabled: true
            }
        });
        const response = await this.request({
            method: "GET",
            urlType: "gql",
            path: "UserByRestId",
            query: query
        });
        return response;
    }

    async getUserByScreenNameGql(screenName: string) {
        const query = new RequestQuery({
            variables: {
                screen_name: screenName,
                withSafetyModeUserFields: true
            },
            features: {
                blue_business_profile_image_shape_enabled: true,
                responsive_web_graphql_exclude_directive_enabled: true,
                verified_phone_label_enabled: false,
                highlights_tweets_tab_ui_enabled: true,
                creator_subscriptions_tweet_preview_api_enabled: false,
                responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
                responsive_web_graphql_timeline_navigation_enabled: true,
                hidden_profile_likes_enabled: true,
                subscriptions_verification_info_verified_since_enabled: true
            }
        });
        const response = await this.request({
            method: "GET",
            urlType: "gql",
            path: "UserByScreenName",
            query: query
        });
        return response;
    }

    async getUserByScreenName(screenName: string) : Promise<TwitterUser> {
        const res = await this.getUserByScreenNameGql(screenName);
        const json = await res.json();
        const userGql = json.data.user.result;
        return this.formatUser(userGql);
    }

    async getUserTweetsGql(userId: string) {
        const query = new RequestQuery({
            variables: {
                userId,
                count: 20,
                includePromotedContent: true,
                withQuickPromoteEligibilityTweetFields: true,
                withVoice: true,
                withV2Timeline: true,
            },
            features: {
                blue_business_profile_image_shape_enabled: true,
                responsive_web_graphql_exclude_directive_enabled: true,
                verified_phone_label_enabled: false,
                responsive_web_graphql_timeline_navigation_enabled: true,
                responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
                tweetypie_unmention_optimization_enabled: true,
                vibe_api_enabled: true,
                responsive_web_edit_tweet_api_enabled: true,
                graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
                view_counts_everywhere_api_enabled: true,
                longform_notetweets_consumption_enabled: true,
                tweet_awards_web_tipping_enabled: false,
                freedom_of_speech_not_reach_fetch_enabled: false,
                standardized_nudges_misinfo: true,
                tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
                interactive_text_enabled: true,
                responsive_web_text_conversations_enabled: false,
                longform_notetweets_rich_text_read_enabled: true,
                responsive_web_enhance_cards_enabled: false,
                creator_subscriptions_tweet_preview_api_enabled: true,
                longform_notetweets_inline_media_enabled: true,
                rweb_lists_timeline_redesign_enabled: true
            }
        });
        const response = await this.request({
            method: "GET",
            urlType: "gql",
            path: "UserTweets",
            query: query
        });
        return response;
    }

    async getUserTweets(userId: string, lastTweetId: string = '0'): Promise<Array<Tweet>> {
        const res = await this.getUserTweetsGql(userId);
        const json = await res.json();
        let tweetsGql = json.data.user.result.timeline_v2.timeline.instructions[1].entries;
        const tweets = this.formatTweets(tweetsGql, lastTweetId);
        return tweets;
    }

    async getUserTweetsAndReplies(userId: string) {
        const query = new RequestQuery({
            variables: {
                userId,
                count: 20,
                includePromotedContent: true,
                withCommunity: true,
                withVoice: true,
                withV2Timeline: true,
              },
              features: {
                blue_business_profile_image_shape_enabled: true,
                responsive_web_graphql_exclude_directive_enabled: true,
                verified_phone_label_enabled: false,
                responsive_web_graphql_timeline_navigation_enabled: true,
                responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
                tweetypie_unmention_optimization_enabled: true,
                vibe_api_enabled: true,
                responsive_web_edit_tweet_api_enabled: true,
                graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
                view_counts_everywhere_api_enabled: true,
                longform_notetweets_consumption_enabled: true,
                tweet_awards_web_tipping_enabled: false,
                freedom_of_speech_not_reach_fetch_enabled: false,
                standardized_nudges_misinfo: true,
                tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
                interactive_text_enabled: true,
                responsive_web_text_conversations_enabled: false,
                longform_notetweets_rich_text_read_enabled: true,
                responsive_web_enhance_cards_enabled: false,
              }
        });
        const response = await this.request({
            method: "GET",
            urlType: "gql",
            path: "UserTweetsAndReplies",
            query: query
        });
        return response;
    }

    async getAudioSpaceById(id: string) {
        const query = new RequestQuery({
            variables: {
                id,
                isMetatagsQuery: false,
                withReplays: true,
              },
              features: {
                spaces_2022_h2_clipping: true,
                spaces_2022_h2_spaces_communities: true,
                blue_business_profile_image_shape_enabled: true,
                responsive_web_graphql_exclude_directive_enabled: true,
                verified_phone_label_enabled: false,
                responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
                tweetypie_unmention_optimization_enabled: true,
                vibe_api_enabled: true,
                responsive_web_edit_tweet_api_enabled: true,
                graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
                view_counts_everywhere_api_enabled: true,
                longform_notetweets_consumption_enabled: true,
                tweet_awards_web_tipping_enabled: false,
                freedom_of_speech_not_reach_fetch_enabled: false,
                standardized_nudges_misinfo: true,
                tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
                responsive_web_graphql_timeline_navigation_enabled: true,
                interactive_text_enabled: true,
                responsive_web_text_conversations_enabled: false,
                longform_notetweets_rich_text_read_enabled: true,
                responsive_web_enhance_cards_enabled: false,
              }
        });
        const response = await this.request({
            method: "GET",
            urlType: "gql",
            path: "AudioSpaceById",
            query: query
        });
        return response;
    }

    
    formatTweets(tweets: any, lastTweetId: string): Array<Tweet> {
        const result: Array<Tweet> = []

        tweets.forEach((tweetGql:any) => {
            if (tweetGql.entryId.startsWith("cursor-")) {
                console.log(`skipped entry ${tweetGql.entryId}`);
                return;
            }
            const tweet:any = tweetGql.content.itemContent.tweet_results.result.legacy;
            const user:any = tweetGql.content.itemContent.tweet_results.result.core.user_results.result;

            if (tweet.id_str <= lastTweetId) return;

            result.push({
                id: tweet.id_str,
                conversationId: tweet.conversation_id_str,
                content: tweet.full_text,
                lang: tweet.lang,
                likes: tweet.favorite_count,
                bookmarks: tweet.bookmark_count,
                retweets: tweet.retweet_count,
                quotes: tweet.quote_count,
                replies: tweet.reply_count,
                created: tweet.created_at,
                createdBy: this.formatUser(user)
            });
        });

        return result;
    }

    formatUser(user: any): TwitterUser {
        return {
            id: user.rest_id,
            name: user.legacy.screen_name,
            displayName: user.legacy.name,
            created: user.legacy.created_at,
            following: user.legacy.friends_count,
            followers: user.legacy.followers_count,
            bannerUrl: user.legacy.profile_banner_url,
            profileImageUrl: user.legacy.profile_image_url_https,
            url: user.legacy.url,
            tweets: user.legacy.statuses_count,
            description: user.legacy.description
        };
    }
}