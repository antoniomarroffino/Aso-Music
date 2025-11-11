import { useQuery } from "@tanstack/react-query";
import { NewsDTO } from "@/types/news";
import { fetchAllNews } from "@/api/news";

/**
 * Hook React Query per gestire la cache e il recupero delle news
 */
export function useNews() {
    return useQuery<NewsDTO[]>({
        queryKey: ["news"],
        queryFn: fetchAllNews,
        staleTime: 1000 * 60 * 5, // 5 minuti di cache
        refetchOnMount: true,
    });
}
