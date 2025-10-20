package com.asomusic.backend.model.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.*;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
@Schema(description = "Artista musicale")
public class ArtistDTO {

    @Schema(description = "ID univoco dell'artista", examples = "W1HgxeMBBYNsGCHNYJN1")
    private String id;

    @Schema(description = "Nome dell'artista", examples = "Anto")
    private String name;

    @Schema(description = "Biografia o descrizione dell'artista", examples = "King del microfono")
    private String bio;

    @Schema(description = "URL dell'immagine profilo dell'artista", examples = "https://firebasestorage.googleapis.com/...")
    private String profileURL;
}
