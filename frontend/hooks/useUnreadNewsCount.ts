import {
    useQuery,
} from "@tanstack/react-query";

import {
    unreadNewsCountQueryOptions,
} from "@/hooks/queryOptions";

export function useUnreadNewsCount() {
    return useQuery(
        unreadNewsCountQueryOptions(),
    );
}