/**
 * Un solo vocabolario per il movimento dell'interfaccia.
 *
 * Le liste virtualizzate non devono usare animazioni d'ingresso: quando React
 * ricicla una riga, ripartire da opacity 0 provoca un flash. Questi preset sono
 * quindi riservati a schermate, overlay e cambi di stato realmente nuovi.
 */
export const MOTION_DURATION = {
    fast: 160,
    standard: 220,
    relaxed: 360,
    pulse: 1200,
} as const;

export const motionTiming = (
    duration: number =
        MOTION_DURATION.standard,
    delay: number = 0,
) => ({
    type: "timing" as const,
    duration,
    delay,
});

export const motionSpring = (
    delay: number = 0,
) => ({
    type: "spring" as const,
    damping: 22,
    stiffness: 190,
    mass: 0.8,
    delay,
});

export const motionPulse = (
    delay: number = 0,
) => ({
    type: "timing" as const,
    duration: MOTION_DURATION.pulse,
    delay,
    loop: true,
    repeatReverse: true,
});

export const cappedStagger = (
    index: number,
    step = 28,
    maximum = 140,
) => Math.min(
    Math.max(index, 0) * step,
    maximum,
);
