package com.asomusic.backend.model.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.*;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
@Schema(description = "Album musicale contenente uno o più brani")
public class AlbumDTO {

    @Schema(description = "ID univoco dell'album", examples = "abc123")
    private String id;

    @Schema(description = "Titolo dell'album", examples = "ASO MIXTAPE 2")
    private String name;

    @Schema(description = "Artista dell'album", examples = "Aso Fam")
    private String artist;

    @Schema(description = "Descrizione dell'album", examples = "Frizzer gay")
    private String description;

    @Schema(description = "URL della copertina", examples = "gs://...")
    private String coverURL;

    @Schema(
            description = "Data di uscita dell'album",
            examples = "2023-09-04T00:00:00+02:00",
            format = "date-time"
    )
    private OffsetDateTime releaseDate;

    @Schema(description = "Lista dei brani dell'album")
    private List<SongDTO> songs;
}

