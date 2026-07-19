export interface NewsDTO {
    id: string;
    message: string;
    createdAt: string | null;
    seen: boolean;
}

export interface NewsFeedDTO {
    news: NewsDTO[];
    unreadCount: number;
    readCursor: number;
}

export interface UnreadNewsCountDTO {
    unreadCount: number;
}

export interface MarkNewsSeenRequestDTO {
    upToSequence: number;
}