import TrackPlayer, {
    PlayerCommand,
} from "@rntp/player";

type GlobalPlayerState =
    typeof globalThis & {
    __asoMusicPlayerInitialized?: boolean;
};

const globalPlayerState =
    globalThis as GlobalPlayerState;

export function initializeMusicPlayer(): void {
    if (
        globalPlayerState
            .__asoMusicPlayerInitialized
    ) {
        return;
    }

    TrackPlayer.setupPlayer({
        contentType: "music",
        handleAudioBecomingNoisy: true,
    });

    TrackPlayer.setCommands({
        capabilities: [
            PlayerCommand.PlayPause,
            PlayerCommand.Next,
            PlayerCommand.Previous,
            PlayerCommand.Seek,
            PlayerCommand.Stop,
        ],
    });

    globalPlayerState
        .__asoMusicPlayerInitialized =
        true;
}

export function isMusicPlayerInitialized(): boolean {
    return Boolean(
        globalPlayerState
            .__asoMusicPlayerInitialized,
    );
}