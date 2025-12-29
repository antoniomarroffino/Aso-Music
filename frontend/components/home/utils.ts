import { Ionicons } from "@expo/vector-icons";

export type SortOrder = "newest" | "oldest" | "alphabetical";

export const getSortLabel = (order: SortOrder): string => {
    switch (order) {
        case "newest":
            return "Più recenti";
        case "oldest":
            return "Più vecchi";
        case "alphabetical":
            return "A-Z";
    }
};

export const getSortIcon = (order: SortOrder): keyof typeof Ionicons.glyphMap => {
    switch (order) {
        case "newest":
            return "arrow-down-outline";
        case "oldest":
            return "arrow-up-outline";
        case "alphabetical":
            return "text-outline";
    }
};

export const SORT_OPTIONS: SortOrder[] = ["newest", "oldest", "alphabetical"];