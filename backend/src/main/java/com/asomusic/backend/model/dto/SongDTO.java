package com.asomusic.backend.model.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.*;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
@Schema(description = "Brano musicale appartenente a un album")
public class SongDTO {

    @Schema(description = "ID univoco della canzone", examples = "2y1wamdN1T0wZHbYpQ8t")
    private String id;

    @Schema(description = "Titolo del brano", examples = "Pesce Spada")
    private String title;

    @Schema(description = "Durata del brano in formato mm:ss", examples = "3:05")
    private String duration;

    @Schema(description = "URL dell'audio", examples = "gs://...")
    private String audioURL;

    @Schema(description = "URL della copertina", examples = "gs://...")
    private String coverURL;

    @Schema(description = "Numero totale di ascolti", examples = "195")
    private long stream;

    @Schema(description = "Posizione nella tracklist", examples = "21")
    private int tracklistPosition;

    @Schema(description = "Lista degli artisti che hanno partecipato al brano")
    private List<ArtistDTO> artists;
}
