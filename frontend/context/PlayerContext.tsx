import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useRef,
} from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { SongDTO } from "@/types/music";
import { incrementStreamCount } from "@/api/songs"; // 👈 chiamata API

type PlayerContextType = {
    currentSong: SongDTO | null;
    nextSong: SongDTO | null;
    isPlaying: boolean;
    playSong: (
        song: SongDTO,
        queue?: SongDTO[],
        startIndex?: number,
        albumId?: string
    ) => void;
    togglePlayPause: () => void;
    stopSong: () => void;
    nextSongAction: () => void;
    prevSong: () => void;
    seekTo: (seconds: number) => void;
    progress: number;
    duration: number;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [currentSong, setCurrentSong] = useState<SongDTO | null>(null);
    const [currentQueue, setCurrentQueue] = useState<SongDTO[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [source, setSource] = useState<{ uri: string } | undefined>();
    const [currentAlbumId, setCurrentAlbumId] = useState<string | null>(null);

    const player = useAudioPlayer(source);
    const status = useAudioPlayerStatus(player);
    const [isPlaying, setIsPlaying] = useState(false);

    const isSeekingRef = useRef(false);
    const wasPlayingBeforeSeek = useRef(false);

    const lastStreamedSongId = useRef<string | null>(null);
    const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // ✅ FIX TYPE

    const nextSong =
        currentQueue.length > 0
            ? currentQueue[(currentIndex + 1) % currentQueue.length]
            : null;

    useEffect(() => {
        if (status && !isSeekingRef.current) {
            setIsPlaying(status.playing ?? false);
        }
    }, [status]);

    useEffect(() => {
        if (source) player.play();
    }, [player, source]);

    useEffect(() => {
        if (!status) return;
        if (status.didJustFinish) {
            nextSongAction();
        }
    }, [status]);

    /** 🎵 Avvia la riproduzione e imposta il timer per incrementare gli stream */
    const playSong = (
        song: SongDTO,
        queue?: SongDTO[],
        startIndex?: number,
        albumId?: string
    ) => {
        // 🔹 reset del timer precedente
        if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
        }

        // 🔹 salva album corrente
        if (albumId) setCurrentAlbumId(albumId);

        // 🔹 gestione della queue
        if (queue && queue.length > 0) {
            setCurrentQueue(queue);
            const index =
                typeof startIndex === "number"
                    ? startIndex
                    : queue.findIndex((s) => s.id === song.id);
            setCurrentIndex(index !== -1 ? index : 0);
        } else if (currentQueue.length > 0) {
            const idx = currentQueue.findIndex((s) => s.id === song.id);
            setCurrentIndex(idx !== -1 ? idx : 0);
        } else {
            setCurrentQueue([song]);
            setCurrentIndex(0);
        }

        setCurrentSong(song);
        setSource({ uri: song.audioURL });

        // 🔥 Incrementa stream dopo 20 secondi
        if (albumId && song.id) {
            streamTimeoutRef.current = setTimeout(() => {
                if (lastStreamedSongId.current !== song.id) {
                    lastStreamedSongId.current = song.id;
                    console.log(`🎧 Incremento stream per "${song.title}" (${albumId})`);
                    incrementStreamCount(albumId, song.id);
                }
            }, 20000);
        }
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            player.pause();
            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
                streamTimeoutRef.current = null;
            }
        } else {
            player.play();

            // se riprende, fai ripartire il timer solo se non ancora conteggiato
            if (
                currentSong &&
                currentAlbumId &&
                lastStreamedSongId.current !== currentSong.id
            ) {
                streamTimeoutRef.current = setTimeout(() => {
                    console.log(`🎧 Incremento stream (ripresa) per "${currentSong.title}"`);
                    incrementStreamCount(currentAlbumId, currentSong.id);
                    lastStreamedSongId.current = currentSong.id;
                }, 20000);
            }
        }
    };

    const stopSong = () => {
        player.pause();
        player.seekTo(0);
        setIsPlaying(false);
        setCurrentSong(null);
        setSource(undefined);
        setCurrentQueue([]);
        setCurrentAlbumId(null);

        if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
        }
    };

    const nextSongAction = () => {
        if (!currentQueue.length) return;
        const nextIndex = (currentIndex + 1) % currentQueue.length;
        const next = currentQueue[nextIndex];
        setCurrentIndex(nextIndex);
        setCurrentSong(next);
        setSource({ uri: next.audioURL });

        if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
        }

        if (currentAlbumId && next.id) {
            streamTimeoutRef.current = setTimeout(() => {
                console.log(`🎧 Incremento stream per "${next.title}" (${currentAlbumId})`);
                incrementStreamCount(currentAlbumId, next.id);
                lastStreamedSongId.current = next.id;
            }, 20000);
        }
    };

    const prevSong = () => {
        if (!currentQueue.length) return;
        const prevIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
        const prev = currentQueue[prevIndex];
        setCurrentIndex(prevIndex);
        setCurrentSong(prev);
        setSource({ uri: prev.audioURL });

        if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
        }

        if (currentAlbumId && prev.id) {
            streamTimeoutRef.current = setTimeout(() => {
                console.log(`🎧 Incremento stream per "${prev.title}" (${currentAlbumId})`);
                incrementStreamCount(currentAlbumId, prev.id);
                lastStreamedSongId.current = prev.id;
            }, 20000);
        }
    };

    const seekTo = (seconds: number) => {
        if (!player) return;
        isSeekingRef.current = true;
        wasPlayingBeforeSeek.current = isPlaying;
        player.seekTo(seconds);
        setTimeout(() => {
            isSeekingRef.current = false;
            if (wasPlayingBeforeSeek.current && !status?.playing) {
                player.play();
            }
        }, 200);
    };

    const progress = status?.currentTime ?? 0;
    const duration = status?.duration ?? 0;

    return (
        <PlayerContext.Provider
            value={{
                currentSong,
                nextSong,
                isPlaying,
                playSong,
                togglePlayPause,
                stopSong,
                nextSongAction,
                prevSong,
                progress,
                duration,
                seekTo,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const ctx = useContext(PlayerContext);
    if (!ctx)
        throw new Error("usePlayer deve essere usato dentro <PlayerProvider>");
    return ctx;
};
