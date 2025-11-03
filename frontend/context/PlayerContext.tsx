import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { SongDTO } from "@/types/music";

type PlayerContextType = {
    currentSong: SongDTO | null;
    nextSong: SongDTO | null;
    isPlaying: boolean;
    playSong: (song: SongDTO, queue?: SongDTO[], startIndex?: number) => void;
    togglePlayPause: () => void;
    stopSong: () => void;
    nextSongAction: () => void;
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

    /** 🧠 Stato derivato: canzone successiva */
    const nextSong =
        currentQueue.length > 0
            ? currentQueue[(currentIndex + 1) % currentQueue.length]
            : null;

    /** 🔹 Aggiorna flag di riproduzione */
    useEffect(() => {
        if (status) setIsPlaying(status.playing ?? false);
    }, [status]);

    /** 🔹 Riproduce automaticamente quando cambia sorgente */
    useEffect(() => {
        if (source) player.play();
    }, [player, source]);

    /** 🔹 Auto-next quando la traccia termina */
    useEffect(() => {
        if (!status) return;
        if (status.didJustFinish) {
            nextSongAction();
        }
    }, [status]);

    /** 🎵 Riproduce una canzone e imposta eventualmente la coda */
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

    /** ⏯️ Play/Pause toggle */
    const togglePlayPause = () => {
        if (isPlaying) player.pause();
        else player.play();
    };

    /** ⏹️ Stop e reset */
    const stopSong = () => {
        player.pause();
        player.seekTo(0);
        setIsPlaying(false);
        setCurrentSong(null);
        setSource(undefined);
        setCurrentQueue([]);
    };

    /** ⏭️ Traccia successiva */
    const nextSongAction = () => {
        if (!currentQueue.length) return;
        const nextIndex = (currentIndex + 1) % currentQueue.length;
        const next = currentQueue[nextIndex];
        setCurrentIndex(nextIndex);
        setCurrentSong(next);
        setSource({ uri: next.audioURL });
    };

    /** ⏮️ Traccia precedente */
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
                nextSong, // ✅ disponibile ovunque
                isPlaying,
                playSong,
                togglePlayPause,
                stopSong,
                nextSongAction,
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
