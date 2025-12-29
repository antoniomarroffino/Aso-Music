package com.asomusic.backend.util;

import com.google.cloud.Timestamp;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

public final class SongUtils {

    private SongUtils() {

    }

    public static OffsetDateTime toOffsetDateTime(Timestamp ts) {
        if (ts == null) {
            return null;
        }
        return ts.toDate()
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toOffsetDateTime();
    }

    public static Integer asInt(Object obj) {
        switch (obj) {
            case null -> {
                return null;
            }
            case Number number -> {
                return number.intValue();
            }
            case String str -> {
                try {
                    return Integer.parseInt(str);
                } catch (NumberFormatException e) {
                    return null;
                }
            }
            default -> {
            }
        }
        return null;
    }

    public static String formatArtistNames(List<String> names) {
        if (names == null || names.isEmpty()) {
            return "Artista sconosciuto";
        }

        int size = names.size();

        if (size == 1) {
            return names.get(0);
        }

        if (size == 2) {
            return names.get(0) + " e " + names.get(1);
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < size - 1; i++) {
            sb.append(names.get(i));
            if (i < size - 2) {
                sb.append(", ");
            }
        }
        sb.append(" e ").append(names.get(size - 1));

        return sb.toString();
    }

    public static String getPlatinoLabel(int multiplier) {
        return switch (multiplier) {
            case 2 -> "doppio";
            case 3 -> "triplo";
            case 4 -> "quadruplo";
            case 5 -> "quintuplo";
            case 6 -> "sestuplo";
            case 7 -> "settuplo";
            case 8 -> "ottuplo";
            case 9 -> "nonuplo";
            case 10 -> "decuplo";
            default -> multiplier + "º";
        };
    }

    public static String buildCertificationMessage(String songName, String artistName, long streamCount) {
        if (streamCount < 40) {
            return null;
        }

        if (streamCount == 40L) {
            return "🥇 \"" + songName + "\" di " + artistName + " ha ottenuto il disco d'oro!";
        }

        if (streamCount == 80L) {
            return "💿 \"" + songName + "\" di " + artistName + " ha ottenuto il disco di platino!";
        }

        if (streamCount > 80 && streamCount % 80 == 0) {
            int multiplier = (int) (streamCount / 80);
            String label = getPlatinoLabel(multiplier);
            return "💿 \"" + songName + "\" di " + artistName + " ha ottenuto il " + label + " disco di platino!";
        }

        return null;
    }
}