import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Audio } from "expo-av";
import { SongDTO } from "@/types/music";

type PlayerContextType = {
    currentSong: SongDTO | null;
    isPlaying: boolean;
    playSong: (song: SongDTO) => Promise<void>;
    togglePlayPause: () => Promise<void>;
    stopPlayback: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [currentSong, setCurrentSong] = useState<SongDTO | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // ✅ Rilascia risorse quando il componente viene smontato
    useEffect(() => {
        return sound
            ? () => {
                console.log("🔇 Rilascio risorsa audio");
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    const playSong = async (song: SongDTO) => {
        try {
            console.log(song.audioURL);
            if (sound) {
                await sound.unloadAsync();
            }

            console.log("🎵 Riproduco:", song.title);

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: song.audioURL },
                { shouldPlay: true }
            );

            setSound(newSound);
            setCurrentSong(song);
            setIsPlaying(true);
        } catch (error) {
            console.error("❌ Errore nella riproduzione:", error);
        }
    };

    const togglePlayPause = async () => {
        if (!sound) return;
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
            if (status.isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
        }
    };

    const stopPlayback = async () => {
        if (sound) {
            await sound.unloadAsync();
            setSound(null);
            setCurrentSong(null);
            setIsPlaying(false);
        }
    };

    return (
        <PlayerContext.Provider
            value={{
                currentSong,
                isPlaying,
                playSong,
                togglePlayPause,
                stopPlayback,
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
