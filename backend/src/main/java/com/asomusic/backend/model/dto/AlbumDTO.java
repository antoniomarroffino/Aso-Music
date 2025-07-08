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
@Schema(description = "Album musicale contenente uno o più brani")
public class AlbumDTO {

    @Schema(description = "ID univoco dell'album", example = "abc123")
    private String id;

    @Schema(description = "Titolo dell'album", example = "ASO MIXTAPE 2")
    private String name;

    @Schema(description = "Artista dell'album", example = "Aso Fam")
    private String artist;

    @Schema(description = "Descrizione dell'album", example = "Frizzer gay")
    private String description;

    @Schema(description = "URL della copertina", example = "gs://...")
    private String coverURL;

    @Schema(description = "Anno di uscita", example = "2023")
    private int releaseYear;

    @Schema(description = "Lista dei brani dell'album")
    private List<SongDTO> songs;
}

