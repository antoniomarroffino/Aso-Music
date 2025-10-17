import { useQuery } from "@tanstack/react-query";
import { albumsApi } from "../api/albums";

export const useAlbums = () => {
    return useQuery({
        queryKey: ["albums"],
        queryFn: albumsApi.getAllAlbums,
        staleTime: 1000 * 60 * 5,
    });
};