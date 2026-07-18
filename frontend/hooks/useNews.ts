import {
    useQuery,
} from "@tanstack/react-query";
import {newsQueryOptions} from "@/hooks/queryOptions";

export function useNews() {
    return useQuery(
        newsQueryOptions(),
    );
}