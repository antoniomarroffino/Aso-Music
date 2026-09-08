const {
    registerBackgroundEventHandler,
} = require("@rntp/player");

const {
    playbackService,
} = require(
    "./playbackService",
);

registerBackgroundEventHandler(
    playbackService,
);
