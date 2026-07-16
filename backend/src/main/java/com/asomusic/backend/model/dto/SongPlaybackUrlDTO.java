package com.asomusic.backend.model.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
@Schema(description = "URL temporanea per la riproduzione di un brano")
public class SongPlaybackUrlDTO {

    @Schema(
            description = "URL temporanea firmata del file audio",
            examples = "https://storage.googleapis.com/..."
    )
    private String url;

    @Schema(
            description = "Data e ora di scadenza della URL",
            format = "date-time"
    )
    private OffsetDateTime expiresAt;
}