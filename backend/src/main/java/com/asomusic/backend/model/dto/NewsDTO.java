package com.asomusic.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsDTO {

    private String id;
    private String message;
    private OffsetDateTime createdAt;

    /**
     * True quando la news è già stata vista
     * dall'utente autenticato.
     */
    private boolean seen;
}