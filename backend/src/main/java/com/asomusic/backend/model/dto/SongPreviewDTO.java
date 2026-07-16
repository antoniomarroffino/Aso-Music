package com.asomusic.backend.model.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
@Schema(description = "Anteprima di un brano appartenente a un album")
public class SongPreviewDTO {

    @Schema(
            description = "ID univoco della canzone",
            examples = "2y1wamdN1T0wZHbYpQ8t"
    )
    private String id;

    @Schema(
            description = "Titolo del brano",
            examples = "Pesce Spada"
    )
    private String title;

    @Schema(
            description = "Durata del brano in formato mm:ss",
            examples = "3:05"
    )
    private String duration;

    @Schema(
            description = "URL temporanea della copertina specifica del brano",
            examples = "https://storage.googleapis.com/..."
    )
    private String coverURL;

    @Schema(
            description = "Numero totale di ascolti",
            examples = "195"
    )
    private long stream;

    @Schema(
            description = "Posizione nella tracklist",
            examples = "21"
    )
    private int tracklistPosition;

    @Schema(
            description = "Lista degli artisti che hanno partecipato al brano"
    )
    private List<ArtistDTO> artists;

    @Schema(
            description = "ID dell'album di appartenenza",
            examples = "ab12cd34ef56"
    )
    private String albumId;

    @Schema(
            description = "Nome dell'album di appartenenza",
            examples = "ASO MIXTAPE"
    )
    private String albumName;
}