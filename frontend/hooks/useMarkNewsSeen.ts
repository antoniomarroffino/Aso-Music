import {
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import {
    markNewsAsSeen,
} from "@/api/news";
import {
    MarkNewsSeenRequestDTO,
    NewsFeedDTO,
    UnreadNewsCountDTO,
} from "@/types/news";
import {
    queryKeys,
} from "@/hooks/queryKeys";

export function useMarkNewsSeen() {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: (
            request:
            MarkNewsSeenRequestDTO,
        ) =>
            markNewsAsSeen(
                request,
            ),

        onSuccess: (
            response,
            request,
        ) => {
            queryClient.setQueryData<
                UnreadNewsCountDTO
            >(
                queryKeys.news
                    .unreadCount,
                response,
            );

            queryClient.setQueryData<
                NewsFeedDTO
            >(
                queryKeys.news.all,
                (currentFeed) => {
                    if (!currentFeed) {
                        return currentFeed;
                    }

                    /*
                     * Normalmente viene inviato il readCursor
                     * del feed attualmente visualizzato.
                     */
                    const coversCurrentFeed =
                        request.upToSequence >=
                        currentFeed.readCursor;

                    return {
                        ...currentFeed,

                        unreadCount:
                        response.unreadCount,

                        news:
                            coversCurrentFeed
                                ? currentFeed.news.map(
                                    (news) => ({
                                        ...news,
                                        seen: true,
                                    }),
                                )
                                : currentFeed.news,
                    };
                },
            );
        },
    });
}