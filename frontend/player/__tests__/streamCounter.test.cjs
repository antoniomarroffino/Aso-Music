const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const loadTypeScriptModule = (sourcePath) => {
    const compiled = ts.transpileModule(
        fs.readFileSync(sourcePath, "utf8"),
        {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2022,
            },
            fileName: sourcePath,
        },
    ).outputText;

    const loadedModule = {exports: {}};

    new Function(
        "exports",
        "module",
        "require",
        compiled,
    )(loadedModule.exports, loadedModule, require);

    return loadedModule.exports;
};

const {createStreamCounter} = loadTypeScriptModule(
    path.resolve(
        __dirname,
        "../streamCounter.ts",
    ),
);

const {
    buildOrderedSongQueue,
    pickDjNextSong,
    uniqueSongs,
} = loadTypeScriptModule(
    path.resolve(
        __dirname,
        "../queueStrategy.ts",
    ),
);

const song = (albumId, id) => ({
    albumId,
    id,
    title: `${albumId}-${id}`,
});

const identity = {
    albumId: "album-1",
    songId: "song-1",
    queueSessionId: "queue-1",
    streamKey: "queue-1:album-1:song-1",
};

test("registra una sola stream al raggiungimento dei 20 secondi", async () => {
    const calls = [];
    const updates = [];
    const counter = createStreamCounter({
        registerStream: async (receivedIdentity, listenId) => {
            calls.push({receivedIdentity, listenId});
            return {
                songId: receivedIdentity.songId,
                listenCount: 42,
                incremented: true,
            };
        },
        onRegistered: (_receivedIdentity, result) => {
            updates.push(result.listenCount);
        },
    });

    assert.equal(
        await counter.registerProgress(identity, 19.9, "media-1", "media-1"),
        false,
    );
    assert.equal(
        await counter.registerProgress(identity, 20, "media-1", "media-1"),
        true,
    );
    assert.equal(
        await counter.registerProgress(identity, 21, "media-1", "media-1"),
        false,
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0].listenId, "queue-1:album-1:song-1:0");
    assert.deepEqual(updates, [42]);
});

test("ritenta dopo un errore HTTP senza perdere la stream", async () => {
    let callCount = 0;
    const counter = createStreamCounter({
        registerStream: async () => {
            callCount += 1;

            if (callCount === 1) {
                throw new Error("rete non disponibile");
            }

            return {
                songId: identity.songId,
                listenCount: 8,
                incremented: true,
            };
        },
    });

    await assert.rejects(
        counter.registerProgress(identity, 20),
        /rete non disponibile/,
    );

    assert.equal(
        await counter.registerProgress(identity, 21),
        true,
    );
    assert.equal(callCount, 2);
});

test("ignora eventi appartenenti a una traccia non più attiva", async () => {
    let callCount = 0;
    const counter = createStreamCounter({
        registerStream: async () => {
            callCount += 1;
            return {
                songId: identity.songId,
                listenCount: 1,
                incremented: true,
            };
        },
    });

    assert.equal(
        await counter.registerProgress(identity, 20, "old-media", "new-media"),
        false,
    );
    assert.equal(callCount, 0);
});

test("una nuova riproduzione della stessa traccia crea un nuovo listenId", async () => {
    const listenIds = [];
    const counter = createStreamCounter({
        registerStream: async (_receivedIdentity, listenId) => {
            listenIds.push(listenId);
            return {
                songId: identity.songId,
                listenCount: listenIds.length,
                incremented: true,
            };
        },
    });

    await counter.registerProgress(identity, 20);
    await counter.registerProgress(identity, 0.5);
    await counter.registerProgress(identity, 20);

    assert.deepEqual(listenIds, [
        "queue-1:album-1:song-1:0",
        "queue-1:album-1:song-1:1",
    ]);
});

test("la soglia produce la POST attesa e usa il conteggio restituito dal backend", async () => {
    const previousApiUrl =
        process.env.EXPO_PUBLIC_API_URL;
    const previousFetch =
        global.fetch;

    process.env.EXPO_PUBLIC_API_URL =
        "https://api.example.test/api";

    const requests = [];

    global.fetch = async (url, init) => {
        requests.push({url, init});

        return new Response(
            JSON.stringify({
                songId: "song-1",
                title: "Brano",
                listenCount: 43,
                artistNames: ["Artista"],
                incremented: true,
            }),
            {
                status: 200,
                headers: {
                    "Content-Type":
                        "application/json",
                },
            },
        );
    };

    try {
        const {incrementStreamCount} =
            loadTypeScriptModule(
                path.resolve(
                    __dirname,
                    "../../api/songs.ts",
                ),
            );

        const result =
            await incrementStreamCount(
                "album/uno",
                "song uno",
                "listen-123",
            );

        assert.equal(requests.length, 1);
        assert.equal(
            requests[0].url,
            "https://api.example.test/api/songs/album%2Funo/songs/song%20uno/listen",
        );
        assert.equal(
            requests[0].init.method,
            "POST",
        );
        assert.deepEqual(
            JSON.parse(requests[0].init.body),
            {listenId: "listen-123"},
        );
        assert.equal(result.listenCount, 43);
    } finally {
        global.fetch = previousFetch;

        if (previousApiUrl === undefined) {
            delete process.env.EXPO_PUBLIC_API_URL;
        } else {
            process.env.EXPO_PUBLIC_API_URL =
                previousApiUrl;
        }
    }
});

test("DJ Cheddar sceglie dall'intera discografia ed evita la cronologia recente", () => {
    const catalog = [
        song("album-1", "song-1"),
        song("album-1", "song-2"),
        song("album-2", "song-3"),
        song("album-3", "song-4"),
    ];
    const history = [
        catalog[0],
        catalog[1],
        catalog[2],
    ];

    const next = pickDjNextSong(
        catalog,
        history,
        () => 0,
    );

    assert.equal(next, catalog[3]);
    assert.deepEqual(history, [
        catalog[0],
        catalog[1],
        catalog[2],
    ]);
});

test("DJ Cheddar mantiene brani omonimi di album diversi ma elimina i duplicati reali", () => {
    const first = song(
        "album-1",
        "song-1",
    );
    const sameIdOtherAlbum =
        song(
            "album-2",
            "song-1",
        );

    assert.deepEqual(
        uniqueSongs([
            first,
            first,
            sameIdOtherAlbum,
        ]),
        [
            first,
            sameIdOtherAlbum,
        ],
    );
});

test("la coda contestuale conserva l'ordine mostrato e scarta i risultati non musicali", () => {
    const first = song(
        "album-2",
        "song-8",
    );
    const second = song(
        "album-1",
        "song-3",
    );
    const displayedResults = [
        {type: "artist"},
        {type: "song", value: first},
        {type: "album"},
        {type: "song", value: second},
    ];

    assert.deepEqual(
        buildOrderedSongQueue(
            displayedResults,
            (item) =>
                item.type === "song"
                    ? item.value
                    : null,
        ),
        [first, second],
    );
});
