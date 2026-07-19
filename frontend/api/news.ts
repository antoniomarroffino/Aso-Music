import {
    authenticatedFetch,
    readJsonResponse,
} from "@/api/http";

import {
    MarkNewsSeenRequestDTO,
    NewsFeedDTO,
    UnreadNewsCountDTO,
} from "@/types/news";

/**
 * Recupera tutte le news con lo stato
 * letto/non letto dell'utente autenticato.
 */
export async function fetchAllNews(
    signal?: AbortSignal,
): Promise<NewsFeedDTO> {
    const response =
        await authenticatedFetch(
            "/news/all",
            {
                method: "GET",
                signal,
            },
        );

    return readJsonResponse<NewsFeedDTO>(
        response,
        "Recupero delle news",
    );
}

/**
 * Recupera soltanto il numero di news
 * non ancora viste dall'utente.
 */
export async function fetchUnreadNewsCount(
    signal?: AbortSignal,
): Promise<UnreadNewsCountDTO> {
    const response =
        await authenticatedFetch(
            "/news/unread-count",
            {
                method: "GET",
                signal,
            },
        );

    return readJsonResponse<UnreadNewsCountDTO>(
        response,
        "Recupero del numero di news non lette",
    );
}

/**
 * Marca come viste tutte le news fino
 * alla sequenza indicata.
 */
export async function markNewsAsSeen(
    request: MarkNewsSeenRequestDTO,
    signal?: AbortSignal,
): Promise<UnreadNewsCountDTO> {
    if (
        !Number.isSafeInteger(
            request.upToSequence,
        ) ||
        request.upToSequence < 0
    ) {
        throw new RangeError(
            "upToSequence deve essere un intero non negativo",
        );
    }

    const response =
        await authenticatedFetch(
            "/news/mark-seen",
            {
                method: "POST",
                signal,
                body: JSON.stringify(
                    request,
                ),
            },
        );

    return readJsonResponse<UnreadNewsCountDTO>(
        response,
        "Aggiornamento delle news visualizzate",
    );
}