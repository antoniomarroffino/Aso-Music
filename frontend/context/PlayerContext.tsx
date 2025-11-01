import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { SongDTO } from "@/types/music";

type PlayerContextType = {
    currentSong: SongDTO | null;
    isPlaying: boolean;
    playSong: (song: SongDTO) => void;
    pauseSong: () => void;
    resumeSong: () => void;
    stopSong: () => void;
    progress: number;
    duration: number;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [currentSong, setCurrentSong] = useState<SongDTO | null>(null);

    // ✅ player reattivo: crea e aggiorna quando cambia la sorgente
    const [source, setSource] = useState<{ uri: string } | null>(null);
    const player = useAudioPlayer(source ?? undefined);
    const status = useAudioPlayerStatus(player);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (status) {
            setIsPlaying(status.playing ?? false);
        }
    }, [status]);

    const playSong = (song: SongDTO) => {
        console.log("🎵 Playing:", song.title);
        console.log("🔗 URL:", song.audioURL);
        setCurrentSong(song);
        setSource({ uri: song.audioURL }); // ✅ cambia la sorgente (triggera il player)
        player.play();
    };

    const pauseSong = () => {
        player.pause();
        setIsPlaying(false);
    };

    const resumeSong = () => {
        player.play();
        setIsPlaying(true);
    };

    const stopSong = () => {
        player.pause();
        player.seekTo(0);
        setIsPlaying(false);
        setCurrentSong(null);
        setSource(null);
    };

    const progress = status?.currentTime ?? 0;
    const duration = status?.duration ?? 0;

    return (
        <PlayerContext.Provider
            value={{
                currentSong,
                isPlaying,
                playSong,
                pauseSong,
                resumeSong,
                stopSong,
                progress,
                duration,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = (): PlayerContextType => {
    const ctx = useContext(PlayerContext);
    if (!ctx) throw new Error("usePlayer deve essere usato dentro <PlayerProvider>");
    return ctx;
};
