import {
    ArtistDTO,
    ArtistSongsDTO,
} from "@/types/music";

const rawBaseUrl =
    process.env.EXPO_PUBLIC_API_URL;

const BASE_URL =
    rawBaseUrl?.replace(/\/+$/, "");

function buildApiUrl(
    path: string,
): string {
    if (!BASE_URL) {
        throw new Error(
            "EXPO_PUBLIC_API_URL non è configurata",
        );
    }

    return `${BASE_URL}${path}`;
}

async function parseJsonResponse<T>(
    response: Response,
    fallbackMessage: string,
): Promise<T> {
    if (response.ok) {
        return await response.json() as Promise<T>;
    }

    let responseMessage = "";

    try {
        responseMessage =
            await response.text();
    } catch {
        responseMessage = "";
    }

    throw new Error(
        responseMessage.trim() ||
        `${fallbackMessage}: ${response.status}`,
    );
}

export async function fetchAllArtists(
    signal?: AbortSignal,
): Promise<ArtistDTO[]> {
    const response = await fetch(
        buildApiUrl("/artists/all"),
        {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
            signal,
        },
    );

    return parseJsonResponse<ArtistDTO[]>(
        response,
        "Errore nel recupero degli artisti",
    );
}

export async function fetchArtistSongs(
    artistId: string,
    signal?: AbortSignal,
): Promise<ArtistSongsDTO> {
    const normalizedArtistId =
        artistId.trim();

    if (!normalizedArtistId) {
        throw new Error(
            "L'ID dell'artista è obbligatorio",
        );
    }

    const encodedArtistId =
        encodeURIComponent(
            normalizedArtistId,
        );

    const response = await fetch(
        buildApiUrl(
            `/artists/${encodedArtistId}/songs`,
        ),
        {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
            signal,
        },
    );

    return parseJsonResponse<ArtistSongsDTO>(
        response,
        "Errore nel recupero delle canzoni dell'artista",
    );
}