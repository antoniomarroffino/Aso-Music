const TrackPlayerModule =
    require(
        "react-native-track-player",
    );

const TrackPlayer =
    TrackPlayerModule.default ??
    TrackPlayerModule;

const {
    playbackService,
} = require(
    "./playbackService",
);

TrackPlayer.registerPlaybackService(
    () => playbackService,
);