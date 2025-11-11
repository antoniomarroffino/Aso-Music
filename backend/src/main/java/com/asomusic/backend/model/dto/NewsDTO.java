package com.asomusic.backend.model.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.*;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
@Schema(description = "News o notifica generata dal sistema")
public class NewsDTO {

    @Schema(description = "ID univoco della news", examples = "e5f8c83a-4f13-45e2-8a78-2acb8dc9a4e5")
    private String id;

    @Schema(description = "Messaggio della notifica o news", examples = "Il brano 'CRR POW' ha raggiunto il disco di platino!")
    private String message;

    @Schema(description = "Data di creazione della news in formato ISO 8601", examples = "2025-11-11T14:22:05Z")
    private String createdAt;
}
