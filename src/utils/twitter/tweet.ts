export type TwitterUser = {
    id: string,
    name: string,
    displayName: string,
    created: string,
    following: number,
    followers: number
    bannerUrl: string,
    profileImageUrl: string,
    url: string,
    tweets: number,
    description: string
}

export type Tweet = {
    id: string,
    conversationId: string,
    created: string,
    createdBy: TwitterUser,
    content: string,
    lang: string,
    likes: number,
    bookmarks: number,
    retweets: number,
    quotes: number,
    replies: number
}