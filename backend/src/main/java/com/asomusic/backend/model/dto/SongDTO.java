package com.asomusic.backend.model.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.*;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
@Schema(description = "Brano musicale appartenente a un album")
public class SongDTO {

    @Schema(description = "ID univoco della canzone", example = "2y1wamdN1T0wZHbYpQ8t")
    private String id;

    @Schema(description = "Titolo del brano", example = "Pesce Spada")
    private String title;

    @Schema(description = "Durata del brano in formato mm:ss", example = "3:05")
    private String duration;

    @Schema(description = "URL dell'audio", example = "gs://...")
    private String audioURL;

    @Schema(description = "URL della copertina", example = "gs://...")
    private String coverURL;

    @Schema(description = "Numero totale di ascolti", example = "195")
    private long stream;

    @Schema(description = "Posizione nella tracklist", example = "21")
    private int tracklistPosition;
}

