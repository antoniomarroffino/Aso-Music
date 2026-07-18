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
@Schema(
        description = "Canzoni associate a un artista"
)
public class ArtistSongsDTO {

    @Schema(
            description = "ID dell'artista"
    )
    private String artistId;

    @Schema(
            description = "Numero totale di canzoni dell'artista"
    )
    private int total;

    @Schema(
            description = "Canzoni dell'artista ordinate per ascolti"
    )
    private List<SongPreviewDTO> songs;
}