import {
    getAuth,
} from "firebase/auth";

const BASE_URL =
    process.env.EXPO_PUBLIC_API_URL;

interface BackendErrorResponse {
    code?: string;
    message?: string;
}

export class ApiError extends Error {
    readonly status: number;
    readonly code?: string;

    constructor(
        status: number,
        message: string,
        code?: string,
    ) {
        super(message);

        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}

function getApiBaseUrl(): string {
    if (!BASE_URL) {
        throw new Error(
            "EXPO_PUBLIC_API_URL non configurata",
        );
    }

    return BASE_URL.replace(
        /\/+$/,
        "",
    );
}

function buildApiUrl(
    path: string,
): string {
    const normalizedPath =
        path.startsWith("/")
            ? path
            : `/${path}`;

    return `${getApiBaseUrl()}${normalizedPath}`;
}

async function getFirebaseIdToken(): Promise<string> {
    const auth =
        getAuth();

    /*
     * Evita di leggere currentUser mentre Firebase
     * sta ancora ripristinando la sessione persistita.
     */
    await auth.authStateReady();

    const currentUser =
        auth.currentUser;

    if (!currentUser) {
        throw new ApiError(
            401,
            "Utente non autenticato",
            "USER_NOT_AUTHENTICATED",
        );
    }

    return currentUser.getIdToken();
}

export async function authenticatedFetch(
    path: string,
    init: RequestInit = {},
): Promise<Response> {
    const idToken =
        await getFirebaseIdToken();

    const headers =
        new Headers(init.headers);

    headers.set(
        "Authorization",
        `Bearer ${idToken}`,
    );

    /*
     * Non impostiamo automaticamente application/json
     * per FormData, perché fetch deve generare il boundary.
     */
    if (
        typeof init.body === "string" &&
        !headers.has("Content-Type")
    ) {
        headers.set(
            "Content-Type",
            "application/json",
        );
    }

    return fetch(
        buildApiUrl(path),
        {
            ...init,
            headers,
        },
    );
}

export async function readJsonResponse<T>(
    response: Response,
    operationName: string,
): Promise<T> {
    if (!response.ok) {
        const error =
            await readErrorResponse(response);

        throw new ApiError(
            response.status,
            error.message ??
            `${operationName} fallita con stato ${response.status}`,
            error.code,
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const body: unknown =
        await response.json();

    return body as T;
}

async function readErrorResponse(
    response: Response,
): Promise<BackendErrorResponse> {
    const contentType =
        response.headers.get(
            "content-type",
        );

    if (
        contentType?.includes(
            "application/json",
        )
    ) {
        try {
            const body: unknown =
                await response.json();

            if (isRecord(body)) {
                return {
                    code:
                        typeof body.code ===
                        "string"
                            ? body.code
                            : undefined,

                    message:
                        typeof body.message ===
                        "string"
                            ? body.message
                            : undefined,
                };
            }
        } catch {
            return {};
        }
    }

    try {
        const message =
            await response.text();

        return {
            message:
                message.trim() ||
                undefined,
        };
    } catch {
        return {};
    }
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null
    );
}