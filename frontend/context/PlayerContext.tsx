import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { SongDTO } from "@/types/music";

type PlayerContextType = {
    currentSong: SongDTO | null;
    isPlaying: boolean;
    playSong: (song: SongDTO, queue?: SongDTO[], startIndex?: number) => void;
    togglePlayPause: () => void;
    stopSong: () => void;
    nextSong: () => void;
    prevSong: () => void;
    progress: number;
    duration: number;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [currentSong, setCurrentSong] = useState<SongDTO | null>(null);
    const [currentQueue, setCurrentQueue] = useState<SongDTO[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [source, setSource] = useState<{ uri: string } | undefined>();

    const player = useAudioPlayer(source);
    const status = useAudioPlayerStatus(player);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (status) setIsPlaying(status.playing ?? false);
    }, [status]);

    useEffect(() => {
        if (source) player.play();
    }, [player, source]);

    /** 🔹 Riproduce una canzone e, opzionalmente, una queue */
    const playSong = (song: SongDTO, queue?: SongDTO[], startIndex?: number) => {
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
    };

    const togglePlayPause = () => {
        if (isPlaying) player.pause();
        else player.play();
    };

    const stopSong = () => {
        player.pause();
        player.seekTo(0);
        setIsPlaying(false);
        setCurrentSong(null);
        setSource(undefined);
        setCurrentQueue([]);
    };

    /** 🔹 Traccia successiva con logica circolare */
    const nextSong = () => {
        if (!currentQueue.length) return;
        const nextIndex = (currentIndex + 1) % currentQueue.length;
        const next = currentQueue[nextIndex];
        setCurrentIndex(nextIndex);
        setCurrentSong(next);
        setSource({ uri: next.audioURL });
    };

    /** 🔹 Traccia precedente con logica circolare */
    const prevSong = () => {
        if (!currentQueue.length) return;
        const prevIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
        const prev = currentQueue[prevIndex];
        setCurrentIndex(prevIndex);
        setCurrentSong(prev);
        setSource({ uri: prev.audioURL });
    };

    const progress = status?.currentTime ?? 0;
    const duration = status?.duration ?? 0;

    return (
        <PlayerContext.Provider
            value={{
                currentSong,
                isPlaying,
                playSong,
                togglePlayPause,
                stopSong,
                nextSong,
                prevSong,
                progress,
                duration,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const ctx = useContext(PlayerContext);
    if (!ctx) throw new Error("usePlayer deve essere usato dentro <PlayerProvider>");
    return ctx;
};
