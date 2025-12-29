export const formatReleaseDate = (isoDate: string): string =>
    new Date(isoDate).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

export const parseDuration = (dur: string | number): number => {
    if (typeof dur === "number") return dur;

    const parts = dur.split(":").map((n) => parseInt(n, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return parts[0] * 60 + parts[1];
    }

    const asNum = parseInt(dur, 10);
    return isNaN(asNum) ? 0 : asNum;
};