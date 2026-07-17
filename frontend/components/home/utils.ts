import { Ionicons } from "@expo/vector-icons";

export type SortOrder =
    | "newest"
    | "oldest"
    | "alphabetical";

type SortConfiguration = {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
};

export const SORT_CONFIGURATION: Record<
    SortOrder,
    SortConfiguration
> = {
    newest: {
        label: "Più recenti",
        icon: "arrow-down-outline",
    },
    oldest: {
        label: "Più vecchi",
        icon: "arrow-up-outline",
    },
    alphabetical: {
        label: "A-Z",
        icon: "text-outline",
    },
};

export const SORT_OPTIONS: SortOrder[] = [
    "newest",
    "oldest",
    "alphabetical",
];

export const getSortLabel = (
    order: SortOrder,
): string => {
    return SORT_CONFIGURATION[order].label;
};

export const getSortIcon = (
    order: SortOrder,
): keyof typeof Ionicons.glyphMap => {
    return SORT_CONFIGURATION[order].icon;
};